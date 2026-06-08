const { fstat } = require("fs");
const { Blog } = require("../models/blogModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const aggregatePaginate = require("../utils/aggregate");
const { generateUniqueSlug } = require("../utils/slugGeneration");
const { fillMissingDates } = require("../utils/helperFunction");
const sanitizeHtml = require("sanitize-html");
const { DEFAULT_COVER } = require("../config/defaults");

const safeParseJSON = (val, fallback = null) => {
  try {
    if (!val) return fallback;

    return typeof val === "string" ? JSON.parse(val) : val;
  } catch {
    return fallback;
  }
};

const sanitizeBlogHtml = (html = "") => {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "blockquote",
      "code",
      "pre",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "hr",
      "a",
      "img",
    ],

    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "class", "style", "data-id"],
      "*": ["class"],
    },
    allowedStyles: {
      "*": {
        color: [/^.*$/],
        "text-align": [/^left$/, /^right$/, /^center$/],
        width: [/^\d+(?:px|%)$/],
        height: [/^\d+(?:px|%)$/],
      },
    },
    allowedSchemes: ["http", "https", "data"],
  });
};

/* ─────────────────────────────────────────────
   CREATE BLOG
───────────────────────────────────────────── */

exports.createBlog = async (req, res) => {
  try {
    const { title, description, category, status, scheduledFor, tags } =
      req.body;

    /* ─────────────────────────────────────
       STATUS VALIDATION
    ───────────────────────────────────── */

    if (status === "scheduled") {
      if (!scheduledFor) {
        return res.status(400).json({
          success: false,
          message: "scheduledFor date is required when status is scheduled",
        });
      }

      if (new Date(scheduledFor) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "scheduledFor must be a future date",
        });
      }
    }

    /* ─────────────────────────────────────
       CONTENT
    ───────────────────────────────────── */

    const contentJson = safeParseJSON(req.body.contentJson, {});

    const sanitizedHtml = sanitizeBlogHtml(req.body.contentHtml || "");

    const strippedContent = sanitizedHtml
      .replace(/<[^>]*>/g, "")
      .replace(/\s/g, "");

    if (!strippedContent) {
      return res.status(400).json({
        success: false,
        message: "Blog content cannot be empty",
      });
    }

    /* ─────────────────────────────────────
       IMAGES
    ───────────────────────────────────── */

    let images = [];

    if (req.body.images) {
      const parsedImages = safeParseJSON(req.body.images, []);

      if (Array.isArray(parsedImages)) {
        images = parsedImages.map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          size: img.size || 0,
          order: typeof img.order === "number" ? img.order : index,
        }));
      }
    }

    /* ─────────────────────────────────────
       COVER IMAGE
    ───────────────────────────────────── */

    //let coverImage = "uploads/blogs/covers/default-cover.png";
    /*  if (req.files?.coverImage?.[0]) {
      coverImage = req.files.coverImage[0].path.replace(/\\/g, "/");
      } */

    let coverImage = DEFAULT_COVER;
    let coverImagePublicId = null;

    if (req.cloudinaryFiles?.coverImage?.[0]) {
      coverImage = req.cloudinaryFiles.coverImage[0].secure_url;
      coverImagePublicId = req.cloudinaryFiles.coverImage[0].public_id;
    }

    /* ─────────────────────────────────────
       CREATE BLOG DATA
    ───────────────────────────────────── */

    const blogData = {
      title,
      description,
      category,
      authorId: req.user._id,
      contentHtml: sanitizedHtml,
      contentJson,
      tags: typeof tags === "string" ? [tags] : Array.isArray(tags) ? tags : [],
      images,
      coverImage,
      status,
      scheduledFor: status === "scheduled" ? new Date(scheduledFor) : null,
      publishedAt: status === "published" ? new Date() : null,
    };

    const blog = await Blog.create(blogData);

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: {
        blog,
      },
    });
  } catch (error) {
    console.error("CREATE BLOG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* ─────────────────────────────────────────────
   UPDATE BLOG
───────────────────────────────────────────── */

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const blog = await Blog.findOne({
      _id: id,
      authorId: req.user._id,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found or you do not have permission",
      });
    }

    /* ─────────────────────────────────────
       CONTENT
    ───────────────────────────────────── */

    let contentJson = blog.contentJson;

    if (req.body.contentJson) {
      contentJson = safeParseJSON(req.body.contentJson, {});
    }

    let contentHtml = blog.contentHtml;

    if (req.body.contentHtml) {
      contentHtml = sanitizeBlogHtml(req.body.contentHtml);
    }

    /* ─────────────────────────────────────
       IMAGES
    ───────────────────────────────────── */

    let images = blog.images || [];

    if (req.body.images) {
      const parsedImages = safeParseJSON(req.body.images, []);

      if (Array.isArray(parsedImages)) {
        images = parsedImages.map((img, index) => ({
          url: img.url,
          filename: img.filename,
          size: img.size || 0,
          order: typeof img.order === "number" ? img.order : index,
        }));
      }
    }
    /* ─────────────────────────────────────
   COVER IMAGE
───────────────────────────────────── */

    /*    let coverImage = blog.coverImage; 

     if (req.files?.coverImage?.[0]) {
      // new file uploaded — delete old, save new
      if (blog.coverImage && !blog.coverImage.includes("default-cover.png")) {
        const oldPath = path.resolve(blog.coverImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      coverImage = req.files.coverImage[0].path.replace(/\\/g, "/");
    } else if (req.body.coverImage === "null" || req.body.coverImage === null) {
      // user explicitly removed it
      if (blog.coverImage && !blog.coverImage.includes("default-cover.png")) {
        const oldPath = path.resolve(blog.coverImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      coverImage = null;
    }
 */
    let coverImage = blog.coverImage;
    let coverImagePublicId = blog.coverImagePublicId;

    if (req.cloudinaryFiles?.coverImage?.[0]) {
      // Delete old cover from Cloudinary
      if (blog.coverImagePublicId) {
        try {
          await cloudinary.uploader.destroy(blog.coverImagePublicId);
        } catch (err) {
          console.error("Failed to delete old cover from Cloudinary:", err);
        }
      }
      coverImage = req.cloudinaryFiles.coverImage[0].secure_url;
      coverImagePublicId = req.cloudinaryFiles.coverImage[0].public_id;
    } else if (req.body.coverImage === "null" || req.body.coverImage === null) {
      // User explicitly removed cover
      if (blog.coverImagePublicId) {
        try {
          await cloudinary.uploader.destroy(blog.coverImagePublicId);
        } catch (err) {
          console.error("Failed to delete cover from Cloudinary:", err);
        }
      }
      coverImage = DEFAULT_COVER;
      coverImagePublicId = null;
    }

    /* ─────────────────────────────────────
       STATUS LOGIC
    ───────────────────────────────────── */

    let publishedAt = blog.publishedAt;
    let scheduledFor = blog.scheduledFor;

    if (req.body.status === "published") {
      publishedAt = publishedAt || new Date();
      scheduledFor = null;
    }

    if (req.body.status === "draft") {
      scheduledFor = null;
    }

    if (req.body.status === "scheduled") {
      scheduledFor = new Date(req.body.scheduledFor);
    }

    /* ─────────────────────────────────────
       TITLE / SLUG
    ───────────────────────────────────── */

    let slug = blog.slug;

    if (req.body.title && req.body.title !== blog.title) {
      slug = await generateUniqueSlug(req.body.title, id);
    }

    /* ─────────────────────────────────────
       UPDATE
    ───────────────────────────────────── */

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        $set: {
          ...req.body,
          coverImage,
          coverImagePublicId,
          slug,
          contentHtml,
          contentJson,
          images,
          publishedAt,
          scheduledFor,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: {
        blog: updatedBlog,
      },
    });
  } catch (error) {
    console.error("UPDATE BLOG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* ─────────────────────────────────────────────
   INLINE IMAGE UPLOAD
───────────────────────────────────────────── */

/* exports.uploadInlineImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const file = req.files[0];

    const images = req.files.map((file, index) => ({
      url: `/${file.path.replace(/\\/g, "/")}`,
      filename: file.filename,
      size: file.size,
      order: index,
    }));

    return res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("INLINE IMAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
}; */

exports.uploadInlineImage = async (req, res) => {
  try {
    if (!req.cloudinaryFiles?.images?.length) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const images = req.cloudinaryFiles.image.map((file, index) => ({
      url: file.secure_url,
      publicId: file.public_id, // ← frontend should send this back in images[] on save
      size: file.bytes,
      order: index,
    }));

    return res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("INLINE IMAGE ERROR:", error);
    return res
      .status(500)
      .json({ success: false, data: false, message: "Image upload failed" });
  }
};
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid Blog ID" });
    }

    const userId = req.user?._id;

    // 🔥 update FIRST (atomic + dedup safe)
    if (userId) {
      await Blog.updateOne(
        {
          _id: id,
          "viewedBy.userId": { $ne: userId },
        },
        {
          $addToSet: { viewedBy: { userId } },
          $inc: { viewsCount: 1 },
        },
      );
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
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          title: 1,
          contentHtml: 1,
          contentJson: 1,
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

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: { blog: blog[0] },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    const { id } = req.user;
    const blogs = await Blog.find({
      authorId: id,
      deletedAt: null,
      // no status filter — author sees everything including under_review
    }).sort({ createdAt: -1 });

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
    const slug = req.params.slug;
    const userId = req.user?._id;

    const blog = await Blog.findOne({
      slug,
      status: "published",
    });

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // acorrect id usage + safe update
    if (userId) {
      await Blog.updateOne(
        {
          _id: blog._id,
          "viewedBy.userId": { $ne: userId },
        },
        {
          $addToSet: { viewedBy: { userId } },
          $inc: { viewsCount: 1 },
        },
      );
    }

    const result = await Blog.aggregate([
      { $match: { _id: blog._id } },

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
          title: 1,
          contentJson: 1,
          contentHtml: 1,
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

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: { blog: result[0] },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
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
    const { search, category, status, page, limit, deleted } = req.query; // ← deleted add karo

    // ── Base query ──────────────────────────────────────────────
    const matchQuery = {};

    if (deleted === "true") {
      matchQuery.deletedAt = { $ne: null }; // ← only soft-deleted blogs
    } else {
      matchQuery.deletedAt = null; // ← exclude deleted from all other tabs
      if (
        status &&
        ["published", "draft", "scheduled", "under_review"].includes(status)
      ) {
        matchQuery.status = status;
      }
    }

    // ── Search ──────────────────────────────────────────────────
    if (search && search.trim()) {
      matchQuery.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // ── Category ────────────────────────────────────────────────
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
          deletedAt: 1, // ← add this so frontend knows it's deleted
          adminNote: 1,
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
    console.error("Error fetching blogs in adminPanel:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Admin: Something went wrong fetching blogs",
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
    const { status, scheduledFor, adminNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Blog ID" });
    }

    const validStatuses = ["published", "draft", "scheduled", "under_review"]; // ← add under_review
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (status === "scheduled") {
      if (!scheduledFor) {
        return res
          .status(400)
          .json({ success: false, message: "scheduledFor is required" });
      }
      if (new Date(scheduledFor) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "scheduledFor must be a future date",
        });
      }
    }

    if (status === "under_review" && !adminNote) {
      return res.status(400).json({
        success: false,
        message: "adminNote (reason) is required for under_review",
      });
    }

    // ── Build update payload ──────────────────────────────────────
    const updateData = { status };

    if (status === "published") {
      updateData.publishedAt = new Date();
      updateData.scheduledFor = null;
      updateData.adminNote = undefined; // clear any previous flag reason
    } else if (status === "draft") {
      updateData.publishedAt = null;
      updateData.scheduledFor = null;
      updateData.adminNote = undefined;
    } else if (status === "scheduled") {
      updateData.scheduledFor = new Date(scheduledFor);
      updateData.publishedAt = null;
      updateData.adminNote = undefined;
    } else if (status === "under_review") {
      updateData.adminNote = adminNote;
      updateData.publishedAt = null; // hide from public feeds
      updateData.scheduledFor = null;
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
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
        .json({ success: false, message: "Invalid Blog ID" });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // A. Permanent removal
    if (hard === "true") {
      await Blog.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ success: true, message: "Blog permanently deleted" });
    }

    // B. Move to under_review — use findByIdAndUpdate to skip full validation
    const updated = await Blog.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "under_review",
          adminNote:
            reason ||
            "This content is currently under review by an administrator.",
          publishedAt: null,
          scheduledFor: null,
        },
      },
      { new: true, runValidators: false }, // ← runValidators: false — skip required field checks
    ).lean();

    return res.status(200).json({
      success: true,
      message: "Blog moved to Under Review",
      data: { blog: updated },
    });
  } catch (error) {
    console.error("Admin deleteBlog error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getActivityChart = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [blogActivity, userActivity] = await Promise.all([
      Blog.aggregate([
        { $match: { createdAt: { $gte: fromDate }, deletedAt: null } },
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
        { $match: { createdAt: { $gte: fromDate } } },
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

    const filledBlogs = fillMissingDates(blogActivity, days);
    const filledUsers = fillMissingDates(userActivity, days);
    return res.status(200).json({
      success: true,
      data: {
        blogs: filledBlogs,
        users: filledUsers,
      },
      message: "Blogs Fetched Successfully",
    });
  } catch (error) {
    console.error("getActivityChart error:", error.message);
    return res.status(500).json({
      success: false,
      data: false,
      message: error.messsage || "Internal server error",
    });
  }
};
