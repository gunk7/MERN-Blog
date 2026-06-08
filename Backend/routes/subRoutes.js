const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subControllers");
const { authMiddleware } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const {
  createCheckoutSessionSchema,
} = require("../validations/subscriptionValidation");

router.use(authMiddleware);

router.post("/free", subscriptionController.selectFreePlan);

router.post(
  "/checkout",
  validate(createCheckoutSessionSchema),
  subscriptionController.createCheckoutSession,
);
router.get("/my", subscriptionController.getMySubscriptions);
router.patch("/cancel", subscriptionController.cancelSubscription);
router.patch("/toggle-auto-renew", subscriptionController.toggleAutoRenewal);
router.post("/refund-request", subscriptionController.refundRequest);
router.get("/refund-status", subscriptionController.getRefundStatus);

module.exports = router;
