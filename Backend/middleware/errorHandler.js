const { logger: errorLogger, classifyError } = require("../utils/errorUtils");

/**
 * Express error-handling middleware (4 params).
 *
 * Place this AFTER all routes in server.js. Any error that reaches here
 * — whether thrown in an async handler (Express 5 catches those automatically)
 * or forwarded via next(err) — gets:
 *   1. Persisted to the ErrorLog collection via errorLogger
 *   2. Sent back as a clean JSON response
 *
 * Controllers can still catch and respond themselves; this is a safety net
 * for anything that slips through or for a gradual migration away from
 * per-controller try/catch blocks.
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express's default handler
  if (res.headersSent) {
    return next(err);
  }

  const classification = classifyError(err);

  // Determine log level from the status code
  const statusCode = err.statusCode || classification.statusCode || 500;
  let level = "error";
  if (statusCode >= 500) level = "error";
  else if (statusCode >= 400) level = "warning";

  // Persist to MongoDB (fire-and-forget, never throws)
  errorLogger[level](err, {
    source: "middleware",
    endpoint: req.originalUrl,
    method: req.method,
    requestId: req.headers["x-request-id"] || null,
  });

  // Respond
  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal Server Error"
        : err.message || "Something went wrong",
  });
}

module.exports = errorHandler;
