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
} = require("../controllers/chatController");
const { getMyUsage } = require("../controllers/usageControllers");
const rateLimit = require("express-rate-limit");
const { authMiddleware } = require("../middleware/authMiddleware");
const { checkUsageLimit } = require("../middleware/checkUsageLimit");
const validate = require("../middleware/validate");
const {
  chatRouteMessageSchema,
  chatIdParamSchema,
  renameChatSchema,
  writingAssistantSchema,
  tagsSchema,
  summarySchema,
  queryPageSchema,
} = require("../validations/chatValidation");
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, message: "Too many requests, please slow down" },
});

// Apply authMiddleware to ALL routes since they all rely on req.user or DB saving
router.use(authMiddleware);
router.get("/usage/me", getMyUsage);
router.post(
  "/message",
  aiLimiter,
  checkUsageLimit("aiChat"),
  validate(chatRouteMessageSchema),
  chatHandler,
);

// Writing & Blog utilities — keep BEFORE /:chatId wildcard
router.post(
  "/writing-assist",
  aiLimiter,
  checkUsageLimit("writingAssist"),
  validate(writingAssistantSchema),
  writingAssistantHandler,
);
router.post(
  "/tags",
  aiLimiter,
  checkUsageLimit("tagsGeneration"),
  validate(tagsSchema),
  tagsHandler,
);
router.post(
  "/summary",
  aiLimiter,
  checkUsageLimit("aiSummary"),
  validate(summarySchema),
  summaryHandler,
);
// Chat history & messages
router.get("/history", aiLimiter, getChatHistory);
router.get(
  "/:chatId",
  aiLimiter,
  validate(chatIdParamSchema, "params"),
  validate(queryPageSchema, "query"),
  getChatMessages,
);

// New: delete & rename
router.delete(
  "/:chatId",
  aiLimiter,
  validate(chatIdParamSchema, "params"),
  deleteChatHandler,
);
router.patch(
  "/:chatId/rename",
  aiLimiter,
  validate(chatIdParamSchema, "params"),
  validate(renameChatSchema),
  renameChatHandler,
);

module.exports = router;
