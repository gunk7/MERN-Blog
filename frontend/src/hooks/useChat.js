import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/selectors/authSelectors";

const SESSION_LIMIT = 10;
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export function useChat() {
  const accessToken = useSelector(selectToken);

  // ── Persisted state ──────────────────────────────────────────────────────

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem("ai_messages");
      return saved
        ? JSON.parse(saved).map((m) => ({ ...m, streaming: false }))
        : [];
    } catch {
      return [];
    }
  });

  const [msgCount, setMsgCount] = useState(() =>
    Number(sessionStorage.getItem("ai_msg_count") || "0"),
  );

  const [currentChatId, setCurrentChatId] = useState(
    () => sessionStorage.getItem("ai_chat_id") || null,
  );

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────

  const fullTextRef = useRef("");
  const shownTextRef = useRef("");
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // ── Computed ─────────────────────────────────────────────────────────────

  const isLimitReached = msgCount >= SESSION_LIMIT;

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Sync messages to sessionStorage
  useEffect(() => {
    if (messages.length === 0) return;
    sessionStorage.setItem("ai_messages", JSON.stringify(messages));
  }, [messages]);

  // Sync chatId to sessionStorage
  useEffect(() => {
    if (currentChatId) {
      sessionStorage.setItem("ai_chat_id", currentChatId);
    }
  }, [currentChatId]);

  // Sync msgCount to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("ai_msg_count", String(msgCount));
  }, [msgCount]);

  // Patch any message that was mid-stream when page was reloaded
  useEffect(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      if (last.role === "model" && (!last.text || last.streaming)) {
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            text: "_Response was interrupted by a page reload._",
            streaming: false,
          },
        ];
      }
      return prev;
    });
  }, []);

  // ── Streaming ─────────────────────────────────────────────────────────────

  const streamMessage = async (userText, botMsgId) => {
    if (!accessToken) {
      if (mountedRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text: "Error: You must be logged in.",
                  streaming: false,
                }
              : m,
          ),
        );
      }
      return;
    }

    try {
      fullTextRef.current = "";
      shownTextRef.current = "";

      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: userText, chatId: currentChatId }),
      });

      if (res.status === 401)
        throw new Error("Session expired. Please log in.");
      if (res.status === 429) throw new Error("LIMIT_REACHED");
      if (!res.ok) throw new Error("Connection failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.chatId && !currentChatId && mountedRef.current) {
              setCurrentChatId(data.chatId);
            }

            if (data.done) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              if (mountedRef.current) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, text: fullTextRef.current, streaming: false }
                      : m,
                  ),
                );
              }
              return;
            }

            if (data.text) {
              fullTextRef.current += data.text;

              if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  if (!mountedRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    return;
                  }

                  const full = fullTextRef.current;
                  const shown = shownTextRef.current;

                  if (shown.length >= full.length) return;

                  shownTextRef.current += full.slice(
                    shown.length,
                    shown.length + 4,
                  );

                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId
                        ? { ...m, text: shownTextRef.current, streaming: true }
                        : m,
                    ),
                  );
                }, 18);
              }
            }
          } catch {
            // Ignore malformed SSE frames
          }
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  text:
                    err.message === "LIMIT_REACHED"
                      ? "You've reached your monthly chat limit. Upgrade your plan for more."
                      : err.message || "Trouble connecting.",
                  streaming: false,
                }
              : m,
          ),
        );
      }
    } finally {
      if (mountedRef.current) setIsTyping(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!input.trim() || isTyping || !accessToken) return;

    const userText = input.trim();
    const botMsgId = Date.now();
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setInput("");
    setIsTyping(true);
    setMsgCount((p) => p + 1);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, time },
      { id: botMsgId, role: "model", text: "", time, streaming: true },
    ]);

    await streamMessage(userText, botMsgId);
  };

  const startNewChat = () => {
    if (isTyping) return;
    sessionStorage.removeItem("ai_messages");
    sessionStorage.removeItem("ai_chat_id");
    sessionStorage.removeItem("ai_msg_count");
    setMessages([]);
    setMsgCount(0);
    setCurrentChatId(null);
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    isTyping,
    msgCount,
    setMsgCount,
    currentChatId,
    setCurrentChatId,
    isLimitReached,
    SESSION_LIMIT,
    handleSend,
    startNewChat,
  };
}
