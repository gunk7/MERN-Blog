const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const AddonPurchase = require("../models/addonPurchaseModel.js");
const Plan = require("../models/planModel");
const Subscription = require("../models/subscriptionModel");
const Transaction = require("../models/transactionModel");
const stripe = require("../config/stripe.js");
const handleError = (res, error) => {
  console.error("Error in addonController:", error);
  res.status(500).json({
    success: false,
    data: false,
    message: error.message || "An error occurred. Please try again later.",
  });
};
exports.getAddonPlans = catchAsync(async (req, res) => {
    const plans = await Plan.find({
      type: "add_on",
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!plans) {
      return res.status(404).json({
        success: false,
        message: "No addon plans found.",
      });
    }
    return res.status(200).json({
      success: true,
      data: { plans },
    });
  });;

exports.createAddonCheckout = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const userEmail = req.user.email;
    const { planId } = req.body;

    // Must have an active subscription to buy addon
    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "trialing"] },
      endDate: { $gt: new Date() },
    });

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "You need an active subscription to purchase addon tokens.",
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      type: "add_on",
      isActive: true,
      isDeleted: false,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Addon plan not found.",
      });
    }

    const transaction = await Transaction.create({
      userId,
      planId: plan._id,
      subscriptionId: subscription._id,
      amount: plan.price,
      currency: "INR",
      paymentProvider: "stripe",
      type: "addon",
      status: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment", // one-time, not subscription
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      metadata: {
        userId: userId.toString(),
        planId: plan._id.toString(),
        transactionId: transaction._id.toString(),
        subscriptionId: subscription._id.toString(),
        type: "addon",
      },
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });

    transaction.checkoutSessionId = session.id;
    await transaction.save();

    return res.status(200).json({
      success: true,
      data: { checkoutUrl: session.url },
    });
  });;

// ── Get user's active addons ──────────────────────────────────────────────────
exports.getMyAddons = catchAsync(async (req, res) => {
    const userId = req.user._id;

    const addons = await AddonPurchase.find({
      userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalAddonTokens = addons.reduce(
      (sum, a) => sum + a.tokensRemaining,
      0,
    );

    return res.status(200).json({
      success: true,
      data: { addons, totalAddonTokens },
    });
  });;
