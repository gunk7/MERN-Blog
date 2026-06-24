// src/components/editor/DocImporter.jsx
import { useRef, useState } from "react";
import mammoth from "mammoth";
import API from "../../services/axios";

export default function DocImporter({ editor, onImagesChange }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const uploadBase64Image = async (b64, contentType) => {
    const byteStr = atob(b64);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const blob = new Blob([arr], { type: contentType });
    const ext = contentType.split("/")[1] || "png";
    const file = new File([blob], `import-${Date.now()}.${ext}`, {
      type: contentType,
    });

    const form = new FormData(); // ← named "form"
    form.append("image", file);

    const { data } = await API.post("/api/blogs/upload/inline", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const img = data.images?.[0];
    if (!img) throw new Error("Upload failed");
    return img.url;
  };

  const handleFile = async (file) => {
    if (!file || !editor) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["docx", "doc"].includes(ext)) {
      alert("Please upload a .docx or .doc file.");
      return;
    }

    setLoading(true);
    setProgress("Parsing document…");

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Collect images as base64 during conversion
      const imageMap = {}; // originalSrc → uploadedUrl
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: ["u => u", "strike => s"],
          convertImage: mammoth.images.imgElement(async (img) => {
            const b64 = await img.read("base64");
            // Placeholder src — we'll swap after upload
            const tempSrc = `data:${img.contentType};base64,${b64}`;
            imageMap[tempSrc] = { b64, contentType: img.contentType };
            return { src: tempSrc };
          }),
        },
      );

      // Upload each image and build a swap map
      const srcs = Object.keys(imageMap);
      const uploadedUrls = {};
      for (let i = 0; i < srcs.length; i++) {
        setProgress(`Uploading image ${i + 1} of ${srcs.length}…`);
        const { b64, contentType } = imageMap[srcs[i]];
        try {
          uploadedUrls[srcs[i]] = await uploadBase64Image(b64, contentType);
        } catch {
          // If upload fails, skip the image gracefully
          uploadedUrls[srcs[i]] = null;
        }
      }

      // Swap base64 srcs for real URLs in the HTML
      let html = result.value;
      for (const [tempSrc, realUrl] of Object.entries(uploadedUrls)) {
        if (realUrl) {
          // escape for regex
          html = html.split(`src="${tempSrc}"`).join(`src="${realUrl}"`);
          // notify parent image tracker
          if (onImagesChange) {
            onImagesChange((prev) => ({
              ...prev,
              [realUrl]: { url: realUrl, uploaded: true },
            }));
          }
        } else {
          // Remove <img> tags whose upload failed
          html = html.replace(/<img[^>]*src="[^"]*"[^>]*>/g, "");
        }
      }

      setProgress("Loading into editor…");
      editor.commands.setContent(html, true);
      editor.commands.focus("end");
    } catch (err) {
      console.error("Doc import failed:", err);
      alert(
        "Could not parse the document. Please make sure it's a valid .docx file.",
      );
    } finally {
      setLoading(false);
      setProgress("");
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.doc"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <button
        type="button"
        onClick={() => !loading && inputRef.current.click()}
        disabled={loading || !editor}
        title={loading ? progress : "Import from Word document"}
        className="
          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
          border border-primary/20 text-on-surface
          hover:bg-surface-low disabled:opacity-40
          transition-colors whitespace-nowrap
        "
      >
        {loading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="32"
                strokeDashoffset="12"
              />
            </svg>
            <span className="max-w-32 truncate">{progress}</span>
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Import .docx
          </>
        )}
      </button>
    </>
  );
}
