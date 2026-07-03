const express = require("express");
const route = express.Router();
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiters");
const {
  signupSchema,
  verifySchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshSchema,
  logoutSchema,
} = require("../validations/authValidation");

route.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  authController.signup,
);
route.post(
  "/verify",
  otpLimiter,
  validate(verifySchema),
  authController.verifyAndCreateUser,
);
route.post(
  "/resendOtp",
  otpLimiter,
  validate(resendOtpSchema),
  authController.resendOtp,
);

route.get("/google", authController.googleAuth);
route.get("/google/callback", authController.googleCallback);
route.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh,
);

route.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login,
);

route.post(
  "/forgot_password",
  otpLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
route.post(
  "/reset_password",
  otpLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
route.post(
  "/change_password_request",
  authMiddleware,
  authController.changePasswordReq,
);
route.post(
  "/change_password",
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword,
);

route.post(
  "/logout",
  authMiddleware,
  validate(logoutSchema),
  authController.logout,
);
module.exports = route;
