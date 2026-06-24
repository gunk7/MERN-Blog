import React, { useState, useEffect } from "react";
import {
  Sparkles,
  RefreshCw,
  Mic,
  Check,
  X,
  Tag,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import API from "../services/axios";
import { toast } from "react-toastify";

const TONES = ["formal", "casual", "confident", "friendly", "professional"];
const parseMarkdown = (md) => DOMPurify.sanitize(marked.parse(md));

// ── Tooltip ───────────────────────────────────────────────────────────────────
const Tip = ({ label, children }) => (
  <div className="relative group flex items-center justify-center">
    {children}
    <div className="absolute right-full mr-2 px-2 py-1 rounded-lg bg-surface-high text-on-surface text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-sm border border-primary/10">
      {label}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const WritingAssistantPanel = ({
  editor,
  docText = "",
  showSummary = true,
  onTagsGenerated,
  onOpenChange,
}) => {
  const isEditorMode = !!editor;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [showTones, setShowTones] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [savedRange, setSavedRange] = useState(null);
  const [hasPendingResult, setHasPendingResult] = useState(false);

  useEffect(() => {
    onOpenChange?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!editor) return;
    const updateSelection = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ").trim();
      if (text) {
        setSelectedText(text);
        setSavedRange({ from, to });
      } else {
        setSelectedText("");
      }
    };
    editor.on("selectionUpdate", updateSelection);
    editor.on("update", updateSelection);
    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("update", updateSelection);
    };
  }, [editor]);

  useEffect(() => {
    if (result) Promise.resolve().then(() => setHasPendingResult(true));
  }, [result]);

  useEffect(() => {
    if (open) Promise.resolve().then(() => setHasPendingResult(false));
  }, [open]);

  const reset = () => {
    setResult(null);
    setResultType(null);
    setActiveAction(null);
    setSavedRange(null);
    setSelectedText("");
    setShowTones(false);
  };

  const assist = async (action, tone = null) => {
    setResult(null);
    setResultType("text");
    setActiveAction(action === "tone" ? tone : action);
    setLoading(true);
    setShowTones(false);
    try {
      const { data } = await API.post("/chat/writing-assist", {
        text: selectedText || editor.getText(),
        action,
        ...(tone && { tone }),
      });
      if (data.success) setResult(data.result);
      else toast.error(data.message || "Something went wrong");
    } catch {
      toast.error("Writing assistant failed");
    } finally {
      setLoading(false);
    }
  };

  const generateTags = async () => {
    setResult(null);
    setActiveAction("tags");
    setLoading(true);
    try {
      const { data } = await API.post("/chat/tags", { text: editor.getText() });
      if (data.success) {
        if (onTagsGenerated) {
          onTagsGenerated(data.tags);
          toast.success("Tags applied to your post!");
          reset();
        } else {
          setResult(data.tags);
          setResultType("tags");
        }
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("Tag generation failed");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const generateSummary = async () => {
    setResult(null);
    setResultType("text");
    setActiveAction("summary");
    setLoading(true);
    try {
      const text = isEditorMode ? selectedText || editor.getText() : docText;
      const { data } = await API.post("/chat/summary", {
        text,
        isSelection: isEditorMode && !!selectedText,
      });
      if (data.success) setResult(data.summary);
      else toast.error(data.message || "Something went wrong");
    } catch {
      toast.error("Summary generation failed");
    } finally {
      setLoading(false);
    }
  };

  const applyToSelection = () => {
    if (!editor || !result || !savedRange) return;
    editor
      .chain()
      .focus()
      .setTextSelection(savedRange)
      .deleteSelection()
      .insertContentAt(savedRange.from, parseMarkdown(result))
      .run();
    reset();
    toast.success("Applied to selection!");
  };

  const applyToAll = () => {
    if (!editor || !result) return;
    editor.commands.setContent(parseMarkdown(result));
    reset();
    toast.success("Applied to entire document!");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/*
        Outer wrapper holds [tab trigger] + [panel] side by side as a flex row.
        The whole row translates right when closed — tab peeks out because it
        sits to the LEFT of the panel, so only the panel width gets hidden.
      */}
      <div
        className={`fixed top-20 right-0 h-[calc(100vh-5rem)] z-40 flex flex-row items-center
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-72"}`}
      >
        {/* Tab trigger — glued to left edge, travels with the panel */}
        <button
          onClick={() => setOpen((p) => !p)}
          className="relative flex flex-col items-center justify-center gap-1.5 py-5 px-1.5
            bg-surface-low border border-primary/10 border-r-0 rounded-l-xl shadow-lg
            hover:bg-surface-high transition-colors self-center"
        >
          {hasPendingResult && !open && (
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-surface-lowest" />
          )}
          <Sparkles size={13} className="text-primary" />
          <span
            style={{ writingMode: "vertical-rl" }}
            className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant"
          >
            AI
          </span>
          <ChevronLeft
            size={10}
            className={`text-on-surface-variant transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Panel */}
        <div className="h-full w-72 flex flex-col bg-surface-lowest border-l border-primary/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-low border-b border-primary/10 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest text-on-surface">
                AI Assistant
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-high text-on-surface-variant transition-all"
            >
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-5">
            {/* ── Editor mode ── */}
            {isEditorMode && (
              <>
                {/* Selection pill */}
                <div
                  className={`rounded-xl px-3 py-2.5 text-[10px] leading-relaxed transition-colors ${
                    selectedText
                      ? "bg-primary/8 text-primary border border-primary/15"
                      : "bg-surface-low text-on-surface-variant/40 border border-primary/5"
                  }`}
                >
                  {selectedText ? (
                    <>
                      <span className="font-black uppercase tracking-widest block mb-0.5">
                        Selection active
                      </span>
                      "{selectedText.slice(0, 50)}
                      {selectedText.length > 50 ? "…" : ""}"
                    </>
                  ) : (
                    <span>
                      No selection — actions apply to the entire document.
                    </span>
                  )}
                </div>

                {/* Writing actions */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                    Writing
                  </p>

                  <button
                    onClick={() => assist("improve")}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-40 text-left
                      ${
                        activeAction === "improve"
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "border-primary/8 hover:bg-surface-high text-on-surface"
                      }`}
                  >
                    <Sparkles
                      size={15}
                      className={
                        activeAction === "improve"
                          ? "text-primary"
                          : "text-primary/50"
                      }
                    />
                    <div>
                      <p className="text-xs font-bold">Improve</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-normal">
                        Fix grammar & sharpen flow
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => assist("rephrase")}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-40 text-left
                      ${
                        activeAction === "rephrase"
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "border-primary/8 hover:bg-surface-high text-on-surface"
                      }`}
                  >
                    <RefreshCw
                      size={15}
                      className={
                        activeAction === "rephrase"
                          ? "text-primary"
                          : "text-primary/50"
                      }
                    />
                    <div>
                      <p className="text-xs font-bold">Rephrase</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-normal">
                        Say it a different way
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowTones((p) => !p)}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-40 text-left
                      ${
                        showTones || TONES.includes(activeAction)
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "border-primary/8 hover:bg-surface-high text-on-surface"
                      }`}
                  >
                    <Mic
                      size={15}
                      className={
                        showTones || TONES.includes(activeAction)
                          ? "text-primary"
                          : "text-primary/50"
                      }
                    />
                    <div>
                      <p className="text-xs font-bold">Change Tone</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-normal capitalize">
                        {TONES.includes(activeAction)
                          ? `Active: ${activeAction}`
                          : "Formal, casual, confident…"}
                      </p>
                    </div>
                  </button>

                  {showTones && (
                    <div className="ml-4 border-l-2 border-primary/10 pl-3 space-y-1">
                      {TONES.map((tone) => (
                        <button
                          key={tone}
                          onClick={() => assist("tone", tone)}
                          disabled={loading}
                          className={`w-full text-left px-3 py-2 text-xs capitalize rounded-lg transition-all disabled:opacity-40
                            ${
                              activeAction === tone
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-on-surface hover:bg-surface-high"
                            }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-primary/5" />

                {/* Document actions */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                    Document
                  </p>

                  <button
                    onClick={generateTags}
                    disabled={loading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-40 text-left
                      ${
                        activeAction === "tags"
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "border-primary/8 hover:bg-surface-high text-on-surface"
                      }`}
                  >
                    <Tag
                      size={15}
                      className={
                        activeAction === "tags"
                          ? "text-primary"
                          : "text-primary/50"
                      }
                    />
                    <div>
                      <p className="text-xs font-bold">Generate Tags</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-normal">
                        Auto-tag from content
                      </p>
                    </div>
                  </button>

                  {showSummary && (
                    <button
                      onClick={generateSummary}
                      disabled={loading}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-40 text-left
                        ${
                          activeAction === "summary"
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "border-primary/8 hover:bg-surface-high text-on-surface"
                        }`}
                    >
                      <FileText
                        size={15}
                        className={
                          activeAction === "summary"
                            ? "text-primary"
                            : "text-primary/50"
                        }
                      />
                      <div>
                        <p className="text-xs font-bold">Summarize</p>
                        <p className="text-[10px] text-on-surface-variant/50 font-normal">
                          Get the key points
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Tip banner — only when idle */}
                {!loading && !result && (
                  <div className="mt-auto pt-2">
                    <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-4 flex flex-col items-center text-center gap-2">
                      <span className="text-3xl">💡</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">
                        How to use
                      </p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {selectedText
                          ? "Text selected! Pick an action above to improve, rephrase, or change its tone."
                          : "Select text in your document to target a specific section, or run any action to apply it to the whole post."}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Detail mode ── */}
            {!isEditorMode && (
              <>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
                    Document
                  </p>
                  <button
                    onClick={generateSummary}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/8 text-on-surface hover:bg-surface-high transition-all text-left disabled:opacity-40"
                  >
                    <FileText size={15} className="text-primary/50 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Summarize</p>
                      <p className="text-[10px] text-on-surface-variant/50 font-normal">
                        Get the key points
                      </p>
                    </div>
                  </button>
                </div>

                {!loading && !result && (
                  <div className="mt-auto pt-2">
                    <div className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-4 flex flex-col items-center text-center gap-2">
                      <span className="text-3xl">💡</span>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">
                        How to use
                      </p>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        Hit Summarize to get a quick overview of this post's key
                        points.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center gap-2 py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] text-on-surface-variant capitalize">
                  {activeAction && `Generating ${activeAction}…`}
                </p>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div className="space-y-2">
                <div className="w-full h-px bg-primary/5" />
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                  Result
                </p>

                {resultType === "tags" && Array.isArray(result) && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {result.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => copyToClipboard(tag)}
                          className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(result.map((t) => `#${t}`).join(" "))
                      }
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                    >
                      <Check size={12} /> Copy All Tags
                    </button>
                    <button
                      onClick={reset}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant text-xs font-bold hover:bg-surface-high transition-all"
                    >
                      <X size={12} /> Discard
                    </button>
                  </div>
                )}

                {resultType === "text" && typeof result === "string" && (
                  <div className="space-y-2">
                    <div
                      className="bg-surface-low rounded-xl p-3 text-xs text-on-surface leading-relaxed max-h-48 overflow-y-auto border border-primary/5 prose prose-xs max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: parseMarkdown(result),
                      }}
                    />

                    {activeAction === "summary" ? (
                      <>
                        <button
                          onClick={() => copyToClipboard(result)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
                        >
                          <Check size={12} /> Copy Summary
                        </button>
                        <button
                          onClick={reset}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant text-xs font-bold hover:bg-surface-high transition-all"
                        >
                          <X size={12} /> Discard
                        </button>
                      </>
                    ) : (
                      <>
                        {savedRange ? (
                          <>
                            <button
                              onClick={applyToSelection}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
                            >
                              <Check size={12} /> Apply to Selection
                            </button>
                            <button
                              onClick={applyToAll}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                            >
                              <Sparkles size={12} /> Apply to All
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-[10px] text-on-surface-variant/60 text-center">
                              No text selected — result will replace entire
                              document
                            </p>
                            <button
                              onClick={applyToAll}
                              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all"
                            >
                              <Sparkles size={12} /> Apply to All
                            </button>
                          </>
                        )}
                        <button
                          onClick={reset}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-primary/10 text-on-surface-variant text-xs font-bold hover:bg-surface-high transition-all"
                        >
                          <X size={12} /> Discard
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WritingAssistantPanel;
