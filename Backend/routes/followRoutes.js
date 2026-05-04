const express = require("express");
const route = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const followController = require("../controllers/followController");
const { validate, followSchemaValidation } = require("../validations/validation");
route.get("/followers", authMiddleware, followController.getFollowers);
route.get("/following", authMiddleware, followController.getFollowing);

route.post("/:followingId", authMiddleware, validate(followSchemaValidation, "body"), followController.followUser);
route.delete("/:followingId", authMiddleware, validate(followSchemaValidation, "body"), followController.unfollowUser);

module.exports = route;