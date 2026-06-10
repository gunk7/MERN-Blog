const cron = require("node-cron");
const UsageLog = require("../models/usageModel");
const Subscription = require("../models/subscriptionModel");

const tokenResetScheduler = () => {
  // Runs every day at midnight — checks whose anniversary it is today
  cron.schedule("0 0 * * *", async () => {
    try {
      const now = new Date();
      const todayDay = now.getDate(); // e.g. 15

      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Handle end-of-month edge case:
      // If today is the 28th and startDate was on the 31st,
      // we reset on the last day of the month for those users
      const daysInCurrentMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();

      const isLastDayOfMonth = todayDay === daysInCurrentMonth;

      // Find active subscriptions whose billing day matches today
      const subscriptions = await Subscription.find({
        status: { $in: ["active", "trialing"] },
      }).select("_id userId startDate planSnapshot");

      const toReset = subscriptions.filter((sub) => {
        const billingDay = new Date(sub.startDate).getDate();

        // Direct match
        if (billingDay === todayDay) return true;

        // Edge case: billing day (e.g. 31) doesn't exist this month
        // → reset on last day of current month instead
        if (isLastDayOfMonth && billingDay > daysInCurrentMonth) return true;

        return false;
      });

      if (!toReset.length) {
        console.log(
          `[Cron] Token reset: No resets due today (day ${todayDay}).`,
        );
        return;
      }

      const bulkOps = toReset.map((sub) => ({
        updateOne: {
          filter: {
            userId: sub.userId,
            subscriptionId: sub._id,
            month: currentMonth,
          },
          update: {
            $setOnInsert: {
              userId: sub.userId,
              subscriptionId: sub._id,
              month: currentMonth,
              tokensUsed: 0,
              addOnTokensUsed: 0,
            },
          },
          upsert: true,
        },
      }));

      const result = await UsageLog.bulkWrite(bulkOps);

      console.log(
        `[Cron] Token reset: ${result.upsertedCount} subscriptions reset for day ${todayDay} of ${currentMonth}.`,
      );
    } catch (error) {
      console.error("[Cron Error] Token reset failed:", error);
    }
  });

  console.log("⏰ Cron Job initialized: Daily token reset check at midnight.");
};

module.exports = { tokenResetScheduler };
