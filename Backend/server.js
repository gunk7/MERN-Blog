require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/database");
const path = require("path");
const PORT = process.env.PORT;
const cors = require("cors");
const allRoutes = require("./routes/routes");
const { blogScheduler } = require("./services/cronService");
const session = require("express-session");
const passport = require("./config/passport");

const logger = require("./logger");
const requestLogger = require("./middleware/requestLogger");

connectDB();
blogScheduler();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:2807",
    /https:\/\/wavelog-.*\.vercel\.app/,
  ],
  credentials: true,
};

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

app.get("/", (req, res) => {
  return res.send("Welcome to the Blogging Platform API");
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
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection: " + reason);
});
