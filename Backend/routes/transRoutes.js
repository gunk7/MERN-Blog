const express = require("express");

const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");

const transactionController = require("../controllers/transController");

router.get("/my", authMiddleware, transactionController.getMyTransactions);
router.get("/:id", authMiddleware, transactionController.getTransactionById);
router.get(
  "/invoice/:transactionId",
  authMiddleware,
  transactionController.getInvoice,
);

module.exports = router;
