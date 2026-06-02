const express = require("express");
const router = express.Router();
const planControllers = require("../controllers/planControllers");
const validate = require("../middleware/validate");


//Get all Plans
router.get("/all", planControllers.getPlans);
router.get("/:id", planControllers.getPlanById);

module.exports = router;
