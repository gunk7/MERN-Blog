const express = require("express");
const route = express.Router();
const adminController = require("../controllers/userController");
const { isAdmin } = require("../middleware/adminMiddlware");
const { authMiddleware } = require("../middleware/authMiddleware");

route.get("/", authMiddleware, isAdmin, adminController.getAllUsers);
route.put("/:id", authMiddleware, isAdmin, adminController.updateUserProfile);
route.delete("/:id", authMiddleware, isAdmin, adminController.deleteUser);

module.exports = route;
