const mongoose = require("mongoose");
const Chat = require("./chatModel");

const MESSAGE_STATUSES = ["streaming", "completed", "interrupted", "error"];

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },

    content: {
      type: String,
      trim: true,
      default: "",
      maxlength: 32000,
    },

    status: {
      type: String,
      enum: MESSAGE_STATUSES,
      default: "completed",
      index: true,
    },

    error: {
      type: String,
      default: null,
      maxlength: 500,
    },

    tokenCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    model: {
      type: String,
      default: null,
    },

    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ─────────────────────────────────────────

MessageSchema.index({ chatId: 1, createdAt: 1 });
MessageSchema.index({ chatId: 1, role: 1 });
MessageSchema.index({ chatId: 1, status: 1 });

// ─── Hooks ───────────────────────────────────────────

MessageSchema.pre("save", async function () {
  if (this.isModified("content") && this.content) {
    this.content = this.content.trim();
  }


});

MessageSchema.post("save", async function () {
  try {
    await Chat.findByIdAndUpdate(this.chatId, {
      $set: {
        lastMessageAt: this.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to update chat lastMessageAt:", error.message);
  }
});

// ─── Methods ─────────────────────────────────────────

MessageSchema.methods.isStreaming = function () {
  return this.status === "streaming";
};

MessageSchema.methods.isCompleted = function () {
  return this.status === "completed";
};

MessageSchema.methods.isInterrupted = function () {
  return this.status === "interrupted";
};

MessageSchema.methods.hasError = function () {
  return this.status === "error";
};

module.exports = mongoose.model("Message", MessageSchema);
