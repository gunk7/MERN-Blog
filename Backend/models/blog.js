const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A blog must have a title"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Content cannot be empty"],
  },
  type: {
    type: String,
    enum: ["text", "video", "audio", "image-gallery"],
    default: "text",
  },
  coverImage: {
    type: String, 
    default: "default-cover.jpg",
  },
  images: [String], 
  author: {
    type: mongoose.Schema.ObjectId,
    ref: "User", 
    required: [true, "A blog must belong to an author"],
  },
  tags: [String],
  category: {
    type: String,
    required: [true, "Please specify a category"],
    enum: [
      "Food", "Travel", "Health & Fitness", "Lifestyle", 
      "Fashion & Beauty", "DIY Craft", "Parenting", 
      "Business", "Personal Finance", "Sports", "Other"
    ],
  },
  status: {
    type: String,
    enum: ["draft", "published", "scheduled"],
    default: "draft",
  },
 
  publishedAt: Date,
  scheduledFor: Date,
  viewsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
}, {
  timestamps: true, 
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;