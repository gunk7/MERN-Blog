const Joi = require("joi");

const email = Joi.string().trim().lowercase().email().required();
const password = Joi.string().trim().min(6).max(128).required();
const username = Joi.string().trim().min(3).max(30).required();
const otp = Joi.string().trim().length(6).required();
const refreshToken = Joi.string().trim().required();

const signupSchema = Joi.object({
  email,
  username,
  password,
});

const verifySchema = Joi.object({
  email,
  otp,
});

const resendOtpSchema = Joi.object({
  email,
});

const loginSchema = Joi.object({
  email,
  password,
});

const forgotPasswordSchema = Joi.object({
  email,
});

const resetPasswordSchema = Joi.object({
  email,
  otp,
  newPassword: Joi.string().trim().min(6).max(128).required(),
});

const changePasswordSchema = Joi.object({
  otp,
  oldPassword: Joi.string().trim().required(),
  newPassword: Joi.string().trim().min(6).max(128).required(),
  confirmPassword: Joi.string().trim().required(),
}).with("newPassword", "confirmPassword");

const refreshSchema = Joi.object({
  refreshToken,
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().trim().optional(),
  allDevices: Joi.boolean().optional(),
}).or("refreshToken", "allDevices").messages({
  "object.missing": "Provide refreshToken or allDevices",
});

module.exports = {
  signupSchema,
  verifySchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshSchema,
  logoutSchema,
};
