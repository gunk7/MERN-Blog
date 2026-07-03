/**
 * catchAsync — wraps an async Express route handler so that any
 * rejected promise is automatically forwarded to the centralized
 * error-handling middleware via next(err).
 *
 * Usage:
 *   const catchAsync = require("../utils/catchAsync");
 *   exports.getUsers = catchAsync(async (req, res) => {
 *     // ... no try/catch needed, errors flow to errorHandler middleware
 *   });
 *
 * Express 5 already catches async rejections, but this wrapper makes
 * the intent explicit and works identically on Express 4 if the project
 * ever pins an older version.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
