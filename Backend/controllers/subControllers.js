const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const Subscription = require("../models/subscriptionModel");
const Plan = require("../models/planModel");
const Transaction = require("../models/transactionModel");
const UsageLog = require("../models/usageModel");
const stripe = require("../config/stripe");
const RefundRequest = require("../models/refundRequestModel");
const User = require("../models/userModel");
const { mailSend } = require("../utils/mail");
const emailTemplates = require("../utils/emailTemplate");
const { getCurrentMonth } = require("../middleware/checkUsageLimit");
const AddonPurchase = require("../models/addonPurchaseModel");
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

  return res
    .status(500)
    .json({ success: false, data: false, message: "Internal Server Error" });
};

exports.selectFreePlan = catchAsync(async (req, res) => {
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
        limit: freePlan.limit,
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
  });;

exports.getMySubscriptions = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const subscriptions = await Subscription.find({ userId })
      .populate("planId", "name slug price interval features limit")
      .sort({ createdAt: -1 })
      .lean();

    if (!subscriptions.length) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No subscriptions found.",
      });
    }

    const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

    const current =
      subscriptions.find(
        (s) =>
          ACTIVE_STATUSES.includes(s.status) &&
          new Date(s.endDate) > new Date(),
      ) ?? subscriptions.find((s) => s.status === "cancelled");
    null;

    const past = subscriptions.filter(
      (s) => s._id.toString() !== current?._id?.toString(),
    );
    return res.status(200).json({
      success: true,
      data: { current, past },
      message: "Subscriptions retrieved successfully.",
    });
  });;

exports.toggleAutoRenewal = catchAsync(async (req, res) => {
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
    if (subscription.providerSubscriptionId) {
      await stripe.subscriptions.update(subscription.providerSubscriptionId, {
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
  });;

exports.cancelSubscription = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No active subscription found.",
      });
    }

    if (subscription.providerSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.providerSubscriptionId);
    }

    subscription.status = "cancelled";
    subscription.cancelledAt = new Date();
    subscription.endDate = new Date(); // access ends immediately
    subscription.autoRenew = false;
    await subscription.save();

    await AddonPurchase.updateMany(
      { userId, subscriptionId: subscription._id, status: "active" },
      { status: "cancelled" },
    );

    return res.status(200).json({
      success: true,
      data: subscription,
      message: "Subscription cancelled successfully.",
    });
  });;

exports.refundRequest = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const { reason } = req.body;

    // Sub will always be cancelled at this point — user cancels first, then requests refund
    const subscription = await Subscription.findOne({
      userId,
      status: "cancelled",
      providerSubscriptionId: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 }); // ← always gets the most recent cancelled sub

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No cancelled subscription found eligible for refund.",
      });
    }
    const refundDeadline = new Date(
      subscription.cancelledAt.getTime() + 24 * 60 * 60 * 1000,
    );
    if (new Date() > refundDeadline) {
      return res.status(400).json({
        success: false,
        message:
          "Refund requests must be submitted within 24 hours of cancellation.",
      });
    }
    const transaction = await Transaction.findOne({
      userId,
      status: "paid",
      subscriptionId: subscription._id,
    }).sort({ createdAt: -1 });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "No transaction found.",
      });
    }

    // Sanity check — cancelled before the payment was made means something's off
    if (subscription.cancelledAt < transaction.paidAt) {
      return res.status(400).json({
        success: false,
        message: "Refunds are not available for this transaction.",
      });
    }

    const existing = await RefundRequest.findOne({
      userId,
      subscriptionId: subscription._id,
      status: { $in: ["pending", "approved"] },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "approved"
            ? "A refund has already been approved for this account."
            : "You already have a pending refund request.",
      });
    }

    if (["refunded", "partially_refunded"].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: "This transaction has already been refunded.",
      });
    }

    const usageLog = await UsageLog.findOne({
      userId,
      subscriptionId: subscription._id,
      month: getCurrentMonth(),
    }).lean();

    const refundReq = await RefundRequest.create({
      userId,
      subscriptionId: subscription._id,
      transactionId: transaction._id,
      reason,
      tokensUsed: usageLog?.tokensUsed || 0,
      monthlyLimit: subscription.planSnapshot?.limit?.monthlyTokens || 0,
    });

    await Transaction.findByIdAndUpdate(transaction._id, {
      refundRequestId: refundReq._id,
    });

    const user = await User.findById(userId).lean();
    const mail = emailTemplates.refundSubmitted();
    mailSend(user.email, mail.subject, mail.html);

    return res.status(200).json({
      success: true,
      message:
        "Refund request submitted. Our team will review and notify you by email.",
      data: { requestId: refundReq._id },
    });
  });;

