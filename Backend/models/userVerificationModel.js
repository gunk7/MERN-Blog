const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userVerificationSchema = new mongoose.Schema(
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
      required: function () {
        return this.otp?.type === "email_verification";
      },
      minlength: 8,
      maxlength: 128,
      
    },
    otp: {
      code: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: [
          "email_verification",
          "password_reset",
          "change_password",
          "account_deletion",
          "subscription_confirm",
        ],
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      attempts: {
        type: Number,
        default: 0,
        max: 5,
      },
    },
  },
  { timestamps: true },
);

userVerificationSchema.index({ "otp.expiresAt": 1 }, { expireAfterSeconds: 0 });

userVerificationSchema.pre("save", async function () {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      throw new Error("Password hashing failed");
    }
  }
  if (this.isModified("otp.code") && this.otp?.code) {
    const salt = await bcrypt.genSalt(10);
    this.otp.code = await bcrypt.hash(this.otp.code, salt);
  }
});

userVerificationSchema.methods.compareOTP = async function (inputCode) {
  if (!this.otp?.code) return false;
  return await bcrypt.compare(inputCode, this.otp.code);
};
module.exports = mongoose.model("UserVerification", userVerificationSchema);
