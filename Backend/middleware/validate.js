/**
 * Generic Joi validation middleware
 * @param {Object} schema - The Joi schema to validate against
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return all errors, not just the first one
    stripUnknown: true, // Remove fields not defined in the schema
  });

  if (error) {
    const errorMessage = error.details
      .map((details) => details.message)
      .join(", ");

    return res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }

  // Replace req.body with the cleaned/validated values
  req.body = value;
  next();
};

module.exports = validate;
