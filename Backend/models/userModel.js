const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 12,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    subscribersCount: { type: Number, default: 0 },
    subscribedToCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  // 1. If the password hasn't changed at all, skip.
  if (!this.isModified("password")) return;

  // 2. Check if the string is already a valid Bcrypt hash.
  // Bcrypt hashes follow a specific structure: $2[abyp]$cost$salt+hash
  const isAlreadyHashed = /^\$2[ayb]\$.{56}$/.test(this.password);

  // 3. If it's already a hash (migrating from UserVerify), stop here.
  if (isAlreadyHashed) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error("Password hashing failed: " + error.message);
  }
});
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
  },
});

module.exports = mongoose.model("User", UserSchema);
