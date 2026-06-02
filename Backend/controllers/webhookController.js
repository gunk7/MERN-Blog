const stripe = require("../config/stripe");
const Plan = require("../models/planModel");
const Subscription = require("../models/subscriptionModel");
const Transaction = require("../models/transactionModel");
const Invoice = require("../models/invoiceModel");

exports.handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook Signature Error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // ── Idempotency guard ─────────────────────────────────────────────────────
  const existingEvent = await Transaction.findOne({ stripeEventId: event.id });
  if (existingEvent) return res.json({ received: true });

  try {
    switch (event.type) {
      // ── New paid subscription created via Checkout ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, planId, transactionId } = session.metadata;

        if (!userId || !planId || !transactionId) {
          console.error(
            "checkout.session.completed — missing metadata, aborting",
          );
          return res.json({ received: true });
        }

        const existingTransaction = await Transaction.findById(transactionId);
        if (
          existingTransaction?.status === "paid" &&
          existingTransaction?.paymentIntentId
        ) {
          return res.json({ received: true });
        }

        const plan = await Plan.findById(planId);
        if (!plan) throw new Error("Plan not found");

        let stripeSubscription = null;
        let stripeInvoice = null;

        if (session.subscription) {
          stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );

          const invoiceId =
            session.invoice ?? stripeSubscription.latest_invoice;

          if (invoiceId) {
            stripeInvoice = await stripe.invoices.retrieve(invoiceId, {
              expand: ["payment_intent", "charge", "payments"],
            });
          } else {
            await new Promise((r) => setTimeout(r, 2000));
            const refreshed = await stripe.subscriptions.retrieve(
              session.subscription,
            );
            if (refreshed.latest_invoice) {
              stripeInvoice = await stripe.invoices.retrieve(
                refreshed.latest_invoice,
              );
            }
          }
        }

        if (!stripeSubscription) {
          console.error(
            "checkout.session.completed — no Stripe subscription, aborting",
          );
          return res.json({ received: true });
        }

        const invoiceAmountPaid = stripeInvoice
          ? stripeInvoice.amount_paid / 100
          : plan.price;

        const invoiceCurrency = stripeInvoice
          ? stripeInvoice.currency.toUpperCase()
          : "INR";

        const startDate = stripeSubscription.current_period_start
          ? new Date(stripeSubscription.current_period_start * 1000)
          : new Date();

        const endDate = stripeSubscription.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // FIX 5: derive autoRenew from Stripe's cancel_at_period_end at creation time
        // cancel_at_period_end: false → Stripe will renew → autoRenew: true
        // cancel_at_period_end: true  → Stripe won't renew  → autoRenew: false
        const autoRenew = !stripeSubscription.cancel_at_period_end;

        const subscription = await Subscription.create({
          userId,
          planId,
          planSnapshot: {
            name: plan.name,
            price: plan.price,
            interval: plan.interval,
            features: plan.features,
            limits: plan.limits,
          },
          providerSubscriptionId: stripeSubscription.id,
          providerCustomerId: stripeSubscription.customer,
          status: "active",
          startDate,
          endDate,
          autoRenew,
        });

        const updatedTransaction = await Transaction.findByIdAndUpdate(
          transactionId,
          {
            subscriptionId: subscription._id,
            providerCustomerId: stripeSubscription.customer,
            providerSubscriptionId: stripeSubscription.id,
            invoiceId: stripeInvoice?.id ?? null,
            receiptUrl: stripeInvoice?.hosted_invoice_url ?? null,
            invoicePdfUrl: stripeInvoice?.invoice_pdf ?? null,
            paymentIntentId:
              stripeInvoice?.payments?.data?.[0]?.payment?.payment_intent ??
              null,
            billingReason: "subscription_create",
            stripeEventId: event.id,
            status: "paid",
            paidAt: new Date(),
          },
          { new: true },
        );

        await Invoice.create({
          transactionId: updatedTransaction._id,
          userId,
          planId,
          planName: plan.name,
          amount: invoiceAmountPaid,
          currency: invoiceCurrency,
          stripeInvoiceId: stripeInvoice?.id ?? null,
          stripeInvoicePdfUrl: stripeInvoice?.invoice_pdf ?? null,
          status: "paid",
          paidAt: new Date(),
        });

        console.log(
          "checkout.session.completed — subscription created:",
          subscription._id,
        );
        break;
      }
      // This fires when:
      //   • toggleAutoRenewal sets cancel_at_period_end (Stripe confirms it here)
      //   • cancelSubscription sets cancel_at_period_end
      //   • User cancels directly in Stripe dashboard
      //   • Stripe itself changes subscription state (trials end, upgrades, etc.)
      case "customer.subscription.updated": {
        const stripeSub = event.data.object;

        // cancel_at_period_end: true  → user turned off auto-renew (or cancelled)
        // cancel_at_period_end: false → auto-renew is on
        const autoRenew = !stripeSub.cancel_at_period_end;

        // Map Stripe status to your schema's enum values
        const statusMap = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "cancelled", // Stripe uses "canceled" (1 l), your schema "cancelled" (2 l)
          incomplete: "incomplete",
          incomplete_expired: "expired",
          unpaid: "past_due",
        };
        const newStatus = statusMap[stripeSub.status] ?? "active";

        const updatePayload = {
          autoRenew,
          status: newStatus,
        };

        // Only update endDate if Stripe gives a valid timestamp
        if (stripeSub.current_period_end) {
          updatePayload.endDate = new Date(stripeSub.current_period_end * 1000);
        }
        // If Stripe confirms the subscription is set to cancel at period end,
        // record cancelledAt so the model pre-validate hook doesn't overwrite it
        if (stripeSub.cancel_at_period_end && !stripeSub.canceled_at) {
          updatePayload.cancelledAt = new Date();
        }

        await Subscription.findOneAndUpdate(
          { providerSubscriptionId: stripeSub.id },
          updatePayload,
        );

        console.log(
          `customer.subscription.updated — autoRenew: ${autoRenew}, status: ${newStatus}`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSub = event.data.object;

        const updatePayload = {
          status: "cancelled",
          autoRenew: false,
          cancelledAt: new Date(),
        };

        if (stripeSub.current_period_end) {
          updatePayload.endDate = new Date(stripeSub.current_period_end * 1000);
        }

        await Subscription.findOneAndUpdate(
          { providerSubscriptionId: stripeSub.id },
          updatePayload,
        );

        console.log("customer.subscription.deleted — subscription cancelled");
        break;
      }

      // ── Payment failed → mark past_due ───────────────────────────────────
      case "invoice.payment_failed": {
        const inv = event.data.object;

        await Subscription.findOneAndUpdate(
          { providerSubscriptionId: inv.subscription },
          { status: "past_due" },
        );

        await Transaction.create({
          userId: inv.metadata?.userId,
          planId: inv.metadata?.planId,
          providerSubscriptionId: inv.subscription,
          providerCustomerId: inv.customer,
          invoiceId: inv.id,
          amount: inv.amount_due / 100,
          currency: inv.currency.toUpperCase(),
          billingReason: inv.billing_reason,
          stripeEventId: event.id,
          status: "failed",
          failureReason:
            inv.last_finalization_error?.message || "Payment failed",
        });

        console.log("invoice.payment_failed — subscription set to past_due");
        break;
      }

      // ── Renewal payment succeeded ─────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object;
        if (inv.billing_reason === "subscription_create") break;

        // Guard against duplicate processing with invoice_payment.paid
        const existing = await Transaction.findOne({
          invoiceId: inv.id,
          status: "paid",
        });
        if (existing) {
          console.log(
            "invoice.payment_succeeded — already processed, skipping",
          );
          break;
        }

        const sub = await Subscription.findOne({
          providerSubscriptionId: inv.subscription,
        });

        const freshInv = await stripe.invoices.retrieve(inv.id, {
          expand: ["payments"],
        });

        const renewalTx = await Transaction.create({
          userId: sub?.userId,
          planId: sub?.planId,
          providerSubscriptionId: inv.subscription,
          providerCustomerId: inv.customer,
          invoiceId: inv.id,
          paymentIntentId:
            freshInv.payments?.data?.[0]?.payment?.payment_intent ?? null,
          receiptUrl: inv.hosted_invoice_url,
          invoicePdfUrl: inv.invoice_pdf,
          amount: inv.amount_paid / 100,
          currency: inv.currency.toUpperCase(),
          billingReason: inv.billing_reason,
          stripeEventId: event.id,
          status: "paid",
          paidAt: new Date(),
        });

        if (sub) {
          await Invoice.create({
            transactionId: renewalTx._id,
            userId: sub.userId,
            planId: sub.planId,
            planName: sub.planSnapshot?.name,
            planInterval: sub.planSnapshot?.interval,
            amount: inv.amount_paid / 100,
            currency: inv.currency.toUpperCase(),
            stripeInvoiceId: inv.id,
            stripeInvoicePdfUrl: inv.invoice_pdf,
            status: "paid",
            paidAt: new Date(),
          });

          const stripeSub = await stripe.subscriptions.retrieve(
            inv.subscription,
          );
          await Subscription.findOneAndUpdate(
            { providerSubscriptionId: inv.subscription },
            {
              status: "active",
              autoRenew: !stripeSub.cancel_at_period_end,
              endDate: new Date(stripeSub.current_period_end * 1000),
            },
          );
        }

        console.log("invoice.payment_succeeded — subscription renewed");
        break;
      }

      case "invoice_payment.paid": {
        const invPayment = event.data.object;
        if (invPayment.billing_reason === "subscription_create") break;

        const stripeInv = await stripe.invoices.retrieve(invPayment.invoice, {
          expand: ["payments"],
        });
        const sub = await Subscription.findOne({
          providerSubscriptionId: stripeInv.subscription,
        });

        if (!sub) {
          console.log(
            "invoice_payment.paid — no matching subscription, skipping",
          );
          break;
        }

        const existing = await Transaction.findOne({
          invoiceId: stripeInv.id,
          status: "paid",
        });
        if (existing) {
          console.log("invoice_payment.paid — already processed, skipping");
          break;
        }

        const renewalTx = await Transaction.create({
          userId: sub.userId,
          planId: sub.planId,
          providerSubscriptionId: stripeInv.subscription,
          providerCustomerId: stripeInv.customer,
          invoiceId: stripeInv.id,
          paymentIntentId:
            stripeInv.payments?.data?.[0]?.payment?.payment_intent ?? null,
          receiptUrl: stripeInv.hosted_invoice_url,
          invoicePdfUrl: stripeInv.invoice_pdf,
          amount: stripeInv.amount_paid / 100,
          currency: stripeInv.currency.toUpperCase(),
          billingReason: invPayment.billing_reason,
          stripeEventId: event.id,
          status: "paid",
          paidAt: new Date(),
        });

        await Invoice.create({
          transactionId: renewalTx._id,
          userId: sub.userId,
          planId: sub.planId,
          planName: sub.planSnapshot?.name,
          planInterval: sub.planSnapshot?.interval,
          amount: stripeInv.amount_paid / 100,
          currency: stripeInv.currency.toUpperCase(),
          stripeInvoiceId: stripeInv.id,
          stripeInvoicePdfUrl: stripeInv.invoice_pdf,
          status: "paid",
          paidAt: new Date(),
        });

        const stripeSub = await stripe.subscriptions.retrieve(
          stripeInv.subscription,
        );

        await Subscription.findOneAndUpdate(
          { providerSubscriptionId: stripeInv.subscription },
          {
            status: "active",
            autoRenew: !stripeSub.cancel_at_period_end,
            endDate: new Date(stripeSub.current_period_end * 1000),
          },
        );

        console.log("invoice_payment.paid — renewal processed");
        break;
      }
      // ── Refund processed ─────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object;

        // Find transaction by paymentIntentId
        const transaction = await Transaction.findOne({
          paymentIntentId: charge.payment_intent,
        });

        if (!transaction) {
          console.log("charge.refunded — no matching transaction, skipping");
          break;
        }

        // Avoid reprocessing if already marked refunded
        if (transaction.status === "refunded") {
          console.log("charge.refunded — already processed, skipping");
          break;
        }

        const refund = charge.refunds?.data?.[0];

        transaction.status = "refunded";
        transaction.refundAmount = charge.amount_refunded / 100;
        transaction.refundedAt = new Date();
        transaction.providerRefundId = refund?.id ?? null;
        transaction.stripeEventId = event.id;
        await transaction.save();

        // Cancel subscription if still active
        const subscription = await Subscription.findOne({
          userId: transaction.userId,
          status: "active",
        });

        if (subscription?.providerSubscriptionId) {
          await stripe.subscriptions.cancel(
            subscription.providerSubscriptionId,
          );
        }

        if (subscription) {
          subscription.status = "cancelled";
          subscription.autoRenew = false;
          subscription.cancelledAt = new Date();
          await subscription.save();
        }

        console.log("charge.refunded — transaction updated:", transaction._id);
        break;
      }

      // ── Refund status changed (pending → succeeded / failed) ─────────────────
      case "charge.refund.updated": {
        const refund = event.data.object;

        const transaction = await Transaction.findOne({
          providerRefundId: refund.id,
        });

        if (!transaction) {
          console.log(
            "charge.refund.updated — no matching transaction, skipping",
          );
          break;
        }

        // If refund failed, revert transaction back to paid
        if (refund.status === "failed") {
          transaction.status = "paid";
          transaction.refundAmount = 0;
          transaction.refundedAt = null;
          transaction.providerRefundId = null;
          await transaction.save();

          // Reactivate subscription
          await Subscription.findOneAndUpdate(
            { userId: transaction.userId, status: "cancelled" },
            {
              status: "active",
              autoRenew: true,
              cancelledAt: null,
            },
          );

          console.log(
            "charge.refund.updated — refund failed, transaction reverted",
          );
          break;
        }

        // If refund succeeded, ensure transaction is marked correctly
        if (refund.status === "succeeded") {
          transaction.status = "refunded";
          transaction.refundedAt = new Date();
          await transaction.save();

          console.log("charge.refund.updated — refund confirmed succeeded");
        }

        break;
      }
      case "payment_intent.created":
      case "payment_intent.succeeded":
      case "customer.created":
      case "customer.updated":
      case "payment_method.attached":
      case "invoice.created":
      case "invoice.finalized":
      case "invoice.paid":
      case "charge.succeeded":
      case "refund.created":
      case "refund.updated":
      case "customer.subscription.created": {
        console.log(`Acknowledged (no action): ${event.type}`);
        break;
      }
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook Processing Error:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
