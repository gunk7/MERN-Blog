const Joi = require("joi");
const {  BLOG_STATUSES, CATEGORIES } = require("../models/blogModel");

const objectId = Joi.string()
  .pattern(/^[a-f\d]{24}$/i)
  .message("Must be a valid MongoDB ObjectId");

// ─── Image object schema ───────────────────────────────────────────────────────
const imageSchema = Joi.object({
  url:      Joi.string().required().messages({ "string.empty": "Image URL cannot be empty" }),
  filename: Joi.string().required().messages({ "string.empty": "Image filename cannot be empty" }),
  size:     Joi.number().max(5 * 1024 * 1024).messages({
    "number.max": "Each image must be under 5MB",
  }),
  order: Joi.number().integer().min(0).default(0),
});

// ─── Main schema ──────────────────────────────────────────────────────────────
const blogJoiSchema = Joi.object({
  title: Joi.string().trim().max(150).messages({
    "string.empty": "Title cannot be empty",
    "string.max":   "Title cannot exceed 150 characters",
  }),

  description: Joi.string().max(200).messages({
    "string.empty": "Description cannot be empty",
    "string.max":   "Description cannot exceed 200 characters",
  }),

  content: Joi.string().max(5000).messages({
    "string.empty": "Content cannot be empty",
    "string.max":   "Content cannot exceed 5000 characters",
  }),

 
  coverImage: Joi.string().allow(null, "").default("uploads/blogs/covers/default-cover.png"),

  // ── Images array ────────────────────────────────────────────────────────────
  images: Joi.array()
    .items(imageSchema)
    .max(5)
    .default([])
    .messages({
      "array.max":  "A blog can have at most 5 content images",
      "array.base": "Images must be an array",
    }),

  authorId: objectId.optional(),

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
      "any.only":     `Category must be one of: ${CATEGORIES.join(", ")}`,
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
      is:   "scheduled",
      then: Joi.required().messages({
        "any.required": "scheduledFor is required when status is 'scheduled'",
      }),
    })
    .when("status", {
      is:   Joi.valid("draft", "published"),
      then: Joi.valid(null).messages({
        "any.only": "scheduledFor must be null when status is 'draft' or 'published'",
      }),
    })
    .messages({
      "date.format":  "scheduledFor must be a valid ISO date",
      "date.greater": "scheduledFor must be a future date",
    }),
});

// ─── Validate middleware factory ──────────────────────────────────────────────
const REQUIRED_ON_CREATE = ["title", "description", "content", "category"];

const validate = (operation) => (req, res, next) => {
  // Merge multer file paths into req.body before validation
  if (req.files) {
    if (req.files.coverImage?.[0]) {
      req.body.coverImage = req.files.coverImage[0].path.replace(/\\/g, "/");
    }
    if (req.files.images?.length) {
      req.body.images = req.files.images.map((f, i) => ({
        url:      f.path.replace(/\\/g, "/"),
        filename: f.filename,
        size:     f.size,
        order:    i,
      }));
    }
  }

  const schema =
    operation === "update"
      ? blogJoiSchema
          .fork(REQUIRED_ON_CREATE, (field) => field.optional())
          .min(1)
          .messages({ "object.min": "Provide at least one field to update" })
      : blogJoiSchema.fork(REQUIRED_ON_CREATE, (field) => field.required());

  const { error, value } = schema.validate(req.body, {
    abortEarly:    false,
    stripUnknown:  true,
    convert:       true,
  });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: errors.join(", "), data: null });
  }

  req.body = value;
  next();
};

module.exports = {
  validateCreateBlog: validate("create"),
  validateUpdateBlog: validate("update"),
};