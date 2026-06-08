import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectToken } from "../redux/selectors/authSelectors";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  RefreshCw,
  Mic,
  Check,
  X,
  Tag,
  FileText,
  History,
  Plus,
  Search,
  Trash2,
  Pencil,
  MessageSquare,
  ChevronRight,
  Copy,
} from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useChatHistory } from "../hooks/useChatHistory";
import { useWritingTools } from "../hooks/useWritingTools";
import { useUsage } from "../hooks/useUsage";
import MarkdownRenderer from "./MarkdownRenderer";

const TONES = ["formal", "casual", "confident", "friendly", "professional"];

const TOOL_DESCRIPTIONS = {
  improve: "Rewrites your content for better clarity and flow",
  rephrase: "Gives your text a fresh new phrasing",
  tone: "Adjust the voice and style of your writing",
  tags: "Auto-generates relevant hashtags from your content",
  summary: "Creates a concise summary of your document",
};

// ── Tooltip ───────────────────────────────────────────────────────────────────

const Tooltip = ({ text, children }) => (
  <div className="relative group/tip shrink-0">
    {children}
    <div
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
        px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[10px] font-medium leading-tight
        whitespace-nowrap shadow-lg opacity-0 group-hover/tip:opacity-100
        transition-opacity duration-150 select-none"
    >
      {text}
      {/* Arrow */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

// ── QuickChip ─────────────────────────────────────────────────────────────────

const QuickChip = ({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  tooltip,
}) => {
  const chip = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all whitespace-nowrap
        ${
          disabled && !active
            ? "opacity-30 cursor-not-allowed bg-white border-primary/10 text-on-surface"
            : active
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-white border-primary/10 text-on-surface hover:bg-surface-high hover:border-primary/20"
        }`}
    >
      <Icon size={11} />
      {label}
    </button>
  );

  if (tooltip) {
    return <Tooltip text={tooltip}>{chip}</Tooltip>;
  }
  return chip;
};

// ── Main component ────────────────────────────────────────────────────────────

const FloatingAIHub = ({
  editor = null,
  docText = "",
  showSummary = true,
  showWritingTools = true,
  onTagsGenerated,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("chat");

  const accessToken = useSelector(selectToken);
  const scrollRef = useRef(null);
  const isEditorMode = !!editor;
  const { usage, fetchUsage } = useUsage();

  useEffect(() => {
    if (isOpen) fetchUsage();
  }, [isOpen]);
  // ── Hooks ───────────────────u───────────────────────────────────────────────

  const {
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
    startNewChat: _startNewChat,
  } = useChat();

  const startNewChat = () => {
    _startNewChat();
    setView("chat");
  };

  const {
    historySearch,
    setHistorySearch,
    loadingHistory,
    renamingId,
    renameValue,
    setRenameValue,
    filteredHistory,
    fetchHistory,
    loadChat: _loadChat,
    deleteChat,
    startRename,
    commitRename,
  } = useChatHistory({
    isTyping,
    setMessages,
    setCurrentChatId,
    setMsgCount,
    startNewChat,
  });

  const loadChat = async (chatId) => {
    await _loadChat(chatId);
    setView("chat");
  };

  const {
    assistLoading,
    assistResult,
    assistResultType,
    activePanel,
    showTones,
    setShowTones,
    selectedText,
    savedRange,
    resetAssist,
    assist,
    regenerate,
    generateTags,
    generateSummary,
    applyToSelection,
    applyToAll,
    copyToClipboard,
  } = useWritingTools({
    editor,
    docText,
    onTagsGenerated,
    onSuccess: fetchUsage,
  });

  // ── Effects ────────────────────asss────────────────────────────────────────────

  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("ai-panel-open");
    } else {
      document.body.classList.remove("ai-panel-open");
    }
    return () => document.body.classList.remove("ai-panel-open");
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (view === "history") fetchHistory();
  }, [view]);

  // Disable text selection while assist is loading or a result is pending apply
  useEffect(() => {
    if (assistLoading || (assistResult && assistResultType === "text")) {
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
    };
  }, [assistLoading, assistResult, assistResultType]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleClose = () => {
    if (isTyping) return;
    setIsOpen(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className={`fixed top-20 right-0 h-[calc(100vh-5rem)] z-40 flex flex-col bg-white border-l border-primary/10 shadow-xl transition-all duration-300 ease-in-out
          ${isOpen ? "w-104" : "w-0 overflow-hidden"}`}
      >
        {isOpen && (
          <>
            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={15} />
                <span className="font-bold text-sm leading-none">
                  Wavelog AI
                </span>
                {/*  {view === "chat" && (
                  <span className="text-[10px] opacity-60 ml-1">
                    {Math.max(0, SESSION_LIMIT - msgCount)} left
                  </span>
                )} */}
                {isTyping && (
                  <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-white/15 text-[9px] font-bold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    Live
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={startNewChat}
                  disabled={isTyping}
                  title={isTyping ? "Wait for response to finish" : "New chat"}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>

                <button
                  onClick={() => {
                    if (isTyping) return;
                    setView((v) => (v === "history" ? "chat" : "history"));
                  }}
                  disabled={isTyping}
                  title={isTyping ? "Wait for response to finish" : "History"}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    view === "history" ? "bg-white/25" : "hover:bg-white/20"
                  }`}
                >
                  <History size={14} />
                </button>

                <button
                  onClick={handleClose}
                  disabled={isTyping}
                  title={isTyping ? "Generating — please wait" : "Close"}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* ── HISTORY VIEW ── */}
            {view === "history" && (
              <div className="flex flex-col flex-1 overflow-hidden bg-white">
                <div className="px-4 pt-3 pb-2 border-b border-primary/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-primary/8">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <input
                      className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder:text-gray-400"
                      placeholder="Search conversations…"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                  {loadingHistory ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-8">
                      No conversations yet
                    </p>
                  ) : (
                    filteredHistory.map((chat) => (
                      <div
                        key={chat._id}
                        onClick={() => loadChat(chat._id)}
                        className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-primary/5 transition-colors ${
                          isTyping
                            ? "opacity-50 cursor-not-allowed pointer-events-none"
                            : "cursor-pointer"
                        }`}
                      >
                        <MessageSquare
                          size={13}
                          className="text-primary/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          {renamingId === chat._id ? (
                            <input
                              autoFocus
                              className="w-full text-xs border border-primary/20 rounded-lg px-2 py-0.5 outline-none focus:border-primary"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => commitRename(chat._id)}
                            />
                          ) : (
                            <>
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {chat.title}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(chat.updatedAt).toLocaleDateString()}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => startRename(e, chat)}
                            className="p-1 rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={(e) =>
                              deleteChat(e, chat._id, currentChatId)
                            }
                            className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── CHAT VIEW ── */}
            {view === "chat" && (
              <>
                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
                >
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles size={18} className="text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        Hi, how can I help?
                      </p>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed
                          ${
                            msg.role === "user"
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-white border border-primary/8 text-gray-800 rounded-bl-sm"
                          }`}
                      >
                        {msg.text ? (
                          msg.role === "model" ? (
                            <div className={msg.streaming ? "stream-fade" : ""}>
                              <MarkdownRenderer
                                content={msg.text}
                                variant="chat"
                              />
                              {msg.streaming && (
                                <span className="stream-cursor" />
                              )}
                            </div>
                          ) : (
                            msg.text
                          )
                        ) : isTyping ? (
                          /* Only show thinking dots — no extra text label */
                          <span className="flex items-center justify-center w-6 h-6 relative">
                            {[...Array(8)].map((_, i) => (
                              <span
                                key={i}
                                className="orbit-dot"
                                style={{
                                  transform: `rotate(${i * 45}deg) translateX(10px)`,
                                  animationDelay: `${-(i / 8)}s`,
                                }}
                              />
                            ))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── WRITING TOOL RESULT ── */}
                {(assistLoading || assistResult) && (
                  <div className="border-t border-primary/5 bg-white px-3 py-3">
                    {assistLoading ? (
                      /* Single spinner — no duplicate "Thinking..." label */
                      <div className="flex items-center gap-2 py-2">
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] text-gray-400 capitalize">
                          Generating {activePanel}…
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assistResultType === "tags" &&
                          Array.isArray(assistResult) && (
                            <div className="flex flex-wrap gap-1">
                              {assistResult.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => copyToClipboard(tag)}
                                  className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          )}

                        {assistResultType === "text" &&
                          typeof assistResult === "string" && (
                            <>
                              <MarkdownRenderer
                                content={assistResult}
                                variant="chat"
                                maxHeight="28rem"
                              />
                              <div className="flex gap-2">
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    copyToClipboard(assistResult);
                                  }}
                                  onClick={() => copyToClipboard(assistResult)}
                                  className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-primary/10 text-gray-700 text-xs font-bold hover:bg-gray-50"
                                >
                                  <Copy size={13} />
                                  Copy
                                </button>

                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    regenerate();
                                  }}
                                  disabled={assistLoading}
                                  className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-primary/10 text-gray-700 text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
                                >
                                  <RefreshCw
                                    size={13}
                                    className={
                                      assistLoading ? "animate-spin" : ""
                                    }
                                  />
                                  Retry
                                </button>

                                {/* ── Only show Apply buttons for non-summary actions ── */}
                                {activePanel !== "summary" && (
                                  <>
                                    {savedRange ? (
                                      <button
                                        onMouseDown={(e) => {
                                          e.preventDefault(); // ← prevents editor losing focus
                                          applyToSelection();
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
                                      >
                                        <Check size={13} />
                                        Apply Selection
                                      </button>
                                    ) : (
                                      <button
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          applyToAll();
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold"
                                      >
                                        <Sparkles size={13} />
                                        Apply All
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* Discard — clears result and unlocks tools */}
                                <button
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    resetAssist();
                                  }}
                                  title="Discard result"
                                  className="px-3 py-2.5 rounded-xl border border-red-100 text-red-400 text-xs font-bold hover:bg-red-50 hover:border-red-200 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── WRITING TOOLS TOOLBAR ── */}
                {(showWritingTools || showSummary) && (
                  <div className="border-t border-primary/5 bg-white px-3 py-3">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                      {showWritingTools && (
                        <>
                          <QuickChip
                            icon={Sparkles}
                            label={`Improve${usage?.writingAssist?.remaining != null ? ` · ${usage.writingAssist.remaining}` : ""}`}
                            tooltip={TOOL_DESCRIPTIONS.improve}
                            active={activePanel === "improve"}
                            disabled={
                              assistLoading ||
                              !!assistResult ||
                              usage?.writingAssist?.locked ||
                              usage?.writingAssist?.remaining === 0
                            }
                            onClick={() =>
                              activePanel === "improve"
                                ? resetAssist()
                                : assist("improve")
                            }
                          />
                          <QuickChip
                            icon={RefreshCw}
                            label={`Rephrase${usage?.writingAssist?.remaining != null ? ` · ${usage.writingAssist.remaining}` : ""}`}
                            tooltip={TOOL_DESCRIPTIONS.rephrase}
                            active={activePanel === "rephrase"}
                            disabled={
                              assistLoading ||
                              !!assistResult ||
                              usage?.writingAssist?.locked ||
                              usage?.writingAssist?.remaining === 0
                            }
                            onClick={() =>
                              activePanel === "rephrase"
                                ? resetAssist()
                                : assist("rephrase")
                            }
                          />
                          <QuickChip
                            icon={Mic}
                            label="Tone"
                            tooltip={TOOL_DESCRIPTIONS.tone}
                            active={showTones || TONES.includes(activePanel)}
                            disabled={
                              assistLoading ||
                              !!assistResult ||
                              usage?.writingAssist?.locked ||
                              usage?.writingAssist?.remaining === 0
                            }
                            onClick={() =>
                              !(assistLoading || assistResult) &&
                              setShowTones((p) => !p)
                            }
                          />
                          <QuickChip
                            icon={Tag}
                            label={`Tags${usage?.tags?.remaining != null ? ` · ${usage.tags.remaining}` : ""}`}
                            tooltip={TOOL_DESCRIPTIONS.tags}
                            active={activePanel === "tags"}
                            disabled={
                              assistLoading ||
                              !!assistResult ||
                              usage?.tags?.remaining === 0
                            }
                            onClick={generateTags}
                          />
                        </>
                      )}

                      {showSummary && (
                        <QuickChip
                          icon={FileText}
                          label={`Summary${usage?.summary?.remaining != null ? ` · ${usage.summary.remaining}` : ""}`}
                          tooltip={TOOL_DESCRIPTIONS.summary}
                          active={activePanel === "summary"}
                          disabled={
                            assistLoading ||
                            !!assistResult ||
                            usage?.summary?.remaining === 0
                          }
                          onClick={() =>
                            activePanel === "summary"
                              ? resetAssist()
                              : generateSummary()
                          }
                        />
                      )}
                    </div>

                    {showWritingTools && showTones && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {TONES.map((tone) => (
                          <button
                            key={tone}
                            onClick={() =>
                              !(assistLoading || assistResult) &&
                              assist("tone", tone)
                            }
                            disabled={
                              assistLoading ||
                              !!assistResult ||
                              usage?.writingAssist?.locked ||
                              usage?.writingAssist?.remaining === 0
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition-all border
              disabled:opacity-30 disabled:cursor-not-allowed
              ${
                activePanel === tone
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-primary/10 text-gray-600 hover:bg-primary/5"
              }`}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    )}

                    {isEditorMode && selectedText && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-primary">
                        <span className="font-bold">Selected:</span>{" "}
                        {selectedText.slice(0, 80)}
                        {selectedText.length > 80 ? "..." : ""}
                      </div>
                    )}
                  </div>
                )}

                {/* ── UPGRADE BANNER ── */}
                {usage &&
                  (usage.writingAssist?.locked ||
                    usage.writingAssist?.remaining === 0 ||
                    usage.summary?.remaining === 0 ||
                    usage.tags?.remaining === 0) && (
                    <div className="mx-3 mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <span className="text-[10px] text-amber-700 font-medium">
                        {usage.writingAssist?.locked
                          ? "Writing tools require Pro"
                          : "Some limits reached"}
                      </span>
                      <button
                        onClick={() => navigate("/onboarding/plan")}
                        className="text-[10px] font-bold text-amber-700 underline"
                      >
                        Upgrade →
                      </button>
                    </div>
                  )}
                {/* ── INPUT ── */}
                <div className="border-t border-primary/5 bg-white px-3 py-3">
                  {!accessToken ? (
                    <p className="text-xs text-center text-red-400 py-1">
                      Please log in to chat
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 bg-gray-50 border border-primary/10 rounded-full px-4 py-2 text-sm outline-none focus:border-primary transition-colors placeholder:text-gray-400"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        disabled={isTyping}
                        placeholder="Ask Wavelog..."
                      />
                      <button
                        onClick={handleSend}
                        disabled={isTyping || !input.trim()}
                        className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── TOGGLE BUTTON ── */}
      {/*
        Vertical pill: fixed height, narrow width.
        `right` shifts from 0 (closed) to panel width (open) with the same
        duration/easing as the panel so the two move in lock-step.
      */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        style={{
          right: isOpen ? "26rem" : "0",
          transition: "right 300ms ease-in-out",
        }}
        className="z-40 fixed bottom-6 flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-l-2xl shadow-lg hover:bg-primary/90"
      >
        <Sparkles size={16} />
        <span className="text-xs font-bold tracking-wide uppercase">
          Wavelog AI
        </span>
        {isTyping && !isOpen && (
          <span className="relative flex">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-green-400" />
          </span>
        )}
      </button>
    </>
  );
};

export default FloatingAIHub;
