const { fstat } = require("fs");
const { Blog } = require("../models/blogModel");
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

exports.getAllBlogs = async (req, res) => {
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
};

/* exports.getAllBlogs = async (req, res) => {
  try {
    const { search, category, page, limit } = req.query;

    // 1. Build the dynamic match object
    const matchQuery = { status: "published" };

    // Search by Title (case-insensitive)
    if (search) {
      matchQuery.title = { $regex: search, $options: "i" };
    }

    // Filter by Category
    if (category) {
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
    const result = await aggregatePaginate(Blog, pipeline, { page, limit });

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
    const blogs = await Blog.find({ authorId: id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results: blogs.length,
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID format" });
    }

    const blogs = await Blog.find({ authorId: userId })
      .populate("authorId", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      data: { blogs },
    });
  } catch (error) {
    console.error("Error fetching user blogs:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.aggregate([
      { $match: { slug: slug } },

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

exports.
updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { removeCoverImage } = req.body;

    console.log(id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Blog ID",
        data: null,
      });
    }
    console.log("id came", req.user._id);
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
