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

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: filterFileType,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadBlogFiles = uploadImage.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

const uploadSingleImage = uploadImage.single("profilePic");
module.exports = { uploadBlogFiles, uploadSingleImage };
