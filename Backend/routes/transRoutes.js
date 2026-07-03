const express = require("express");

const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { paramsObjectIdSchema } = require("../validations/commonValidation");

const transactionController = require("../controllers/transController");

router.get("/my", authMiddleware, transactionController.getMyTransactions);
router.get(
  "/:id",
  authMiddleware,
  validate(paramsObjectIdSchema("id"), "params"),
  transactionController.getTransactionById,
);
router.get(
  "/invoice/:transactionId",
  authMiddleware,
  validate(paramsObjectIdSchema("transactionId"), "params"),
  transactionController.getInvoice,
);

module.exports = router;
