const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const Comment = require("../models/commentModel");
const { Blog } = require("../models/blogModel");
const aggregatePaginate = require("../utils/aggregate");

// Create a new comment
exports.createComment = catchAsync(async (req, res) => {
    const { blogId, content, parentCommentId } = req.body;
    const authorId = req.user._id;

    const blog = await Blog.findOne({ _id: blogId, status: "published" });
    if (!blog) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Blog not found or not published",
      });
    }

    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        _id: parentCommentId,
        blogId,
      });
      if (!parentComment || parentComment.deletedAt !== null) {
        return res.status(404).json({
          success: false,
          data: null,
          message: "Parent comment not found",
        });
      }
    }

    // 3. Create the comment
    const newComment = await Comment.create({
      authorId,
      blogId,
      content,
      parentCommentId: parentCommentId || null,
    });

    // 4. Update the blog's comment counter
    await Blog.findByIdAndUpdate(blogId, { $inc: { commentsCount: 1 } });

    res.status(201).json({
      success: true,
      data: newComment,
      message: "Comment created successfully",
    });
  });;
/* // Get comments for a blog with pagination and author details
exports.getBlogComments = catchAsync(async (req, res) => {
    const { blogId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const blog = await Blog.findOne({ _id: blogId, status: "published" });
    if (!blog) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Blog not found or not published",
      });
    }

    const pipeline = [
      { $match: { blogId: blog._id, parentCommentId: null, deletedAt: null } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "userdetails",
          localField: "author._id",
          foreignField: "userId",
          as: "author.profile",
        },
      },
      {
        $unwind: { path: "$author.profile", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          content: 1,
          isEdited: 1,
          createdAt: 1,
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          "author.username": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ];
    const { data, pagination } = await aggregatePaginate(Comment, pipeline, {
      page,
      limit,
    });
    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      comments: data,
      pagination: {
        totalComments: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  });;

// Get replies for a comment with pagination and author details
exports.getCommentReplies = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const parentComment = await Comment.findOne({
      _id: commentId,
      deletedAt: null,
    });
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Comment not found",
      });
    }
    const pipeline = [
      {
        $match: {
          parentCommentId: parentComment._id,
          deletedAt: null,
        },
      },
      { $sort: { createdAt: 1 } }, // oldest first for replies
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "userdetails",
          localField: "author._id",
          foreignField: "userId",
          as: "author.profile",
        },
      },
      {
        $unwind: { path: "$author.profile", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          content: 1,
          isEdited: 1,
          createdAt: 1,
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          "author.username": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ];

    const { data, pagination } = await aggregatePaginate(Comment, pipeline, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Replies fetched successfully",
      replies: data,
      pagination: {
        totalReplies: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  });; */

exports.getComments = catchAsync(async (req, res) => {
    const { blogId, commentId } = req.params;
    const { page, limit } = req.query;

    if (!blogId && !commentId) {
      return res.status(400).json({
        success: false,
        message: "Either blogId or commentId is required",
      });
    }

    let matchCriteria = {};
    let sortOrder = -1;
    let response = "comments";

    if (blogId) {
      const blog = await Blog.findOne({ _id: blogId, status: "published" });

      if (!blog) {
        return res.status(404).json({
          success: false,
          data: false,
          message: "Blog not published or found",
        });
      }

      matchCriteria = {
        blogId: blog._id,
        parentCommentId: null,
        deletedAt: null,
      };

      sortOrder = -1;
      response = "comments";
    } else if (commentId) {
      const parentComment = await Comment.findOne({
        _id: commentId,
        deletedAt: null,
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          data: false,
          message: "Comment Not Found",
        });
      }

      matchCriteria = {
        parentCommentId: parentComment._id,
        deletedAt: null,
      };
      sortOrder = 1;
      response = "replies";
    }

    const pipeline = [
      { $match: matchCriteria },
      { $sort: { createdAt: sortOrder } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $lookup: {
          from: "userdetails",
          localField: "author._id",
          foreignField: "userId",
          as: "author.profile",
        },
      },
      {
        $unwind: {
          path: "$author.profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      // ── Count how many non-deleted replies exist for each comment ──
      {
        $lookup: {
          from: "comments",
          let: { commentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$parentCommentId", "$$commentId"] },
                deletedAt: null,
              },
            },
            { $count: "count" },
          ],
          as: "repliesData",
        },
      },
      {
        $project: {
          content: 1,
          isEdited: 1,
          createdAt: 1,
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          // ── replyCount: 0 if no replies, otherwise the count ──
          replyCount: {
            $ifNull: [{ $arrayElemAt: ["$repliesData.count", 0] }, 0],
          },
          "author._id": 1,
          "author.username": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ];

    const { data, pagination } = await aggregatePaginate(Comment, pipeline, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: `${response} fetched successfully`,
      [response]: data,
      pagination: {
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  });;

// Update a comment (only content can be updated)
exports.updateComment = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!commentId) {
      return res.status(400).json({
        success: false,
        message: "Comment ID is required",
      });
    }

    const comment = await Comment.findOne({
      _id: commentId,
      authorId: userId,
      deletedAt: null,
    });
    if (!comment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Comment not found",
      });
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    return res.status(200).json({
      success: true,
      data: comment,
      message: "Comment updated successfully",
    });
  });;

//Soft delete - set deletedAt timestamp instead of removing the document
exports.deleteComment = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const targetComment = await Comment.findById(commentId);
    if (!targetComment || targetComment.deletedAt) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Comment not found",
      });
    }

    // Check if the user is the author of the comment or has admin privileges
    if (
      targetComment.authorId.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "You are not authorized to delete this comment",
      });
    }

    targetComment.deletedAt = new Date();
    await targetComment.save();

    return res.status(200).json({
      success: true,
      data: targetComment,
      message: "Comment deleted successfully",
    });
  });;

// Toggle like/unlike on a comment

exports.toggleLike = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findOne({ _id: commentId, deletedAt: null });
    if (!comment) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Comment not found",
      });
    }
    const hasLiked = comment.likes.includes(userId);
    if (hasLiked) {
      comment.likes.pull(userId);
    } else {
      comment.likes.push(userId);
    }
    comment.likesCount = comment.likes.length;
    await comment.save();

    return res.status(200).json({
      success: true,
      data: { liked: !hasLiked, likesCount: comment.likes.length },
      message: hasLiked ? "Like removed" : "Comment liked",
    });
  });;
