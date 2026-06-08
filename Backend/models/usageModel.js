const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    month: {
      type: String, // "2025-06"
      required: true,
    },

    tokensUsed: {
      type: Number,
      default: 0,
    },
    addOnTokensUsed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

usageSchema.index({ userId: 1, subscriptionId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("UsageLog", usageSchema);
