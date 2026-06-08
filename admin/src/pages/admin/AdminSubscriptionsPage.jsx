import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  fetchAllSubscriptions,
  fetchSubscriptionStats,
} from "../../redux/thunks/adminSubscriptionThunks";
import {
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
  clearError,
} from "../../redux/slice/adminSubscriptionSlice";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Sort: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-3 h-3"
    >
      <path
        d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
        strokeLinecap="round"
      />
    </svg>
  ),
  Eye: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  X: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-5 h-5"
    >
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  ),
  Filter: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <polygon
        points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ChevronLeft: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4"
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="round" />
    </svg>
  ),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(endDate) {
  return endDate && new Date(endDate) < new Date();
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-lavender flex flex-col gap-1 hover:-translate-y-0.5 transition-transform duration-300">
      <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
        {label}
      </span>
      <span className="text-3xl font-display text-on-surface">
        {value ?? "—"}
      </span>
      {sub && <span className="text-xs text-on-surface-variant">{sub}</span>}
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(38,30,53,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewModal({ subscription, onClose }) {
  if (!subscription) return null;
  const s = subscription;
  const expired = isExpired(s.endDate);

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-4xl p-8 max-w-lg w-full shadow-lavender max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-2xl text-on-surface">
              Subscription
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">#{s._id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon.X />
          </button>
        </div>

        {/* User */}
        <div className="bg-surface-low rounded-2xl p-4 mb-4">
          <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
            User
          </p>
          <p className="font-bold text-on-surface">
            {s.user?.name || s.userId?.name || "—"}
          </p>
          <p className="text-xs text-on-surface-variant">
            {s.user?.email || s.userId?.email || "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          {[
            ["Plan", s.plan?.name || s.planId?.name || "—"],
            ["Interval", s.interval || s.plan?.interval || "—"],
            ["Status", s.status],
            ["Expired", expired ? "Yes" : "No"],
            ["Start Date", formatDate(s.startDate)],
            ["End Date", formatDate(s.endDate)],
          ].map(([l, v]) => (
            <div key={l} className="bg-surface-low rounded-2xl p-3">
              <div className="text-xs text-on-surface-variant mb-0.5">{l}</div>
              <div className="font-bold text-on-surface capitalize">{v}</div>
            </div>
          ))}
        </div>

        {s.plan?.price !== undefined && (
          <div className="bg-primary-fixed rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Plan Price
            </span>
            <span className="font-display text-2xl text-primary">
              ₹
              {Number(s.plan?.price ?? s.planId?.price ?? 0).toLocaleString(
                "en-IN",
              )}
            </span>
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSubscriptionsPage() {
  const dispatch = useDispatch();
  const {
    subscriptions,
    totalCount,
    page,
    limit,
    filters,
    stats,
    loading,
    error,
  } = useSelector((s) => s.adminSubscriptions);

  const [viewSub, setViewSub] = useState(null);
  const [sorting, setSorting] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchAllSubscriptions({ page, limit, ...filters }));
  }, [dispatch, page, limit, filters]);

  useEffect(() => {
    dispatch(fetchSubscriptionStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => {
          const user = row.original.user || row.original.userId;
          return (
            <div>
              <div className="font-bold text-on-surface">
                {user?.username || "—"}
              </div>
              <div className="text-xs text-on-surface-variant">
                {user?.email || "—"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => {
          const plan = row.original.plan || row.original.planId;
          return (
            <div>
              <div className="font-bold text-on-surface">
                {plan?.name || "—"}
              </div>
              <div className="text-xs text-primary font-display">
                {plan?.price !== undefined
                  ? `₹${Number(plan.price).toLocaleString("en-IN")}`
                  : ""}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "interval",
        header: "Interval",
        cell: ({ row }) => {
          const interval =
            row.original.interval ||
            row.original.plan?.interval ||
            row.original.planId?.interval;
          return (
            <span className="capitalize text-xs text-on-surface-variant">
              {interval || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const v = row.original.status;
          const expired = isExpired(row.original.endDate);
          const cls =
            v === "active" && !expired
              ? "status-verified"
              : v === "active" && expired
                ? "bg-red-100 text-red-600 border border-red-200"
                : v === "pending"
                  ? "status-pending"
                  : v === "cancelled"
                    ? "bg-red-100 text-red-600 border border-red-200"
                    : "bg-surface-highest text-on-surface-variant border border-surface-highest";
          return (
            <span className={`status-badge ${cls}`}>
              {expired && v === "active" ? "expired" : v}
            </span>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ getValue }) => (
          <span className="text-xs text-on-surface-variant">
            {formatDate(getValue())}
          </span>
        ),
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }) => {
          const expired = isExpired(row.original.endDate);
          return (
            <span
              className={`text-xs ${expired ? "text-red-500 font-bold" : "text-on-surface-variant"}`}
            >
              {formatDate(row.original.endDate)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={() => setViewSub(row.original)}
            className="p-2 rounded-xl hover:bg-surface-low text-on-surface-variant hover:text-primary transition-colors"
          >
            <Icon.Eye />
          </button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: subscriptions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / limit),
  });

  const ov = stats?.overview || stats;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">
            Admin
          </p>
          <h1 className="font-display text-4xl text-on-surface">
            Subscriptions
          </h1>
        </div>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className="btn-editorial w-auto px-6 py-3 rounded-full text-sm"
        >
          <Icon.Filter /> {showFilters ? "Hide Filters" : "Filters"}
        </button>
      </div>

      {/* Stats */}
      {ov && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={ov.total ?? totalCount} />
          <StatCard label="Active" value={ov.active ?? ov.totalActive} />
          <StatCard
            label="Cancelled"
            value={ov.cancelled ?? ov.totalCancelled}
          />
          <StatCard label="Expired" value={ov.expired ?? ov.totalExpired} />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-black/5 rounded-3xl shadow-lavender p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Search
              </label>
              <input
                value={filters.search}
                onChange={(e) =>
                  dispatch(updateFilters({ search: e.target.value }))
                }
                placeholder="Name or email…"
                className="input-editorial text-sm py-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Plan Name
              </label>
              <input
                value={filters.name}
                onChange={(e) =>
                  dispatch(updateFilters({ name: e.target.value }))
                }
                placeholder="Plan name…"
                className="input-editorial text-sm py-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Interval
              </label>
              <select
                value={filters.interval}
                onChange={(e) =>
                  dispatch(updateFilters({ interval: e.target.value }))
                }
                className="input-editorial text-sm py-2"
              >
                <option value="">All</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  dispatch(updateFilters({ status: e.target.value }))
                }
                className="input-editorial text-sm py-2"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => dispatch(clearFilters())}
              className="text-xs text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-2">
          <h2 className="font-display text-xl text-on-surface">
            All Subscriptions
            {totalCount > 0 && (
              <span className="text-sm font-body text-on-surface-variant ml-2">
                ({totalCount})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-on-surface-variant">Rows:</label>
            <select
              value={limit}
              onChange={(e) => {
                dispatch(setLimit(Number(e.target.value)));
                dispatch(setPage(1));
              }}
              className="input-editorial text-sm py-1.5 w-20"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-on-surface-variant text-sm">
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="table-header-cell cursor-pointer select-none"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                          {h.column.getCanSort() && <Icon.Sort />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="table-body-cell text-center text-on-surface-variant py-12"
                    >
                      No subscriptions found
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-low/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="table-body-cell">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-highest/30">
            <span className="text-xs text-on-surface-variant">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(setPage(page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl hover:bg-surface-low text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
              >
                <Icon.ChevronLeft />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p =
                  totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => dispatch(setPage(p))}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "hover:bg-surface-low text-on-surface-variant"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => dispatch(setPage(page + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl hover:bg-surface-low text-on-surface-variant hover:text-primary transition-colors disabled:opacity-30"
              >
                <Icon.ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewSub && (
        <ViewModal subscription={viewSub} onClose={() => setViewSub(null)} />
      )}
    </div>
  );
}
