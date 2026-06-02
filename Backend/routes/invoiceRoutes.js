const express = require("express");
const router = express.Router();
const { uploadInvoicePdf } = require("../middleware/multerMiddlware");
const invoiceController = require("../controllers/invoiceController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post(
  "/upload-pdf",
  uploadInvoicePdf,
  invoiceController.uploadInvoicePdf,
);
router.get("/my", invoiceController.getMyInvoices);
router.get(
  "/transaction/:transactionId",
  invoiceController.getInvoiceByTransaction,
);
router.get("/:invoiceId", invoiceController.getInvoiceById);
router.get("/session/:sessionId", invoiceController.getInvoiceBySession);
module.exports = router;
