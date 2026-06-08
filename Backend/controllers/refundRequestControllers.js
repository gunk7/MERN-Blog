const mongoose = require("mongoose");
const RefundRequest = require("../models/refundRequestModel");
const Subscription = require("../models/subscriptionModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const stripe = require("../config/stripe");
const { mailSend } = require("../utils/mail");
const emailTemplates = require("../utils/emailTemplate");
const handleError = (res, error) => {
  console.error("[adminRefundController]", error.message);
  res.status(500).json({ success: false, message: error.message });
};

exports.getAllRefundRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      RefundRequest.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
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
          $lookup: {
            from: "subscriptions",
            localField: "subscriptionId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  planSnapshot: 1,
                  status: 1,
                  startDate: 1,
                  endDate: 1,
                },
              },
            ],
            as: "subscription",
          },
        },
        {
          $lookup: {
            from: "transactions",
            localField: "transactionId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  amount: 1,
                  currency: 1,
                  paidAt: 1,
                  paymentIntentId: 1,
                },
              },
            ],
            as: "transaction",
          },
        },
        {
          $addFields: {
            user: { $first: "$user" },
            subscription: { $first: "$subscription" },
            transaction: { $first: "$transaction" },
          },
        },
      ]),
      RefundRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getRefundRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const [refundReq] = await RefundRequest.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
        $lookup: {
          from: "subscriptions",
          localField: "subscriptionId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                planSnapshot: 1,
                status: 1,
                startDate: 1,
                endDate: 1,
              },
            },
          ],
          as: "subscription",
        },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "transactionId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                amount: 1,
                currency: 1,
                paidAt: 1,
                paymentIntentId: 1,
              },
            },
          ],
          as: "transaction",
        },
      },
      {
        $addFields: {
          user: { $first: "$user" },
          subscription: { $first: "$subscription" },
          transaction: { $first: "$transaction" },
        },
      },
    ]);

    if (!refundReq) {
      return res
        .status(404)
        .json({ success: false, message: "Refund request not found." });
    }

    return res.status(200).json({ success: true, data: refundReq });
  } catch (error) {
    handleError(res, error);
  }
};
// POST /api/admin/refunds/:id/resolve
exports.resolveRefundRequest = async (req, res) => {
  try {
    console.log("Resolving refund request:", req.params.id, req.body);
    const { refundType, refundAmount, userMessage, adminNote } = req.body;
    const adminId = req.user._id;

    if (!refundType || !userMessage) {
      return res.status(400).json({
        success: false,
        message: "refundType and userMessage are required.",
      });
    }

    const refundReq = await RefundRequest.findById(req.params.id);
    if (!refundReq) {
      return res
        .status(404)
        .json({ success: false, message: "Refund request not found." });
    }
    if (refundReq.status !== "pending") {
      return res
        .status(400)
        .json({ success: false, message: "Request already resolved." });
    }

    const [transaction, subscription, user] = await Promise.all([
      Transaction.findById(refundReq.transactionId),
      Subscription.findById(refundReq.subscriptionId),
      User.findById(refundReq.userId).lean(),
    ]);

    // ── 1. Hit Stripe if refund is full or partial ──────────
    if (refundType === "full" || refundType === "partial") {
      if (!transaction?.paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: "Cannot refund — paymentIntentId missing on transaction.",
        });
      }

      const amountInPaise = Math.round(refundAmount * 100);

      const stripeRefund = await stripe.refunds.create(
        {
          payment_intent: transaction.paymentIntentId,
          amount: amountInPaise,
          reason: "requested_by_customer",
        },
        { idempotencyKey: `refund_resolve_${refundReq._id}` },
      );

      if (stripeRefund.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          message: "Stripe refund failed. Please try again.",
        });
      }

      transaction.status =
        refundType === "full" ? "refunded" : "partially_refunded";
      transaction.refundAmount = refundAmount;
      transaction.refundReason = userMessage;
      transaction.refundedAt = new Date();
      transaction.providerRefundId = stripeRefund.id;
      await transaction.save();
    }

    // ── 2. Cancel subscription ──────────────────────────────
    // ── 2. Cancel subscription — ONLY if approving ──────────────────────────────
    if (refundType !== "none") {
      // ← ADD THIS GUARD
      if (subscription?.providerSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(
            subscription.providerSubscriptionId,
          );
        } catch (err) {
          if (err.code !== "resource_missing") throw err;
        }
      }

      if (subscription) {
        subscription.status = "cancelled";
        subscription.autoRenew = false;
        subscription.cancelledAt = new Date();
        await subscription.save();
      }
    }
    // ── 3. Update refund request ────────────────────────────
    refundReq.status = refundType === "none" ? "rejected" : "approved";
    refundReq.refundType = refundType;
    refundReq.refundAmount = refundAmount || 0;
    refundReq.adminNote = adminNote;
    refundReq.userMessage = userMessage;
    refundReq.resolvedAt = new Date();
    refundReq.resolvedBy = adminId;
    await refundReq.save();

    // ── 4. Email user ───────────────────────────────────────
    const { subject, html } = emailTemplates.refundResolved(
      user.name,
      refundReq.status === "approved",
      refundAmount,
      userMessage,
    );
    await mailSend(user.email, subject, html);

    return res.status(200).json({
      success: true,
      message: "Resolved and user notified.",
      data: {
        status: refundReq.status,
        refundType: refundReq.refundType,
        refundAmount: refundReq.refundAmount,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};
