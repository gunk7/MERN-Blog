const cron = require("node-cron");
const { Blog } = require("../models/blogModel");

const blogScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const result = await Blog.updateMany(
        {
          status: "scheduled",
          scheduledFor: { $lte: now },
        },
        {
          $set: {
            status: "published",
            publishedAt: now,
            scheduledFor: null,
          },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[Cron] Published ${result.modifiedCount} scheduled posts.`,
        );
      }
    } catch (error) {
      console.error("[Cron Error]", error);
    }
  });

  console.log("⏰ Cron Job initialized: Checking every minute.");
};

module.exports = { blogScheduler };
