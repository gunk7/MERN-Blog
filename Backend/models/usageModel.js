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
      default: null,
    },
    month: {
      type: String, // "2026-05"
      required: true,
    },
    chatTokens: {
      type: Number,
      default: 0,
    },
    writingAssistHits: {
      type: Number,
      default: 0,
    },
    summaryHits: {
      type: Number,
      default: 0,
    },
    tagHits: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

usageSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("UsageLog", usageSchema);