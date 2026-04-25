const slugify = require("slugify");

const generateUniqueSlug = (title, id) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  const shortId = id.toString().slice(-12);

  return `${baseSlug}-${shortId}`;
};

module.exports = { generateUniqueSlug };
