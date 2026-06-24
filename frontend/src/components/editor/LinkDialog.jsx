import React, { useState } from "react";
import { toast } from "react-toastify";

const LinkDialog = ({ editor, onClose }) => {
  const existing = editor.getAttributes("link");

  const [url, setUrl] = useState(existing.href || "");
  const [nofollow, setNofollow] = useState(
    existing.rel?.includes("nofollow") || false,
  );
  const [sponsored, setSponsored] = useState(
    existing.rel?.includes("sponsored") || false,
  );
  const [openInNewTab, setOpenInNewTab] = useState(
    existing.target ? existing.target === "_blank" : true,
  );

  const apply = () => {
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    const rel = ["noopener", nofollow && "nofollow", sponsored && "sponsored"]
      .filter(Boolean)
      .join(" ");
    const target = openInNewTab ? "_blank" : null;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      editor.chain().focus().setLink({ href: url, target, rel }).run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: url,
          marks: [{ type: "link", attrs: { href: url, target, rel } }],
        })
        .run();
    }

    onClose();
  };

  const remove = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  const isExistingLink = editor.isActive("link");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-surface-lowest border border-primary/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-sm font-bold text-on-surface mb-4">
          {isExistingLink ? "Edit Link" : "Insert Link"}
        </h3>

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="https://example.com"
          autoFocus
          className="w-full px-3 py-2 rounded-xl border border-primary/10 bg-surface-low
                     text-sm text-on-surface placeholder:text-on-surface-variant/50
                     focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
        />

        {/* rel + behavior checkboxes */}
        <div className="flex flex-col gap-2.5 mb-5">
          <label className="flex items-center gap-2.5 text-sm text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            Open in new tab
          </label>
          <label className="flex items-center gap-2.5 text-sm text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={nofollow}
              onChange={(e) => setNofollow(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            nofollow
          </label>
          <label className="flex items-center gap-2.5 text-sm text-on-surface-variant cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sponsored}
              onChange={(e) => setSponsored(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            sponsored
          </label>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={apply}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold
                       hover:bg-primary/90 transition-all"
          >
            {isExistingLink ? "Update" : "Insert"}
          </button>

          {isExistingLink && (
            <button
              type="button"
              onClick={remove}
              className="px-4 py-2 rounded-xl border border-red-400/30 text-sm
                         text-red-400 hover:bg-red-400/10 transition-all"
            >
              Remove
            </button>
          )}

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

export default LinkDialog;
