import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { marked } from "marked";
import API from "../services/axios";

const markdownToHTML = (markdown) => marked.parse(markdown || "");

export function useWritingTools({
  editor,
  docText,
  onTagsGenerated,
  onSuccess,
}) {
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistResult, setAssistResult] = useState(null);
  const [assistResultType, setAssistResultType] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [showTones, setShowTones] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [savedRange, setSavedRange] = useState(null);

  // ── Refs ────────────────────────────────────────────────────────────────

  const savedRangeRef = useRef(null);
  const toastShownRef = useRef(false);
  const isResettingRef = useRef(false);
  const assistLoadingRef = useRef(false);
  const assistResultRef = useRef(null);
  const assistResultTypeRef = useRef(null);

  const lastActionRef = useRef({ action: null, tone: null });

  // ── Editor selection tracking ──────────────────────────────────────────

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      if (isResettingRef.current) return;

      const isLocked =
        assistLoadingRef.current ||
        (assistResultRef.current && assistResultTypeRef.current === "text");

      if (isLocked) {
        const range = savedRangeRef.current;

        if (range) {
          const { from, to } = editor.state.selection;
          // restore even if collapsed (user clicked away)
          if (from !== range.from || to !== range.to) {
            editor.commands.setTextSelection(range);
          }
        }

        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast.warn(
            "Apply, discard, or copy the result before selecting new text.",
            {
              toastId: "selection-locked",
              onClose: () => {
                toastShownRef.current = false;
              },
            },
          );
        }

        return;
      }

      // ── NORMAL SELECTION FLOW ──
      const { from, to } = editor.state.selection;

      if (from === to) {
        // selection collapsed — clear range only if NOT locked
        savedRangeRef.current = null;
        setSavedRange(null);
        setSelectedText("");
        return;
      }

      const text = editor.state.doc.textBetween(from, to, " ").trim();
      if (!text) return;

      savedRangeRef.current = { from, to };
      setSavedRange({ from, to });
      setSelectedText(text);
      editor.commands.setMark("highlight", { color: "#ede9fe" });
    };

    editor.on("selectionUpdate", update);

    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  // ── Helpers ────────────────────────────────────────────────────────────

  const clearHighlight = () => {
    const range = savedRangeRef.current;
    if (editor && range) {
      editor
        .chain()
        .focus()
        .setTextSelection(range)
        .unsetMark("highlight")
        .run();
    }
  };

  const resetAssist = () => {
    isResettingRef.current = true;

    assistResultRef.current = null;
    assistLoadingRef.current = false;
    assistResultTypeRef.current = null;
    setAssistResult(null);
    setAssistResultType(null);
    setActivePanel(null);
    setShowTones(false);

    lastActionRef.current = { action: null, tone: null };

    const range = savedRangeRef.current;
    if (editor && range) {
      try {
        editor
          .chain()
          .focus()
          .setTextSelection(range)
          .unsetMark("highlight")
          .blur()
          .run();
      } catch (err) {
        console.error("Failed to clear selection", err);
      }
    }
    setSelectedText("");
    savedRangeRef.current = null;
    setSavedRange(null);

    requestAnimationFrame(() => {
      isResettingRef.current = false;
    });
  };

  // ── Core assist runner ─────────────────────────────────────────────────

  const runAssist = async (action, tone = null) => {
    // snapshot selection BEFORE async gap
    const rangeAtStart = savedRangeRef.current;
    if (rangeAtStart) {
      savedRangeRef.current = rangeAtStart;
      setSavedRange(rangeAtStart);
    }

    assistResultRef.current = null;
    assistResultTypeRef.current = "text";
    setAssistResult(null);
    setAssistResultType("text");
    setActivePanel(action === "tone" ? tone : action);
    assistLoadingRef.current = true;
    setAssistLoading(true);
    setShowTones(false);

    lastActionRef.current = { action, tone };

    try {
      const { data } = await API.post("/chat/writing-assist", {
        text: selectedText || editor?.getText() || docText,
        action,
        ...(tone && { tone }),
      });

      if (data.success) {
        assistResultRef.current = data.result;
        setAssistResult(data.result);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("Writing tools require a Pro plan — tap to upgrade", {
          onClick: () => (window.location.href = "/onboarding/plan"),
          style: { cursor: "pointer" },
        });
      } else if (status === 429) {
        toast.error("Monthly limit reached — tap to upgrade", {
          onClick: () => (window.location.href = "/onboarding/plan"),
          style: { cursor: "pointer" },
        });
      } else {
        toast.error("Writing assistant failed");
      }
    } finally {
      assistLoadingRef.current = false;
      setAssistLoading(false);
      setActivePanel(null);
    }
  };

  const assist = (action, tone = null) => runAssist(action, tone);

  // ── Regenerate ─────────────────────────────────────────────────────────

  const regenerate = () => {
    const { action, tone } = lastActionRef.current;
    if (!action) return;
    runAssist(action, tone);
  };

  // ── Apply actions ──────────────────────────────────────────────────────

  const applyToSelection = () => {
    isResettingRef.current = true;

    const range = savedRangeRef.current;
    const result = assistResultRef.current;

    if (!editor || !result || !range) {
      toast.error("No selection to apply to");
      isResettingRef.current = false;
      return;
    }

    const html = markdownToHTML(result);

    // clear all state before touching editor
    assistResultRef.current = null;
    assistResultTypeRef.current = null;
    assistLoadingRef.current = false;
    setAssistResult(null);
    setAssistResultType(null);
    setActivePanel(null);
    setShowTones(false);
    setSelectedText("");
    savedRangeRef.current = null;
    setSavedRange(null);
    lastActionRef.current = { action: null, tone: null };

    // select the range, remove highlight, then replace with new content in one chain
    editor
      .chain()
      .focus()
      .setTextSelection(range)
      .unsetMark("highlight")
      .insertContent(html) // ← replaces the active selection directly
      .run();

    requestAnimationFrame(() => {
      isResettingRef.current = false;
    });

    toast.success("Applied to selection!");
  };

  const applyToAll = () => {
    const result = assistResultRef.current; // ← use ref, not state

    if (!editor || !result) return;

    const html = markdownToHTML(result);
    editor.commands.setContent(html);
    resetAssist();
    toast.success("Applied to document!");
  };

  // ── Tags ───────────────────────────────────────────────────────────────

  const generateTags = async () => {
    assistResultRef.current = null;
    assistResultTypeRef.current = null;
    setAssistResult(null);
    setActivePanel("tags");
    assistLoadingRef.current = true;
    setAssistLoading(true);

    try {
      const { data } = await API.post("/chat/tags", {
        text: editor?.getText() || docText,
      });

      if (data.success) {
        if (onTagsGenerated) {
          onTagsGenerated(data.tags);
          toast.success("Tags applied!");
          resetAssist();
        } else {
          assistResultTypeRef.current = "tags";
          setAssistResultType("tags");
          assistResultRef.current = data.tags;
          setAssistResult(data.tags);
          if (onSuccess) onSuccess();
        }
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("This feature requires a Pro plan.", {
          onClick: () => (window.location.href = "/onboarding/plan"),
          style: { cursor: "pointer" },
        });
      } else if (status === 429) {
        toast.error("Monthly limit reached. Upgrade for more.", {
          onClick: () => (window.location.href = "/onboarding/plan"),
          style: { cursor: "pointer" },
        });
      } else {
        toast.error("Writing assistant failed");
      }
    } finally {
      assistLoadingRef.current = false;
      setAssistLoading(false);
      setActivePanel(null);
    }
  };

  // ── Summary ────────────────────────────────────────────────────────────

  const generateSummary = async () => {
    assistResultRef.current = null;
    assistResultTypeRef.current = "text";
    setAssistResult(null);
    setAssistResultType("text");
    setActivePanel("summary");
    assistLoadingRef.current = true;
    setAssistLoading(true);

    lastActionRef.current = { action: "summary", tone: null };

    const isEditorMode = !!editor;

    try {
      const text = isEditorMode ? selectedText || editor.getText() : docText;

      const { data } = await API.post("/chat/summary", {
        text,
        isSelection: isEditorMode && !!selectedText,
      });

      if (data.success) {
        assistResultRef.current = data.summary;
        setAssistResult(data.summary);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        toast.error("This feature requires a Pro plan.", {
          onClick: () => (window.location.href = "/onboarding/plan"),
          style: { cursor: "pointer" },
        });
      } else if (status === 429) {
        toast.error("Monthly limit reached. Upgrade for more.", {
          onClick: () => (window.location.href = "/onboarding/plan"),
          style: { cursor: "pointer" },
        });
      } else {
        toast.error("Writing assistant failed");
      }
    } finally {
      assistLoadingRef.current = false;
      setAssistLoading(false);
      setActivePanel(null);
    }
  };

  // ── Clipboard ──────────────────────────────────────────────────────────

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  // ── Return ─────────────────────────────────────────────────────────────

  return {
    assistLoading,
    assistResult,
    assistResultType,
    activePanel,
    showTones,
    setShowTones,

    selectedText,
    savedRange,

    lastAction: lastActionRef.current,

    resetAssist,
    assist,
    regenerate,

    generateTags,
    generateSummary,

    applyToSelection,
    applyToAll,

    copyToClipboard,
    clearHighlight,
  };
}
