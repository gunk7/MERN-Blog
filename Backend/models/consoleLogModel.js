const mongoose = require("mongoose");

const consoleLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      // ⚠️  No `index: true` here — TTL index below already creates this index
    },
    environment: {
      type: String,
      default: process.env.NODE_ENV ,
      index: true,
    },
    // Optional context object to store related request/user metadata
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Optional reference to a user related to the log (if available)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: false }
);

// TTL index — auto-delete logs after 7 days (604800 seconds)
consoleLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.models.ConsoleLog || mongoose.model("ConsoleLog", consoleLogSchema);
