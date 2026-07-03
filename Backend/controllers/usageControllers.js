const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const UsageLog = require("../models/usageModel");

const Subscription = require("../models/subscriptionModel");
const AddonPurchase = require("../models/addonPurchaseModel");
const { FREE_PLAN, getCurrentMonth } = require("../middleware/checkUsageLimit");

exports.getMyUsage = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const month = getCurrentMonth();

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ["active", "trialing", "cancelled"] },
      endDate: { $gt: new Date() },
    }).lean();

    const plan = subscription
      ? {
          features: subscription.planSnapshot?.features ?? FREE_PLAN.features,
          limit: subscription.planSnapshot?.limit ?? FREE_PLAN.limit,
        }
      : FREE_PLAN;
      
    const usage = await UsageLog.findOne({
      userId,
      subscriptionId: subscription?._id,
      month,
    }).lean();

    const tokensUsed = usage?.tokensUsed || 0;
    const monthlyLimit = plan.limit.monthlyTokens;

    const activeAddons = await AddonPurchase.find({
      userId,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).lean();

    const totalAddonTokensRemaining = activeAddons.reduce(
      (sum, a) => sum + a.tokensRemaining,
      0,
    );
    return res.status(200).json({
      success: true,
      usage: {
        used: tokensUsed,
        limit: monthlyLimit,
        remaining: Math.max(0, monthlyLimit - tokensUsed),
        usedPercentage: Math.min(
          100,
          monthlyLimit > 0 ? (tokensUsed / monthlyLimit) * 100 : 0,
        ),
        addonTokensRemaining: totalAddonTokensRemaining,
      },
      features: {
        aiChat: plan.features.aiChat,
        writingAssist: plan.features.writingAssist,
        aiSummary: plan.features.aiSummary,
        tagsGeneration: plan.features.tagsGeneration,
        analyticsAccess: plan.features.analyticsAccess,
      },
    });
  });;

/* exports.getUsageStats = catchAsync(async (req, res) => {

  });; */

exports.getAllUsage = catchAsync(async (req, res) => {
    const { month } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (month) {
      filter.month = month;
    }
    const [usageLogs, total] = await Promise.all([
      UsageLog.find(filter)
        .populate("userId", "name email")
        .populate("subscriptionId", "status")
        .sort({ month: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      UsageLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: usageLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      message: "Usage records retrieved successfully.",
    });
  });;

exports.getUserUsageById = catchAsync(async (req, res) => {
    const usage = await UsageLog.find({
      userId: req.params.userId,
    })
      .populate("subscriptionId", "status")
      .sort({ month: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: usage,
      message: "User usage retrieved successfully.",
    });
  });;
