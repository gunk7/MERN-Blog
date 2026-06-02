const express = require("express");
const route = express.Router();

const blogController = require("../controllers/blogController");

const { authMiddleware } = require("../middleware/authMiddleware");

const {
  uploadInlineImage,
  uploadBlogFiles,
} = require("../middleware/multerMiddlware");

const {
  validateCreateBlog,
  validateUpdateBlog,
} = require("../validations/blogValidation");

/* ─────────────────────────────────────────────
   INLINE EDITOR IMAGE UPLOAD
───────────────────────────────────────────── */

route.post(
  "/upload/inline",
  authMiddleware,
  (req, res, next) => {
    req.imagePath = {
      image: "blogs/inline",
    };

    next();
  },
  uploadInlineImage,
  blogController.uploadInlineImage,
);

/* ─────────────────────────────────────────────
   CREATE BLOG
───────────────────────────────────────────── */

route.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    req.imagePath = {
      coverImage: "blogs/covers",
    };

    next();
  },
  uploadBlogFiles,
  validateCreateBlog,
  blogController.createBlog,
);

/* ─────────────────────────────────────────────
   GET BLOGS
───────────────────────────────────────────── */

route.get("/slug/:slug", authMiddleware, blogController.getBlogBySlug);

route.get("/my-blogs", authMiddleware, blogController.getMyBlogs);

route.get("/", blogController.getAllBlogs);

route.get("/id/:id", blogController.getBlogById);

route.get("/user/:userId", blogController.getBlogsByUser);

/* ─────────────────────────────────────────────
   UPDATE BLOG
───────────────────────────────────────────── */

route.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    req.imagePath = {
      coverImage: "blogs/covers",
    };

    next();
  },
  uploadBlogFiles,
  validateUpdateBlog,
  blogController.updateBlog,
);

/* ─────────────────────────────────────────────
   LIKE BLOG
───────────────────────────────────────────── */

route.post("/like/:id", authMiddleware, blogController.toggleLikeBlog);

/* ─────────────────────────────────────────────
   DELETE BLOG
───────────────────────────────────────────── */

route.delete("/:id", authMiddleware, blogController.deleteBlog);

module.exports = route;