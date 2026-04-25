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
      max: 200,
    },
    dob: {
      type: Date,
      validate: {
        validator: (value) => value <= new Date(),
        message: "Date of Birth is invalid",
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "other","prefer not to say"],
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
