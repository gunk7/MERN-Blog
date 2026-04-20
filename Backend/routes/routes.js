const express = require("express");
const router = express.Router(); 

const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);

module.exports = router; 