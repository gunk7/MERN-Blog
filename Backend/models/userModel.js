const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      unique: true,
      sparse:true,
      minlength: 3,
      maxlength: 12,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email address",
      ],
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
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
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        deviceInfo: { type: String, default: "Unknown Device" },
        ipAddress: { type: String, default: null },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: 60 * 60 * 24 * 30,
        },
      },
    ],
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    subscribersCount: { type: Number, default: 0 },
    subscribedToCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function () {
  try {
    if (this.isModified("username") && this.username) {
      this.username = this.username.trim().toLowerCase();
    }

    // 🔹 Normalize email
    if (this.isModified("email") && this.email) {
      this.email = this.email.trim().toLowerCase();
    }
    if (!this.password || !this.isModified("password")) return;

    const isAlreadyHashed = /^\$2[ayb]\$.{56}$/.test(this.password);

    if (isAlreadyHashed) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error("Password hashing failed: " + error.message);
  }
});

UserSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  if (!update) return;

  // Handle direct updates
  if (update.username) {
    update.username = update.username.trim().toLowerCase();
  }

  if (update.email) {
    update.email = update.email.trim().toLowerCase();
  }

  // Handle $set updates (VERY IMPORTANT)
  if (update.$set) {
    if (update.$set.username) {
      update.$set.username = update.$set.username.trim().toLowerCase();
    }

    if (update.$set.email) {
      update.$set.email = update.$set.email.trim().toLowerCase();
    }
  }

  this.setUpdate(update);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
UserSchema.methods.addRefreshToken = function (token, deviceInfo, ipAddress) {
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // evict oldest if over device limit
  }
  this.refreshTokens.push({ token, deviceInfo, ipAddress });
  return this.save();
};

UserSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
  return this.save();
};

UserSchema.methods.removeAllRefreshTokens = function () {
  this.refreshTokens = [];
  return this.save();
};

UserSchema.methods.hasRefreshToken = function (token) {
  return this.refreshTokens.some((t) => t.token === token);
};

UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.refreshTokens; // never expose sessions
    delete ret.googleId;
  },
});

module.exports = mongoose.model("User", UserSchema);
