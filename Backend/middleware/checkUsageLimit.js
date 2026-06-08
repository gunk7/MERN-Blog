const Subscription = require("../models/subscriptionModel");
const UsageLog = require("../models/usageModel");
const AddonPurchase = require("../models/addonPurchaseModel");

const FREE_PLAN = {
  features: {
    aiChat: true,
    aiSummary: true,
    writingAssist: false,
    tagsGeneration: true,
    analyticsAccess: false,
  },
  limit: {
    monthlyTokens: 50000,
  },
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function checkUsageLimit(feature) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const month = getCurrentMonth();

      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ["active", "trialing", "cancelled"] },
        endDate: { $gt: new Date() },
      }).lean();

      const plan = subscription ? subscription.planSnapshot : FREE_PLAN;

      // 1. Feature gate
      if (plan.features[feature] === false) {
        return res.status(403).json({
          success: false,
          message: "This feature requires a higher plan.",
        });
      }

      // 2. Token limit
      const usage = subscription
        ? await UsageLog.findOne({
            userId,
            subscriptionId: subscription._id,
            month,
          }).lean()
        : null;

      const totalUsed =
        (usage?.tokensUsed || 0) + (usage?.addOnTokensUsed || 0);

      if (totalUsed >= plan.limit.monthlyTokens) {
        // Only now check for addon tokens
        const activeAddon = await AddonPurchase.findOne({
          userId,
          status: "active",
          expiresAt: { $gt: new Date() },
          tokensRemaining: { $gt: 0 },
        }).lean();

        if (!activeAddon) {
          return res.status(429).json({
            success: false,
            message:
              "Monthly token limit reached. Purchase an addon pack or upgrade your plan.",
          });
        }

        // Has addon tokens — flag for usage handler to deduct from addon
        req.useAddonTokens = true;
        req.activeAddon = activeAddon;
      }

      // Attach to request for handlers
      req.plan = plan;
      req.subscriptionId = subscription?._id || null;
      next();
    } catch (err) {
      console.error("[checkUsageLimit]", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}

module.exports = { checkUsageLimit, FREE_PLAN, getCurrentMonth };
