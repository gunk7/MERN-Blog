const express = require("express");
const route = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const followController = require("../controllers/followController");
const validate = require("../middleware/validate");
const { paramsObjectIdSchema } = require("../validations/commonValidation");

route.get("/followers", authMiddleware, followController.getFollowers);
route.get("/following", authMiddleware, followController.getFollowing);

route.post(
  "/:followingId",
  authMiddleware,
  validate(paramsObjectIdSchema("followingId"), "params"),
  followController.followUser,
);
route.delete(
  "/:followingId",
  authMiddleware,
  validate(paramsObjectIdSchema("followingId"), "params"),
  followController.unfollowUser,
);

module.exports = route;
