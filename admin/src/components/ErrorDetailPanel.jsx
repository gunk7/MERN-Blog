import React, { useState } from "react";

const LEVEL_DOT_CLASS = {
  fatal: "bg-red-600",
  error: "bg-red-600",
  warning: "bg-amber-500",
};

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * CodeContextSection
 *
 * Handles all three states the /source endpoint can return:
 *   - not yet fetched (sourceContext is null)
 *   - { status: "unavailable", reason }
 *   - { status: "ok", lines, errorLine, errorColumn, ageDays }
 *
 * The ageDays soft-warning is shown whenever present and above a threshold,
 * per the "always attempt, warn on old ones" decision — not a hard cutoff.
 */
function CodeContextSection({ sourceContext, sourceContextLoading }) {
  if (sourceContextLoading) {
    return (
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Code context
        </h3>
        <div className="bg-surface-low/70 rounded-xl p-4 text-xs text-on-surface-variant">
          Loading…
        </div>
      </div>
    );
  }

  if (!sourceContext) return null;

  if (sourceContext.status === "unavailable") {
    return (
      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Code context
        </h3>
        <div className="bg-surface-low/70 rounded-xl p-4 text-xs text-on-surface-variant">
          Code context unavailable — {sourceContext.reason}
        </div>
      </div>
    );
  }

  const { lines, errorLine, errorColumn, ageDays } = sourceContext;
  const showStaleWarning = typeof ageDays === "number" && ageDays > 2;

  return (
    <div className="mb-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
        Code context
      </h3>
      {showStaleWarning && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mb-2">
          This error is {ageDays} days old — the code shown may not match what
          was deployed then.
        </p>
      )}
      <div className="bg-surface-low/70 rounded-xl overflow-hidden font-mono text-xs leading-6">
        {lines.map(({ lineNumber, content }) => {
          const isErrorLine = lineNumber === errorLine;
          return (
            <div
              key={lineNumber}
              className={`px-4 py-1.5 flex ${
                isErrorLine ? "bg-red-100/60 border-l-2 border-red-500" : ""
              }`}
            >
              <span
                className={`w-8 select-none ${
                  isErrorLine
                    ? "text-red-600/70 font-bold"
                    : "text-on-surface-variant/50"
                }`}
              >
                {lineNumber}
              </span>
              <span
                className={
                  isErrorLine
                    ? "text-red-700 font-bold"
                    : "text-on-surface-variant"
                }
              >
                {content}
                {/* errorColumn, when present, marks the exact character on the
                    error line — shown as a caret on the line below it. */}
              </span>
            </div>
          );
        })}
        {typeof errorColumn === "number" && (
          <div className="px-4 pb-2 -mt-1 flex">
            <span className="w-8" />
            <span
              className="text-red-500 font-bold"
              style={{ paddingLeft: `${errorColumn - 1}ch` }}
            >
              ^
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorDetailPanel
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WIRE-UP NOTE: this component is intentionally "dumb" — it takes the
 * fully-resolved error object, the source-context result, and loading
 * flags as props. ErrorLogsPage.jsx is where you'll:
 *   1. Read `id` from useSearchParams
 *   2. Dispatch fetchErrorLogById(id) and fetchErrorSourceContext(id)
 *      whenever `id` changes
 *   3. Select state.selectedError / state.sourceContext from your slice
 *      and pass them down as props here
 * ─────────────────────────────────────────────────────────────────────────
 */
export default function ErrorDetailPanel({
  error,
  sourceContext,
  sourceContextLoading,
  isLoading,
  onClose,
  onResolveToggle,
  resolveLoading,
}) {
  if (isLoading) {
    return (
      <div className="table-container p-10 text-center text-sm text-on-surface-variant">
        Loading error details…
      </div>
    );
  }

  if (!error) return null;

  const [note, setNote] = useState("");

  return (
    <div className="table-container p-5">
      <button
        onClick={onClose}
        className="text-xs font-bold text-primary mb-4 flex items-center gap-1"
      >
        ← Back to list
      </button>

      <div className="flex items-start gap-2 mb-1">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 ${
            LEVEL_DOT_CLASS[error.level] || "bg-gray-400"
          }`}
        />
        <div>
          <h2 className="text-lg font-bold text-on-surface leading-tight">
            {error.name}
          </h2>
          <p className="text-sm text-on-surface-variant">{error.message}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 mt-2">
        <span className="status-badge bg-red-100 text-red-700 border border-red-200">
          {error.category}
        </span>
        <span className="status-badge bg-surface-high text-on-surface-variant border border-primary/10 font-mono">
          {error.subtype}
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-primary/10 bg-surface-low/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Resolution
            </p>
            <p className="text-sm text-on-surface">
              {error.isResolved ? "Marked resolved" : "Open for follow-up"}
            </p>
          </div>
          <button
            onClick={() => onResolveToggle?.(error._id, !error.isResolved, note.trim())}
            disabled={resolveLoading}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              error.isResolved
                ? "bg-surface-high text-on-surface border border-primary/10"
                : "bg-primary text-white"
            } ${resolveLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {resolveLoading
              ? "Saving..."
              : error.isResolved
                ? "Reopen"
                : "Mark resolved"}
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional resolution note"
          className="input-editorial mt-3 min-h-18 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs mb-5 bg-surface-low/60 rounded-2xl p-4">
        <div>
          <span className="text-on-surface-variant">Occurred</span>
          <br />
          <span className="font-mono">{formatTimestamp(error.createdAt)}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">Endpoint</span>
          <br />
          <span className="font-mono">
            {error.method
              ? `${error.method} ${error.endpoint}`
              : error.endpoint || "—"}
          </span>
        </div>
        <div>
          <span className="text-on-surface-variant">Source</span>
          <br />
          <span>{error.source}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">Environment</span>
          <br />
          <span>{error.environment}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">Occurrences</span>
          <br />
          <span className="font-mono">{error.occurrenceCount ?? 1}</span>
        </div>
        <div>
          <span className="text-on-surface-variant">Status</span>
          <br />
          <span className="font-mono">
            {error.isResolved ? "Resolved" : "Open"}
            {error.resolvedAt ? ` • ${formatTimestamp(error.resolvedAt)}` : ""}
          </span>
        </div>
      </div>

      <CodeContextSection
        sourceContext={sourceContext}
        sourceContextLoading={sourceContextLoading}
      />

      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
          Stack trace
        </h3>
        <div className="bg-surface-low/70 rounded-xl p-4 font-mono text-xs text-on-surface-variant leading-6 overflow-x-auto whitespace-pre-wrap">
          {error.stack || "No stack trace recorded."}
        </div>
      </div>

      {(error.requestParams || error.method || error.ip) && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Request context
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-on-surface-variant">Method</span>
              <br />
              <span className="font-mono">{error.method || "—"}</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Params</span>
              <br />
              <span className="font-mono">
                {error.requestParams
                  ? JSON.stringify(error.requestParams)
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant">IP</span>
              <br />
              <span className="font-mono">{error.ip || "—"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
