const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subControllers");
const { authMiddleware } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  createCheckoutSessionSchema,
} = require("../validations/subscriptionValidation");

router.post("/free", authMiddleware, subscriptionController.selectFreePlan);

router.post(
  "/checkout",
  authMiddleware,
  validate(createCheckoutSessionSchema),
  subscriptionController.createCheckoutSession,
);
router.get("/my", authMiddleware, subscriptionController.getMySubscriptions);
router.patch(
  "/cancel",
  authMiddleware,
  subscriptionController.cancelSubscription,
);
router.patch(
  "/toggle-auto-renew",
  authMiddleware,
  subscriptionController.toggleAutoRenewal,
);

router.post("/refund", authMiddleware, subscriptionController.refundRequest);

module.exports = router;
