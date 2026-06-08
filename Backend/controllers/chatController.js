const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const UsageLog = require("../models/usageModel");
const AddonPurchase = require("../models/addonPurchaseModel");
const { getCurrentMonth } = require("../middleware/checkUsageLimit");
const {
  chat,
  writingAssist,
  generateTags,
  generateSummary,
} = require("../services/aiService");

async function deductTokens(req, tokenCount) {
  console.log("[deductTokens]", {
    userId: req.user.id,
    subscriptionId: req.subscriptionId,
    month: getCurrentMonth(),
    tokenCount,
    useAddon: req.useAddonTokens,
  });
  if (req.useAddonTokens && req.activeAddon) {
    const updated = await AddonPurchase.findByIdAndUpdate(
      req.activeAddon._id,
      { $inc: { tokensRemaining: -tokenCount } },
      { new: true },
    );

    if (updated.tokensRemaining <= 0) {
      await AddonPurchase.findByIdAndUpdate(req.activeAddon._id, {
        $set: { status: "exhausted", tokensRemaining: 0 },
      });
    }

    await UsageLog.findOneAndUpdate(
      {
        userId: req.user.id,
        subscriptionId: req.subscriptionId,
        month: getCurrentMonth(),
      },
      { $inc: { addOnTokensUsed: tokenCount } },
      { upsert: true },
    );
  } else {
    await UsageLog.findOneAndUpdate(
      {
        userId: req.user.id,
        subscriptionId: req.subscriptionId,
        month: getCurrentMonth(),
      },
      { $inc: { tokensUsed: tokenCount } },
      { upsert: true },
    );
  }
}

async function chatHandler(req, res) {
  let aiMessageDoc = null;

  try {
    let { message, chatId } = req.body;
    const userId = req.user.id;

    if (!message?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }
    // ── CREATE CHAT ─────────────────────────────────────────

    if (!chatId) {
      const newChat = await Chat.create({
        userId,
        title: message.length > 30 ? `${message.substring(0, 30)}...` : message,
      });

      chatId = newChat._id;
    }

    // ── HISTORY ─────────────────────────────────────────────

    const historyDocs = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    const history = historyDocs.map((msg) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // ── SAVE USER MESSAGE ──────────────────────────────────

    const userMessageDoc = await Message.create({
      chatId,
      role: "user",
      content: message,
      status: "completed",
      tokenCount: Math.ceil(message.length / 4),
    });

    // ── CREATE STREAMING AI MESSAGE ────────────────────────

    aiMessageDoc = await Message.create({
      chatId,
      role: "model",
      content: "",
      status: "streaming",
      model: "gemini-3-flash-preview",
    });

    // ── START AI STREAM ────────────────────────────────────

    const result = await chat(message, history);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    res.write(`data: ${JSON.stringify({ chatId })}\n\n`);
    if (res.flushHeaders) {
      res.flushHeaders();
    }

    let fullAiResponse = "";
    let clientDisconnected = false;

    req.on("close", () => {
      clientDisconnected = true;
    });

    try {
      for await (const chunk of result.stream) {
        // User closed tab / refreshed
        if (clientDisconnected) {
          throw new Error("Client disconnected");
        }

        const text = chunk.text();

        if (!text) continue;

        fullAiResponse += text;

        res.write(
          `data: ${JSON.stringify({
            text,
            chatId,
            messageId: aiMessageDoc._id,
          })}\n\n`,
        );
      }

      // ── FINAL RESPONSE ─────────────────────────────────

      const finalResponse = await result.response;
      const usage = finalResponse?.usageMetadata || {};

      console.log("[gemini usage]", JSON.stringify(usage)); // ← see what's actually there

      const totalTokens =
        usage.totalTokenCount ||
        (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0) ||
        Math.ceil((message.length + fullAiResponse.length) / 4); // character-based fallback

      // Update user token count
      await Message.findByIdAndUpdate(userMessageDoc._id, {
        tokenCount: usage.promptTokenCount || Math.ceil(message.length / 4),
      });

      // Finalize AI message
      await Message.findByIdAndUpdate(aiMessageDoc._id, {
        content: fullAiResponse,
        status: "completed",
        tokenCount:
          usage.candidatesTokenCount || Math.ceil(fullAiResponse.length / 4),
        finishedAt: new Date(),
      });

      // Update chat activity
      await Chat.findByIdAndUpdate(chatId, {
        lastMessageAt: new Date(),
      });
      await deductTokens(req, totalTokens);
      console.log(
        "[usage] tracked:",
        totalTokens,
        "sub:",
        req.subscriptionId,
        "month:",
        getCurrentMonth(),
      );

      res.write(
        `data: ${JSON.stringify({
          done: true,
          messageId: aiMessageDoc._id,
        })}\n\n`,
      );

      res.end();

      return;
    } catch (streamError) {
      console.error("[STREAM_ERROR]", streamError.message);

      const status = clientDisconnected ? "interrupted" : "error";

      // Save partial response
      if (aiMessageDoc) {
        await Message.findByIdAndUpdate(aiMessageDoc._id, {
          content: fullAiResponse,
          status,
          error: streamError.message,
        });
      }

      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            error: streamError.message,
            interrupted: clientDisconnected,
          })}\n\n`,
        );

        res.end();
      }

      return;
    }
  } catch (error) {
    console.error("[chatHandler]", error.message);

    // Catch unexpected crash before streaming started
    if (aiMessageDoc && aiMessageDoc.status === "streaming") {
      try {
        await Message.findByIdAndUpdate(aiMessageDoc._id, {
          status: "error",
          error: error.message,
        });
      } catch (dbError) {
        console.error("[MESSAGE_UPDATE_ERROR]", dbError.message);
      }
    }

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          error: "Internal server error",
        })}\n\n`,
      );

      res.end();
    }
  }
}

// 1. Get List of Chats (For the Sidebar)
async function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ userId, isArchived: false })
      .sort({ updatedAt: -1 })
      .select("title updatedAt");

    res.status(200).json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// 2. Get All Messages for a Specific Chat (When clicking a sidebar item)
async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteChatHandler(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chatDoc = await Chat.findOneAndDelete({ _id: chatId, userId });
    if (!chatDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    // Also delete all messages belonging to this chat
    await Message.deleteMany({ chatId });

    res.status(200).json({ success: true, message: "Chat deleted" });
  } catch (error) {
    console.error("[deleteChatHandler]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function renameChatHandler(req, res) {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const chatDoc = await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { title: title.trim() },
      { new: true },
    );

    if (!chatDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({ success: true, chat: chatDoc });
  } catch (error) {
    console.error("[renameChatHandler]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function writingAssistantHandler(req, res) {
  try {
    const { text, action, tone } = req.body;
    const { result, tokenCount } = await writingAssist({ text, action, tone });

    await deductTokens(req, tokenCount);

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("[writingAssistantHandler]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function tagsHandler(req, res) {
  try {
    const { text } = req.body;
    const { tags, tokenCount } = await generateTags({ text });

    await deductTokens(req, tokenCount);

    res.status(200).json({ success: true, tags });
  } catch (error) {
    console.error("[tagsHandler]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function summaryHandler(req, res) {
  try {
    const { text, isSelection } = req.body;
    const { summary, tokenCount } = await generateSummary({
      text,
      isSelection,
    });

    await deductTokens(req, tokenCount);

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("[summaryHandler]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  chatHandler,
  getChatMessages,
  getChatHistory,
  writingAssistantHandler,
  tagsHandler,
  summaryHandler,
  deleteChatHandler,
  renameChatHandler,
};
