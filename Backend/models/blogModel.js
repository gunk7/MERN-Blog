const mongoose = require("mongoose");
const Joi = require("joi");
const { generateUniqueSlug } = require("../utils/slugGeneration");

const BLOG_STATUSES = ["draft", "published", "scheduled"];
const CATEGORIES = [
  "Technology",
  "Design",
  "Business",
  "Science",
  "Culture",
  "Health & Wellness",
  "Finance",
  "Education",
  "Travel",
  "Food & Lifestyle",
  "Sports",
  "Entertainment",
  "Politics",
  "Environment",
  "Personal",
];

const blogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 5000 },

    coverImage: {
      type: String,
      default: "uploads/blogs/covers/default-cover.png",
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          filename: { type: String, required: true },
          size: { type: Number },
          order: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
    category: { type: String, required: true, enum: CATEGORIES },
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
    },
    publishedAt: { type: Date },
    deletedAt: { type: Date },
    scheduledFor: { type: Date },

    viewsCount: { type: Number, default: 0, min: 0 },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

blogSchema.index({ authorId: 1, status: 1 }); // getMyBlogs sections
blogSchema.index({ status: 1, scheduledFor: 1 }); // scheduler job queries
blogSchema.index({ category: 1, publishedAt: -1 }); // browse by category
blogSchema.index({ tags: 1 }); // tag filtering
blogSchema.index({ deletedAt: 1 }, { sparse: true }); // soft-delete lookups

//Virtuals

// Estimated read time (avg 200 wpm)
blogSchema.virtual("readTime").get(function () {
  const words = this.content?.trim().split(/\s+/).length ?? 0;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
});

// Expose whether the blog is soft-deleted
blogSchema.virtual("isDeleted").get(function () {
  return this.deletedAt !== null;
});

//  Pre-save hook
blogSchema.pre("save", async function () {

 
  // Auto-stamp publishedAt when status flips to published
  if (this.isModified("status")) {
    if (this.status === "published" && !this.publishedAt) {
      this.publishedAt = new Date();
    }
    // Clear scheduledFor if moved out of scheduled
    if (this.status !== "scheduled") {
      this.scheduledFor = null;
    }
  }
});

blogSchema.pre("validate", async function () {
  // Generate slug on new blog creation
  if (!this.slug) {
    if (!this._id) {
      this._id = new mongoose.Types.ObjectId();
    }
    this.slug = generateUniqueSlug(this.title, this._id);
  }
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = { Blog, BLOG_STATUSES, CATEGORIES };
