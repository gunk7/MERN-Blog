const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: false,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    planName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "refunded", "void"],
      default: "paid",
    },
    stripeInvoiceId: { type: String },
    stripeInvoicePdfUrl: { type: String },
    pdfUrl: { type: String, default: null },
    paidAt: { type: Date },
  },
  { timestamps: true },
);

invoiceSchema.pre("save", async function () {
  if (this.invoiceId) return;
  const year = new Date().getFullYear();
  const prefix = `WL-${year}-`;

  const last = await mongoose
    .model("Invoice")
    .findOne(
      { invoiceId: { $regex: `^${prefix}` } },
      { invoiceId: 1 },
      { sort: { createdAt: -1 } },
    );

  const lastSeq = last ? parseInt(last.invoiceId.replace(prefix, ""), 10) : 0;

  this.invoiceId = `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
});
module.exports = mongoose.model("Invoice", invoiceSchema);
