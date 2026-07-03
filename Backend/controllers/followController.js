const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const Follow = require("../models/followModel");
const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const aggregatePaginate = require("../utils/aggregate");

exports.followUser = catchAsync(async (req, res) => {
    const { followingId } = req.params;
    const followerId = req.user._id;

    if (!followerId || !followingId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid user ID or follower ID",
      });
    }
    if (followingId === followerId.toString()) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "You cannot follow yourself",
      });
    }

    const user = await User.findById(followingId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const exists = await Follow.exists({ followerId, followingId });
    if (exists)
      return res.status(409).json({
        success: false,
        data: null,
        message: "Already following this user",
      });

    await Follow.create({ followerId, followingId });

    await Promise.all([
      User.findByIdAndUpdate(followingId, {
        $inc: { followersCount: 1 },
      }),
      User.findByIdAndUpdate(followerId, {
        $inc: { followingCount: 1 },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: null,
      message: "User followed successfully",
    });
  });;

exports.unfollowUser = catchAsync(async (req, res) => {
    const { followingId } = req.params;
    const followerId = req.user._id;

    const result = await Follow.findOneAndDelete({ followerId, followingId });
    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Follow relationship not found",
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(followingId, {
        $inc: { followersCount: -1 },
      }),
      User.findByIdAndUpdate(followerId, {
        $inc: { followingCount: -1 },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: null,
      message: "User unfollowed successfully",
    });
  });;

exports.getFollowers = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid user ID",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "User not found",
      });
    }

    const pipeline = [
      {
        $match: { followingId: new mongoose.Types.ObjectId(userId) },
      },
      // 2. Simple lookup to User model (since profilePic is here now)
      {
        $lookup: {
          from: "users",
          localField: "followerId",
          foreignField: "_id",
          as: "follower",
        },
      },
      // 3. Flatten the array
      { $unwind: "$follower" },
      // 4. Project clean fields
      {
        $project: {
          _id: 0,
          followerId: 1,
          username: "$follower.username",
          profilePic: "$follower.profilePic",
          followedAt: "$createdAt",
        },
      },
      { $sort: { followedAt: -1 } },
    ];

    const { data, pagination } = await aggregatePaginate(Follower, pipeline, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Followers fetched successfully",
      data,
      pagination: {
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  });;

exports.getFollowing = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid user ID",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "User not found",
      });
    }

    const pipeline = [
      {
        $match: { followingId: new mongoose.Types.ObjectId(userId) },
      },
      // 2. Simple lookup to User model (since profilePic is here now)
      {
        $lookup: {
          from: "users",
          localField: "followingId",
          foreignField: "_id",
          as: "following",
        },
      },
      // 3. Flatten the array
      { $unwind: "$following" },
      // 4. Project clean fields
      {
        $project: {
          _id: 0,
          followingId: 1,
          username: "$following.username",
          profilePic: "$following.profilePic",
          followedAt: "$createdAt",
        },
      },
      { $sort: { followedAt: -1 } },
    ];

    const { data, pagination } = await aggregatePaginate(Follower, pipeline, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Followers fetched successfully",
      data,
      pagination: {
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  });;
