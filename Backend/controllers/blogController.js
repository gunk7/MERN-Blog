const { fstat } = require("fs");
const { Blog } = require("../models/blogModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const aggregatePaginate = require("../utils/aggregate");
const { generateUniqueSlug } = require("../utils/slugGeneration");

exports.createBlog = async (req, res) => {
  try {
    const { status, scheduledFor } = req.body;
    if (status === "scheduled" && !scheduledFor) {
      return res.status(400).json({
        success: false,
        message: "scheduledFor date is required when status is 'scheduled'",
      });
    }

    if (status === "scheduled" && new Date(scheduledFor) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "scheduledFor date must be in the future",
      });
    }

    const blogData = {
      ...req.body,
      authorId: req.user.id,
    };

    if (req.files && req.files.coverImage) {
      blogData.coverImage = req.files.coverImage[0].path.replace(/\\/g, "/");
    }

    // 4. Process Content Images (Array)
    if (req.files && req.files.images) {
      blogData.images = req.files.images.map((file, index) => ({
        url: file.path.replace(/\\/g, "/"),
        filename: file.filename,
        size: file.size,
        order: index, // Optional: useful for gallery ordering
      }));
    }

    if (status === "draft") {
      blogData.scheduledFor = null;
      blogData.publishedAt = null;
    } else if (status === "published") {
      blogData.publishedAt = new Date();
    }

    const newBlog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      data: {
        blog: newBlog,
      },
      message: "Blog created successfully",
    });
  } catch (error) {
    console.error("Error creating blog:", error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

/* exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.aggregate([
      { $match: { status: "published" } },
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
        $unwind: {
          path: "$author.profile",
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          description: 1,
          category: 1,
          status: 1,
          coverImage: 1,
          viewsCount: 1,
          createdAt: 1,
          slug: 1,
          likesCount: 1,
          commentsCount: 1,
          "author.username": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      data: { blogs },
    });
  } catch (error) {
    console.error("Error fetching blogs with aggregate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}; */

/* exports.getAllBlogs = async (req, res) => {
  try {
    const { search, category, page, limit } = req.query;

    // 1. Build the dynamic match object
    const matchQuery = { status: "published", deletedAt: null };

    // Search by Title (case-insensitive)
    if (search && search.trim()) {
      matchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by Category
    if (category && category !== "All") {
      matchQuery.category = category;
    }

    const pipeline = [
      { $match: matchQuery },
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
        $unwind: {
          path: "$author.profile",
          preserveNullAndEmptyArrays: true, // Optional: keeps blog even if profile is missing
        },
      },
      {
        $project: {
          slug: 1,
          title: 1,
          content: 1,
          description: 1,
          category: 1,
          status: 1,
          coverImage: 1,
          viewsCount: 1,
          createdAt: 1,
          "author.username": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ];

    const { data, pagination } = await aggregatePaginate(Blog, pipeline, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      blogs: data,
      pagination: {
        totalBlogs: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs :", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Internal server error",
    });
  }
};
 */

exports.getAllBlogs = async (req, res) => {
  try {
    const { search, category, page, limit } = req.query;

    const matchCriteria = { status: "published", deletedAt: null };

    if (search && search.trim()) {
      matchCriteria.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "ALL") {
      const categories = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      if (categories.length === 1) {
        matchCriteria.category = categories[0];
      } else if (categories.length > 1) {
        matchCriteria.category = { $in: categories };
      }
    }

    const pipeline = [
      { $match: matchCriteria },
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
        $unwind: {
          path: "$author.profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          slug: 1,
          title: 1,
          content: 1,
          description: 1,
          category: 1,
          status: 1,
          coverImage: 1,
          viewsCount: 1,
          createdAt: 1,
          "author.username": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ];

    const { data, pagination } = await aggregatePaginate(Blog, pipeline, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      blogs: data,
      pagination: {
        totalBlogs: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error in fetching all blogs:", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.message || "Error in fetchiing Blogs",
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
        data: null,
      });
    }

    await Blog.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $inc: { viewsCount: 1 } },
    );

    const blog = await Blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

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
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          description: 1,
          status: 1,
          category: 1,
          coverImage: 1,
          images: 1,
          tags: 1,
          viewsCount: 1,
          likesCount: 1,
          commentsCount: 1,
          createdAt: 1,
          "author.username": 1,
          "author.email": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ]);

    if (!blog || blog.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        data: null,
      });
    }

    // Since aggregate returns an array, we take the first element
    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: { blog: blog[0] },
    });
  } catch (error) {
    console.error("Error fetching blog with aggregate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    const { id } = req.user;
    const blogs = await Blog.find({ authorId: id, deletedAt: null }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: { blogs },
      message: "Blogs fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching user's blogs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBlogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "Invalid User ID format",
      });
    }

    const blogs = await Blog.find({
      authorId: userId,
      status: "published",
      deletedAt: null,
    })
      .select("title description coverImage category createdAt slug viewsCount")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      data: { blogs },
    });
  } catch (error) {
    console.error("Error fetching user blogs:", error);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.message || "Something Went Wrong while fecting user Blogs",
    });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const userId = req.user._id;
    const { slug } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "Invalid userId",
      });
    }
    await Blog.findOneAndUpdate(
      {
        slug,
        status: "published",
        "viewedBy.userId": { $ne: userId }, // only if user hasn't viewed
      },
      {
        $push: { viewedBy: { userId } },
        $inc: { viewsCount: 1 },
      },
    );

    const blog = await Blog.aggregate([
      { $match: { slug: slug, status: "published" } },

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
        },
      },

      {
        $project: {
          title: 1,
          content: 1,
          description: 1,
          status: 1,
          category: 1,
          coverImage: 1,
          images: 1,
          tags: 1,
          viewsCount: 1,
          likesCount: 1,
          commentsCount: 1,
          createdAt: 1,
          "author.username": 1,
          "author.email": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ]);

    if (!blog || blog.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        data: null,
      });
    }

    // Since aggregate returns an array, we take the first element
    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: { blog: blog[0] },
    });
  } catch (error) {
    console.error("Error fetching blog with aggregate:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { removeCoverImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
        data: null,
      });
    }
    const blog = await Blog.findOne({ _id: id, authorId: req.user._id });
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found or you don't have permission to edit",
        data: null,
      });
    }

    // --- 1. Handle Cover Image Update ---
    if ((req.files && req.files.coverImage) || removeCoverImage === "true") {
      // Delete old cover if it exists and isn't the default
      if (blog.coverImage && !blog.coverImage.includes("default-cover.png")) {
        const oldPath = path.resolve(blog.coverImage);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      if (removeCoverImage === "true") {
        req.body.coverImage = "uploads/blogs/covers/default-cover.png";
      } else {
        req.body.coverImage = req.files.coverImage[0].path.replace(/\\/g, "/");
      }
    }

    // --- 2. Handle Gallery Images (Append new ones) ---
    // 1. Normalize what the frontend wants to keep
    let existingToKeep = [];
    if (req.body.existingImages) {
      existingToKeep = Array.isArray(req.body.existingImages)
        ? req.body.existingImages
        : [req.body.existingImages];
    }

    let finalGallery = blog.images.filter((img) =>
      existingToKeep.includes(img.filename),
    );

    // 3. Physical cleanup (optional but recommended)
    const toDelete = blog.images.filter(
      (img) => !existingToKeep.includes(img.filename),
    );
    toDelete.forEach((img) => {
      const p = path.resolve(img.url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    // 4. Append ONLY brand new uploads
    if (req.files && req.files.images) {
      const newUploads = req.files.images.map((file, index) => ({
        url: file.path.replace(/\\/g, "/"),
        filename: file.filename,
        size: file.size,
        order: finalGallery.length + index,
      }));
      finalGallery = [...finalGallery, ...newUploads];
    }

    // 5. Overwrite the field entirely
    req.body.images = finalGallery;

    if (req.body.title) {
      req.body.slug = await generateUniqueSlug(req.body.title, id);
    }
    const updated = await Blog.findByIdAndUpdate(
      id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: { blog: updated },
    });
  } catch (error) {
    console.error("Error updating blog:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: error.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
        data: null,
      });
    }
    const blog = await Blog.findOne({ _id: id, authorId: req.user._id });
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found or you don't have permission to delete",
        data: null,
      });
    }
    await Blog.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error deleting blog:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

