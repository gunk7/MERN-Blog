/**
 * Generic Joi validation middleware
 * @param {Object} schema - The Joi schema to validate against
 */
const validate = (schema, source = "body") => (req, res, next) => {
  const data = req[source];
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
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

  req[source] = value;
  next();
};

module.exports = validate;
