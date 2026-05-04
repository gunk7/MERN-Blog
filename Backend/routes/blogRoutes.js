const express = require("express");
const route = express.Router();

const blogController = require("../controllers/blogController");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  uploadImage,
  uploadBlogFiles,
} = require("../middleware/multerMiddlware");
const {
  validateCreateBlog,
  validateUpdateBlog,
} = require("../validations/blogValidation");

route.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    req.imagePath = {
      coverImage: "blogs/covers",
      images: "blogs/images",
    };
    next();
  },
  uploadBlogFiles,
  validateCreateBlog,
  blogController.createBlog,
);

route.get("/slug/:slug", authMiddleware, blogController.getBlogBySlug);
route.get("/my-blogs", authMiddleware, blogController.getMyBlogs);

route.get("/", blogController.getAllBlogs);

route.get("/id/:id", blogController.getBlogById);
route.get("/user/:userId", blogController.getBlogsByUser);

route.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    req.imagePath = {
      coverImage: "blogs/covers",
      images: "blogs/images",
    };
    next();
  },
  uploadBlogFiles,
  validateUpdateBlog,

  blogController.updateBlog,
);

route.post("/like/:id", authMiddleware, blogController.toggleLikeBlog);

route.delete("/:id", authMiddleware, blogController.deleteBlog);

module.exports = route;
