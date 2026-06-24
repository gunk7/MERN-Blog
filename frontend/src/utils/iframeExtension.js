import { Node, mergeAttributes } from "@tiptap/core";

// ── Helper: convert a YouTube URL into an embeddable iframe src ─────────────
export function getEmbedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    // YouTube — youtube.com/watch?v=ID or youtu.be/ID
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      // youtube.com/shorts/ID
      const shortsMatch = url.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.replace("/", "");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  } catch {
    return null;
  }
}

// ── Iframe Node ────────────────────────────────────────────────────────────
const Iframe = Node.create({
  name: "iframe",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "Embedded video" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-video-embed] iframe" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-video-embed": "true", class: "video-embed-wrapper" },
      [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setIframe:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

export default Iframe;