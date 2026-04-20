const mongoose = require("mongoose");

const UserDetailsSchema = new mongoose.Schema(
  {
    profilePic: {
      type: String,
      default: "uploads/images/profilePics/blank.jpg",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },

    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      required: [true, "Bio is Required"],
      max: 200,
    },
    dob: {
      type: Date,
      required: [true, "Date of Birth is Required"],
      validate: {
        validator: (value) => value <= new Date(),
        message: "Date of Birth is invalid",
      },
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other"],
      lowercase: true,
      trim: true,
    },
    country: {
      type: String,
    },
  },

  { timestamps: true },
);

module.exports = mongoose.model("UserDetail", UserDetailsSchema);
