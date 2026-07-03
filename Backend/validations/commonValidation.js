const Joi = require("joi");

const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ObjectId");

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(10),
});

const paramsObjectIdSchema = (paramName) =>
  Joi.object({
    [paramName]: objectId.required(),
  });

module.exports = {
  objectId,
  paginationSchema,
  paramsObjectIdSchema,
};
