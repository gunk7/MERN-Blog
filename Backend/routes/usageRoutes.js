const express = require("express");
const route = express.Router();
const usageController = require("../controllers/usageControllers");
const { authMiddleware } = require("../middleware/authMiddleware");
route.use(authMiddleware);

route.get("/my", usageController.getMyUsage);

module.exports = route;