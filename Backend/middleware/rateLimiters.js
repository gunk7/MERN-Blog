const rateLimit = require("express-rate-limit");

// ── Auth rate limiter ─────────────────────────────────────────────────────────
// Applied to: /login, /signup
// 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// ── OTP rate limiter ──────────────────────────────────────────────────────────
// Applied to: /verify, /resendOtp, /forgot_password, /reset_password
// 5 requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests, please wait before retrying." },
});

module.exports = { authLimiter, otpLimiter };
