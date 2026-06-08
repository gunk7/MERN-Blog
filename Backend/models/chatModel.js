const mongoose = require("mongoose");


// ─── Schema ───────────────────────────────────────────────────────────────────

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New chat",
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    model: {
      type: String,
      default: "gemini-3-flash-preview",
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

ChatSchema.index({ userId: 1, lastMessageAt: -1 });
ChatSchema.index({ userId: 1, isArchived: 1 });

// ─── Hooks ────────────────────────────────────────────────────────────────────

ChatSchema.pre("save", function () {
  if (this.isModified("title") && this.title) {
    this.title = this.title.trim();
  }
});

ChatSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  if (update.title) update.title = update.title.trim();
  if (update.$set?.title) update.$set.title = update.$set.title.trim();

  this.setUpdate(update);
});

// ─── Methods ─────────────────────────────────────────────────────────────────

// Call this whenever a new message is added to keep lastMessageAt current
ChatSchema.methods.touch = function () {
  this.lastMessageAt = new Date();
  return this.save();
};

ChatSchema.methods.archive = function () {
  this.isArchived = true;
  return this.save();
};

ChatSchema.methods.unarchive = function () {
  this.isArchived = false;
  return this.save();
};

// ─── toJSON ───────────────────────────────────────────────────────────────────

ChatSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("Chat", ChatSchema);
