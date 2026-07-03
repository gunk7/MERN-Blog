const express = require("express");
const router = express.Router();

const addonController = require("../controllers/addonController");
const { authMiddleware } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { createAddonCheckoutSchema } = require("../validations/addonValidation");

router.use(authMiddleware);
router.get("/addon-plans", addonController.getAddonPlans);
router.post(
  "/addon-checkout",
  validate(createAddonCheckoutSchema),
  addonController.createAddonCheckout,
);
router.get("/my-addons", addonController.getMyAddons);
module.exports = router;
