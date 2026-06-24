import React, { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code,
  Link2,
  Unlink,
} from "lucide-react";
import LinkDialog from "./LinkDialog";

// add at the top of the file alongside other imports
const HIGHLIGHT_COLORS = [
  { label: "Yellow", color: "#FEF08A" },
  { label: "Green", color: "#BBF7D0" },
  { label: "Blue", color: "#BFDBFE" },
  { label: "Pink", color: "#FBCFE8" },
  { label: "Orange", color: "#FED7AA" },
  { label: "Purple", color: "#E9D5FF" },
  { label: "Red", color: "#FECACA" },
];

// ── Bubble button ─────────────────────────────────────────────────────────────
const BBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault();
      if (!disabled) onClick();
    }}
    className={`p-1.5 rounded-lg transition-all
      ${
        active
          ? "bg-white/20 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }
      ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

const BSep = () => <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />;

// ── FloatingBubble ────────────────────────────────────────────────────────────
const FloatingBubble = ({ editor }) => {
  const [showLink, setShowLink] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  if (!editor) return null;

  const isCode = editor.isActive("code");
  const inlineCodeBlocked =
    editor.isActive("bold") ||
    editor.isActive("italic") ||
    editor.isActive("underline") ||
    editor.isActive("strike") ||
    editor.isActive("blockquote") ||
    editor.isActive("codeBlock");

  // Don't show bubble inside code blocks, or when an image is selected
  // (that's MediaToolbar's job — otherwise both appear at once).
  const shouldShow = ({ editor }) => {
    if (editor.isActive("codeBlock")) return false;
    if (editor.isActive("image")) return false;
    const { from, to } = editor.state.selection;
    return from !== to; // only when text is selected
  };

  return (
    <>
      <BubbleMenu
        editor={editor}
        shouldShow={shouldShow}
        options={{
          placement: "top",
          offset: 8,
        }}
      >
        <div
          className="flex items-center gap-0.5 px-2 py-1.5
                        bg-gray-900/95 backdrop-blur-md border border-white/10
                        rounded-xl shadow-2xl"
        >
          {/* Bold */}
          <BBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={14} />
          </BBtn>

          {/* Italic */}
          <BBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={14} />
          </BBtn>

          {/* Underline */}
          <BBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <Underline size={14} />
          </BBtn>

          {/* Strike */}
          <BBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </BBtn>

          {/* Highlight */}
          <div className="relative">
            <BBtn
              onClick={() => setShowHighlight((p) => !p)}
              active={HIGHLIGHT_COLORS.some((c) =>
                editor.isActive("highlight", { color: c.color }),
              )}
              title="Highlight"
            >
              <Highlighter size={14} />
            </BBtn>

            {showHighlight && (
              <div
                className="absolute bottom-full left-0 mb-2 z-50
                    bg-gray-900/95 backdrop-blur-md border border-white/10
                    rounded-xl shadow-2xl p-2 flex flex-wrap gap-1.5 w-32"
              >
                {HIGHLIGHT_COLORS.map(({ label, color }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlight(false);
                    }}
                    className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: editor.isActive("highlight", { color })
                        ? "#fff"
                        : "transparent",
                    }}
                  />
                ))}
                {/* Remove highlight */}
                <button
                  type="button"
                  title="Remove highlight"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlight(false);
                  }}
                  className="w-6 h-6 rounded-md border-2 border-dashed border-white/30
                   flex items-center justify-center text-white/50
                   hover:border-white/70 transition-all text-[9px]"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <BSep />

          {/* Inline code */}
          <BBtn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={isCode}
            disabled={inlineCodeBlocked}
            title="Inline Code"
          >
            <Code size={14} />
          </BBtn>

          <BSep />

          {/* Link — opens dialog */}
          <BBtn
            onClick={() => setShowLink(true)}
            active={editor.isActive("link")}
            title={editor.isActive("link") ? "Edit Link" : "Insert Link"}
          >
            <Link2 size={14} />
          </BBtn>

          {/* Unlink — only shown when on a link */}
          {editor.isActive("link") && (
            <BBtn
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Link"
            >
              <Unlink size={14} />
            </BBtn>
          )}
        </div>
      </BubbleMenu>

      {/* Link dialog */}
      {showLink && (
        <LinkDialog editor={editor} onClose={() => setShowLink(false)} />
      )}
    </>
  );
};

export default FloatingBubble;
