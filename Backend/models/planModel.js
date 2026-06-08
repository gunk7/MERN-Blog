const mongoose = require("mongoose");
const { generateUniqueSlug } = require("../utils/slugGeneration");

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      enum: ["base", "add_on"],
      type: String,
      default: "base",
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
    },
    interval: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "one_time"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["active", "archived", "draft"],
      default: "active",
    },
    features: {
      aiChat: { type: Boolean, default: false },
      aiSummary: { type: Boolean, default: false },
      writingAssist: { type: Boolean, default: false },
      tagsGeneration: { type: Boolean, default: false },
      analyticsAccess: { type: Boolean, default: false },
    },
    limit: {
      monthlyTokens: { type: Number, default: 0 },
    },

    stripeProductId: String,
    stripePriceId: String,

    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

planSchema.pre("validate", async function () {
  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }

  if (this.isNew || this.isModified("name")) {
    this.slug = generateUniqueSlug(this.name, this._id);
  }

  if (this.price === 0 && this.interval !== "one_time") {
    this.interval = "one_time";
  }

  if (
    this.price > 0 &&
    this.type === "base" &&
    this.limit.monthlyTokens === 0
  ) {
    throw new Error("Paid base plan must have monthlyTokens > 0");
  }
  if (this.type === "add_on" && this.limit.monthlyTokens === 0) {
    throw new Error("Addon plan must have monthlyTokens > 0");
  }
});

// soft Delete method
planSchema.methods.softDelete = function () {
  this.slug = `${this.slug}-deleted-${Date.now()}`;
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.status = "archived";
  return this.save();
};

module.exports = mongoose.model("Plan", planSchema);
