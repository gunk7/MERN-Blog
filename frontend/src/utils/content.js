// rehype-slug uses the `github-slugger` algorithm internally.
// Mirror it here so TOC ids match what rehype-slug stamps on the DOM.
import GithubSlugger from "github-slugger";

export function extractHeadings(html) {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headingEls = doc.querySelectorAll("h1, h2, h3");
  const slugger = new GithubSlugger();
  const headings = [];

  headingEls.forEach((el) => {
    const text = el.textContent || "";
    const id = slugger.slug(text); // same algorithm rehype-slug uses
    headings.push({ id, text, level: Number(el.tagName.replace("H", "")) });
  });

  return headings;
}

// ── Slug generator ────────────────────────────────────────────────────────
function slugify(text, usedSlugs = new Set()) {
  let base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!base) base = "section";

  let slug = base;
  let i = 1;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  usedSlugs.add(slug);
  return slug;
}

// ── Extract headings from rendered HTML + inject ids ────────────────────────
// Takes a raw HTML string (from editor.getHTML() or stored blog content),
// returns { html: <string with id attrs added>, headings: [{ id, text, level }] }
export function injectHeadingIds(html) {
  if (!html) return { html: html || "", headings: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headingEls = doc.querySelectorAll("h1, h2, h3");

  const usedSlugs = new Set();
  const headings = [];

  headingEls.forEach((el) => {
    const text = el.textContent || "";
    const id = slugify(text, usedSlugs);
    el.setAttribute("id", id);
    headings.push({
      id,
      text,
      level: Number(el.tagName.replace("H", "")),
    });
  });

  return { html: doc.body.innerHTML, headings };
}