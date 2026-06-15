#!/usr/bin/env node
// ============================================================
//  WaveLog Deploy Pipeline
//  Usage: node deploy.js "your commit message"
// ============================================================
const { execSync } = require("child_process");

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";

const TOTAL_STAGES = 5;

const stage = (n, msg) =>
  console.log(`\n${BLUE}[Stage ${n}/${TOTAL_STAGES}]${RESET} ${msg}...`);
const success = (msg) => console.log(`${GREEN}  ✓ ${msg}${RESET}`);
const fail = (msg, detail = "") => {
  console.error(`${RED}  ✗ ${msg}${RESET}`);
  if (detail) console.error(`${DIM}${detail}${RESET}`);
  console.error(
    `\n${RED}Pipeline stopped.${RESET} Fix the error above and try again.\n`,
  );
  process.exit(1);
};

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const runIn = (cmd, cwd) => execSync(cmd, { stdio: "inherit", cwd });
const get = (cmd) => execSync(cmd).toString().trim();

const commitMsg =
  process.argv[2] ||
  `chore: auto-deploy ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
const branch = process.env.GIT_BRANCH || "gdev";

console.log(`\n${YELLOW}WaveLog Deploy Pipeline${RESET}`);
console.log(DIM + "─".repeat(50) + RESET);

// ── Stage 1: Check repository & changes ──────────────────────
stage(1, "Checking repository");

try {
  get("git rev-parse --is-inside-work-tree");
} catch (err) {
  fail("Not inside a Git repository.", err?.message);
}

const changed = get("git status --short");
if (!changed) {
  success("No changes detected.");
  console.log(`\n${GREEN}Nothing to deploy.${RESET}\n`);
  process.exit(0);
}

console.log(`${DIM}Changed files:${RESET}`);
changed.split("\n").forEach((line) => console.log(`${DIM}${line}${RESET}`));
success("Changes detected.");

// ── Stage 2: Frontend build ───────────────────────────────────
stage(2, "Building frontend");

try {
  runIn("npm run build", "frontend");
  success("Frontend build successful.");
} catch (err) {
  fail("Frontend build failed.", err?.message);
}

// ── Stage 3: Backend validation ───────────────────────────────
stage(3, "Validating backend");

try {
  runIn("node --check server.js", "backend");
  success("Backend validation successful.");
} catch (err) {
  fail("Backend validation failed.", err?.message);
}

// ── Stage 4: Commit ───────────────────────────────────────────
stage(4, "Committing changes");

try {
  run("git add -A");
  run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  success(`Committed: "${commitMsg}"`);
} catch (err) {
  fail("Git commit failed.", err?.message);
}

// ── Stage 5: Push ─────────────────────────────────────────────
stage(5, `Pushing to origin/${branch}`);

try {
  run(`git push origin ${branch}`);
  success("Pushed to GitHub.");
} catch (err) {
  fail("Git push failed.", err?.message);
}

// ── Done ──────────────────────────────────────────────────────
console.log(DIM + "\n" + "─".repeat(50) + RESET);
console.log(`${GREEN}Pipeline complete.${RESET}`);
console.log(`${DIM}GitHub received the changes.${RESET}`);
console.log(
  `${DIM}Render and Vercel will auto-deploy if connected to this branch.${RESET}`,
);
console.log(`${DIM}Render Dashboard: https://dashboard.render.com${RESET}\n`);
