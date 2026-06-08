const express = require("express");
const route = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleImage } = require("../middleware/multerMiddlware");

route.use(authMiddleware);
route.get("/", userController.getMyProfile);
route.put("/:id", ...uploadSingleImage, userController.updateUserProfile);

route.get("/search", authMiddleware, userController.searchUsers);

route.get(
  "/profile/:username",
  authMiddleware,
  userController.getPublicProfile,
);

module.exports = route;
