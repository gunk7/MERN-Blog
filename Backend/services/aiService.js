const {
  generateResponse,
  generateStreamingResponse,
  model,
} = require("./geminiService");
const { CATEGORIES } = require("../models/blogModel");

// ── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = ["improve", "rephrase", "tone"];
const ALLOWED_TONES = [
  "formal",
  "casual",
  "confident",
  "friendly",
  "professional",
];

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildChatPrompt(message) {
  return `
You are a warm, friendly support assistant for "Wavelog" — a general multi-topic blog 
covering: ${CATEGORIES.join(", ")}.

YOUR PERSONALITY:
- Friendly, conversational, and welcoming — like a helpful friend, not a robot
- Use casual but respectful language
- Keep responses concise (2-4 sentences unless more is needed)
- Use light emojis where natural 😊

WHAT YOU CAN HELP WITH:
- General conversation and casual chat
- Telling readers about Wavelog and what kind of content it covers
- Helping readers find topics or types of posts they might enjoy
- Answering general knowledge questions in a helpful way
- Encouraging readers to explore the blog

WHAT TO AVOID:
- Never make up specific post titles, URLs, or author names
- Don't go into deeply technical topics unrelated to the blog
- If asked something very niche or harmful, politely redirect

Reader's message: "${message}"
  `.trim();
}

function buildWritingPrompt(text, action, tone) {
  const base = `
You are a writing assistant for "Wavelog", a blogging platform.
RULES:
- Return ONLY the rewritten text, nothing else
- No explanations, no preamble, no quotes around the result
- Preserve markdown formatting if present
- Do not change the meaning of the text
  `.trim();

  if (action === "improve")
    return `${base}\n\nImprove the clarity, grammar, and flow of this text:\n\n${text}`;
  if (action === "rephrase")
    return `${base}\n\nRephrase this text in a fresh way without changing the meaning:\n\n${text}`;
  if (action === "tone")
    return `${base}\n\nRewrite this text in a ${tone} tone:\n\n${text}`;
}

function buildTagsPrompt(text) {
  return `
You are a blog tagging assistant for "Wavelog", a blogging platform.
Read the blog post below and generate relevant tags for it.

RULES:
- Return ONLY a JSON array of strings, nothing else
- No explanation, no markdown, no backticks, no preamble
- 5 to 10 tags maximum
- Tags must be lowercase, short (1-3 words), hyphenated if multi-word (e.g. "machine-learning")
- Focus on the main topics, themes, and keywords of the post
- Do not include generic tags like "blog", "post", "article"

Blog post:
"""
${text}
"""
  `.trim();
}

function buildSummaryPrompt(text, isSelection) {
  const target = isSelection ? "selected passage" : "blog post";

  return `
You are an AI summarization assistant for "Wavelog", a modern blogging platform.

Your task is to generate a visually engaging bullet-point summary of the ${target} below.

GUIDELINES:
- Create concise but meaningful bullet points
- Keep most bullets to 1 sentence only
- Important or complex ideas may use up to 2 short sentences maximum
- Expand points only when necessary for clarity
- Focus on:
  - key insights
  - technical concepts
  - arguments
  - examples
  - conclusions
- Avoid filler or generic wording
- Make the summary feel sharp, readable, and modern
- Avoid repeating ideas
- Do NOT use headings or numbering
- Do NOT start with phrases like:
  - "This article discusses"
  - "The post explains"
  - "In summary"

FORMATTING RULES:
- Return ONLY bullet points
- Every point MUST start with: •
- Highlight important terms naturally using:
  - **bold** for key concepts
  - *italic* for emphasis or nuanced ideas
- Use formatting sparingly and meaningfully
- Generate 3-8 bullet points dynamically based on content depth
- Keep bullets compact and scannable

GOOD OUTPUT STYLE EXAMPLE:
• **Database indexing** performance depends heavily on insertion order, with random UUIDs causing fragmentation and slower writes.

• *Cache stampedes* can overwhelm databases after expiration events, making probabilistic early refresh strategies important at scale.

• **Idempotency keys** prevent duplicate financial transactions when clients retry failed requests across unstable networks.

${isSelection ? "Selected passage" : "Blog post"}:
"""
${text}
"""
  `.trim();
}

// ── Service functions ────────────────────────────────────────────────────────

// In your aiService.js
async function chat(message, history = []) {
  const formattedPrompt = buildChatPrompt(message);
  return await generateStreamingResponse(formattedPrompt, history);
}

async function writingAssist({ text, action, tone }) {
  if (!ALLOWED_ACTIONS.includes(action))
    throw new Error(
      `Invalid action. Must be one of: ${ALLOWED_ACTIONS.join(", ")}`,
    );
  if (action === "tone" && !ALLOWED_TONES.includes(tone))
    throw new Error(
      `Invalid tone. Must be one of: ${ALLOWED_TONES.join(", ")}`,
    );
  if (!text?.trim()) throw new Error("Text is required");
  if (text.trim().length < 5) throw new Error("Text too short");

  if (text.length > 2000)
    throw new Error("Text too long — max 2000 characters");

  const { text: rewritten, usage } = await generateResponse(
    buildWritingPrompt(text, action, tone),
  );
  return {
    result: rewritten,
    tokenCount: usage?.totalTokenCount || Math.ceil(text.length / 4),
  };
}

async function generateTags({ text }) {
  if (!text?.trim()) throw new Error("Document text is required");
  if (text.trim().length < 20)
    throw new Error("Document too short to generate tags");
  if (text.length > 1000000)
    throw new Error("Document too long — max 10000 characters");

  const { text: raw, usage } = await generateResponse(buildTagsPrompt(text));
  const clean = raw.replace(/```json|```/g, "").trim();
  const tags = JSON.parse(clean);

  if (!Array.isArray(tags)) throw new Error("Invalid tags response from AI");
  if (tags.some((t) => typeof t !== "string"))
    throw new Error("Tags must be strings");

  return { tags, tokenCount: usage?.totalTokenCount || Math.ceil(text.length / 4)  };
}

async function generateSummary({ text, isSelection = false }) {
  if (!text?.trim()) throw new Error("Text is required");
  if (text.trim().length < 20) throw new Error("Text too short to summarize");
  if (text.length > 10000)
    throw new Error("Text too long — max 10000 characters");

  const { text: summaryText, usage } = await generateResponse(
    buildSummaryPrompt(text, isSelection),
  );
  return { summary: summaryText, tokenCount: usage?.totalTokenCount || Math.ceil(text.length / 4) };
}

module.exports = { chat, writingAssist, generateTags, generateSummary };
