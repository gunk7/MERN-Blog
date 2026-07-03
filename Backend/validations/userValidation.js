const Joi = require("joi");

const updateUserProfileSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).optional(),
  firstName: Joi.string().trim().max(30).optional().allow(""),
  lastName: Joi.string().trim().max(30).optional().allow(""),
  bio: Joi.string().trim().max(500).optional().allow(""),
  dob: Joi.date().iso().optional().allow(null, ""),
  gender: Joi.string()
    .trim()
    .valid("male", "female", "other")
    .optional()
    .allow(null, ""),
  country: Joi.string().trim().max(56).optional().allow(null, ""),
  removeImage: Joi.boolean().optional(),
});

const searchUsersQuerySchema = Joi.object({
  q: Joi.string().trim().optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  updateUserProfileSchema,
  searchUsersQuerySchema,
};
