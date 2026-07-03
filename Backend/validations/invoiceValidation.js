// validations/invoiceValidation.js
const Joi = require("joi");

const uploadPdfSchema = Joi.object({
  invoiceId: Joi.string()
    .pattern(/^WL-\d{4}-\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "invoiceId must be in format WL-YYYY-XXXX",
      "any.required": "invoiceId is required",
    }),
});

const getByTransactionSchema = Joi.object({
  transactionId: Joi.string().hex().length(24).required().messages({
    "string.hex": "transactionId must be a valid MongoDB ObjectId",
    "string.length": "transactionId must be 24 characters",
    "any.required": "transactionId is required",
  }),
});

const getByInvoiceIdSchema = Joi.object({
  invoiceId: Joi.string()
    .pattern(/^WL-\d{4}-\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "invoiceId must be in format WL-YYYY-XXXX",
      "any.required": "invoiceId is required",
    }),
});

const getBySessionIdSchema = Joi.object({
  sessionId: Joi.string().trim().required().messages({
    "any.required": "sessionId is required",
    "string.empty": "sessionId cannot be empty",
  }),
});

module.exports = {
  uploadPdfSchema,
  getByTransactionSchema,
  getByInvoiceIdSchema,
  getBySessionIdSchema,
};
