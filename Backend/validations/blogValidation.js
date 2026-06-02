const Joi = require("joi");
const { BLOG_STATUSES, CATEGORIES } = require("../models/blogModel");

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .message("Must be a valid MongoDB ObjectId");

// ─── Image object schema ───────────────────────────────────────────────────────
const imageSchema = Joi.object({
  url: Joi.string().required().messages({
    "string.empty": "Image URL cannot be empty",
  }),

  filename: Joi.string().required().messages({
    "string.empty": "Image filename cannot be empty",
  }),

  size: Joi.number()
    .max(5 * 1024 * 1024)
    .messages({
      "number.max": "Each image must be under 5MB",
    }),
});

// ─── Main schema ──────────────────────────────────────────────────────────────
const blogJoiSchema = Joi.object({
  title: Joi.string().trim().max(150).messages({
    "string.empty": "Title cannot be empty",
    "string.max": "Title cannot exceed 150 characters",
  }),

  description: Joi.string().max(200).messages({
    "string.empty": "Description cannot be empty",
    "string.max": "Description cannot exceed 200 characters",
  }),

  contentHtml: Joi.string().max(20000).messages({
    "string.empty": "Content cannot be empty",
    "string.max": "Content cannot exceed 20000 characters",
  }),

  contentJson: Joi.object().required(),

  coverImage: Joi.string()
    .allow(null, "")
    .default("uploads/blogs/covers/default-cover.png"),

  // ── Images array ────────────────────────────────────────────────────────────
  images: Joi.array().items(imageSchema).max(10).default([]).messages({
    "array.base": "Images must be an array",
    "array.max": "A blog can have at most 10 images",
  }),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase().max(30))
    .max(10)
    .single()
    .default([])
    .messages({
      "array.max": "A blog can have at most 10 tags",
    }),

  category: Joi.string()
    .trim()
    .valid(...CATEGORIES)
    .messages({
      "string.empty": "Category cannot be empty",
      "any.only": `Category must be one of: ${CATEGORIES.join(", ")}`,
    }),

  status: Joi.string()
    .valid(...BLOG_STATUSES)
    .default("draft")
    .messages({
      "any.only": `Status must be one of: ${BLOG_STATUSES.join(", ")}`,
    }),

  // Auto-set by server — strip if client sends it on create
  publishedAt: Joi.date().iso().allow(null).messages({
    "date.format": "publishedAt must be a valid ISO date",
  }),

  scheduledFor: Joi.date()
    .iso()
    .greater("now")
    .allow(null)
    .when("status", {
      is: "scheduled",
      then: Joi.required().messages({
        "any.required": "scheduledFor is required when status is 'scheduled'",
      }),
    })
    .when("status", {
      is: Joi.valid("draft", "published"),
      then: Joi.valid(null).messages({
        "any.only":
          "scheduledFor must be null when status is 'draft' or 'published'",
      }),
    })
    .messages({
      "date.format": "scheduledFor must be a valid ISO date",
      "date.greater": "scheduledFor must be a future date",
    }),
});

// ─── Validate middleware factory ──────────────────────────────────────────────
const REQUIRED_ON_CREATE = ["title", "description", "contentHtml", "category"];

const validate = (operation) => (req, res, next) => {
  try {
    // Parse JSON safely
    if (typeof req.body.contentJson === "string") {
      req.body.contentJson = JSON.parse(req.body.contentJson);
    }

    if (typeof req.body.images === "string") {
      req.body.images = JSON.parse(req.body.images);
    }

    if (!req.body.contentJson) {
      req.body.contentJson = {};
    }

    // Required fields only on create
    let schema = blogJoiSchema;

    if (operation === "create") {
      schema = schema.fork(REQUIRED_ON_CREATE, (field) => field.required());
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      });
    }

    req.body = value;

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format",
    });
  }
};
module.exports = {
  validateCreateBlog: validate("create"),
  validateUpdateBlog: validate("update"),
};
