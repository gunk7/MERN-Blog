const mongoose = require("mongoose");

const contentAnalysisSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      unique: true,
    },

    // ---- moderation (Hugging Face toxic-bert) ----
    moderationStatus: {
      type: String,
      enum: ["pending", "clear", "review", "blocked"],
      default: "pending",
    },
    flags: [{ type: String }], // e.g. "toxic", "insult", "threat", "identity_hate"
    moderationScores: {
      type: mongoose.Schema.Types.Mixed, // raw scores from the model, keyed by label (toxic, insult, threat, etc.)
      default: {},
    },

    analyzedAt: { type: Date },
  },
  { timestamps: true },
);

contentAnalysisSchema.index({ moderationStatus: 1 });

const ContentAnalysis = mongoose.model(
  "ContentAnalysis",
  contentAnalysisSchema,
);

module.exports = { ContentAnalysis };
