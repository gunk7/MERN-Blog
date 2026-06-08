import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/axios";

/**
 * @param {object} params
 * @param {boolean} params.isTyping          - from useChat; prevents loading a chat mid-stream
 * @param {Function} params.setMessages      - from useChat
 * @param {Function} params.setCurrentChatId - from useChat
 * @param {Function} params.setMsgCount      - from useChat
 * @param {Function} params.startNewChat     - from useChat
 */
export function useChatHistory({
  isTyping,
  setMessages,
  setCurrentChatId,
  setMsgCount,
  startNewChat,
}) {
  const [chatHistory, setChatHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // ── Computed ──────────────────────────────────────────────────────────────

  const filteredHistory = chatHistory.filter((c) =>
    c.title.toLowerCase().includes(historySearch.toLowerCase()),
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await API.get("/chat/history");
      if (data.success) setChatHistory(data.chats);
    } catch {
      toast.error("Could not load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadChat = async (chatId) => {
    if (isTyping) return;
    try {
      const { data } = await API.get(`/chat/${chatId}`);
      if (data.success) {
        setMessages(
          data.messages.map((m) => ({
            id: m._id,
            role: m.role,
            text: m.content,
            streaming: false,
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
        setCurrentChatId(chatId);
        setMsgCount(data.messages.filter((m) => m.role === "user").length);
      }
    } catch {
      toast.error("Could not load chat");
    }
  };

  const deleteChat = async (e, chatId, currentChatId) => {
    e.stopPropagation();
    try {
      await API.delete(`/chat/${chatId}`);
      setChatHistory((prev) => prev.filter((c) => c._id !== chatId));
      if (currentChatId === chatId) startNewChat();
      toast.success("Chat deleted");
    } catch {
      toast.error("Could not delete chat");
    }
  };

  const startRename = (e, chat) => {
    e.stopPropagation();
    setRenamingId(chat._id);
    setRenameValue(chat.title);
  };

  const commitRename = async (chatId) => {
    if (!renameValue.trim()) return;
    try {
      await API.patch(`/chat/${chatId}/rename`, { title: renameValue.trim() });
      setChatHistory((prev) =>
        prev.map((c) =>
          c._id === chatId ? { ...c, title: renameValue.trim() } : c,
        ),
      );
    } catch {
      toast.error("Could not rename chat");
    } finally {
      setRenamingId(null);
    }
  };

  return {
    chatHistory,
    historySearch,
    setHistorySearch,
    loadingHistory,
    renamingId,
    renameValue,
    setRenameValue,
    filteredHistory,
    fetchHistory,
    loadChat,
    deleteChat,
    startRename,
    commitRename,
  };
}