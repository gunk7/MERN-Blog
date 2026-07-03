import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorDetailPanel from "../../components/ErrorDetailPanel";

// --- Redux wiring ---
import { useDispatch, useSelector } from "react-redux";
import {
  setFilters,
  resetFilters,
  setPage,
  clearSelectedError,
} from "../../redux/slice/adminErrorSlice";
import {
  fetchErrorLogs,
  fetchErrorLogById,
  fetchErrorSourceContext,
  updateErrorResolution,
} from "../../redux/thunks/adminErrorThunks";

// ─────────────────────────────────────────────────────────────────────────────
// FilterBar
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "AUTH",
  "ACCESS",
  "VALIDATION",
  "RESOURCE",
  "DATABASE",
  "FILES",
  "PAYMENT",
  "EXTERNAL_SERVICE",
  "SCHEDULER",
  "SYSTEM",
];

function FilterBar({ filters, onFilterChange }) {
  const [showPanel, setShowPanel] = useState(false);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    onFilterChange({ ...filters, [field]: value === "" ? null : value });
  };

  const activeCount = Object.values(filters).filter(
    (v) => v && v !== "",
  ).length;

  return (
    <div className="mb-3 relative">
      <button
        onClick={() => setShowPanel((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-primary/10 bg-white text-on-surface hover:bg-surface-low transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 4h12M4 8h8M6 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="ml-0.5 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {activeCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute top-9 left-0 z-50 bg-white border border-primary/10 rounded-2xl shadow-lg p-4 w-72 flex flex-col gap-2">
          <select
            className="input-editorial"
            value={filters.category || ""}
            onChange={handleChange("category")}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input-editorial"
            value={filters.level || ""}
            onChange={handleChange("level")}
          >
            <option value="">All levels</option>
            <option value="fatal">fatal</option>
            <option value="error">error</option>
            <option value="warning">warning</option>
          </select>
          <select
            className="input-editorial"
            value={filters.source || ""}
            onChange={handleChange("source")}
          >
            <option value="">All sources</option>
            <option value="middleware">middleware</option>
            <option value="manual">manual</option>
            <option value="uncaughtException">uncaughtException</option>
            <option value="unhandledRejection">unhandledRejection</option>
          </select>
          <select
            className="input-editorial"
            value={filters.environment || ""}
            onChange={handleChange("environment")}
          >
            <option value="">All environments</option>
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
          <input
            type="date"
            className="input-editorial"
            value={filters.startDate || ""}
            onChange={handleChange("startDate")}
          />
          <input
            type="date"
            className="input-editorial"
            value={filters.endDate || ""}
            onChange={handleChange("endDate")}
          />
          <input
            type="text"
            placeholder="Search message or name…"
            className="input-editorial"
            value={filters.search || ""}
            onChange={handleChange("search")}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorTable
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_DOT_CLASS = {
  fatal: "bg-red-600",
  error: "bg-red-600",
  warning: "bg-amber-500",
};

const CATEGORY_BADGE_CLASS = {
  DATABASE: "bg-red-100 text-red-700 border-red-200",
  PAYMENT: "bg-red-100 text-red-700 border-red-200",
  SCHEDULER: "bg-red-100 text-red-700 border-red-200",
  AUTH: "bg-amber-100 text-amber-700 border-amber-200",
  ACCESS: "bg-amber-100 text-amber-700 border-amber-200",
  VALIDATION: "bg-amber-100 text-amber-700 border-amber-200",
  RESOURCE: "bg-surface-high text-on-surface-variant border-primary/10",
  FILES: "bg-surface-high text-on-surface-variant border-primary/10",
  EXTERNAL_SERVICE: "bg-surface-high text-on-surface-variant border-primary/10",
  SYSTEM: "bg-surface-high text-on-surface-variant border-primary/10",
};

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ErrorTable({ errors, selectedId, onRowClick, isLoading, condensed }) {
  if (isLoading) {
    return (
      <div className="table-container p-10 text-center text-sm text-on-surface-variant">
        Loading error logs…
      </div>
    );
  }

  if (!errors || errors.length === 0) {
    return (
      <div className="table-container p-10 text-center text-sm text-on-surface-variant">
        No errors match the current filters.
      </div>
    );
  }

  // Condensed: dot + timestamp + category + truncated message only
  if (condensed) {
    return (
      <div className="table-container overflow-hidden">
        <table className="w-full" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th className="table-header-cell" style={{ width: "8%" }} />
              <th className="table-header-cell" style={{ width: "38%" }}>
                Time
              </th>
              <th className="table-header-cell" style={{ width: "54%" }}>
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err) => (
              <tr
                key={err._id}
                onClick={() => onRowClick(err._id)}
                className={`cursor-pointer hover:bg-surface-low transition-colors ${
                  err._id === selectedId ? "bg-primary-fixed" : ""
                }`}
              >
                <td className="table-body-cell">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${LEVEL_DOT_CLASS[err.level] || "bg-gray-400"}`}
                  />
                </td>
                <td className="table-body-cell font-mono text-[10px] leading-tight">
                  {/* Show only HH:MM:SS in condensed mode to save space */}
                  {formatTimestamp(err.createdAt).split(" ")[1]}
                  <div className="text-on-surface-variant/50 text-[9px]">
                    {formatTimestamp(err.createdAt).split(" ")[0]}
                  </div>
                </td>
                <td className="table-body-cell">
                  <span
                    className={`status-badge border text-[10px] px-1.5 py-0.5 ${CATEGORY_BADGE_CLASS[err.category] || "bg-surface-high text-on-surface-variant border-primary/10"}`}
                  >
                    {err.category}
                  </span>
                  <div className="text-[10px] text-on-surface-variant truncate mt-0.5 max-w-30">
                    {err.message}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Full table
  return (
    <div className="table-container">
      <table className="w-full" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th className="table-header-cell" style={{ width: "5%" }} />
            <th className="table-header-cell" style={{ width: "18%" }}>
              Timestamp
            </th>
            <th className="table-header-cell" style={{ width: "14%" }}>
              Category
            </th>
            <th className="table-header-cell" style={{ width: "16%" }}>
              Subtype
            </th>
            <th className="table-header-cell" style={{ width: "29%" }}>
              Message
            </th>
            <th className="table-header-cell" style={{ width: "18%" }}>
              Endpoint
            </th>
          </tr>
        </thead>
        <tbody>
          {errors.map((err) => (
            <tr
              key={err._id}
              onClick={() => onRowClick(err._id)}
              className={`cursor-pointer hover:bg-surface-low transition-colors ${
                err._id === selectedId ? "bg-primary-fixed" : ""
              }`}
            >
              <td className="table-body-cell">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${LEVEL_DOT_CLASS[err.level] || "bg-gray-400"}`}
                />
              </td>
              <td className="table-body-cell font-mono text-xs">
                {formatTimestamp(err.createdAt)}
              </td>
              <td className="table-body-cell">
                <span
                  className={`status-badge border ${CATEGORY_BADGE_CLASS[err.category] || "bg-surface-high text-on-surface-variant border-primary/10"}`}
                >
                  {err.category}
                </span>
              </td>
              <td className="table-body-cell font-mono text-xs truncate">
                {err.subtype}
              </td>
              <td className="table-body-cell truncate">{err.message}</td>
              <td className="table-body-cell font-mono text-xs truncate">
                {err.endpoint || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

function Pagination({ pagination, onPageChange, condensed }) {
  const { page, totalPages } = pagination;
  return (
    <div
      className={`flex items-center px-4 py-2.5 border-t border-surface-highest/30 bg-surface-low/30 ${
        condensed ? "flex-col gap-1.5 justify-center" : "justify-between"
      }`}
    >
      {!condensed && (
        <span className="text-xs text-on-surface-variant">
          Page {page} of {totalPages}
        </span>
      )}
      <div className="flex gap-1.5 items-center">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-primary/10 text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ◂
        </button>
        {condensed && (
          <span className="text-[10px] text-on-surface-variant px-1">
            {page}/{totalPages}
          </span>
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ▸
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminErrorManagement (page shell)
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminErrorManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id");

  const dispatch = useDispatch();
  const { errors, pagination, filters, listStatus } = useSelector(
    (s) => s.adminError,
  );
  const {
    selectedError,
    detailStatus,
    sourceContext,
    sourceContextStatus,
    resolveStatus,
  } = useSelector((s) => s.adminError);

  // Fetch list on mount and whenever filters or page change
  useEffect(() => {
    dispatch(fetchErrorLogs({ ...filters, page: pagination.page }));
  }, [filters, pagination.page, dispatch]);

  // Fetch detail + source context whenever selected error changes
  useEffect(() => {
    if (!selectedId) return;
    dispatch(fetchErrorLogById(selectedId));
    dispatch(fetchErrorSourceContext(selectedId));
  }, [selectedId, dispatch]);

  function handleFilterChange(newFilters) {
    dispatch(setFilters(newFilters));
  }

  function handlePageChange(newPage) {
    dispatch(setPage(newPage));
  }

  function handleRowClick(errorId) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("id", errorId);
      return next;
    });
  }

  function handleCloseDetail() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
    dispatch(clearSelectedError());
  }

  function handleResolveToggle(errorId, resolved, note) {
    dispatch(updateErrorResolution({ id: errorId, resolved, note }));
  }

  const isDetailOpen = Boolean(selectedId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-on-surface mb-1">Error logs</h1>
      <p className="text-sm text-on-surface-variant mb-5">
        Every error captured across the backend, newest first.
      </p>

      <div className="flex gap-5 items-start">
        <div
          className="min-w-0 transition-all duration-300"
          style={{ flex: isDetailOpen ? "0 0 280px" : "1 1 100%" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            <button
              onClick={() =>
                dispatch(fetchErrorLogs({ ...filters, page: pagination.page }))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-primary/10 bg-white text-on-surface hover:bg-surface-low transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
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
          </div>
          <ErrorTable
            errors={errors}
            selectedId={selectedId}
            onRowClick={handleRowClick}
            isLoading={listStatus === "loading"}
            condensed={isDetailOpen}
          />

          {errors.length > 0 && (
            <div className="table-container mt-0">
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                condensed={isDetailOpen}
              />
            </div>
          )}
        </div>

        {isDetailOpen && (
          <div className="flex-1 min-w-0">
            <ErrorDetailPanel
              error={selectedError}
              sourceContext={sourceContext}
              sourceContextLoading={sourceContextStatus === "loading"}
              isLoading={detailStatus === "loading"}
              onClose={handleCloseDetail}
              onResolveToggle={handleResolveToggle}
              resolveLoading={resolveStatus === "loading"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
