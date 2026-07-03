const Joi = require("joi");

const planIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid planId")
  .required();

const createAddonCheckoutSchema = Joi.object({
  planId: planIdSchema,
});

module.exports = {
  createAddonCheckoutSchema,
};
