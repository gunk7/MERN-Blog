const Transaction = require("../models/transactionModel");
const handleError = (res, error) => {
  console.error("[SubscriptionController]", error.message);
  res.status(500).json({
    success: false,
    data: false,
    message: error.message || "Internal Server Error",
  });
};
// GET /transactions
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("planId", "name price interval")
      .lean();

    return res.status(200).json({
      success: true,
      data: transactions,
      message: "Transactions fetched successfully.",
    });
  } catch (error) {
    handleError(res, error);
  }
};
// GET /transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id, // scope to this user — don't let users see others'
    })
      .populate("planId", "name price interval features")
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
      message: "Transaction fetched successfully.",
    });
  } catch (error) {
    handleError(res, error);
  }
};
exports.getInvoice = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.transactionId,
      userId: req.user._id, // ensure user owns it
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (!transaction.receiptUrl) {
      return res.status(404).json({
        success: false,
        message: "Invoice not yet available",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        invoiceId: transaction.invoiceId,
        receiptUrl: transaction.receiptUrl, // hosted page
        invoicePdfUrl: transaction.invoicePdfUrl, // PDF download
        amount: transaction.formattedAmount,
        paidAt: transaction.paidAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
