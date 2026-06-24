import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ChevronDown,
  List,
  Code,
  Quote,
  Link2,
  Minus,
  Image,
  Eye,
  Pencil,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Table,
  Video,
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../../services/axios";
import LinkDialog from "./LinkDialog";
import { VideoDialog } from "./MediaToolbar";
import { TableGridPicker } from "./TableToolbar";

// ── Constants ────────────────────────────────────────────────────────────────
const HEADING_LEVELS = [
  { label: "Paragraph", value: 0 },
  { label: "Heading 1", value: 1 },
  { label: "Heading 2", value: 2 },
  { label: "Heading 3", value: 3 },
  { label: "Heading 4", value: 4 },
  { label: "Heading 5", value: 5 },
  { label: "Heading 6", value: 6 },
];

const HEADING_STYLES = {
  0: "font-normal text-on-surface-variant",
  1: "text-xl font-black text-on-surface",
  2: "text-lg font-bold text-on-surface",
  3: "text-base font-bold text-on-surface",
  4: "text-sm font-bold text-on-surface",
  5: "text-xs font-bold text-on-surface",
  6: "text-xs font-bold text-on-surface/60",
};

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Justify", value: "justify" },
];

const ALIGN_ICONS = {
  left: <AlignLeft size={13} />,
  center: <AlignCenter size={13} />,
  right: <AlignRight size={13} />,
  justify: <AlignJustify size={13} />,
};

