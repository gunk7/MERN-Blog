const express = require("express");
const route = express.Router();
const commentController = require("../controllers/commentController");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  validate,
  createCommentValidation,
  querySchema,
  updateCommentValidation,
  likeCommentValidation,
} = require("../validations/validation");

// Create a new comment
route.post(
  "/",
  authMiddleware,
  validate(createCommentValidation, "body"),
  commentController.createComment,
);

// Get comments for a blog post
route.get(
  "/blog/:blogId",
  validate(querySchema, "query"),
  commentController.getComments,
);

// Get replies for a comment
route.get(
  "/replies/:commentId",
  validate(querySchema, "query"),
  commentController.getComments,
);

// Update a comment
route.put(
  "/:commentId",
  authMiddleware,
  validate(updateCommentValidation, "body"),
  commentController.updateComment,
);

// Delete a comment
route.delete("/:commentId", authMiddleware, commentController.deleteComment);

// Toggle like/unlike on a comment
route.post(
  "/like/:commentId",
  authMiddleware,
  validate(likeCommentValidation, "body"),
  commentController.toggleLike,
);

module.exports = route;
