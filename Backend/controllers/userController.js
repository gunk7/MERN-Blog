const userModel = require("../models/userModel");
const userDetail = require("../models/userDetail");
const aggregatePaginate = require("../utils/aggregate");
const mongoose = require("mongoose");

//Admin Dashboard
exports.getAllUsers = async (req, res) => {
  try {
    console.log(req.query);

    const {
      search,
      searchBy,
      sortBy,
      sortOrder,
      page,
      limit,
      country,
      gender,
    } = req.query;
    const regex = { $regex: search, $options: "i" };

    let searchCriteria = [];
    if (searchBy === "name") {
      searchCriteria = [{ firstName: regex }, { lastName: regex }];
    } else if (searchBy === "email") {
      searchCriteria = [{ email: regex }];
    } else if (searchBy === "username") {
      searchCriteria = [{ username: regex }];
    } else {
      searchCriteria = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
      ];
    }

    const filterCriteria = {};
    if (country) filterCriteria["profile.country"] = country;
    if (gender) filterCriteria["profile.gender"] = gender;

    const sortField = sortBy || "createdAt";
    const direction = sortOrder === "desc" ? -1 : 1;
    const sortStage = { [sortField]: direction };

    const basePipeline = [
      { $match: { role: "user" } },
      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...(search ? { $or: searchCriteria } : {}),
          ...filterCriteria,
        },
      },
      {
        $project: {
          userId: "$_id",
          username: 1,
          email: 1,
          isAccountVerified: 1,
          createdAt: 1,
          firstName: { $ifNull: ["$profile.firstName", "N/A"] },
          lastName: { $ifNull: ["$profile.lastName", "N/A"] },
          bio: "$profile.bio",
          country: "$profile.country",
          gender: "$profile.gender",
          dob: "$profile.dob",
        },
      },
      { $sort: sortStage },
    ];

    const users = await aggregatePaginate(userModel, basePipeline, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      users: users || [],
      user: req.user || null,
    });
  } catch (err) {
    console.error("Dashboard Fetch Error:", err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching users",
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    console.log(req.body);
    const targetUserId = req.params.id;
    const loggedInUser = req.user;

    const isAdmin = loggedInUser.role === "admin";
    const isOwnProfile = targetUserId === loggedInUser._id.toString();

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot update this profile.",
      });
    }

    const { username, firstName, lastName, bio, dob, gender, country } =
      req.body;

    const userUpdate = userModel
      .findByIdAndUpdate(
        targetUserId,
        { $set: { username: username?.toLowerCase().trim() } },
        { new: true, runValidators: true },
      )
      .select("-password");

    const userDetailUpdate = userDetail.findOneAndUpdate(
      { userId: targetUserId },
      {
        $set: {
          userId: targetUserId,
          firstName,
          lastName,
          bio,
          dob,
          gender,
          country,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    const [updatedUser, updatedUserDetail] = await Promise.all([
      userUpdate,
      userDetailUpdate,
    ]);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile and Account updated successfully",
      data: {
        account: updatedUser,
        profile: updatedUserDetail,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);

    return res.status(500).json({
      success: false,
      data: false,
      message: "Something Went Wrong",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const loggedInUser = req.user;

    // Only Admins should be allowed to perform hard deletes
    if (loggedInUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access. Only Admins can delete Users.",
      });
    }

    // Run both deletions concurrently
    const [deletedUser] = await Promise.all([
      userModel.findByIdAndDelete(targetUserId),
      userDetail.findOneAndDelete({ userId: targetUserId }),
    ]);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User and all associated profile data permanently erased.",
      deletedId: targetUserId,
    });
  } catch (error) {
    console.error("Delete User Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong while deleting the user",
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const loggedInUser = req.user;

    if (loggedInUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access. Only Admins can toggle user status.",
      });
    }

    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isAccountVerified = !user.isAccountVerified;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status updated to ${user.isAccountVerified ? "verified" : "unverified"}.`,
    });
  } catch (error) {
    console.error("Toggle User Status Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong while toggling user status",
    });
  }
};

//User Profile.

exports.getMyProfile = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    let profileResults = await userDetail.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "accountInfo",
        },
      },
      {
        $unwind: "$accountInfo",
      },
      {
        $project: {
          _id: "$accountInfo._id",
          firstName: 1,
          lastName: 1,
          gender: 1,
          country: 1,
          profilePic: 1,
          dob: 1,
          bio: 1,
          email: "$accountInfo.email",
          username: "$accountInfo.username",
          createdAt: "$accountInfo.createdAt",
        },
      },
    ]);

    let userProfile = profileResults[0];

    if (!userProfile) {
      userProfile = {
        firstName: "Guest",
        lastName: "User",
        email: user.email,
        profilePic: "uploads/images/profilePics/blank.jpg",
        country: "-",
        message: "Profile details not yet completed.",
      };
    }

    res.status(200).json({
      success: true,
      userDetail: userProfile,
      isOwner: true,
    });
  } catch (error) {
    console.error("Aggregation Error: ", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
