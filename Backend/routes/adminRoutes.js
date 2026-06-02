const express = require("express");
const route = express.Router();
const adminController = require("../controllers/userController");
const adminBlogController = require("../controllers/blogController");
const adminPlanController = require("../controllers/planControllers");
const { isAdmin } = require("../middleware/adminMiddlware");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadSingleImage } = require("../middleware/multerMiddlware");
const validate = require("../middleware/validate");
const {
  validateObjectId,
  createPlanSchema,
  updatePlanSchema,
} = require("../validations/subscriptionValidation");

// applies to every route in this file — no need to repeat on individual routes
route.use(authMiddleware);
route.use(isAdmin);

route.get("/me", adminController.getAdminProfile);
// ─── User Management ──────────────────────────────────────────────────────────
route.get("/users/profile/:username", adminController.getUserProfileAdmin);

route.get("/", adminController.getAllUsers);
route.delete("/:id", adminController.deleteUser);
route.patch("/:id", adminController.toggleUserStatus);
route.put(
  "/:id",
  (req, res, next) => {
    req.imagePath = { profilePic: "images/profilePics" };
    next();
  },
  uploadSingleImage,
  adminController.updateUserProfile,
);

// ─── Blog Management ──────────────────────────────────────────────────────────
route.get("/blogs", adminBlogController.getAllBlogsAdmin);
route.get("/blogs/:id", adminBlogController.getBlogByAdmin);
route.patch("/blogs/:id/status", adminBlogController.updateBlogStatus);
route.delete("/blogs/:id", adminBlogController.deleteBlogAdmin);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
route.get("/stats", adminController.getDashboardStats);
route.get("/stats/activity", adminBlogController.getActivityChart);

//Plan Managment
route.get("/plan/stats/plans", adminPlanController.getPlanStats); // ← moved above /:id
route.get("/plan", adminPlanController.getPlans);
route.get("/plan/:id", validateObjectId("id"), adminPlanController.getPlanById);
route.post("/create-plan", validate(createPlanSchema), adminPlanController.createPlan);
route.patch(
  "/:id",
  validateObjectId("id"),
  validate(updatePlanSchema),
  adminPlanController.updatePlan,
);
route.delete("/:id", validateObjectId("id"), adminPlanController.deletePlan);
module.exports = route;
