const fs = require("fs");
const path = require("path");

const LINES_OF_CONTEXT = 5;

/**
 * The backend's own project root — the ONLY directory this feature is
 * allowed to read from. Adjust if this file moves relative to the project root.
 */
const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * Stack traces store whatever absolute path existed on the machine that
 * threw the error (a local dev machine, or Render's container path like
 * /opt/render/project/src/...). That exact path won't exist on whatever
 * machine is now serving this admin request. So instead of trusting the
 * full stored path, we take only the path SEGMENTS THAT LOOK LIKE THEY'RE
 * INSIDE THE PROJECT (e.g. "controllers/blogController.js") and resolve
 * that relative to THIS server's own project root.
 *
 * This intentionally throws away anything before a recognizable project
 * folder name, rather than trying to reconstruct the original machine's
 * directory structure, which we have no reliable way to do.
 */
function resolveSafeProjectPath(rawFilePath) {
  if (!rawFilePath || typeof rawFilePath !== "string") return null;

  // Normalize Windows-style backslashes just in case, and strip any
  // querystring-like noise that sometimes appears in transpiled stacks.
  const normalized = rawFilePath.replace(/\\/g, "/");

  // Split into segments and look for a known top-level project folder name.
  // Extend this list if the project's folder layout changes.
  const KNOWN_ROOTS = [
    "controllers",
    "routes",
    "models",
    "middleware",
    "utils",
    "services",
    "config",
    "script",
  ];

  const segments = normalized.split("/");
  const rootIndex = segments.findIndex((seg) => KNOWN_ROOTS.includes(seg));

  console.log("[resolveSafeProjectPath] segments:", segments);
  console.log("[resolveSafeProjectPath] rootIndex:", rootIndex);
  console.log("[resolveSafeProjectPath] PROJECT_ROOT:", PROJECT_ROOT);

  if (rootIndex === -1) {
    // Path doesn't contain any recognizable project folder — likely a
    // node_modules frame, a local-only path we can't map, or similar.
    return null;
  }

  const relativeSegments = segments.slice(rootIndex);
  const candidatePath = path.join(PROJECT_ROOT, ...relativeSegments);
  const resolved = path.resolve(candidatePath);
  if (
    !resolved.startsWith(PROJECT_ROOT + path.sep) &&
    resolved !== PROJECT_ROOT
  ) {
    return null;
  }

  console.log("[resolveSafeProjectPath] resolved:", resolved);
  console.log(
    "[resolveSafeProjectPath] starts with root:",
    resolved.startsWith(PROJECT_ROOT + path.sep),
  );

  // SECURITY: resolve and verify the final path is still inside PROJECT_ROOT.
  // path.join above can't escape on its own here since we only used
  // known-safe segment names, but this check stays as a hard guarantee
  // regardless of how candidatePath was constructed above.

  return resolved;
}

/**
 * Returns one of:
 *   { status: "ok", lines: [...], startLine, endLine, errorLine, errorColumn }
 *   { status: "unavailable", reason: "<human readable reason>" }
 */
function getSourceContext(rawFilePath, errorLine, errorColumn = null) {
  if (!rawFilePath || !errorLine || errorLine < 1) {
    return {
      status: "unavailable",
      reason: "No source location recorded for this error.",
    };
  }

  const safePath = resolveSafeProjectPath(rawFilePath);
  if (!safePath) {
    return {
      status: "unavailable",
      reason:
        "Source file path could not be mapped to this server's project files.",
    };
  }

  if (!fs.existsSync(safePath)) {
    return {
      status: "unavailable",
      reason:
        "File not found — it may have been moved, renamed, or deleted since this error occurred.",
    };
  }

  let fileContents;
  try {
    fileContents = fs.readFileSync(safePath, "utf8");
  } catch (readErr) {
    return { status: "unavailable", reason: "File could not be read." };
  }

  const allLines = fileContents.split("\n");
  const totalLines = allLines.length;

  if (errorLine > totalLines) {
    return {
      status: "unavailable",
      reason:
        "Line number is out of range for the current version of this file — it may have changed significantly since this error occurred.",
    };
  }

  // Clamp the window so short files or errors near the start/end don't
  // go out of bounds (edge case 9 from planning).
  const startLine = Math.max(1, errorLine - LINES_OF_CONTEXT);
  const endLine = Math.min(totalLines, errorLine + LINES_OF_CONTEXT);

  // allLines is 0-indexed; line numbers from stack traces are 1-indexed.
  const lines = [];
  for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
    lines.push({ lineNumber: lineNum, content: allLines[lineNum - 1] });
  }

  // errorColumn tells the frontend WHERE on errorLine to highlight, not just
  // which line. Only meaningful if it actually falls within that line's
  // length — a stale/mismatched column (e.g. file changed since) shouldn't
  // be trusted blindly, same reasoning as the line-out-of-range check above.
  const errorLineContent = allLines[errorLine - 1] || "";
  const validColumn =
    typeof errorColumn === "number" &&
    errorColumn >= 1 &&
    errorColumn <= errorLineContent.length + 1
      ? errorColumn
      : null;

  return {
    status: "ok",
    lines,
    startLine,
    endLine,
    errorLine,
    errorColumn: validColumn,
  };
}

module.exports = { getSourceContext, resolveSafeProjectPath, LINES_OF_CONTEXT };
