const Joi = require("joi");

// ─── Joi Validation  for messageSchema
const messageValidationSchema = Joi.object({
  role: Joi.string().valid("user", "model").required(),
  content: Joi.string().trim().min(1).max(32000).required(),
  tokenCount: Joi.number().integer().min(0).default(0),
});

const validateMessage = (data) =>
  messageValidationSchema.validate(data, { abortEarly: false });

// ─── Joi Validation for  chat Schema
const chatValidationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).default("New chat"),
  model: Joi.string().trim().default("gemini-3-flash-preview"),
  isArchived: Joi.boolean().default(false),
});

const validateChat = (data) =>
  chatValidationSchema.validate(data, { abortEarly: false });

module.exports = { validateMessage, validateChat };
