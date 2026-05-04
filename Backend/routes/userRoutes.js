const express = require("express");
const route = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleImage } = require("../middleware/multerMiddlware");

route.get("/", authMiddleware, userController.getMyProfile);
route.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    req.imagePath = {
      profilePic: "images/profilePics",
    };
    next();
  },
  uploadSingleImage,
  userController.updateUserProfile,
);

route.get("/search", authMiddleware, userController.searchUsers);

route.get(
  "/profile/:username",
  authMiddleware,
  userController.getPublicProfile,
);

module.exports = route;
