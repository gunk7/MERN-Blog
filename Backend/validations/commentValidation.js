const Joi = require("joi");

const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ObjectId");

const createCommentValidation = Joi.object({
  blogId: objectId.required(),
  content: Joi.string().required().trim().max(200),
  parentCommentId: objectId.allow(null).default(null),
});

const updateCommentValidation = Joi.object({
  content: Joi.string().trim().min(1).max(200).required(),
});

const followSchemaValidation = Joi.object({
  followingId: objectId.required(),
});


const likeCommentValidation = Joi.object({
  commentId: objectId.required(),
});
// Pagination and Query Validation (GET requests)
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("").trim(),
  sortBy: Joi.string().valid("createdAt", "likesCount").default("createdAt"),
});

// Updated validate middleware
const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[source]); // Dynamic source selection
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: error.message || "Something went wrong",
      });
    }
    req[source] = value; // Replace with sanitized/defaulted values
    next();
  };

module.exports = {
  createCommentValidation,
  updateCommentValidation,
  followSchemaValidation,
  likeCommentValidation,
  querySchema,
  validate,
};
