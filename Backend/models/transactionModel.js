const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    type: {
      type: String,
      enum: ["subscription", "addon"],
      default: "subscription",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    paymentProvider: {
      type: String,
      enum: ["razorpay", "stripe"],
      default: "stripe",
    },

    paymentId: {
      type: String,
      trim: true,
    },

    orderId: {
      type: String,
      trim: true,
    },

    checkoutSessionId: {
      type: String,
      trim: true,
    },
    paymentIntentId: {
      type: String,
      trim: true,
    },
    providerCustomerId: {
      type: String,
      trim: true,
    },

    providerSubscriptionId: {
      type: String,
      trim: true,
    },

    invoiceId: {
      type: String,
      trim: true,
    },

    receiptUrl: {
      type: String,
      trim: true,
    },

    failureReason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },

    stripeEventId: {
      type: String,
      trim: true,
    },

    paidAt: {
      type: Date,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    providerRefundId: {
      type: String,
      trim: true,
    },

    refundRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefundRequest",
    },
    invoicePdfUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({
  userId: 1,
  status: 1,
});
transactionSchema.index({ stripeEventId: 1 });

transactionSchema.index({
  paymentId: 1,
});

transactionSchema.index({
  paymentIntentId: 1,
});

transactionSchema.index({
  checkoutSessionId: 1,
});

transactionSchema.index({
  providerSubscriptionId: 1,
});

transactionSchema.index({
  providerCustomerId: 1,
});

transactionSchema.index({
  invoiceId: 1,
});

transactionSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: this.currency,
  }).format(this.amount);
});

transactionSchema.post("init", function () {
  this._previousStatus = this.status;
});

transactionSchema.pre("validate", async function () {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }

  if (this.isModified("status") && this.status === "paid" && !this.paidAt) {
    this.paidAt = new Date();
  }

  if (this.status === "paid" && !this.paymentId && !this.invoiceId) {
    throw new Error(
      "paymentId or invoiceId is required when transaction is paid",
    );
  }

  if (
    this.isModified("status") &&
    ["paid", "refunded"].includes(this._previousStatus) &&
    this.status === "pending"
  ) {
    throw new Error("Cannot revert a completed transaction to pending");
  }

  if (this.refundAmount > this.amount) {
    throw new Error("refundAmount cannot exceed original amount");
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
