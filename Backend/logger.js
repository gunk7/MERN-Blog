const { createLogger, format, transports } = require("winston");
const WinstonTransport = require("winston-transport");
const mongoose = require("mongoose");
const ConsoleLog = require("./models/consoleLogModel");

class MongoDbTransport extends WinstonTransport {
  constructor(opts) {
    super(opts);
    // Track in-flight writes so we can wait for them on shutdown
    this.pending = new Set();
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { level, message, timestamp, context, user, ...meta } = info;
    const normalizedContext = context && typeof context === "object" ? context : {};
    const normalizedUser = user || meta.user || undefined;
    const normalizedMeta = { ...meta };
    delete normalizedMeta.context;
    delete normalizedMeta.user;

    const writePromise = ConsoleLog.create({
      level: level
        ? level.replace(/\u001b\[[0-9;]*m/g, "").toLowerCase()
        : "info",
      message:
        typeof message === "object" ? JSON.stringify(message) : String(message),
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      environment: process.env.NODE_ENV || "development",
      context: normalizedContext,
      user: normalizedUser,
      meta: normalizedMeta || {},
    })
      .catch((err) => {
        // Now this will actually be visible, since we're not racing process exit
        console.error(
          "[Winston-MongoDbTransport] Failed to save log:",
          err.message,
        );
      })
      .finally(() => {
        this.pending.delete(writePromise);
      });

    this.pending.add(writePromise);

    // Still call back immediately — Winston shouldn't block on this per-log,
    // but now we have a way to drain pending writes on shutdown (see flush() below).
    if (callback) {
      callback();
    }
  }

  // Called manually on shutdown to wait for in-flight writes
  async flush(timeoutMs = 5000) {
    if (this.pending.size === 0) return;
    const all = Promise.allSettled([...this.pending]);
    await Promise.race([
      all,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }
}

const mongoTransport = new MongoDbTransport();

const logger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.json(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
    mongoTransport,
  ],
});

// Expose so server.js can drain on shutdown
logger.mongoTransport = mongoTransport;

module.exports = logger;
