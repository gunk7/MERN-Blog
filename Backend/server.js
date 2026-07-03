require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const path = require("path");
const PORT = process.env.PORT;
const cors = require("cors");
const helmet = require("helmet");
const { authLimiter, otpLimiter } = require("./middleware/rateLimiters");
const allRoutes = require("./routes/routes");
const { blogScheduler } = require("./services/cronService");
const { tokenResetScheduler } = require("./services/tokenResetScheduler");
//const session = require("express-session");
const passport = require("./config/passport");

const logger = require("./logger");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const { logger: errorLogger } = require("./utils/errorUtils");

connectDB();
blogScheduler();
tokenResetScheduler();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:2807",
    "https://wavelog-nine.vercel.app",
  ],
  credentials: true,
};

// ── Security Headers (helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    // Content-Security-Policy: report-only mode to start — won't break anything
    // but will log violations. Tighten to enforce: true once you've audited reports.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Tiptap/Tailwind dynamic styles; tighten later
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
        connectSrc: ["'self'", ...corsOptions.origin],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // keep false; true breaks Cloudinary images
  })
);

app.use(cors(corsOptions));
app.use(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  require("./routes/webhookRoutes"), // your webhook router
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(passport.initialize());

app.use(requestLogger);

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", allRoutes);

// ── Centralized error handler (must be AFTER all routes) ──────────────────────
app.use(errorHandler);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

/* app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); */

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// ✅ catch unexpected crashes
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception: " + err.message);
  errorLogger.fatal(err, { source: "uncaughtException" });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection: " + reason);
  const err = reason instanceof Error ? reason : new Error(String(reason));
  errorLogger.error(err, { source: "unhandledRejection" });
});

async function gracefulShutdown(signal) {
  console.log(`[shutdown] Received ${signal}, draining logs...`);
  try {
    await logger.mongoTransport.flush(5000); // wait up to 5s for in-flight Mongo writes
  } catch (e) {
    console.error("[shutdown] Error during log flush:", e.message);
  }
  process.exit(0);
}

process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // nodemon's restart signal
