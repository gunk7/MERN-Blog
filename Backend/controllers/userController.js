const userModel = require("../models/userModel");
const userDetail = require("../models/userDetail");
const { Blog } = require("../models/blogModel");

const aggregatePaginate = require("../utils/aggregate");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { DEFAULT_AVATAR } = require("../config/defaults");

//Admin Dashboard
exports.getAllUsers = async (req, res) => {
  try {
    const {
      search,
      searchBy,
      sortBy,
      sortOrder,
      page,
      limit = 10,
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
        { username: regex },
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
          profilePic: "$profile.profilePic",
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

    const {
      username,
      firstName,
      lastName,
      bio,
      dob,
      gender,
      country,
      removeImage,
    } = req.body;

    // -------------------------------
    // 🔹 Handle Profile Picture Logic
    // -------------------------------
    let profilePicPath;

    const currentUserDetail = await userDetail.findOne({
      userId: targetUserId,
    });

    /* if (req.file || removeImage === "true") {
      // Delete old image if exists
      if (currentUserDetail?.profilePic) {
        const oldPath = path.resolve(currentUserDetail.profilePic);

        if (
          fs.existsSync(oldPath) &&
          !currentUserDetail.profilePic.includes("blank.jpg")
        ) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            console.error("Failed to delete old image:", err);
          }
        }
      }

      // Set new image or default
      if (removeImage === "true") {
        profilePicPath = "uploads/images/profilePics/blank.jpg";
      } else if (req.file) {
        profilePicPath = req.file.path.replace(/\\/g, "/");
      }
    } */

    if (req.cloudinaryFile || removeImage === "true") {
      //delete old image
      if (
        currentUserDetail?.profilePicPublicId &&
        !currentUserDetail?.profilePic.includes("blank.jpg")
      ) {
        try {
          await cloudinary.uploader.destroy(
            currentUserDetail.profilePicPublicId,
          );
        } catch (error) {
          console.error("Failed to delete Old Image from the cloudinary");
        }
      }
      if (removeImage === "true") {
        profilePicUrl = DEFAULT_AVATAR; 
        profilePicPublicId = null;
      } else if (req.cloudinaryFile) {
        profilePicUrl = req.cloudinaryFile.secure_url;
        profilePicPublicId = req.cloudinaryFile.public_id;
      }
    }
    // -------------------------------
    // 🔹 Prepare Update Objects
    // -------------------------------
    const userUpdatePromise = userModel
      .findByIdAndUpdate(
        targetUserId,
        {
          ...(username && {
            username: username.toLowerCase().trim(),
          }),
        },
        { new: true, runValidators: true },
      )
      .select("-password");

    const detailUpdateData = {
      userId: targetUserId,
      firstName,
      lastName,
      bio,
      dob,
      gender,
      country,
      ...(profilePicPath && { profilePic: profilePicPath }),
      ...(profilePicPublicId !== undefined && { profilePicPublicId }),
    };

    const userDetailUpdatePromise = userDetail.findOneAndUpdate(
      { userId: targetUserId },
      { $set: detailUpdateData },
      { upsert: true, new: true, runValidators: true },
    );

    // -------------------------------
    // 🔹 Execute in Parallel
    // -------------------------------
    const [updatedUser, updatedUserDetail] = await Promise.all([
      userUpdatePromise,
      userDetailUpdatePromise,
    ]);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        account: updatedUser,
        profile: updatedUserDetail,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
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
          followersCount: "$accountInfo.followersCount",
          followingCount: "$accountInfo.followingCount",
        },
      },
    ]);

    let userProfile = profileResults[0];

    if (!userProfile) {
      userProfile = {
        _id: userId,
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
      data: { userDetail: userProfile, isOwner: true },
    });
  } catch (error) {
    console.error("Aggregation Error: ", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//Public Profile

exports.getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const requesterId = req.user?._id || null;

    if (!username) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "username is required",
      });
    }

    const result = await userModel.aggregate([
      { $match: { username: username.toLowerCase() } },

      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "detail",
        },
      },

      { $unwind: { path: "$detail", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          followersCount: { $size: { $ifNull: ["$followers", []] } },
          followingCount: { $size: { $ifNull: ["$following", []] } },

          isFollowing: requesterId
            ? { $in: [requesterId, { $ifNull: ["$followers", []] }] }
            : false,

          isOwner: requesterId ? { $eq: ["$_id", requesterId] } : false,
        },
      },

      {
        $project: {
          _id: 1,
          username: 1,
          createdAt: 1,

          firstName: "$detail.firstName",
          lastName: "$detail.lastName",
          profilePic: "$detail.profilePic",
          bio: "$detail.bio",
          country: "$detail.country",
          gender: "$detail.gender",

          followersCount: 1,
          followingCount: 1,
          isFollowing: 1,
          isOwner: 1,
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];

    return res.status(200).json({
      success: true,
      message: "Profile Fetched SUccessfully",
      data: {
        userDetail: user,
        isOwner: user.isOwner,
        isFollowing: user.isFollowing,
      },
    });
  } catch (error) {
    console.error("Error in getting Public Profile:", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message:
        error.message || "Somehting went wrong while getting user profile",
    });
  }
};

