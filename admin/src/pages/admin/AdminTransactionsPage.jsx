import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  fetchAllTransactions,
  fetchTransactionStats,
} from "../../redux/thunks/adminTransactionThunks";
import {
  clearCurrentTransaction,
  clearError,
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
} from "../../redux/slice/adminTransactionSlice";

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
function formatTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CLASSES = {
  paid: "status-verified",
  success: "status-verified",
  pending: "status-pending",
  failed: "bg-red-100 text-red-600 border border-red-200",
  refunded: "bg-blue-100 text-blue-700 border border-blue-200",
  partially_refunded: "bg-orange-100 text-orange-600 border border-orange-200",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className={`border border-black/5 rounded-3xl p-6 shadow-lavender flex flex-col gap-1 hover:-translate-y-0.5 transition-transform duration-300 ${accent ? "bg-primary text-white" : "bg-white"}`}
    >
      <span
        className={`text-xs uppercase tracking-widest font-bold ${accent ? "text-white/70" : "text-on-surface-variant"}`}
      >
        {label}
      </span>
      <span
        className={`text-3xl font-display ${accent ? "text-white" : "text-on-surface"}`}
      >
        {value ?? "—"}
      </span>
      {sub && (
        <span
          className={`text-xs ${accent ? "text-white/60" : "text-on-surface-variant"}`}
        >
          {sub}
        </span>
      )}
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
function ViewModal({ transaction: t, onClose }) {
  if (!t) return null;
  const statusCls =
    STATUS_CLASSES[t.status?.toLowerCase()] ||
    "bg-surface-highest text-on-surface-variant border border-surface-highest";

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-4xl p-8 max-w-lg w-full shadow-lavender max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-2xl text-on-surface">
              Transaction
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5 font-mono">
              {t._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon.X />
          </button>
        </div>

        <div className="bg-primary rounded-3xl p-6 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-widest mb-1">
              Amount
            </p>
            <p className="font-display text-4xl text-white">
              ₹{Number(t.amount ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <span className={`status-badge ${statusCls}`}>{t.status}</span>
        </div>

        <div className="bg-surface-low rounded-2xl p-4 mb-4">
          <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
            User
          </p>
          <p className="font-bold text-on-surface">{t.user?.username || "—"}</p>
          <p className="text-xs text-on-surface-variant">
            {t.user?.email || "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          {[
            ["Plan", t.plan?.name || "—"],
            ["Provider", t.paymentProvider || "—"],
            ["Currency", t.currency || "INR"],
            ["Date", `${formatDate(t.createdAt)} ${formatTime(t.createdAt)}`],
          ].map(([l, v]) => (
            <div key={l} className="bg-surface-low rounded-2xl p-3">
              <div className="text-xs text-on-surface-variant mb-0.5">{l}</div>
              <div className="font-bold text-on-surface text-xs break-all capitalize">
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Overlay>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTransactionsPage() {
  const dispatch = useDispatch();
  const {
    transactions,
    transactionStats,
    currentTransaction,
    loading,
    error,
    page,
    limit,
    totalCount,
    filters,
  } = useSelector((s) => s.adminTransactions);

  const [sorting, setSorting] = useState([]);
  const [viewTx, setViewTx] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchAllTransactions({ page, limit, ...filters }));
  }, [dispatch, page, limit, filters]);

  useEffect(() => {
    dispatch(fetchTransactionStats());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (currentTransaction) setViewTx(currentTransaction);
  }, [currentTransaction]);

  const handleCloseModal = () => {
    setViewTx(null);
    dispatch(clearCurrentTransaction());
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => {
          const user = row.original.user;
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
        cell: ({ row }) => (
          <span className="text-sm text-on-surface">
            {row.original.plan?.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ getValue }) => (
          <span className="font-display text-base text-primary">
            ₹{Number(getValue() ?? 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const v = getValue();
          const cls =
            STATUS_CLASSES[v?.toLowerCase()] ||
            "bg-surface-highest text-on-surface-variant border border-surface-highest";
          return <span className={`status-badge ${cls}`}>{v}</span>;
        },
      },
      {
        accessorKey: "paymentProvider",
        header: "Provider",
        cell: ({ getValue }) => (
          <span className="text-xs text-on-surface-variant capitalize">
            {getValue() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => (
          <span className="text-xs text-on-surface-variant uppercase">
            {getValue() || "INR"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ getValue }) => (
          <div>
            <div className="text-xs text-on-surface">
              {formatDate(getValue())}
            </div>
            <div className="text-xs text-on-surface-variant">
              {formatTime(getValue())}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={() => setViewTx(row.original)}
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
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / limit),
  });

  const stats = transactionStats;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Check if any filter is active for the clear button
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">
            Admin
          </p>
          <h1 className="font-display text-4xl text-on-surface">
            Transactions
          </h1>
        </div>
        <button
          onClick={() => setShowFilters((p) => !p)}
          className="btn-editorial w-auto px-6 py-3 rounded-full text-sm"
        >
          <Icon.Filter /> {showFilters ? "Hide Filters" : "Filters"}
          {hasActiveFilters && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-primary inline-block" />
          )}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={`₹${Number(totalRevenue).toLocaleString("en-IN")}`}
            accent
          />
          <StatCard label="Total" value={stats.totalTransactions} />
          <StatCard label="Paid" value={stats.paidTransactions} />
          <StatCard label="Failed" value={stats.failedTransactions} />
          <StatCard label="Refunded" value={stats.refundedTransactions} />
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border border-black/5 rounded-3xl shadow-lavender p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Provider
              </label>
              <select
                value={filters.paymentProvider}
                onChange={(e) =>
                  dispatch(updateFilters({ paymentProvider: e.target.value }))
                }
                className="input-editorial text-sm py-2"
              >
                <option value="">All</option>
                <option value="stripe">Stripe</option>
                <option value="razorpay">Razorpay</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Currency
              </label>
              <select
                value={filters.currency}
                onChange={(e) =>
                  dispatch(updateFilters({ currency: e.target.value }))
                }
                className="input-editorial text-sm py-2"
              >
                <option value="">All</option>
                <option value="inr">INR</option>
                <option value="usd">USD</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  dispatch(updateFilters({ startDate: e.target.value }))
                }
                className="input-editorial text-sm py-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  dispatch(updateFilters({ endDate: e.target.value }))
                }
                className="input-editorial text-sm py-2"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={() => dispatch(clearFilters())}
                className="text-xs text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-2">
          <h2 className="font-display text-xl text-on-surface">
            All Transactions
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
                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="table-body-cell text-center text-on-surface-variant py-12"
                    >
                      No transactions found
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
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${p === page ? "bg-primary text-white" : "hover:bg-surface-low text-on-surface-variant"}`}
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

      {viewTx && <ViewModal transaction={viewTx} onClose={handleCloseModal} />}
    </div>
  );
}
