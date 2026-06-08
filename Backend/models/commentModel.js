const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    content: { type: String, required: true, trim: true },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    deletedAt: { type: Date, default: null },
    isEdited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

commentSchema.index({ blogId: 1, parentCommentId: 1 }); // For fetching comments of a blog and their replies efficiently
commentSchema.index({ authorId: 1 });

module.exports = mongoose.model("Comment", commentSchema);