// add to your imports at the top
const HIGHLIGHT_COLORS = [
  { label: "Yellow", color: "#FEF08A" },
  { label: "Green", color: "#BBF7D0" },
  { label: "Blue", color: "#BFDBFE" },
  { label: "Pink", color: "#FBCFE8" },
  { label: "Orange", color: "#FED7AA" },
  { label: "Purple", color: "#E9D5FF" },
  { label: "Red", color: "#FECACA" },
  { label: "None", color: null },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await API.post("/api/blogs/upload/inline", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const img = data.images?.[0];
  if (!img) throw new Error("Upload failed");
  return {
    url: img.url,
    publicId: img.publicId,
    size: img.size,
    order: img.order,
  };
}

// ── Toolbar button ───────────────────────────────────────────────────────────
const Btn = ({ onClick, active, children, title, disabled = false }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => {
      e.preventDefault();
      if (!disabled) onClick();
    }}
    className={`p-2 rounded-xl transition-all text-sm font-medium
      ${
        active
          ? "bg-primary text-white shadow-sm"
          : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
      }
      ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-primary/10 mx-0.5 shrink-0" />;

// ── EditorToolbar ────────────────────────────────────────────────────────────
const EditorToolbar = ({
  editor,
  images,
  onChange,
  onImagesChange,
  isPreview,
  setIsPreview,
}) => {
  const imageInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showHeadings, setShowHeadings] = useState(false);
  const [showAlign, setShowAlign] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        setShowHeadings(false);
        setShowAlign(false);
        setShowHighlight(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleImageUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      if (uploading) {
        toast.warning("Please wait for current upload to finish.");
        return;
      }
      setUploading(true);
      try {
        const accumulatedImages = [...(images || [])];
        for (const file of files) {
          if (!file.type.startsWith("image/")) {
            toast.error("Invalid image file");
            continue;
          }
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Each image must be under 5MB");
            continue;
          }
          const uploaded = await uploadImageToServer(file);
          editor
            .chain()
            .focus()
            .setImage({ src: uploaded.url, alt: file.name })
            .run();
          accumulatedImages.push({
            ...uploaded,
            order: accumulatedImages.length,
          });
        }
        onImagesChange(accumulatedImages);
        onChange(
          editor.isEmpty ? "" : editor.getHTML(),
          editor.isEmpty ? {} : editor.getJSON(),
        );
      } catch (err) {
        console.error(err);
        toast.error("Image upload failed");
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor, uploading, images, onChange, onImagesChange],
  );

  if (!editor) return null;

  // ── Derived state ──────────────────────────────────────────────────────────
  const isCode = editor.isActive("code");
  const inlineCodeBlocked =
    editor.isActive("bold") ||
    editor.isActive("italic") ||
    editor.isActive("underline") ||
    editor.isActive("strike") ||
    editor.isActive("blockquote") ||
    editor.isActive("codeBlock");

  const activeHeading =
    HEADING_LEVELS.find((h) =>
      h.value === 0
        ? !editor.isActive("heading")
        : editor.isActive("heading", { level: h.value }),
    ) ?? HEADING_LEVELS[0];

  const activeAlign =
    ALIGN_OPTIONS.find((a) => editor.isActive({ textAlign: a.value })) ??
    ALIGN_OPTIONS[0];

  const listActive =
    editor.isActive("bulletList") || editor.isActive("orderedList");

  // ── Handlers ───────────────────────────────────────────────────────────────
  const applyHeading = (level) => {
    setShowHeadings(false);
    if (level === 0) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level }).run();
  };

  const cycleList = () => {
    if (editor.isActive("bulletList")) {
      editor.chain().focus().toggleBulletList().toggleOrderedList().run();
    } else if (editor.isActive("orderedList")) {
      editor.chain().focus().toggleOrderedList().run();
    } else {
      editor.chain().focus().toggleBulletList().run();
    }
  };

  const listLabel = () => {
    if (editor.isActive("bulletList")) return "• List";
    if (editor.isActive("orderedList")) return "1. List";
    return <List size={15} />;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Sticky toolbar ── */}
      <div
        className="sticky top-0 z-30 flex flex-wrap items-center gap-0.5 p-2
                      bg-surface-low border-b border-primary/10
                      backdrop-blur-md"
      >
        {!isPreview && (
          <>
            {/* Heading dropdown */}
            <div className="relative" data-dropdown>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowHeadings((p) => !p);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                           text-on-surface-variant hover:bg-surface-high hover:text-on-surface
                           transition-all min-w-28 justify-between"
              >
                <span>{activeHeading.label}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showHeadings ? "rotate-180" : ""}`}
                />
              </button>
              {showHeadings && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 bg-surface-lowest border
                                border-primary/10 rounded-2xl shadow-xl overflow-hidden min-w-36"
                >
                  {HEADING_LEVELS.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyHeading(h.value);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-all hover:bg-surface-high
                        ${HEADING_STYLES[h.value]}
                        ${activeHeading.value === h.value ? "bg-primary/10 text-primary!" : ""}`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Sep />

            {/* Align dropdown */}
            <div className="relative" data-dropdown>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowAlign((p) => !p);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                           text-on-surface-variant hover:bg-surface-high hover:text-on-surface
                           transition-all justify-between"
              >
                {ALIGN_ICONS[activeAlign.value]}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showAlign ? "rotate-180" : ""}`}
                />
              </button>
              {showAlign && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 bg-surface-lowest border
                                border-primary/10 rounded-2xl shadow-xl overflow-hidden min-w-32"
                >
                  {ALIGN_OPTIONS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setTextAlign(a.value).run();
                        setShowAlign(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5
                                  transition-all hover:bg-surface-high text-on-surface-variant
                        ${activeAlign.value === a.value ? "bg-primary/10 text-primary!" : ""}`}
                    >
                      {ALIGN_ICONS[a.value]}
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Sep />
            {/* Highlight color picker */}
            <div className="relative" data-dropdown>
              <Btn
                onClick={() => setShowHighlight((p) => !p)}
                active={HIGHLIGHT_COLORS.filter((c) => c.color).some((c) =>
                  editor.isActive("highlight", { color: c.color }),
                )}
                title="Highlight"
              >
                <Highlighter size={15} />
              </Btn>

              {showHighlight && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 bg-surface-lowest border
                    border-primary/10 rounded-2xl shadow-xl p-2 flex flex-wrap gap-1.5 w-36"
                >
                  {HIGHLIGHT_COLORS.map(({ label, color }) =>
                    color ? (
                      <button
                        key={color}
                        type="button"
                        title={label}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          editor
                            .chain()
                            .focus()
                            .toggleHighlight({ color })
                            .run();
                          setShowHighlight(false);
                        }}
                        className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: editor.isActive("highlight", { color })
                            ? "#6366f1"
                            : "transparent",
                        }}
                      />
                    ) : (
                      <button
                        key="none"
                        type="button"
                        title="Remove highlight"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          editor.chain().focus().unsetHighlight().run();
                          setShowHighlight(false);
                        }}
                        className="w-7 h-7 rounded-lg border-2 border-dashed border-primary/30
                       flex items-center justify-center text-on-surface-variant
                       hover:border-primary transition-all text-[10px]"
                      >
                        ✕
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
            {/* Inline formats */}
            <Btn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              {" "}
              <Bold size={15} />{" "}
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              {" "}
              <Italic size={15} />{" "}
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Underline"
            >
              {" "}
              <Underline size={15} />{" "}
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              title="Strike"
            >
              {" "}
              <Strikethrough size={15} />{" "}
            </Btn>
            
            <Btn
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={isCode}
              title="Inline Code"
              disabled={inlineCodeBlocked}
            >
              {" "}
              <Code size={15} />{" "}
            </Btn>

            <Sep />

            {/* Block formats */}
            <Btn
              onClick={() => {
                if (editor.isActive("codeBlock") || isCode) return;
                editor.chain().focus().toggleBlockquote().run();
              }}
              active={editor.isActive("blockquote")}
              title="Blockquote"
              disabled={editor.isActive("codeBlock") || isCode}
            >
              <Quote size={15} />
            </Btn>
            <Btn
              onClick={() => {
                if (editor.isActive("blockquote") || isCode) return;
                editor.chain().focus().toggleCodeBlock().run();
              }}
              active={editor.isActive("codeBlock")}
              title="Code Block"
              disabled={editor.isActive("blockquote") || isCode}
            >
              <span className="font-mono text-[11px] font-bold px-0.5">
                {"</>"}
              </span>
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
            >
              <Minus size={15} />
            </Btn>

            <Sep />

            {/* List */}
            <button
              type="button"
              title="Cycle list type"
              onMouseDown={(e) => {
                e.preventDefault();
                cycleList();
              }}
              className={`px-3 py-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5
                ${
                  listActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
                }`}
            >
              {listLabel()}
            </button>

            <Sep />

            {/* Link */}
            <Btn
              onClick={() => setShowLink(true)}
              active={editor.isActive("link")}
              title="Insert Link"
            >
              <Link2 size={15} />
            </Btn>

            {/* Table — grid picker */}
            <div className="relative" data-dropdown>
              <Btn
                onClick={() => setShowTable((p) => !p)}
                active={editor.isActive("table")}
                title="Insert Table"
              >
                <Table size={15} />
              </Btn>
              {showTable && (
                <TableGridPicker
                  onSelect={(rows, cols) => {
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows, cols, withHeaderRow: true })
                      .run();
                    setShowTable(false);
                  }}
                  onClose={() => setShowTable(false)}
                />
              )}
            </div>

            {/* Image */}
            <button
              type="button"
              title="Insert Image"
              className="p-2 text-on-surface-variant hover:bg-surface-high hover:text-on-surface rounded-xl transition-all"
              onMouseDown={(e) => {
                e.preventDefault();
                imageInputRef.current?.click();
              }}
            >
              {uploading ? (
                <span className="text-[10px] text-primary font-bold px-1">
                  Uploading…
                </span>
              ) : (
                <Image size={15} />
              )}
            </button>
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              ref={imageInputRef}
              onChange={handleImageUpload}
            />

            {/* Video embed */}
            <Btn onClick={() => setShowVideo(true)} title="Embed Video">
              <Video size={15} />
            </Btn>
          </>
        )}
        

        {/* Edit / Preview pill — always visible */}
        <div className="ml-auto flex items-center border border-primary/10 rounded-xl overflow-hidden text-xs font-bold">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsPreview(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 transition-all
              ${!isPreview ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-high"}`}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsPreview(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 transition-all border-l border-primary/10
              ${isPreview ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-high"}`}
          >
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      {/* Link dialog — portal */}
      {showLink && (
        <LinkDialog editor={editor} onClose={() => setShowLink(false)} />
      )}

      {/* Video dialog — portal */}
      {showVideo && (
        <VideoDialog editor={editor} onClose={() => setShowVideo(false)} />
      )}
    </>
  );
};

export default EditorToolbar;
