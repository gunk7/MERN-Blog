const Joi = require("joi");
const mongoose = require("mongoose");

// Custom MongoDB ID validator
const objectId = Joi.string()
  .custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "MongoDB ObjectId validation")
  .messages({
    "any.invalid": "Invalid ID format",
  });

// For route params (like /:id)
const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName} format`,
    });
  }
  next();
};

// ── Plan ──────────────────────────────────────────────────────────────────────

const planFeaturesSchema = Joi.object({
  aiChat: Joi.boolean().default(false),
  aiSummary: Joi.boolean().default(false),
  writingAssist: Joi.boolean().default(false),
  tagsGeneration: Joi.boolean().default(false),
  analyticsAccess: Joi.boolean().default(false),
});

const planLimitsSchema = Joi.object({
  monthlyTokens: Joi.number().integer().min(0).default(0),
  dailyAiRequests: Joi.number().integer().min(0).default(0),
  maxInputChars: Joi.number().integer().min(0).default(2000),
  maxSummaryChars: Joi.number().integer().min(0).default(10000),
});

const createPlanSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Plan name is required",
  }),

  description: Joi.string().trim().max(300).optional().allow(""),

  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
  }),

  durationDays: Joi.number().integer().min(1).required().messages({
    "number.min": "Duration must be at least 1 day",
  }),

  interval: Joi.string()
    .valid("monthly", "quarterly", "yearly", "one_time")
    .default("monthly"),

  status: Joi.string().valid("active", "archived", "draft").default("active"),

  features: planFeaturesSchema.default(),
  limits: planLimitsSchema.default(),

  isActive: Joi.boolean().default(true),

  // ← Stripe fields
  stripePriceId: Joi.string().trim().optional().allow(""),
  stripeProductId: Joi.string().trim().optional().allow(""),
}).custom((val, helpers) => {
  if (val.price === 0) val.interval = "one_time";

  if (val.price > 0 && val.limits?.dailyAiRequests === 0) {
    return helpers.message("Paid plan must have dailyAiRequests > 0");
  }

  if (val.price > 0 && !val.stripePriceId) {
    return helpers.message("Paid plan must have a stripePriceId");
  }

  return val;
});

const updatePlanSchema = createPlanSchema.fork(
  ["name", "price", "durationDays"],
  (f) => f.optional(),
);

// ── Subscription ──────────────────────────────────────────────────────────────

const createSubscriptionSchema = Joi.object({
  planId: objectId.required().messages({
    "string.empty": "planId is required",
  }),
});

const updateSubscriptionSchema = Joi.object({
  status: Joi.string()
    .valid("active", "expired", "cancelled", "pending", "past_due")
    .optional(),

  autoRenew: Joi.boolean().optional(),

  endDate: Joi.date().greater("now").optional().messages({
    "date.greater": "endDate must be in the future",
  }),
})
  .min(1)
  .messages({ "object.min": "Provide at least one field to update" });

// ── Transaction ───────────────────────────────────────────────────────────────

const createOrderSchema = Joi.object({
  planId: objectId.required().messages({
    "string.empty": "planId is required",
  }),
});

const updateTransactionSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "paid", "failed", "refunded")
    .required()
    .messages({ "any.only": "Invalid transaction status" }),

  paymentId: Joi.when("status", {
    is: "paid",
    then: Joi.string().trim().required().messages({
      "string.empty": "paymentId is required when status is paid",
    }),
    otherwise: Joi.string().trim().optional(),
  }),
}).custom((val, helpers) => {
  if (val.status === "refunded" && !val.paymentId) {
    return helpers.error("any.invalid", {
      message: "Cannot refund a transaction without a paymentId",
    });
  }
  return val;
});

// ── Checkout ──────────────────────────────────────────────────────────────────

const createCheckoutSessionSchema = Joi.object({
  planId: objectId.required().messages({
    "string.empty": "planId is required",
  }),
});

module.exports = {
  objectId,
  validateObjectId,
  createPlanSchema,
  updatePlanSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  createOrderSchema,
  updateTransactionSchema,
  createCheckoutSessionSchema,
};