exports.getUserProfileAdmin = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "username is required",
      });
    }

    const result = await userModel.aggregate([
      { $match: { username: username.toLowerCase() } },

      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "detail",
        },
      },

      { $unwind: { path: "$detail", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          followersCount: { $size: { $ifNull: ["$followers", []] } },
          followingCount: { $size: { $ifNull: ["$following", []] } },
        },
      },

      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          role: 1,
          isAccountVerified: 1,
          active: 1,
          createdAt: 1,
          updatedAt: 1,

          firstName: "$detail.firstName",
          lastName: "$detail.lastName",
          profilePic: "$detail.profilePic",
          bio: "$detail.bio",
          country: "$detail.country",
          gender: "$detail.gender",
          dateOfBirth: "$detail.dateOfBirth",

          followersCount: 1,
          followingCount: 1,
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "User not found",
      });
    }

    const user = result[0];

    // Top 10 blogs by views (all statuses visible to admin)
    const blogs = await Blog.find({
      authorId: user._id,
      deletedAt: null,
    })
      .sort({ viewsCount: -1 })
      .limit(10)
      .select(
        "title slug description coverImage category status tags viewsCount likesCount commentsCount publishedAt createdAt",
      )
      .lean();

    // Stats across all statuses
    const [statsAgg] = await Blog.aggregate([
      { $match: { authorId: user._id, deletedAt: null } },
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          totalPublished: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          totalDrafts: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          totalScheduled: {
            $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
          },
          totalViews: { $sum: "$viewsCount" },
          totalLikes: { $sum: "$likesCount" },
        },
      },
    ]);

    const stats = {
      totalBlogs: statsAgg?.totalBlogs || 0,
      totalPublished: statsAgg?.totalPublished || 0,
      totalDrafts: statsAgg?.totalDrafts || 0,
      totalScheduled: statsAgg?.totalScheduled || 0,
      totalViews: statsAgg?.totalViews || 0,
      totalLikes: statsAgg?.totalLikes || 0,
    };

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: {
        userDetail: user,
        stats,
        blogs,
      },
    });
  } catch (error) {
    console.error("Error in getUserProfileAdmin:", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message:
        error.message || "Something went wrong while getting user profile",
    });
  }
};

//search user by username

exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const regex = { $regex: q.trim(), $options: "i" };

    const pipeline = [
      // Match by username only (as requested)
      { $match: { username: regex, role: "user" } },
      {
        $lookup: {
          from: "userdetails",
          localField: "_id",
          foreignField: "userId",
          as: "detail",
        },
      },
      {
        $unwind: {
          path: "$detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          followersCount: { $size: { $ifNull: ["$followers", []] } },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          createdAt: 1,
          firstName: "$detail.firstName",
          lastName: "$detail.lastName",
          profilePic: "$detail.profilePic",
          bio: "$detail.bio",
          followersCount: 1,
        },
      },
      { $sort: { followersCount: -1 } }, // most followed first
    ];

    const { data, pagination } = await aggregatePaginate(userModel, pipeline, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users: data,
        pagination: {
          totalUsers: pagination.totalItems,
          totalPages: pagination.totalPages,
          currentPage: pagination.currentPage,
          hasNextPage: pagination.hasNextPage,
          hasPrevPage: pagination.hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error("Error in fetching users: ", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.message || "Error in searching users",
    });
  }
};

//Admin controllers
exports.getAdminProfile = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user._id);
    const admin = await userModel
      .findOne({ _id: adminId, role: "admin" })
      .select(
        "_id email username role isAccountVerified authProviders createdAt",
      );
    if (!admin) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Error in Fetching Admin Profile: ", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.message || "Error in fetching admin profile",
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      verifiedUsers,
      newUsersThisWeek,
      blogStats,
      topBlogs,
      newBlogsThisWeek,
    ] = await Promise.all([
      // Total registered users
      userModel.countDocuments(),

      // Verified users
      userModel.countDocuments({ isAccountVerified: true }),

      // New signups in the last 7 days
      userModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Blog stats grouped by status + totals for views/likes
      Blog.aggregate([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalViews: { $sum: "$viewsCount" },
            totalLikes: { $sum: "$likesCount" },
          },
        },
      ]),

      // Top 5 most viewed published blogs
      Blog.aggregate([
        { $match: { status: "published", deletedAt: null } },
        { $sort: { viewsCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "authorId",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1,
            slug: 1,
            coverImage: 1,
            viewsCount: 1,
            likesCount: 1,
            createdAt: 1,
            "author.username": 1,
          },
        },
      ]),

      // New blogs in the last 7 days
      Blog.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        deletedAt: null,
      }),
    ]);

    // Reshape blog stats into a clean object
    const blogStatusMap = { published: 0, draft: 0, scheduled: 0 };
    let totalViews = 0;
    let totalLikes = 0;
    let totalBlogs = 0;

    blogStats.forEach(({ _id, count, totalViews: v, totalLikes: l }) => {
      if (_id in blogStatusMap) blogStatusMap[_id] = count;
      totalViews += v;
      totalLikes += l;
      totalBlogs += count;
    });

    return res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          newThisWeek: newUsersThisWeek,
        },
        blogs: {
          total: totalBlogs,
          published: blogStatusMap.published,
          drafts: blogStatusMap.draft,
          scheduled: blogStatusMap.scheduled,
          newThisWeek: newBlogsThisWeek,
          totalViews,
          totalLikes,
        },
        topBlogs,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
