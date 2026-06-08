const mongoose = require("mongoose");

const refundRequestSchema = new mongoose.Schema(
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
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    tokensUsed: { type: Number, default: 0 },
    monthlyLimit: { type: Number, default: 0 },

    refundType: {
      type: String,
      enum: ["full", "partial", "none"],
    },
    refundAmount: { type: Number, default: 0 }, 
    adminNote: { type: String, trim: true },
    userMessage: { type: String, trim: true },

    resolvedAt: { type: Date },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    providerRefundId: { type: String, trim: true },
  },
  { timestamps: true },
);

refundRequestSchema.index({ userId: 1, status: 1 });
refundRequestSchema.index({ transactionId: 1 });

module.exports = mongoose.model("RefundRequest", refundRequestSchema);
