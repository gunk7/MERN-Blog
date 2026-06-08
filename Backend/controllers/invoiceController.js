const fs = require("fs");
const path = require("path");
const Invoice = require("../models/invoiceModel");
const {
  uploadPdfSchema,
  getByTransactionSchema,
  getByInvoiceIdSchema,
} = require("../validations/invoiceValidation");

// ── POST /api/invoices/upload-pdf ─────────────────────────────────────────────
exports.uploadInvoicePdf = async (req, res) => {
  try {
    /*  if (!req.file) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "No file received",
      });
    }
 */

    if (!req.cloudinaryFile) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "No file received",
      });
    }
    const { error, value } = uploadPdfSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: false,
        message:
          error.message || "Something went wrong while validating the request",
      });
    }

    // ── Check if PDF already exists ──────────────────────────────
    const existing = await Invoice.findOne({ invoiceId: value.invoiceId });
    if (existing?.pdfUrl) {
      // No local file to clean up anymore — Cloudinary middleware already
      // uploaded it, but we can destroy the orphaned upload since we won't use it
      if (req.cloudinaryFile?.public_id) {
        const cloudinary = require("../config/cloudinary");
        await cloudinary.uploader.destroy(req.cloudinaryFile.public_id, {
          resource_type: "raw",
        });
      }

      return res.json({
        success: true,
        data: { pdfUrl: existing.pdfUrl, invoice: existing },
      });
    }

    // ── Save Cloudinary URL ──────────────────────────────────────────────────
    const pdfUrl = req.cloudinaryFile.secure_url;

    const invoice = await Invoice.findOneAndUpdate(
      { invoiceId: value.invoiceId },
      {
        $set: {
          pdfUrl,
          pdfPublicId: req.cloudinaryFile.public_id, // ← see schema note below
        },
      },
      { new: true },
    );

    if (!invoice) {
      // Invoice record missing — clean up the orphaned Cloudinary file
      const cloudinary = require("../config/cloudinary");
      await cloudinary.uploader.destroy(req.cloudinaryFile.public_id, {
        resource_type: "raw",
      });

      return res.status(404).json({
        success: false,
        data: false,
        message: "Invoice not found",
      });
    }

    return res.json({
      success: true,
      data: { pdfUrl, invoice },
    });
  } catch (err) {
    console.error("Invoice upload error:", err.message);
    return res
      .status(500)
      .json({ success: false, data: false, message: err.message });
  }
};

// ── GET /api/invoices/my ──────────────────────────────────────────────────────
exports.getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("planId", "name price interval");

    return res.json({ success: true, data: invoices });
  } catch (err) {
    console.error("Fetch invoices error:", err.message);
    return res
      .status(500)
      .json({ success: false, data: false, message: err.message });
  }
};

// ── GET /api/invoices/transaction/:transactionId ──────────────────────────────
exports.getInvoiceByTransaction = async (req, res) => {
  try {
    const { error, value } = getByTransactionSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ success: false, data: false, message: error.message });
    }

    const invoice = await Invoice.findOne({
      transactionId: value.transactionId,
    }).populate("planId", "name price interval");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, data: false, message: "Invoice not found" });
    }

    // make sure the invoice belongs to the logged-in user
    if (invoice.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, data: false, message: "Forbidden" });
    }

    return res.json({ success: true, data: invoice });
  } catch (err) {
    console.error("Fetch invoice error:", err.message);
    return res
      .status(500)
      .json({ success: false, data: false, message: err.message });
  }
};

// ── GET /api/invoices/:invoiceId ──────────────────────────────────────────────
exports.getInvoiceById = async (req, res) => {
  try {
    const { error, value } = getByInvoiceIdSchema.validate(req.params);
    if (error) {
      return res
        .status(400)
        .json({ success: false, data: false, message: error.message });
    }

    const invoice = await Invoice.findOne({
      invoiceId: value.invoiceId,
      userId: req.user._id,
    }).populate("planId", "name price interval");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, data: false, message: "Invoice not found" });
    }

    return res.json({ success: true, data: invoice });
  } catch (err) {
    console.error("Fetch invoice error:", err.message);
    return res
      .status(500)
      .json({ success: false, data: false, message: err.message });
  }
};

// GET /api/invoices/session/:sessionId
// PaymentStatus page uses this — session_id is all Stripe gives in the URL
exports.getInvoiceBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Find the transaction by checkoutSessionId
    const Transaction = require("../models/transactionModel");
    const transaction = await Transaction.findOne({
      checkoutSessionId: sessionId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Transaction not found",
      });
    }

    const invoice = await Invoice.findOne({
      transactionId: transaction._id,
    }).populate("planId", "name price interval");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Invoice not found",
      });
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: false,
        message: "Forbidden",
      });
    }

    return res.json({ success: true, data: invoice });
  } catch (err) {
    console.error("Fetch invoice by session error:", err.message);
    return res
      .status(500)
      .json({ success: false, data: false, message: err.message });
  }
};
