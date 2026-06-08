const mongoose = require("mongoose");

const addonPurchaseSchema = new mongoose.Schema(
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
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planSnapshot: {
      name: String,
      price: Number,
      tokens: Number,
    },
    tokensGranted: { type: Number, required: true },
    tokensRemaining: { type: Number, required: true },
    expiresAt: { type: Date, required: true }, // = subscription.endDate
    status: {
      type: String,
      enum: ["active", "exhausted", "expired"],
      default: "active",
    },
  },
  { timestamps: true },
);

const AddonPurchase = mongoose.model("AddonPurchase", addonPurchaseSchema);
module.exports = AddonPurchase; 