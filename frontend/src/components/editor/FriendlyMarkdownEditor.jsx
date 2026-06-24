import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import UnderlineExtension from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import Iframe from "../../utils/iframeExtension";
import MarkdownRenderer from "../MarkdownRenderer";
import EditorToolbar from "./EditorToolbar";
import FloatingBubble from "./FloatingBubble";
import TableToolbar from "./TableToolbar";
import { MediaToolbar } from "./MediaToolbar";
import TableOfContents from "./TableOfContents";
import { injectHeadingIds, extractHeadings } from "../../utils/content";
import HtmlRenderer from "./HtmlRenderer";
import DocImporter from "./DocImporter";

const FriendlyMarkdownEditor = ({
  value,
  images,
  onChange,
  onImagesChange,
  onEditorReady,
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const contentWrapperRef = useRef(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Iframe,
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
      if (editor.isActive("codeBlock")) {
        if (editor.isActive("code")) editor.chain().unsetCode().run();
      }
      if (editor.isActive("blockquote")) {
        if (editor.isActive("code")) editor.chain().unsetCode().run();
      }
      if (editor.isActive("code")) {
        if (editor.isActive("blockquote"))
          editor.chain().focus().toggleBlockquote().run();
        if (editor.isActive("codeBlock"))
          editor.chain().focus().toggleCodeBlock().run();
      }
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  // Sync external value changes into editor
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const formikHtml = value || "";
    if (currentHtml !== formikHtml)
      editor.commands.setContent(formikHtml, false);
  }, [editor, value]);

  const previewRef = useRef(null);

  if (!editor) return null;

  // Build preview HTML with injected heading ids
  const rawHtml = editor.getHTML();
  const headings = isPreview ? extractHeadings(rawHtml) : [];
  return (
    <div className="border border-primary/10 rounded-2xl bg-surface-lowest">
      {/* Sticky toolbar */}
      <EditorToolbar
        editor={editor}
        images={images}
        onChange={onChange}
        onImagesChange={onImagesChange}
        isPreview={isPreview}
        setIsPreview={setIsPreview}
      />

      {/* Floating bubble — inline formatting on selection */}
      <FloatingBubble editor={editor} />

      {/* Content area */}
      <div
        ref={contentWrapperRef}
        className="relative min-h-100 p-6 md:p-10 w-full"
      >
        <TableToolbar editor={editor} containerRef={contentWrapperRef} />
        {/* Image contextual toolbar — appears when an image is selected */}
        <MediaToolbar editor={editor} />
        {isPreview ? (
          <div className="flex gap-8">
            <TableOfContents headings={headings} />
            <div className="flex-1 min-w-0">
              <HtmlRenderer
                content={rawHtml}
                className="/* your editor prose styles */"
              />
            </div>
          </div>
        ) : (
          <div onClick={() => editor.commands.focus()}>
            <EditorContent
              editor={editor}
              className="
                w-full
                [&_.tiptap]:outline-none
                [&_.tiptap]:border-none

                [&_.tiptap]:text-on-surface
                [&_.tiptap]:leading-7
                [&_.tiptap]:text-[15px]

                [&_.tiptap_p]:mb-4

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

                [&_.tiptap_ul]:list-disc
                [&_.tiptap_ul]:pl-6
                [&_.tiptap_ul]:mb-4

                [&_.tiptap_ol]:list-decimal
                [&_.tiptap_ol]:pl-6
                [&_.tiptap_ol]:mb-4

                [&_.tiptap_li]:mb-1

                [&_.tiptap_blockquote]:border-l-4
                [&_.tiptap_blockquote]:border-primary
                [&_.tiptap_blockquote]:pl-4
                [&_.tiptap_blockquote]:italic
                [&_.tiptap_blockquote]:my-5
                [&_.tiptap_blockquote]:text-on-surface-variant

                [&_.tiptap_code]:bg-surface-high
                [&_.tiptap_code]:px-1.5
                [&_.tiptap_code]:py-0.5
                [&_.tiptap_code]:rounded-md
                [&_.tiptap_code]:text-sm
                [&_.tiptap_code]:font-mono

                [&_.tiptap_pre]:bg-black
                [&_.tiptap_pre]:text-white
                [&_.tiptap_pre]:p-4
                [&_.tiptap_pre]:rounded-xl
                [&_.tiptap_pre]:overflow-x-auto
                [&_.tiptap_pre]:my-5

                [&_.tiptap_img]:rounded-2xl
                [&_.tiptap_img]:my-6
                [&_.tiptap_img]:max-w-full

                [&_.tiptap_a]:text-primary
                [&_.tiptap_a]:underline

                [&_.tiptap_hr]:my-8
                [&_.tiptap_hr]:border-primary/10

               [&_.tiptap_table]:w-full
[&_.tiptap_table]:border-collapse
[&_.tiptap_table]:my-6
[&_.tiptap_table]:rounded-xl
[&_.tiptap_table]:overflow-hidden

                [&_.tiptap_th]:bg-primary/10
                [&_.tiptap_th]:text-on-surface
                [&_.tiptap_th]:font-bold
                [&_.tiptap_th]:text-sm
                [&_.tiptap_th]:px-4
                [&_.tiptap_th]:py-2.5
                [&_.tiptap_th]:border
                [&_.tiptap_th]:border-primary/10
                [&_.tiptap_th]:text-left

                [&_.tiptap_td]:px-4
                [&_.tiptap_td]:py-2.5
                [&_.tiptap_td]:border
                [&_.tiptap_td]:border-primary/10
                [&_.tiptap_td]:text-sm
                [&_.tiptap_td]:text-on-surface

                [&_.tiptap_tr:nth-child(even)_td]:bg-surface-low

                [&_.tiptap_.selectedCell]:bg-primary/10

                [&_.video-embed-wrapper]:relative
                [&_.video-embed-wrapper]:w-full
                [&_.video-embed-wrapper]:my-6
                [&_.video-embed-wrapper]:rounded-2xl
                [&_.video-embed-wrapper]:overflow-hidden
                [&_.video-embed-wrapper]:aspect-video
                [&_.video-embed-wrapper_iframe]:absolute
                [&_.video-embed-wrapper_iframe]:inset-0
                [&_.video-embed-wrapper_iframe]:w-full
                [&_.video-embed-wrapper_iframe]:h-full
                [&_.video-embed-wrapper_iframe]:border-0

[&_.tiptap_img.is-selected-image]:outline-2
[&_.tiptap_img.is-selected-image]:outline-purple-500
[&_.tiptap_img.is-selected-image]:outline-offset-2

                /* Update your className template inside FriendlyMarkdownEditor.jsx */

/* Add this rule to catch focus/editing events */
[&_.tiptap_table:has(.selectedCell)]:ring-2
[&_.tiptap_table:has(.selectedCell)]:ring-purple-500/80
[&_.tiptap_table:has(.selectedCell)]:ring-offset-2
              "
            />

            {editor.isEmpty && (
              <div className="flex flex-col items-center gap-2 py-8 pointer-events-none">
                <div className="pointer-events-auto">
                  <DocImporter
                    editor={editor}
                    onImagesChange={onImagesChange}
                  />
                </div>
                <p className="text-xs text-on-surface-variant/50">
                  Import content from a Word document
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendlyMarkdownEditor;