exports.getRefundStatus = catchAsync(async (req, res) => {
    const userId = req.user._id;

    // Find the most recent cancelled subscription
    const subscription = await Subscription.findOne({
      userId,
      status: "cancelled",
      providerSubscriptionId: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No refund request found.",
      });
    }

    // Scope to THIS subscription only
    const refundReq = await RefundRequest.findOne({
      userId,
      subscriptionId: subscription._id,
    })
      .sort({ createdAt: -1 })
      .populate("transactionId", "amount currency paidAt")
      .lean();

    if (!refundReq) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "No refund request found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: refundReq.status,
        refundType: refundReq.refundType,
        refundAmount: refundReq.refundAmount,
        userMessage: refundReq.userMessage,
        tokensUsed: refundReq.tokensUsed,
        monthlyLimit: refundReq.monthlyLimit,
        requestedAt: refundReq.createdAt,
        resolvedAt: refundReq.resolvedAt,
        transaction: refundReq.transactionId,
      },
      message: "Refund request retrieved successfully.",
    });
  });;

exports.getSubscriptionStats = catchAsync(async (req, res) => {
    const { search, name, interval, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { "planSnapshot.name": { $regex: search, $options: "i" } },
        { "planSnapshot.interval": { $regex: search, $options: "i" } },
      ];
    }

    if (name) query["planSnapshot.name"] = name;
    if (interval) query["planSnapshot.interval"] = interval;
    if (status) query.status = status;

    const [
      totalSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
      trailingSubscriptions,
      monthlyPlans,
      yearlyPlans,
    ] = await Promise.all([
      Subscription.countDocuments(query),
      Subscription.countDocuments({ ...query, status: "active" }),
      Subscription.countDocuments({ ...query, status: "cancelled" }),
      Subscription.countDocuments({ ...query, status: "expired" }),
      Subscription.countDocuments({ ...query, status: "trailing" }),
      Subscription.countDocuments({
        ...query,
        "planSnapshot.interval": "monthly",
      }),
      Subscription.countDocuments({
        ...query,
        "planSnapshot.interval": "yearly",
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        expiredSubscriptions,
        trailingSubscriptions,
        monthlyPlans,
        yearlyPlans,
      },
      message: "Subscription statistics retrieved successfully.",
    });
  });;

exports.getAllSubscriptions = catchAsync(async (req, res) => {
    const { search, name, interval, status } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const match = {};
    if (name) match["planSnapshot.name"] = name;
    if (interval) match["planSnapshot.interval"] = interval;
    if (status) match.status = status;
    if (search) {
      match.$or = [
        { "planSnapshot.name": { $regex: search, $options: "i" } },
        { "planSnapshot.interval": { $regex: search, $options: "i" } },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            pipeline: [{ $project: { username: 1, email: 1 } }],
            as: "user",
          },
        },
        {
          $lookup: {
            from: "plans",
            localField: "planId",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, price: 1, interval: 1 } }],
            as: "plan",
          },
        },
        {
          $addFields: {
            user: { $first: "$user" },
            plan: { $first: "$plan" },
          },
        },
      ]),
      Subscription.countDocuments(match),
    ]);

    return res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      message: "Subscriptions retrieved successfully.",
    });
  });;

exports.createCheckoutSession = catchAsync(async (req, res) => {
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
      type: "subscription",
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
  });;
