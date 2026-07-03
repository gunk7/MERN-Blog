const logger = require("../logger");
module.exports = (req, res, next) => {
  const start = Date.now();
  const requestContext = {
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    userAgent: req.get("user-agent"),
    userId: req.user?._id || req.user?.id || null,
    requestId: req.headers["x-request-id"] || req.id || null,
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level](`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      context: requestContext,
      user: req.user?._id || req.user?.id || undefined,
    });
  });
  next();
};
