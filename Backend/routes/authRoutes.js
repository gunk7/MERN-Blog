const express = require("express");
const route = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
route.post("/signup", authController.signup);
route.post("/verify", authController.verifyAndCreateUser);
route.post("/resendOtp", authController.resendOtp);

route.post("/login", authController.login);

route.post("/forgot_password", authController.forgotPassword);
route.post("/reset_password", authController.resetPassword);
route.post(
  "/change_password_request",
  authMiddleware,
  authController.changePasswordReq,
);
route.post("/change_password", authMiddleware, authController.changePassword);
module.exports = route;
