const express = require("express");
const router = express.Router(); 

const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const blogRoutes = require("./blogRoutes");
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);
router.use("/blogs", blogRoutes);

module.exports = router; 