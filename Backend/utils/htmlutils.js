/**
 * Strips HTML tags down to plain text.
 * Quick and good enough — we don't need perfect text extraction here,
 * just enough that tag soup doesn't confuse a classifier.
 */
function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = { stripHtml };