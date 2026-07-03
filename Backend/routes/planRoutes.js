const express = require("express");
const router = express.Router();
const planControllers = require("../controllers/planControllers");
const validate = require("../middleware/validate");
const { paramsObjectIdSchema } = require("../validations/commonValidation");

//Get all Plans
router.get("/all", planControllers.getPlans);
router.get(
  "/:id",
  validate(paramsObjectIdSchema("id"), "params"),
  planControllers.getPlanById,
);

module.exports = router;
