const Joi = require("joi");

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message("Must be a valid MongoDB ObjectId");

// ─── Joi Validation for message schema
const messageValidationSchema = Joi.object({
  role: Joi.string().valid("user", "model").required(),
  content: Joi.string().trim().min(1).max(32000).required(),
  tokenCount: Joi.number().integer().min(0).default(0),
});

const validateMessage = (data) =>
  messageValidationSchema.validate(data, { abortEarly: false });

// ─── Joi Validation for chat schema
const chatValidationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).default("New chat"),
  model: Joi.string().trim().default("gemini-3-flash-preview"),
  isArchived: Joi.boolean().default(false),
});

const validateChat = (data) =>
  chatValidationSchema.validate(data, { abortEarly: false });

const chatRouteMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(32000).required(),
  chatId: objectId.optional(),
});

const chatIdParamSchema = Joi.object({
  chatId: objectId.required(),
});

const renameChatSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
});

const writingAssistantSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
  action: Joi.string().trim().max(100).optional().allow(""),
  tone: Joi.string().trim().max(50).optional().allow(""),
});

const tagsSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
});

const summarySchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
  isSelection: Joi.boolean().optional(),
});

const queryPageSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});

module.exports = {
  validateMessage,
  validateChat,
  chatRouteMessageSchema,
  chatIdParamSchema,
  renameChatSchema,
  writingAssistantSchema,
  tagsSchema,
  summarySchema,
  queryPageSchema,
};
