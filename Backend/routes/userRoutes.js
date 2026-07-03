const express = require("express");
const route = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleImage } = require("../middleware/multerMiddlware");
const validate = require("../middleware/validate");
const {
  updateUserProfileSchema,
  searchUsersQuerySchema,
} = require("../validations/userValidation");

route.use(authMiddleware);
route.get("/", userController.getMyProfile);
route.put(
  "/:id",
  validate(updateUserProfileSchema),
  ...uploadSingleImage,
  userController.updateUserProfile,
);

route.get("/search", validate(searchUsersQuerySchema, "query"), userController.searchUsers);

route.get("/profile/:username", userController.getPublicProfile);

module.exports = route;
