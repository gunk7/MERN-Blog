const express = require("express");
const route = express.Router();
const adminController = require("../controllers/userController");
const adminBlogController = require("../controllers/blogController");
const { isAdmin } = require("../middleware/adminMiddlware");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleImage } = require("../middleware/multerMiddlware");

// ─── User Management  ─────────────────────────────
route.get("/", authMiddleware, isAdmin, adminController.getAllUsers);
route.put(
  "/:id",
  authMiddleware,
  isAdmin,
  (req, res, next) => {
    req.imagePath = {
      profilePic: "images/profilePics",
    };
    next();
  },
  uploadSingleImage,
  adminController.updateUserProfile,
);
route.delete("/:id", authMiddleware, isAdmin, adminController.deleteUser);
route.patch("/:id", authMiddleware, isAdmin, adminController.toggleUserStatus);
route.get(
  "/users/profile/:username",
  authMiddleware,
  isAdmin,
  adminController.getUserProfileAdmin,
);

// ─── Blog Management  ────────────────────────────────────────────────────
route.get("/blogs", adminBlogController.getAllBlogsAdmin);
route.get("/blogs/:id", adminBlogController.getBlogByAdmin);
route.patch("/blogs/:id/status", adminBlogController.updateBlogStatus);
route.delete("/blogs/:id", adminBlogController.deleteBlogAdmin);

// ─── Dashboard Stats (new) ────────────────────────────────────────────────────
route.get("/stats", adminController.getDashboardStats);
route.get("/stats/activity", adminBlogController.getActivityChart);
module.exports = route;
