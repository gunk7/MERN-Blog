/* const multer = require("multer");
const path = require("path");
const fs = require("fs");

const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const pathConfig = req.imagePath;

    // 2. Determine the subfolder:
    // If it's an object, look up the fieldname. If it's a string, use it directly.
    const subFolder =
      typeof pathConfig === "object" ? pathConfig[file.fieldname] : pathConfig;

    const imageUploadPath = path.join("uploads", subFolder || "misc");
    fs.mkdirSync(imageUploadPath, { recursive: true });
    cb(null, imageUploadPath);
  },

  filename: function (req, file, cb) {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 10e10);
    cb(null, suffix + path.extname(file.originalname));
  },
});

const filterFileType = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedImageTypes = [".jpeg", ".jpg", ".png", ".gif"];
  if (allowedImageTypes.includes(ext) && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  cb(new Error("Invalid Image File Type"));
};

// PDF storage configuration
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const pdfUploadPath = path.join("uploads", "invoices");
    fs.mkdirSync(pdfUploadPath, { recursive: true });
    cb(null, pdfUploadPath);
  },
  filename: function (req, file, cb) {
    const invoiceId = req.body?.invoiceId || "invoice";
    cb(null, invoiceId + path.extname(file.originalname));
  },
});

const filterPDFType = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf" && file.mimetype === "application/pdf") {
    return cb(null, true);
  }
  cb(new Error("Invalid PDF File Type"));
};

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: filterFileType,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadBlogFiles = uploadImage.fields([
  { name: "coverImage", maxCount: 1 },
]);

const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: filterPDFType,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadInlineImage = uploadImage.array("image", 10);
const uploadSingleImage = uploadImage.single("profilePic");
const uploadInvoicePdf = uploadPdf.single("invoice");
module.exports = {
  uploadBlogFiles,
  uploadInlineImage,
  uploadSingleImage,
  uploadInvoicePdf,
};
 */

const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const path = require("path");

//Multer Image Upload
const filterFileType = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".jpeg", ".jpg", ".png", ".gif"];
  if (allowedExts.includes(ext) && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  cb(new Error("Invalid Image File Type"));
};

const filterPDFType = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".pdf" && file.mimetype === "application/pdf") {
    return cb(null, true);
  }
  cb(new Error("Invalid PDF File Type"));
};

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: filterFileType,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: filterPDFType,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ─── Core stream uploader ────────────────────────────────────────────────────

const streamUpload = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ─── Middleware that uploads all files in req.files / req.file ───────────────

// Attaches result to req.cloudinaryFiles[fieldname] or req.cloudinaryFile
const uploadToCloudinary = (folder, resourceType = "image") => {
  return async (req, res, next) => {
    try {
      // .fields() or .array() → req.files
      if (req.files) {
        req.cloudinaryFiles = {};

        const entries = Array.isArray(req.files)
          ? req.files.map((f) => [f.fieldname, [f]])
          : Object.entries(req.files);

        for (const [fieldname, files] of entries) {
          req.cloudinaryFiles[fieldname] = await Promise.all(
            files.map((file) =>
              streamUpload(file.buffer, {
                folder,
                resource_type: resourceType,
              }),
            ),
          );
        }
      }

      // .single() → req.file
      if (req.file) {
        req.cloudinaryFile = await streamUpload(req.file.buffer, {
          folder,
          resource_type: resourceType,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

// ─── Exported middleware chains ───────────────────────────────────────────────

// Usage: router.post("/blog", ...uploadBlogFiles, createBlog)
const uploadBlogFiles = [
  imageUpload.fields([{ name: "coverImage", maxCount: 1 }]),
  uploadToCloudinary("uploads/blogs/covers"),
];

// Usage: router.post("/inline-image", ...uploadInlineImage, handler)
const uploadInlineImage = [
  imageUpload.array("image", 10),
  uploadToCloudinary("uploads/blogs/inline"),
];

// Usage: router.put("/profile", ...uploadSingleImage, updateProfile)
const uploadSingleImage = [
  imageUpload.single("profilePic"),
  uploadToCloudinary("uploads/profiles"),
];

// Usage: router.post("/invoice", ...uploadInvoicePdf, handler)
// In multerMiddleware.js — replace the uploadInvoicePdf export
const uploadInvoicePdf = [
  pdfUpload.single("invoice"),
  async (req, res, next) => {
    try {
      if (!req.file) return next();

      const invoiceId = req.body?.invoiceId || "invoice";
      const sanitized = invoiceId.replace(/[^a-zA-Z0-9_-]/g, "_");

      req.cloudinaryFile = await streamUpload(req.file.buffer, {
        folder: "uploads/invoices",
        resource_type: "raw",
        public_id: sanitized, // ← e.g. WL-2026-0008
        overwrite: false, // ← safe to re-upload, won't clobber existing
      });

      next();
    } catch (err) {
      next(err);
    }
  },
];

module.exports = {
  uploadBlogFiles,
  uploadInlineImage,
  uploadSingleImage,
  uploadInvoicePdf,
};
