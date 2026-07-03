const mongoose = require("mongoose");
const crypto = require("crypto");
const {
  ERROR_CATEGORIES,
  ERROR_LEVELS,
  ERROR_SOURCES,
  ENVIRONMENTS,
  isValidSubtypeForCategory,
} = require("../utils/errorUtils");

const errorLogSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, required: true },
    category: { type: String, required: true, enum: ERROR_CATEGORIES },
    subtype: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          if (!isValidSubtypeForCategory(this.category, value)) {
            throw new Error(
              `"${value}" is not a valid subtype for category "${this.category}"`,
            );
          }
          return true;
        },
      },
    },
    name: { type: String, required: true, index: true },
    message: { type: String, required: true },
    stack: { type: String },
    environment: { type: String, required: true, enum: ENVIRONMENTS },
    file: { type: String },
    line: { type: Number },
    column: { type: Number, default: null },
    level: {
      type: String,
      required: true,
      enum: ERROR_LEVELS,
      default: "error",
    },
    source: { type: String, required: true, enum: ERROR_SOURCES },
    endpoint: { type: String, index: true, default: null },
    method: { type: String, default: null },
    requestId: { type: String, index: true, default: null },
    jobRunId: { type: String, index: true, default: null },

    occurrenceCount: { type: Number, default: 1 },
    lastSeenAt: { type: Date, default: Date.now },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    resolvedNote: { type: String, default: null },
    linkedTo: { type: mongoose.Schema.Types.ObjectId, ref: "ErrorLog" },
  },
  { timestamps: true },
);

// Promise-based only — no next param. Mongoose 9.x doesn't inject a callback here.
errorLogSchema.pre("validate", async function () {
  if (!this.fingerprint) {
    const components = [
      this.name || "",
      this.message || "",
      this.file || "",
      this.line || "",
      this.endpoint || "",
    ].join("|");
    this.fingerprint = crypto
      .createHash("sha256")
      .update(components)
      .digest("hex");
  }
});

module.exports =
  mongoose.models.ErrorLog || mongoose.model("ErrorLog", errorLogSchema);
