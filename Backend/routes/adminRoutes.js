const express = require("express");
const route = express.Router();
const adminController = require("../controllers/userController");
const adminBlogController = require("../controllers/blogController");
const adminPlanController = require("../controllers/planControllers");
const adminSubController = require("../controllers/subControllers");
const adminTransController = require("../controllers/transController");
const adminUsageController = require("../controllers/usageControllers");
const adminRefundController= require("../controllers/refundRequestControllers")
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
route.post(
  "/create-plan",
  validate(createPlanSchema),
  adminPlanController.createPlan,
);
route.patch(
  "/:id",
  validateObjectId("id"),
  validate(updatePlanSchema),
  adminPlanController.updatePlan,
);

//Subscription management routes (admin)
route.get("/subscription/all", adminSubController.getAllSubscriptions);
route.get("/subscription/stats", adminSubController.getSubscriptionStats);

//transaction management routes (admin)
route.get("/transactions/all", adminTransController.getAllTransactions);
route.get("/transactions/stats", adminTransController.getTransactionStats);
route.get(
  "/transactions/:id",
  validateObjectId("id"),
  adminTransController.getTransactionById,
);
//usage management routes (admin)
route.get("/usage/all", adminUsageController.getAllUsage);
route.get(
  "/usage/:id",
  validateObjectId("id"),
  adminUsageController.getUserUsageById,
);

//refund management routes (admin)
route.get("/refunds/all", adminRefundController.getAllRefundRequests);
route.get(
  "/refunds/:id",
  validateObjectId("id"),
  adminRefundController.getRefundRequestById,
);
route.patch(
  "/refunds/:id/resolve",
  validateObjectId("id"),
  adminRefundController.resolveRefundRequest,
);

module.exports = route;
