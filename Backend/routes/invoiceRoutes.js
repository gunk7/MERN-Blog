const express = require("express");
const router = express.Router();
const { uploadInvoicePdf } = require("../middleware/multerMiddlware");
const invoiceController = require("../controllers/invoiceController");
const { authMiddleware } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  getByTransactionSchema,
  getByInvoiceIdSchema,
  getBySessionIdSchema,
} = require("../validations/invoiceValidation");

router.use(authMiddleware);

router.post(
  "/upload-pdf",
  ...uploadInvoicePdf,
  invoiceController.uploadInvoicePdf,
);
router.get("/my", invoiceController.getMyInvoices);
router.get(
  "/transaction/:transactionId",
  validate(getByTransactionSchema, "params"),
  invoiceController.getInvoiceByTransaction,
);
router.get(
  "/:invoiceId",
  validate(getByInvoiceIdSchema, "params"),
  invoiceController.getInvoiceById,
);
router.get(
  "/session/:sessionId",
  validate(getBySessionIdSchema, "params"),
  invoiceController.getInvoiceBySession,
);
module.exports = router;
