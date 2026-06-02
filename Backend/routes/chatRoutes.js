const express = require("express");
const router = express.Router();
const {
  chatHandler,
  getChatHistory,
  getChatMessages,
  writingAssistantHandler,
  tagsHandler,
  summaryHandler,
  deleteChatHandler,
  renameChatHandler,
  getUsageHandler,
} = require("../controllers/chatController");
const rateLimit = require("express-rate-limit");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkUsageLimit } = require("../middleware/checkUsageLimit");
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, message: "Too many requests, please slow down" },
});

// Apply authMiddleware to ALL routes since they all rely on req.user or DB saving
router.use(authMiddleware);
router.get("/usage/me", getUsageHandler);
router.post("/message", aiLimiter, checkUsageLimit("aiChat"), chatHandler);

// Writing & Blog utilities — keep BEFORE /:chatId wildcard
router.post(
  "/writing-assist",
  aiLimiter,
  checkUsageLimit("writingAssist"),
  writingAssistantHandler,
);
router.post("/tags", aiLimiter, checkUsageLimit("tagsGeneration"), tagsHandler);
router.post(
  "/summary",
  aiLimiter,
  checkUsageLimit("aiSummary"),
  summaryHandler,
);
// Chat history & messages
router.get("/history", aiLimiter, getChatHistory);
router.get("/:chatId", aiLimiter, getChatMessages);

// New: delete & rename
router.delete("/:chatId", aiLimiter, deleteChatHandler);
router.patch("/:chatId/rename", aiLimiter, renameChatHandler);

module.exports = router;
