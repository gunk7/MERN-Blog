#!/usr/bin/env node

// ============================================================
//  Wavelog Deploy Pipeline
//  Usage: node deploy.js "your commit message"
// ============================================================

const { execSync } = require("child_process");

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const BLUE   = "\x1b[34m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM    = "\x1b[2m";

const TOTAL_STAGES = 3;

const stage   = (n, msg) => console.log(`\n${BLUE}[Stage ${n}/${TOTAL_STAGES}]${RESET} ${msg}...`);
const success = (msg)    => console.log(`${GREEN}  ✓ ${msg}${RESET}`);
const fail    = (msg, detail) => {
  console.error(`${RED}  ✗ ${msg}${RESET}`);
  if (detail) console.error(`${DIM}  ${detail.trim()}${RESET}`);
  console.error(`\n${RED}Pipeline stopped.${RESET} Fix the error above and try again.\n`);
  process.exit(1);
};

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const get = (cmd) => execSync(cmd).toString().trim();

const commitMsg = process.argv[2] ||
  `chore: auto-deploy ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
const branch = process.env.GIT_BRANCH || "gdev";

console.log(`\n${YELLOW}Wavelog Deploy Pipeline${RESET}`);
console.log(DIM + "─".repeat(40) + RESET);

// ── Stage 1: Check for changes ───────────────────────────────
stage(1, "Checking for changes");

try {
  get("git rev-parse --is-inside-work-tree");
} catch (e) {
  fail("Not inside a Git repository.", e.message);
}

const changed = get("git status --short");
if (!changed) {
  success("No changes detected — nothing to push.");
  console.log(`\n${GREEN}Pipeline complete.${RESET} Nothing to do.\n`);
  process.exit(0);
}

console.log(`${DIM}  Changed files:${RESET}`);
changed.split("\n").forEach(line => console.log(`  ${DIM}${line}${RESET}`));
success("Changes detected.");

// ── Stage 2: Commit ──────────────────────────────────────────
stage(2, "Committing");

try {
  run("git add -A");
  run(`git commit -m "${commitMsg}"`);
  success(`Committed: "${commitMsg}"`);
} catch (e) {
  fail("Git commit failed.", e.message);
}

// ── Stage 3: Push ────────────────────────────────────────────
stage(3, `Pushing to origin/${branch}`);

try {
  run(`git push origin ${branch}`);
  success("Pushed to GitHub.");
} catch (e) {
  fail("Git push failed.", e.message);
}

// ── Done ─────────────────────────────────────────────────────
console.log(DIM + "\n" + "─".repeat(40) + RESET);
console.log(`${GREEN}Pipeline complete.${RESET} Render is redeploying.`);
console.log(`${DIM}Monitor at: https://dashboard.render.com${RESET}\n`);

/* GIT_BRANCH=dev node deploy.js "your message" */