const Subscription = require("../models/subscriptionModel");
const Plan = require("../models/planModel");
const Transaction = require("../models/transactionModel");
const UsageLog = require("../models/usageModel");
const stripe = require("../config/stripe");

const handleError = (res, error) => {
  console.error("[SubscriptionController]", error.message);

  if (error.type === "StripeCardError") {
    return res.status(402).json({ success: false, message: error.message });
  }

  if (error.type === "StripeInvalidRequestError") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error.type === "StripeAuthenticationError") {
    return res
      .status(401)
      .json({ success: false, message: "Stripe authentication failed." });
  }

  res
    .status(500)
    .json({ success: false, data: false, message: "Internal Server Error" });
};

exports.selectFreePlan = async (req, res) => {
  try {
    const userId = req.user._id;

    const existingSubscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    });

    // FIX 1: was "exisingSubscription" (typo) — caused ReferenceError crash
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "You already have an active subscription.",
      });
    }

    const freePlan = await Plan.findOne({
      price: 0,
      isActive: true,
      isDeleted: false,
    });

    if (!freePlan) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No free plan available at the moment.",
      });
    }

    const endDate = new Date();
    const interval = freePlan.interval;
    if (interval === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
    else if (interval === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else if (interval === "quarterly") endDate.setMonth(endDate.getMonth() + 3);
    else endDate.setDate(endDate.getDate() + freePlan.durationDays); // one_time fallback

    const subscription = await Subscription.create({
      userId,
      planId: freePlan._id,
      planSnapshot: {
        name: freePlan.name,
        price: freePlan.price,
        interval: freePlan.interval,
        features: freePlan.features,
        limits: freePlan.limits,
      },
      status: "active",
      startDate: new Date(),
      endDate,
      autoRenew: false,
    });

    return res.status(200).json({
      success: true,
      data: subscription,
      message: "Free plan activated successfully.",
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "trialing", "past_due", "cancelled"] },
      endDate: { $gt: new Date() },
    })
      .populate("planId", "name slug price interval features limits")
      .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No active or pending subscriptions found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
      message: "Subscription retrieved successfully.",
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      userId,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Subscription not found.",
      });
    }

    // 3: was only updating DB — Stripe kept charging because it knew nothing
    // For paid plans: tell Stripe to cancel at period end (user keeps access till endDate)
    // For free plans (no providerSubscriptionId): just cancel locally
    if (subscription.providerSubscriptionId) {
      await stripe.subscriptions.update(subscription.providerSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    // Instead of immediately marking cancelled:
    subscription.status = subscription.providerSubscriptionId
      ? "active" // Stripe will fire webhook when it truly ends
      : "cancelled"; // Free plan: safe to cancel immediately
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    return res.status(200).json({
      success: true,
      data: subscription,
      message: "Subscription cancelled successfully.",
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.toggleAutoRenewal = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No active subscription found.",
      });
    }

    const newAutoRenew = !subscription.autoRenew;

    // FIX 4: was only flipping the DB field — Stripe had no idea and kept renewing
    // Sync the toggle with Stripe so billing matches what the user chose
    if (subscription.providerSubscriptionId) {
      await stripe.subscriptions.update(subscription.providerSubscriptionId, {
        // cancel_at_period_end: true  → autoRenew OFF (Stripe stops after current period)
        // cancel_at_period_end: false → autoRenew ON  (Stripe keeps renewing)
        cancel_at_period_end: !newAutoRenew,
      });
    }

    subscription.autoRenew = newAutoRenew;
    await subscription.save();

    return res.status(200).json({
      success: true,
      data: { autoRenew: subscription.autoRenew },
      message: `Auto-renew ${subscription.autoRenew ? "enabled" : "disabled"}.`,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.refundRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reason } = req.body;

    const transaction = await Transaction.findOne({
      userId,
      status: "paid",
    }).sort({ paidAt: -1 });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No paid transactions found.",
      });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "cancelled"] },
    }).sort({ createdAt: -1 });

    // Block only if sub was cancelled BEFORE this payment (stale billing cycle)
    if (subscription?.cancelledAt) {
      const cancelledBeforePayment =
        subscription.cancelledAt < transaction.paidAt;
      if (cancelledBeforePayment) {
        return res.status(400).json({
          success: false,
          message: "Refunds are not available for this transaction.",
        });
      }
    }

    const hoursSincePayment =
      (Date.now() - transaction.paidAt.getTime()) / 3600000;
    if (hoursSincePayment > 24) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "Refund window has expired (24 hours).",
      });
    }

    if (["refunded", "partially_refunded"].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: "This transaction has already been refunded.",
      });
    }

    if (!transaction.paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: "Cannot process refund: payment details not found.",
      });
    }

    // Check usage across current and previous month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1)
      .toISOString()
      .slice(0, 7);

    console.log("subscription._id:", subscription?._id);
    console.log("currentMonth:", currentMonth);
    console.log("prevMonth:", prevMonth);

    const usageLogs = await UsageLog.find({
      userId,
      subscriptionId: subscription?._id,
      month: { $in: [currentMonth, prevMonth] },
    });
    console.log("usageLogs found:", usageLogs.length);
    console.log("usageLogs:", JSON.stringify(usageLogs, null, 2));

    const hasUsage = usageLogs.some(
      (log) =>
        (log.chatTokens ?? 0) > 0 ||
        (log.summaryHits ?? 0) > 0 ||
        (log.tagHits ?? 0) > 0 ||
        (log.writingAssistHits ?? 0) > 0,
    );

    if (hasUsage) {
      return res.status(400).json({
        success: false,
        message: "Refund not available as you have already used the service.",
      });
    }

    const stripeRefund = await stripe.refunds.create(
      {
        payment_intent: transaction.paymentIntentId,
        reason: "requested_by_customer",
      },
      {
        idempotencyKey: `refund_${transaction._id}`,
      },
    );

    if (stripeRefund.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Refund could not be processed. Please try again.",
      });
    }

    transaction.status = "refunded";
    transaction.refundAmount = transaction.amount;
    transaction.refundReason = reason || "Requested by customer";
    transaction.refundedAt = new Date();
    transaction.providerRefundId = stripeRefund.id;
    await transaction.save();

    if (subscription?.providerSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.providerSubscriptionId);
      } catch (err) {
        if (err.code !== "resource_missing") throw err;
      }
    }

    if (subscription) {
      subscription.status = "cancelled";
      subscription.autoRenew = false;
      subscription.cancelledAt = new Date();
      await subscription.save();
    }

    return res.status(200).json({
      success: true,
      message:
        "Refund processed successfully. Your subscription has been cancelled.",
      data: {
        refundId: stripeRefund.id,
        amount: transaction.amount,
        currency: transaction.currency,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.SubscriptionStats = async (req, res) => {}
exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const userEmail = req.user.email;
    const { planId } = req.body;

    const plan = await Plan.findOne({
      _id: planId,
      isActive: true,
      isDeleted: false,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Plan not found or inactive",
      });
    }

    if (plan.price <= 0) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "This plan is free. No checkout session needed.",
      });
    }

    const existingPending = await Transaction.findOne({
      userId,
      planId: plan._id,
      status: "pending",
      createdAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, // 30 min window
    });
    if (existingPending?.checkoutSessionId) {
      const existing = await stripe.checkout.sessions.retrieve(
        existingPending.checkoutSessionId,
      );
      if (existing.status === "open") {
        return res
          .status(200)
          .json({ success: true, data: { checkoutUrl: existing.url } });
      }
    }
    const transaction = await Transaction.create({
      userId,
      planId: plan._id,
      amount: plan.price,
      currency: "INR",
      paymentProvider: "stripe",
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      metadata: {
        userId: userId.toString(),
        planId: plan._id.toString(),
        transactionId: transaction._id.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });

    transaction.checkoutSessionId = session.id;
    await transaction.save();

    return res.status(200).json({
      success: true,
      data: { checkoutUrl: session.url },
      message: "Checkout session created successfully",
    });
  } catch (error) {
    console.error("Checkout Session Error:", error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: error.message || "Failed to create checkout session",
    });
  }
};
