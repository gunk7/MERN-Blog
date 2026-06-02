import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/selectors/authSelectors";
import API from "../services/axios"; // Your Axios instance with interceptors

const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [currentChatId, setCurrentChatId] = useState(null);
  const scrollRef = useRef(null);

  const accessToken = useSelector(selectToken);

  const SESSION_LIMIT = 10;
  const isLimitReached = msgCount >= SESSION_LIMIT;

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const fullTextRef = useRef("");
  const shownTextRef = useRef("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Create a chat session in the DB using Axios when the chat is opened
  const handleOpenChat = async () => {
    setIsOpen(true);
  };

  const streamMessage = async (userText, botMsgId) => {
    if (!accessToken) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: "Error: You must be logged in." }
            : msg,
        ),
      );
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
        body: JSON.stringify({
          message: userText,
          chatId: currentChatId, // This is null for the first message
        }),
      });

      if (res.status === 401)
        throw new Error("Session expired. Please log in.");
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
          const jsonStr = line.slice(6);

          try {
            const data = JSON.parse(jsonStr);

            // 🔥 NEW: Capture the chatId from the stream
            // The backend creates it and sends it back in the chunks
            if (data.chatId && !currentChatId) {
              setCurrentChatId(data.chatId);
            }

            if (data.done) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMsgId
                    ? { ...msg, text: fullTextRef.current }
                    : msg,
                ),
              );
              return;
            }

            if (data.text) {
              fullTextRef.current += data.text;

              // ... your existing intervalRef logic for the typing effect ...
              if (!intervalRef.current) {
                intervalRef.current = setInterval(() => {
                  const full = fullTextRef.current;
                  const shown = shownTextRef.current;

                  if (shown.length >= full.length) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    return;
                  }

                  const nextChunk = full.slice(shown.length, shown.length + 3);
                  shownTextRef.current += nextChunk;

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, text: shownTextRef.current }
                        : msg,
                    ),
                  );
                }, 20);
              }
            }
          } catch (e) {
            console.warn("Skipping invalid JSON:", jsonStr);
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? { ...msg, text: err.message || "Trouble connecting." }
            : msg,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleStream = async () => {
    if (!input.trim() || isTyping || isLimitReached || !accessToken) return;

    const userText = input.trim();
    const botMsgId = Date.now();
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setInput("");
    setIsTyping(true);
    setMsgCount((prev) => prev + 1);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, time },
      { id: botMsgId, role: "model", text: "", time }, // Changed role to 'model'
    ]);

    await streamMessage(userText, botMsgId);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="glass-panel w-[90vw] sm:w-96 h-137.5 flex flex-col overflow-hidden border-primary/10 bg-white shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="p-5 bg-primary text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xl">✨</span>
              <div>
                <h4 className="font-bold leading-none">Wavelog AI</h4>
                <p className="text-[10px] opacity-70 mt-0.5">
                  {SESSION_LIMIT - msgCount} messages remaining
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMessages([]);
                  setMsgCount(0);
                }}
                className="hover:bg-white/20 p-1 rounded"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white border text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-xs text-gray-400 italic">
                Wavelog is thinking...
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            {!accessToken ? (
              <p className="text-xs text-center text-red-500">
                Please log in to chat
              </p>
            ) : isLimitReached ? (
              <p className="text-xs text-center text-gray-400">
                Limit reached 🔒
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-primary"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStream()}
                  disabled={isTyping}
                  placeholder="Ask Wavelog..."
                />
                <button
                  onClick={handleStream}
                  disabled={isTyping || !input.trim()}
                  className="bg-primary text-white w-10 h-10 rounded-full"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleOpenChat}
        className={`w-16 h-16 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 ${isOpen ? "hidden" : "flex"}`}
      >
        ✨
      </button>
    </div>
  );
};

export default FloatingAIChat;
