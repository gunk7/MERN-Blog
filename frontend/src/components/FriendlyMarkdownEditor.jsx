import React, { useRef, useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
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
} from "lucide-react";
import { toast } from "react-toastify";
import API from "../services/axios";
import MarkdownRenderer from "./MarkdownRenderer";
import Highlight from "@tiptap/extension-highlight";

// ── Upload helper ────────────────────────────────────────────────────────────
/* async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await API.post("/blogs/upload/inline", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const img = data.images?.[0];
  if (!img) throw new Error("Upload failed");
  return {
    url: img.url,
    filename: img.filename,
    size: img.size,
    order: img.order,
  };
} */

async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await API.post("/blogs/upload/inline", formData, {
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

// ── Toolbar button ───────────────────────────────────────────────────────────
const Btn = ({ onClick, active, children, title, className = "" }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`p-2 rounded-xl transition-all text-sm font-medium
      ${
        active
          ? "bg-primary text-white shadow-sm"
          : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
      } ${className}`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-primary/10 mx-0.5 shrink-0" />;

// ── Main component ───────────────────────────────────────────────────────────
const FriendlyMarkdownEditor = ({
  value,
  title,
  images,
  onChange,
  onImagesChange,
  onEditorReady,
}) => {
  const imageInputRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showHeadings, setShowHeadings] = useState(false);
  const [showAlign, setShowAlign] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "Start writing your story…" }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(
        editor.isEmpty ? "" : editor.getHTML(),
        editor.isEmpty ? {} : editor.getJSON(),
      );
    },
    onSelectionUpdate({ editor }) {
      // If cursor enters a codeBlock → remove inline code & unset blockquote
      if (editor.isActive("codeBlock")) {
        if (editor.isActive("code")) editor.chain().unsetCode().run();
      }

      // If cursor enters a blockquote → remove inline code
      if (editor.isActive("blockquote")) {
        if (editor.isActive("code")) editor.chain().unsetCode().run();
      }

      // If cursor enters inline code → remove blockquote & codeBlock
      if (editor.isActive("code")) {
        if (editor.isActive("blockquote"))
          editor.chain().focus().toggleBlockquote().run();
        if (editor.isActive("codeBlock"))
          editor.chain().focus().toggleCodeBlock().run();
      }
    },
  });
  const activeAlign =
    ALIGN_OPTIONS.find((a) => editor?.isActive({ textAlign: a.value })) ??
    ALIGN_OPTIONS[0];

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const formikHtml = value || "";
    if (currentHtml !== formikHtml)
      editor.commands.setContent(formikHtml, false);
  }, [editor, value]);

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("[data-dropdown]")) {
        setShowHeadings(false);
        setShowAlign(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  {
    /* ── Inline code — blocked by blockquote or codeBlock ── */
  }
  const isCode = editor.isActive("code");
  const inlineCodeBlocked =
    editor.isActive("bold") ||
    editor.isActive("italic") ||
    editor.isActive("underline") ||
    editor.isActive("strike") ||
    editor.isActive("blockquote") ||
    editor.isActive("codeBlock");

  // ── Active heading ───────────────────────────────────────────────────────
  const activeHeading =
    HEADING_LEVELS.find((h) =>
      h.value === 0
        ? !editor?.isActive("heading")
        : editor?.isActive("heading", { level: h.value }),
    ) ?? HEADING_LEVELS[0];

  const applyHeading = (level) => {
    setShowHeadings(false);
    if (level === 0) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level }).run();
  };

  // ── List cycling ─────────────────────────────────────────────────────────
  const cycleList = () => {
    if (!editor) return;
    if (editor.isActive("bulletList")) {
      editor.chain().focus().toggleBulletList().toggleOrderedList().run();
    } else if (editor.isActive("orderedList")) {
      editor.chain().focus().toggleOrderedList().run();
    } else {
      editor.chain().focus().toggleBulletList().run();
    }
  };

  const listLabel = () => {
    if (!editor) return <List size={15} />;
    if (editor.isActive("bulletList")) return "• List";
    if (editor.isActive("orderedList")) return "1. List";
    return <List size={15} />;
  };

  const listActive =
    editor?.isActive("bulletList") || editor?.isActive("orderedList");

  // ── Image upload ─────────────────────────────────────────────────────────
  /*  const handleImageUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length || !editor) return;
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
          const base = import.meta.env.VITE_API_IMG_URL.replace(/\/$/, "");
          const path = uploaded.url.replace(/^\//, "");
          editor
            .chain()
            .focus()
            .setImage({ src: `${base}/${path}`, alt: file.name })
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
      } catch {
        toast.error("Image upload failed");
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor, uploading, images, onChange, onImagesChange],
  ); */

  // ── Image upload handler (cloudinary)─────────────────────────────────────────────────────
  const handleImageUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length || !editor) return;
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

          // ← Before: had to prepend VITE_API_IMG_URL
          // ← After: uploaded.url is already the full Cloudinary URL
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
      } catch {
        toast.error("Image upload failed");
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [editor, uploading, images, onChange, onImagesChange],
  );
  // ── Link handler ─────────────────────────────────────────────────────────
  const handleLink = () => {
    const url = prompt("Enter URL");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-primary/10 rounded-2xl bg-surface-lowest overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-surface-low border-b border-primary/10">
        {/* Toolbar items hidden in preview */}
        {!isPreview && (
          <>
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
                        ${activeHeading.value === h.value ? "bg-primary/10 text-primary!" : ""}
                      `}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Sep />

            {/* ── Align dropdown ── */}
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
                        ${activeAlign.value === a.value ? "bg-primary/10 text-primary!" : ""}
                      `}
                    >
                      {ALIGN_ICONS[a.value]}
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Sep />

            {/* ── Inline formats ── */}
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
              <Strikethrough size={15} />
            </Btn>
            <Btn
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={isCode}
              title="Inline Code"
              className={
                inlineCodeBlocked ? "opacity-30 cursor-not-allowed" : ""
              }
              disabled={inlineCodeBlocked}
            >
              <Code size={15} />
            </Btn>

            <Sep />

            {/* ── Block formats ── */}
            <Btn
              onClick={() => {
                if (editor.isActive("codeBlock") || isCode) return;
                editor.chain().focus().toggleBlockquote().run();
              }}
              active={editor.isActive("blockquote")}
              title="Blockquote"
              className={
                editor.isActive("codeBlock") || isCode
                  ? "opacity-30 cursor-not-allowed"
                  : ""
              }
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
              className={
                editor.isActive("blockquote") || isCode
                  ? "opacity-30 cursor-not-allowed"
                  : ""
              }
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

            {/* ── List ── */}
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

            {/* ── Link + Image ── */}
            <Btn
              onClick={handleLink}
              active={editor.isActive("link")}
              title="Insert Link"
            >
              <Link2 size={15} />
            </Btn>

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
          </>
        )}

        {/* ── Edit / Preview pill — always visible, pushed right ── */}
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

      {/* ── Content area ── */}
      <div className="min-h-100 p-6 md:p-10 w-full">
        {isPreview ? (
          <MarkdownRenderer
            content={editor.getHTML()}
            format="html"
            variant="editor"
          />
        ) : (
          <div onClick={() => editor.commands.focus()}>
            <EditorContent
              editor={editor}
              className="
    w-full
    [&_.tiptap]:outline-none
    [&_.tiptap]:border-none

    /* Typography */
    [&_.tiptap]:text-on-surface
    [&_.tiptap]:leading-7
    [&_.tiptap]:text-[15px]

    /* Paragraphs */
    [&_.tiptap_p]:mb-4

    /* Headings */
    [&_.tiptap_h1]:text-4xl
    [&_.tiptap_h1]:font-black
    [&_.tiptap_h1]:mb-6
    [&_.tiptap_h1]:mt-8

    [&_.tiptap_h2]:text-3xl
    [&_.tiptap_h2]:font-bold
    [&_.tiptap_h2]:mb-5
    [&_.tiptap_h2]:mt-7

    [&_.tiptap_h3]:text-2xl
    [&_.tiptap_h3]:font-bold
    [&_.tiptap_h3]:mb-4
    [&_.tiptap_h3]:mt-6

    /* Lists */
    [&_.tiptap_ul]:list-disc
    [&_.tiptap_ul]:pl-6
    [&_.tiptap_ul]:mb-4

    [&_.tiptap_ol]:list-decimal
    [&_.tiptap_ol]:pl-6
    [&_.tiptap_ol]:mb-4

    [&_.tiptap_li]:mb-1

    /* Blockquote */
    [&_.tiptap_blockquote]:border-l-4
    [&_.tiptap_blockquote]:border-primary
    [&_.tiptap_blockquote]:pl-4
    [&_.tiptap_blockquote]:italic
    [&_.tiptap_blockquote]:my-5
    [&_.tiptap_blockquote]:text-on-surface-variant

    /* Inline code */
    [&_.tiptap_code]:bg-surface-high
    [&_.tiptap_code]:px-1.5
    [&_.tiptap_code]:py-0.5
    [&_.tiptap_code]:rounded-md
    [&_.tiptap_code]:text-sm
    [&_.tiptap_code]:font-mono

    /* Code block */
    [&_.tiptap_pre]:bg-black
    [&_.tiptap_pre]:text-white
    [&_.tiptap_pre]:p-4
    [&_.tiptap_pre]:rounded-xl
    [&_.tiptap_pre]:overflow-x-auto
    [&_.tiptap_pre]:my-5

    /* Images */
    [&_.tiptap_img]:rounded-2xl
    [&_.tiptap_img]:my-6
    [&_.tiptap_img]:max-w-full

    /* Links */
    [&_.tiptap_a]:text-primary
    [&_.tiptap_a]:underline

    /* HR */
    [&_.tiptap_hr]:my-8
    [&_.tiptap_hr]:border-primary/10
  "
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendlyMarkdownEditor;
