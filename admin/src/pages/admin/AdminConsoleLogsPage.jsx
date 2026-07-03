import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setFilters,
  resetFilters,
  setPage,
} from "../../redux/slice/adminConsoleLogSlice";
import {
  fetchConsoleLogs,
  fetchConsoleLogStats,
  deleteConsoleLogs,
} from "../../redux/thunks/adminConsoleLogThunks";

// ─────────────────────────────────────────────────────────────────────────────
// Constants — level styling, built from the theme's badge tokens
// ─────────────────────────────────────────────────────────────────────────────

const LEVELS = ["info", "warn", "error", "debug", "http"];

// status-badge is the base utility; each level layers its own colors on top,
// matching the green/amber pattern already defined for status-verified/pending.
const LEVEL_CONFIG = {
  info: {
    badge: "bg-blue-100 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
    label: "INFO",
  },
  warn: {
    badge: "bg-amber-100 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
    label: "WARN",
  },
  error: {
    badge: "bg-red-100 text-red-700 border border-red-200",
    dot: "bg-red-500",
    label: "ERROR",
  },
  debug: {
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-500",
    label: "DEBUG",
  },
  http: {
    badge: "bg-purple-100 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
    label: "HTTP",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTs(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// StatsBar
// ─────────────────────────────────────────────────────────────────────────────

function StatsBar({ stats, activeLevel, onLevelClick }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-wrap gap-2 mb-5 text-reveal">
      <button
        onClick={() => onLevelClick(null)}
        className={`status-badge border transition-colors ${
          activeLevel === null
            ? "bg-surface-high text-on-surface border-primary/15"
            : "bg-transparent text-on-surface-variant border-black/5 hover:bg-surface-low"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant" />
        All
        <span className="ml-0.5 text-[11px] tabular-nums opacity-60">
          {total.toLocaleString()}
        </span>
      </button>
      {LEVELS.map((lvl) => {
        const cfg = LEVEL_CONFIG[lvl];
        const isActive = activeLevel === lvl;
        return (
          <button
            key={lvl}
            onClick={() => onLevelClick(isActive ? null : lvl)}
            className={`status-badge transition-colors ${
              isActive
                ? cfg.badge
                : "bg-transparent text-on-surface-variant border border-black/5 hover:bg-surface-low"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
            <span className="ml-0.5 text-[11px] tabular-nums opacity-70">
              {(stats[lvl] || 0).toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LevelBadge
// ─────────────────────────────────────────────────────────────────────────────

function LevelBadge({ level }) {
  const cfg = LEVEL_CONFIG[level?.toLowerCase()] || LEVEL_CONFIG.info;
  return (
    <span
      className={`status-badge font-mono text-[10px] tracking-wider ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExpandedRow
// ─────────────────────────────────────────────────────────────────────────────

function ExpandedRow({ log, accentDot }) {
  const meta = log.meta || {};
  const metaEntries = Object.entries(meta).filter(
    ([k]) => !["splat", "service"].includes(k),
  );

  return (
    <tr>
      <td colSpan={6} className="border-t border-surface-highest/30 p-0">
        <div
          className={`flex flex-col gap-3.5 bg-surface-low/60 py-4 pl-11 pr-5 border-l-4 ${accentDot}`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              Message
            </span>
            <pre className="m-0 whitespace-pre-wrap break-all rounded-2xl border border-black/10 bg-on-surface px-3.5 py-2.5 font-mono text-xs leading-relaxed text-surface">
              {log.message}
            </pre>
          </div>

          {metaEntries.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                Context
              </span>
              <div className="grid grid-cols-[140px_1fr] overflow-hidden rounded-2xl border border-black/5 bg-white">
                {metaEntries.map(([k, v]) => (
                  <React.Fragment key={k}>
                    <span className="border-b border-r border-surface-highest/40 bg-primary-fixed px-2.5 py-1.5 font-mono text-[11px] font-semibold text-primary">
                      {k}
                    </span>
                    <span className="whitespace-pre-wrap break-all border-b border-surface-highest/40 bg-white px-2.5 py-1.5 font-mono text-[11px] text-on-surface">
                      {typeof v === "object"
                        ? JSON.stringify(v, null, 2)
                        : String(v)}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-on-surface-variant">
              Timestamp
            </span>
            <span className="font-mono text-[11px] text-on-surface">
              {formatTs(log.timestamp)}
            </span>
          </div>

          <RawJsonToggle log={log} />
        </div>
      </td>
    </tr>
  );
}

function RawJsonToggle({ log }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className="self-start text-left text-[11px] font-semibold text-primary"
      >
        {open ? "▾" : "▸"} Raw JSON
      </button>
      {open && (
        <pre className="m-0 max-h-72 overflow-x-auto whitespace-pre rounded-2xl border border-black/10 bg-on-surface/90 px-3.5 py-3 font-mono text-[11px] leading-relaxed text-primary-fixed">
          {JSON.stringify(log, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LogTable
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_BORDER = {
  info: "border-l-blue-500",
  warn: "border-l-amber-500",
  error: "border-l-red-500",
  debug: "border-l-primary",
  http: "border-l-purple-500",
};

function LogTable({
  logs,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) {
  const [expanded, setExpanded] = useState(null);
  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-[2.5px] border-surface-highest border-t-primary" />
        <p className="mt-3 text-[13px] text-on-surface-variant">
          Fetching logs…
        </p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-20">
        <span className="mb-2 text-3xl">📭</span>
        <p className="text-[13px] text-on-surface-variant">
          No logs match the current filters.
        </p>
      </div>
    );
  }

  const allSelected = logs.length > 0 && selectedIds.length === logs.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="table-header-cell w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="cursor-pointer accent-primary"
              />
            </th>
            <th className="table-header-cell w-7" />
            <th className="table-header-cell w-25">Level</th>
            <th className="table-header-cell w-40">Timestamp</th>
            <th className="table-header-cell">Message</th>
            <th className="table-header-cell w-22.5 text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isOpen = expanded === log._id;
            const isChecked = selectedIds.includes(log._id);
            const level = log.level?.toLowerCase();
            const accent = ACCENT_BORDER[level] || ACCENT_BORDER.info;
            return (
              <React.Fragment key={log._id}>
                <tr
                  onClick={() => toggle(log._id)}
                  className={`cursor-pointer border-l-4 transition-colors hover:bg-surface-low ${
                    isOpen
                      ? `bg-surface-low ${accent}`
                      : isChecked
                        ? "bg-primary-fixed/40 border-l-transparent"
                        : "border-l-transparent"
                  }`}
                >
                  <td
                    className="table-body-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelect(log._id)}
                      className="cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="table-body-cell">
                    <span
                      className={`inline-block text-[10px] text-on-surface-variant transition-transform ${
                        isOpen ? "rotate-90" : "rotate-0"
                      }`}
                    >
                      ▶
                    </span>
                  </td>
                  <td className="table-body-cell">
                    <LevelBadge level={log.level} />
                  </td>
                  <td className="table-body-cell whitespace-nowrap font-mono text-[11px] text-on-surface-variant">
                    {formatTs(log.timestamp)}
                  </td>
                  <td className="table-body-cell max-w-0">
                    <span className="block truncate font-mono text-xs">
                      {log.message}
                    </span>
                  </td>
                  <td className="table-body-cell whitespace-nowrap text-right text-[11px] text-on-surface-variant">
                    {timeAgo(log.timestamp)}
                  </td>
                </tr>
                {isOpen && <ExpandedRow log={log} accentDot={accent} />}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({ filters, onFilterChange }) {
  const [search, setSearch] = useState(filters.search || "");
  const debounceRef = useRef(null);

  useEffect(() => {
    setSearch(filters.search || "");
  }, [filters.search]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({ search: val || "" });
    }, 350);
  }

  const ENVS = [
    { value: "", label: "All environments" },
    { value: "development", label: "Development" },
    { value: "staging", label: "Staging" },
    { value: "production", label: "Production" },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <div className="input-editorial flex min-w-[180px] flex-1 basis-[220px] items-center gap-2 !py-2">
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 text-on-surface-variant"
        >
          <circle
            cx="6.5"
            cy="6.5"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M10.5 10.5L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          placeholder="Search messages…"
          value={search}
          onChange={handleSearchChange}
          className="w-full border-none bg-transparent text-[13px] text-on-surface outline-none"
        />
      </div>

      <select
        value={filters.environment || ""}
        onChange={(e) =>
          onFilterChange({ environment: e.target.value || null })
        }
        className="cursor-pointer rounded-xl border border-primary/10 bg-surface-low px-3 py-2 text-xs text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-fixed-dim"
      >
        {ENVS.map((e) => (
          <option key={e.value} value={e.value}>
            {e.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.startDate || ""}
        onChange={(e) => onFilterChange({ startDate: e.target.value || null })}
        className="rounded-xl border border-primary/10 bg-surface-low px-3 py-2 text-xs text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-fixed-dim"
        title="From date"
      />
      <input
        type="date"
        value={filters.endDate || ""}
        onChange={(e) => onFilterChange({ endDate: e.target.value || null })}
        className="rounded-xl border border-primary/10 bg-surface-low px-3 py-2 text-xs text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-fixed-dim"
        title="To date"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  const { page, totalPages, total, limit } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const pages = [];
  const delta = 2;
  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(totalPages, page + delta);
    i++
  ) {
    pages.push(i);
  }

  const btnBase =
    "min-w-[28px] h-7 px-1.5 rounded-full border text-xs font-semibold transition-colors";
  const btnIdle =
    "border-black/5 bg-white text-on-surface-variant hover:bg-surface-low";
  const btnDisabled =
    "cursor-not-allowed border-black/5 bg-white text-on-surface-variant/40 opacity-50";

  return (
    <div className="flex items-center justify-between border-t border-surface-highest/40 bg-surface-low/50 px-4 py-3">
      <span className="text-xs text-on-surface-variant">
        {total > 0
          ? `${from}–${to} of ${total.toLocaleString()} logs`
          : "No results"}
      </span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnIdle}`}
        >
          «
        </button>
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnIdle}`}
        >
          ‹
        </button>
        {pages[0] > 1 && (
          <span className="text-xs text-on-surface-variant">…</span>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === page ? "border-primary bg-primary text-white" : btnIdle}`}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <span className="text-xs text-on-surface-variant">…</span>
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnIdle}`}
        >
          ›
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`${btnBase} ${page >= totalPages ? btnDisabled : btnIdle}`}
        >
          »
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AutoRefreshToggle
// ─────────────────────────────────────────────────────────────────────────────

function AutoRefreshToggle({ enabled, onToggle, countdown }) {
  return (
    <button
      onClick={onToggle}
      className={`status-badge transition-colors ${
        enabled
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-white text-on-surface-variant border border-black/5"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${enabled ? "animate-pulse bg-green-500" : "bg-on-surface-variant"}`}
      />
      {enabled ? `Live · ${countdown}s` : "Live off"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminConsoleLogsPage
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminConsoleLogsPage() {
  const dispatch = useDispatch();
  const { logs, pagination, filters, listStatus, stats, deleteStatus } =
    useSelector((s) => s.adminConsoleLogs);

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [selectedIds, setSelectedIds] = useState([]);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const load = useCallback(() => {
    dispatch(
      fetchConsoleLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }),
    );
    dispatch(fetchConsoleLogStats());
  }, [dispatch, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSelectedIds([]);
  }, [logs]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    if (!autoRefresh) {
      setCountdown(5);
      return;
    }

    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 5 : c - 1));
    }, 1000);
    intervalRef.current = setInterval(() => {
      load();
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [autoRefresh, load]);

  function handleLevelClick(level) {
    dispatch(setFilters({ level }));
  }
  function handleFilterChange(patch) {
    dispatch(setFilters(patch));
  }
  function handlePageChange(newPage) {
    dispatch(setPage(newPage));
  }
  function handleReset() {
    dispatch(resetFilters());
  }
  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.length === logs.length ? [] : logs.map((l) => l._id),
    );
  }
  async function handleDelete() {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(
      `Delete ${selectedIds.length} log${selectedIds.length > 1 ? "s" : ""}? This can't be undone.`,
    );
    if (!ok) return;

    try {
      await dispatch(deleteConsoleLogs({ ids: selectedIds })).unwrap();
      setSelectedIds([]);
      load();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const hasActiveFilters =
    filters.level ||
    filters.search ||
    filters.startDate ||
    filters.endDate ||
    filters.environment;

  return (
    <div className="max-w-[1200px] px-7 py-6 font-body text-on-surface">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-[22px] font-bold text-on-surface">
            Console Logs
          </h1>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            All Winston logs — info, warn, error, debug, http — newest first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AutoRefreshToggle
            enabled={autoRefresh}
            onToggle={() => setAutoRefresh((p) => !p)}
            countdown={countdown}
          />

          {selectedIds.length > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleteStatus === "loading"}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteStatus === "loading"
                ? "Deleting…"
                : `🗑 Delete (${selectedIds.length})`}
            </button>
          )}

          <button
            onClick={load}
            title="Refresh"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-low"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.5 2.5A6.5 6.5 0 1 0 14 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M14 2.5V6h-3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
            >
              ✕ Clear filters
            </button>
          )}
        </div>
      </div>

      <StatsBar
        stats={stats}
        activeLevel={filters.level}
        onLevelClick={handleLevelClick}
      />
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <div className="table-container">
        <LogTable
          logs={logs}
          isLoading={listStatus === "loading"}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
        {logs.length > 0 && (
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        )}
      </div>
    </div>
  );
}
