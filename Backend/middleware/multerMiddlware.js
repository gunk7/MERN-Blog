const multer = require("multer");
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
