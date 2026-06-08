const { createLogger, format, transports } = require("winston");
const logger = createLogger({
  level: "debug",
  format: format.json(),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "HH:mm:ss" }),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} ${level}: ${message}`;
        }),
      ),
    }),
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
  ],
});

module.exports = logger;
