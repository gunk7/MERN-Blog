const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
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
exports.getMyTransactions = catchAsync(async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("planId", "name price interval")
      .lean();

    return res.status(200).json({
      success: true,
      data: transactions,
      message: "Transactions fetched successfully.",
    });
  });;
// GET /transactions/:id
exports.getTransactionById = catchAsync(async (req, res) => {
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
  });;

//admin controller to get all transactions
exports.getTransactionStats = catchAsync(async (req, res) => {
    const [
      totalTransactions,
      paidTransactions,
      failedTransactions,
      refundedTransactions,
      totalRevenue,
    ] = await Promise.all([
      Transaction.countDocuments(),

      Transaction.countDocuments({
        status: "paid",
      }),

      Transaction.countDocuments({
        status: "failed",
      }),

      Transaction.countDocuments({
        status: {
          $in: ["refunded", "partially_refunded"],
        },
      }),

      Transaction.aggregate([
        {
          $match: {
            status: "paid",
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: "$amount",
            },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        paidTransactions,
        failedTransactions,
        refundedTransactions,
        totalRevenue: totalRevenue[0]?.revenue || 0,
      },
      message: "Transaction stats fetched successfully.",
    });
  });;

exports.getAllTransactions = catchAsync(async (req, res) => {
    const { status, paymentProvider, startDate, endDate, currency } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const match = {};
    if (status) match.status = status;
    if (paymentProvider) match.paymentProvider = paymentProvider;
    if (currency) match.currency = currency;
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "plans",
            localField: "planId",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, price: 1, interval: 1 } }],
            as: "plan",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            pipeline: [{ $project: { username: 1, email: 1 } }],
            as: "user",
          },
        },
        {
          $addFields: {
            plan: { $first: "$plan" },
            user: { $first: "$user" },
          },
        },
      ]),
      Transaction.countDocuments(match),
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      message: "Transactions fetched successfully.",
    });
  });;

exports.getUserTransactions = catchAsync(async (req, res) => {
    const userId = req.params.userId;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .populate("planId planSnapshot", "name price interval")
      .lean();
    return res.status(200).json({
      success: true,
      data: transactions,
      message: "User transactions fetched successfully.",
    });
  });;
exports.getInvoice = catchAsync(async (req, res) => {
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
  });;