exports.toggleLikeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
        data: null,
      });
    }
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
        data: null,
      });
    }
    const hasLiked = blog.likedBy.includes(userId);

    if (hasLiked) {
      blog.likedBy.pull(userId);
      blog.likesCount = Math.max(0, blog.likesCount - 1);
    } else {
      blog.likedBy.push(userId);
      blog.likesCount += 1;
    }

    blog.likesCount = blog.likedBy.length;
    await blog.save();

    return res.status(200).json({
      success: true,
      message: hasLiked ? "Blog unliked" : "Blog liked",
      data: { likesCount: blog.likesCount },
    });
  } catch (error) {
    console.error("Error toggling like for blog:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

//Admin contollers
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const { search, category, status, page, limit } = req.query;

    const matchQuery = { deletedAt: null };
    if (
      status &&
      ["published", "draft", "scheduled", "under_review"].includes(status)
    ) {
      matchQuery.status = status;
    }

    if (search && search.trim()) {
      matchQuery.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      matchQuery.category = category;
    }

    const pipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
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
          title: 1,
          slug: 1,
          description: 1,
          category: 1,
          status: 1,
          coverImage: 1,
          viewsCount: 1,
          likesCount: 1,
          commentsCount: 1,
          tags: 1,
          createdAt: 1,
          publishedAt: 1,
          scheduledFor: 1,
          adminNote: 1,
          status: 1,

          "author._id": 1,
          "author.username": 1,
          "author.email": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ];

    const { data, pagination } = await aggregatePaginate(Blog, pipeline, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      blogs: data,
      pagination: {
        totalBlogs: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error in Fecthign blogs in adminPanel: ", error.message);

    return res.status(500).json({
      success: false,
      data: false,
      message:
        error.message || "Admin: Something went wrong in fecthing Blogs ",
    });
  }
};

exports.getBlogByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Blog ID" });
    }

    const blog = await Blog.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
          title: 1,
          slug: 1,
          content: 1,
          description: 1,
          category: 1,
          status: 1,
          coverImage: 1,
          images: 1,
          tags: 1,
          viewsCount: 1,
          likesCount: 1,
          commentsCount: 1,
          createdAt: 1,
          updatedAt: 1,
          publishedAt: 1,
          scheduledFor: 1,
          deletedAt: 1,
          "author._id": 1,
          "author.username": 1,
          "author.email": 1,
          "author.profile.firstName": 1,
          "author.profile.lastName": 1,
          "author.profile.profilePic": 1,
        },
      },
    ]);

    if (!blog || blog.length === 0) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { blog: blog[0] },
      message: "Admin: Blog Fetched SUccessfully",
    });
  } catch (error) {
    console.error("Admin getBlogById error:", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.updateBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledFor } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Blog ID" });
    }

    const validStatuses = ["published", "draft", "scheduled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (status === "scheduled") {
      if (!scheduledFor) {
        return res.status(400).json({
          success: false,
          data: false,
          message: "scheduledFor is required",
        });
      }
      if (new Date(scheduledFor) <= new Date()) {
        return res.status(400).json({
          success: false,
          data: false,
          message: "scheduledFor must be a future date",
        });
      }
    }

    const updateData = { status };
    if (status === "published") {
      updateData.publishedAt = new Date();
      updateData.scheduledFor = null;
    } else if (status === "draft") {
      updateData.publishedAt = null;
      updateData.scheduledFor = null;
    } else if (status === "scheduled") {
      updateData.scheduledFor = new Date(scheduledFor);
      updateData.publishedAt = null;
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, data: false, message: "Blog not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Blog status updated to '${status}'`,
      data: { blog },
    });
  } catch (error) {
    console.error("Admin updateBlogStatus error:", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.deleteBlogAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { hard, reason } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, data: false, message: "Invalid Blog ID" });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, data: false, message: "Blog not found" });
    }

    // A. Permanent removal
    if (hard === "true") {
      await Blog.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Blog permanently deleted",
      });
    }

    // B. Under Review (Flagging) - This is the "Admin Delete" action you wanted
    // We update the status and set the reason.
    blog.status = "under_review";
    blog.adminNote =
      reason || "This content is currently under review by an administrator.";
    // Reset publishedAt so it doesn't appear in "Recent" lists if re-approved later
    blog.publishedAt = undefined;

    await blog.save();

    return res.status(200).json({
      success: true,
      message: "Blog has been moved to 'Under Review' and hidden from public.",
    });
  } catch (error) {
    console.error("Admin deleteBlog error:", error.message);
    return res
      .status(500)
      .json({ success: false, dara: false, message: "Internal server error" });
  }
};

exports.getActivityChart = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [blogActivity, userActivity] = await Promise.all([
      Blog.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, deletedAt: null } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      userModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        blogs: blogActivity, // [{ _id: "2025-01-14", count: 3 }, ...]
        users: userActivity, // [{ _id: "2025-01-14", count: 1 }, ...]
      },
    });
  } catch (error) {
    console.error("getActivityChart error:", error.message);
    return res
      .status(500)
      .json({ success: false, data: false, message: "Internal server error" });
  }
};
