import React, { useState, useEffect } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { ImageIcon, Check } from "lucide-react";
import { toast } from "react-toastify";
import { getEmbedUrl } from "../../utils/iframeExtension";

// ── Helper — reliably finds the <img> DOM node by editor position ─────────────
const getImgDOM = (editor, pos) => {
  if (pos == null) return null;
  try {
    const dom = editor.view.nodeDOM(pos);
    if (!dom) {
      return (
        editor.view.dom.querySelector("img.ProseMirror-selectednode") ?? null
      );
    }
    if (dom.nodeName === "IMG") return dom;
    const found = dom.querySelector?.("img");
    if (found) return found;
    return (
      editor.view.dom.querySelector("img.ProseMirror-selectednode") ?? null
    );
  } catch {
    return (
      editor.view.dom.querySelector("img.ProseMirror-selectednode") ?? null
    );
  }
};

// ── Inner editable bubble ─────────────────────────────────────────────────────
const AltTextEditor = ({ editor, pos, alt }) => {
  const [altText, setAltText] = useState(alt || "");

  // Add highlight on mount, remove on unmount
  useEffect(() => {
    const img = getImgDOM(editor, pos);
    if (!img) return;
    img.classList.add("img-highlight");
    return () => img.classList.remove("img-highlight");
  }, [pos, editor]);

  // Re-apply highlight while typing
  useEffect(() => {
    const img = getImgDOM(editor, pos);
    if (!img) return;
    img.classList.add("img-highlight");
  }, [altText, editor, pos]);

  const applyAlt = () => {
    editor.chain().focus().updateAttributes("image", { alt: altText }).run();
    editor.commands.setTextSelection(editor.state.selection.from + 1);
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2
                 bg-gray-900/95 backdrop-blur-md border border-white/10
                 rounded-xl shadow-2xl"
    >
      <ImageIcon size={14} className="text-white/50 shrink-0" />
      <input
        type="text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && applyAlt()}
        placeholder="Describe this image…"
        className="w-56 px-2 py-1 rounded-lg bg-white/10 text-white text-xs
                   placeholder:text-white/30 border border-white/10
                   focus:outline-none focus:border-white/30"
      />
      <button
        type="button"
        title="Save alt text"
        onMouseDown={(e) => {
          e.preventDefault();
          applyAlt();
        }}
        className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all"
      >
        <Check size={14} />
      </button>
    </div>
  );
};

// ── Image bubble — shows when an image is selected ────────────────────────────
export const MediaToolbar = ({ editor }) => {
  const [imgPos, setImgPos] = useState(null);
  const [imgAlt, setImgAlt] = useState("");

  if (!editor) return null;

  const shouldShow = ({ state }) => {
    const { selection } = state;
    const node = selection.node;
    if (node?.type?.name === "image") {
      setImgPos(selection.from);
      setImgAlt(node.attrs.alt ?? "");
      return true;
    }
    setImgPos(null);
    setImgAlt("");
    return false;
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{ placement: "bottom", offset: 8 }}
    >
      <AltTextEditor key={imgPos} editor={editor} pos={imgPos} alt={imgAlt} />
    </BubbleMenu>
  );
};

// ── Video embed dialog ────────────────────────────────────────────────────────
export const VideoDialog = ({ editor, onClose }) => {
  const [url, setUrl] = useState("");

  const apply = () => {
    if (!url) return;
    const embedUrl = getEmbedUrl(url.trim());
    if (!embedUrl) {
      toast.error("Enter a valid YouTube URL");
      return;
    }
    editor
      .chain()
      .focus()
      .setIframe({ src: embedUrl, title: "Embedded video" })
      .run();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-surface-lowest border border-primary/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-sm font-bold text-on-surface mb-4">Embed Video</h3>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="https://youtube.com/watch?v=…"
          autoFocus
          className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-surface-low
                     text-sm text-on-surface placeholder:text-on-surface-variant/50
                     focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
        />
        <p className="text-xs text-on-surface-variant/50 mb-5">
          Supports YouTube links only.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={apply}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold
                       hover:bg-primary/90 transition-all"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-primary/10 text-sm
                       text-on-surface-variant hover:bg-surface-high transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaToolbar;
