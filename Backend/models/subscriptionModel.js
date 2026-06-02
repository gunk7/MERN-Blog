const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planSnapshot: {
      name: String,
      price: Number,
      interval: String,

      features: {
        aiChat: Boolean,
        aiSummary: Boolean,
        writingAssist: Boolean,
        tagsGeneration: Boolean,
        analyticsAccess: Boolean,
      },

      limits: {
        monthlyTokens: Number,
        writingAssistHits: Number,
        summaryHits: Number,
        tagHits: Number,
        maxInputChars: Number,
      },
    },
    providerSubscriptionId: {
      type: String,
      trim: true,
    },

    providerCustomerId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
        "incomplete",
      ],
      default: "trialing",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ providerSubscriptionId: 1 });
subscriptionSchema.index({ providerCustomerId: 1 });

subscriptionSchema.virtual("isLive").get(function () {
  return (
    ["active", "cancelled"].includes(this.status) && this.endDate > new Date()
  );
});

subscriptionSchema.virtual("daysRemaining").get(function () {
  if (!["active", "cancelled"].includes(this.status)) return 0;
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
});

subscriptionSchema.pre("validate", async function () {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }

  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    throw new Error("endDate must be after startDate");
  }

  if (this.status === "active" && this.endDate < new Date()) {
    this.status = "expired";
  }

  if (this.status === "cancelled" && !this.cancelledAt) {
    this.autoRenew = false;
    if (!this.cancelledAt) this.cancelledAt = new Date();
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
