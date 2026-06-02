const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const blogRoutes = require("./blogRoutes");
const commentRoutes = require("./commentRoutes");
const followRoutes = require("./followRoutes");
const chatRoutes = require("./chatRoutes");
const planRoutes = require("./planRoutes");
const subscriptionRoutes = require("./subRoutes");
const transRoutes = require("./transRoutes");
const invoiceRoutes = require("./invoiceRoutes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/user", userRoutes);
router.use("/blogs", blogRoutes);
router.use("/comments", commentRoutes);
router.use("/follow", followRoutes);
router.use("/chat", chatRoutes);
router.use("/plans", planRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/transaction", transRoutes);
router.use("/invoices", invoiceRoutes);

module.exports = router;
