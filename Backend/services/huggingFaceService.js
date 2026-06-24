const { InferenceClient } = require("@huggingface/inference");
const { stripHtml } = require("../utils/htmlutils");

const HF_MODEL = "unitary/toxic-bert";

// Threshold above which a category counts as "flagged".
// Starting point — tune after seeing real scores from your own blogs.
const FLAG_THRESHOLD = 0.5;

// Anything scoring above this on these specific categories is severe
// enough to auto-block rather than just send to review.
const BLOCK_THRESHOLD = 0.85;
const SEVERE_CATEGORIES = ["threat", "identity_hate", "severe_toxic"];

// toxic-bert's hard ceiling is 512 tokens. Character count isn't a
// reliable proxy for token count, so we stay well under the ceiling
// to leave margin for dense text (we've seen 2000 chars overflow
// on real content before).
const CHUNK_SIZE = 1200;

const client = new InferenceClient(process.env.HF_API_TOKEN);

/**
 * Calls Hugging Face's text-classification task via the official client.
 * The client handles routing to whichever provider currently serves
 * this model, so we're not hardcoding a URL that can be deprecated
 * out from under us again.
 *
 * Cold-start note: a model not recently used may take 10-20s to spin
 * up on first call. The client retries internally on a 503, but we
 * add one manual retry as a safety net.
 */
async function callHuggingFace(text) {
  try {
    return await client.textClassification({
      model: HF_MODEL,
      inputs: text,
    });
  } catch (err) {
    if (err.message?.includes("503") || err.message?.includes("loading")) {
      await new Promise((r) => setTimeout(r, 15000));
      return client.textClassification({ model: HF_MODEL, inputs: text });
    }
    throw err;
  }
}

/**
 * Splits text into chunks no longer than CHUNK_SIZE characters,
 * breaking on whitespace where possible so we don't cut words in half.
 */
function chunkText(text, chunkSize = CHUNK_SIZE) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastSpace > start) end = lastSpace;
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(Boolean);
}

/**
 * Runs toxic-bert against a single chunk, returning its raw scores.
 */
async function classifyChunk(chunk) {
  const scores = await callHuggingFace(chunk);
  // Response shape from the official client: [{label, score}, {label, score}, ...]
  return scores;
}

/**
 * Runs a blog's full content through toxic-bert, chunking as needed
 * so long posts get fully analyzed instead of only their first
 * ~1200 characters. Combines results across chunks:
 *   - moderationScores: the MAX score per label across all chunks
 *     (one bad paragraph shouldn't get diluted by nine clean ones)
 *   - flags: union of every label that crossed the threshold in
 *     ANY chunk
 *
 * @param {{ title: string, contentHtml: string }} blog
 */
async function runModeration({ title = "", contentHtml = "" }) {
  const plainText = `${title}\n\n${stripHtml(contentHtml)}`;
  const chunks = chunkText(plainText);

  // Run chunks sequentially rather than in parallel — keeps us
  // gentle on Hugging Face's free-tier rate limits, same reasoning
  // as the delay between blogs in the backfill script.
  const moderationScores = {};
  for (const chunk of chunks) {
    const scores = await classifyChunk(chunk);
    scores.forEach(({ label, score }) => {
      if (!(label in moderationScores) || score > moderationScores[label]) {
        moderationScores[label] = score;
      }
    });
  }

  const flags = Object.entries(moderationScores)
    .filter(([, score]) => score >= FLAG_THRESHOLD)
    .map(([label]) => label);

  let moderationStatus = "clear";
  if (flags.length > 0) {
    moderationStatus = "review";
  }

  const hasSevereFlag = Object.entries(moderationScores).some(
    ([label, score]) =>
      SEVERE_CATEGORIES.includes(label) && score >= BLOCK_THRESHOLD,
  );
  if (hasSevereFlag) {
    moderationStatus = "blocked";
  }

  return { moderationStatus, flags, moderationScores };
}

module.exports = { runModeration };
