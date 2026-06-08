const express = require("express");
const router = express.Router();

const addonController = require("../controllers/addonController");
const {authMiddleware} = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.get("/addon-plans", addonController.getAddonPlans);
router.post("/addon-checkout", addonController.createAddonCheckout);
router.get("/my-addons", addonController.getMyAddons);
module.exports = router;
