const Subscription = require("../models/subscriptionModel");
const UsageLog = require("../models/usageModel");

const FREE_PLAN = {
  features: {
    aiChat: true,
    aiSummary: true,
    writingAssist: false,
    tagsGeneration: true,
    analyticsAccess: false,
  },
  limits: {
    monthlyTokens: 50000,
    writingAssistHits: 0,
    summaryHits: 5,
    tagHits: 20,
    maxInputChars: 2000,
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

      // Load active subscription
      const subscription = await Subscription.findOne({
        userId,
        status: { $in: ["active", "trialing","cancelled"] },
        endDate: { $gt: new Date() },
      }).lean();

      const plan = subscription ? subscription.planSnapshot : FREE_PLAN;

      // Check feature access
      if (!plan.features[feature]) {
        return res.status(403).json({
          success: false,
          message: `This feature requires a Pro plan.`,
        });
      }

      // Load usage log
      const usage = (await UsageLog.findOne({ userId, month })) || {
        chatTokens: 0,
        writingAssistHits: 0,
        summaryHits: 0,
        tagHits: 0,
      };

      // Check limits per feature
      if (feature === "aiChat") {
        if (usage.chatTokens >= plan.limits.monthlyTokens) {
          return res.status(429).json({
            success: false,
            message: "Monthly chat token limit reached. Upgrade or wait until next month.",
          });
        }
      }

      if (feature === "writingAssist") {
        if (usage.writingAssistHits >= plan.limits.writingAssistHits) {
          return res.status(429).json({
            success: false,
            message: `Writing assist limit reached (${plan.limits.writingAssistHits}/month).`,
          });
        }
      }

      if (feature === "aiSummary") {
        if (usage.summaryHits >= plan.limits.summaryHits) {
          return res.status(429).json({
            success: false,
            message: `Summary limit reached (${plan.limits.summaryHits}/month).`,
          });
        }
      }

      if (feature === "tagsGeneration") {
        if (usage.tagHits >= plan.limits.tagHits) {
          return res.status(429).json({
            success: false,
            message: `Tag generation limit reached (${plan.limits.tagHits}/month).`,
          });
        }
      }

      // Attach to request for handlers to use
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