const express = require("express");
const route = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");

route.get("/", authMiddleware, userController.getMyProfile);
route.put("/:id", authMiddleware, userController.updateUserProfile);

module.exports = route;
