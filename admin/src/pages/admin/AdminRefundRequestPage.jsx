import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  fetchAllRefundRequests,
  resolveRefundRequest,
} from "../../redux/thunks/adminRefundThunks";
import {
  setPage,
  setLimit,
  setStatusFilter,
  clearResolveError,
  clearError,
} from "../../redux/slice/adminRefundSlice";

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

function TokenBar({ used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color =
    pct === 0 ? "bg-emerald-400" : pct < 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-on-surface-variant">
          {used?.toLocaleString("en-IN")} used
        </span>
        <span className="font-bold text-on-surface">{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-surface-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-on-surface-variant">
        of {limit?.toLocaleString("en-IN")} limit
      </div>
    </div>
  );
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

// ─── Resolve Modal ────────────────────────────────────────────────────────────
function ResolveModal({ request, onClose, onResolved }) {
  const dispatch = useDispatch();
  const { resolving, error } = useSelector((s) => s.adminRefunds);

  const [refundType, setRefundType] = useState("full");
  const [refundAmount, setRefundAmount] = useState(
    request?.transaction?.amount || 0,
  );
  const [userMessage, setUserMessage] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const txAmount = request?.transaction?.amount || 0;
  const isResolved = request?.status !== "pending";
  const handleRefundTypeChange = (type) => {
    setRefundType(type);
    if (type === "full") setRefundAmount(txAmount);
    if (type === "none") setRefundAmount(0);
  };

  const handleSubmit = async () => {
    if (!userMessage.trim()) return;
    const result = await dispatch(
      resolveRefundRequest({
        refundId: request._id,
        refundType,
        refundAmount: Number(refundAmount),
        userMessage,
        adminNote,
      }),
    );
    if (!result.error) {
      onResolved();
      onClose();
    }
  };

  if (!request) return null;

  const r = request;
  const user = r.user;
  const sub = r.subscription;
  const tx = r.transaction;

  return (
    <Overlay onClose={onClose}>
      <div className="bg-white rounded-4xl p-8 max-w-2xl w-full shadow-lavender max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-display text-2xl text-on-surface">
              Resolve Refund
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">#{r._id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon.X />
          </button>
        </div>
        {isResolved && (
          <div className="mb-4 px-4 py-2.5 bg-surface-low border border-surface-highest rounded-2xl text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            This request was already{" "}
            <span
              className={
                r.status === "approved" ? "text-emerald-600" : "text-red-500"
              }
            >
              {r.status}
            </span>{" "}
            — no further action possible.
          </div>
        )}
        {/* User + Plan */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-surface-low rounded-2xl p-4">
            <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
              User
            </p>
            <p className="font-bold text-on-surface">
              {user?.username || user?.name || "—"}
            </p>
            <p className="text-xs text-on-surface-variant">
              {user?.email || "—"}
            </p>
          </div>
          <div className="bg-surface-low rounded-2xl p-4">
            <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
              Plan
            </p>
            <p className="font-bold text-on-surface">
              {sub?.planSnapshot?.name || "—"}
            </p>
            <p className="text-xs text-on-surface-variant capitalize">
              {sub?.planSnapshot?.interval || "—"}
            </p>
          </div>
        </div>

        {/* Transaction + Usage */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-primary-fixed rounded-2xl p-4">
            <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
              Transaction
            </p>
            <p className="font-display text-2xl text-primary">
              ₹{Number(tx?.amount || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Paid {formatDate(tx?.paidAt)}
            </p>
          </div>
          <div className="bg-surface-low rounded-2xl p-4">
            <p className="text-xs text-on-surface-variant mb-2 uppercase tracking-widest">
              Token Usage
            </p>
            <TokenBar used={r.tokensUsed} limit={r.monthlyLimit} />
          </div>
        </div>

        {/* Reason */}
        {r.reason && (
          <div className="bg-surface-low rounded-2xl p-4 mb-4">
            <p className="text-xs text-on-surface-variant mb-1 uppercase tracking-widest">
              User's Reason
            </p>
            <p className="text-sm text-on-surface font-bold">{r.reason}</p>
          </div>
        )}

        {/* Refund Type */}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-2">
            Refund Decision
          </p>
          <div
            className={`grid grid-cols-3 gap-2 ${isResolved ? "opacity-50 pointer-events-none" : ""}`}
          >
            {[
              {
                value: "full",
                label: "Full Refund",
                sub: `₹${Number(txAmount).toLocaleString("en-IN")}`,
              },
              { value: "partial", label: "Partial", sub: "Custom amount" },
              { value: "none", label: "No Refund", sub: "Reject request" },
            ].map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => handleRefundTypeChange(value)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  refundType === value
                    ? value === "none"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-primary-fixed border-primary/30 text-primary"
                    : "bg-surface-low border-surface-highest text-on-surface-variant hover:border-primary/20"
                }`}
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  {label}
                </p>
                <p className="text-xs mt-0.5 opacity-70">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Partial amount input */}
        {refundType === "partial" && (
          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              min={1}
              max={txAmount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              disabled={isResolved}
              className={`input-editorial mt-1 ${isResolved ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder={`Max ₹${txAmount}`}
            />
          </div>
        )}

        {/* User message */}
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Message to User <span className="text-red-400">*</span>
          </label>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="This will be sent to the user via email…"
            rows={3}
            disabled={isResolved}
            className={`input-editorial mt-1 resize-none ${isResolved ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Admin note */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Internal Note (optional)
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Internal note — not sent to user…"
            rows={2}
            disabled={isResolved}
            className={`input-editorial mt-1 resize-none ${isResolved ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>

        {error && (
          <p className="text-xs font-bold text-red-500 mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={resolving || !userMessage.trim() || isResolved}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              refundType === "none"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-primary hover:bg-primary-container text-white"
            }`}
          >
            {resolving
              ? "Processing…"
              : refundType === "none"
                ? "Reject Request"
                : "Process Refund"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-low border border-surface-highest text-on-surface-variant text-sm font-black rounded-xl hover:bg-surface-high transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRefundRequestsPage() {
  const dispatch = useDispatch();
  const { requests, totalCount, page, limit, statusFilter, loading, error } =
    useSelector((s) => s.adminRefunds);

  const [sorting, setSorting] = useState([]);
  const [resolveTarget, setResolveTarget] = useState(null);

  const totalPages = Math.ceil(totalCount / limit);

  useEffect(() => {
    dispatch(fetchAllRefundRequests({ page, limit, status: statusFilter }));
  }, [dispatch, page, limit, statusFilter]);

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
          const user = row.original.user;
          return (
            <div>
              <div className="font-bold text-on-surface">
                {user?.username || user?.name || "—"}
              </div>
              <div className="text-xs text-on-surface-variant">
                {user?.email || "—"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "subscription",
        header: "Plan",
        cell: ({ row }) => {
          const sub = row.original.subscription;
          return (
            <div>
              <div className="font-bold text-on-surface">
                {sub?.planSnapshot?.name || "—"}
              </div>
              <div className="text-xs text-on-surface-variant capitalize">
                {sub?.planSnapshot?.interval || "—"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "transaction",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-display text-base text-primary">
            ₹
            {Number(row.original.transaction?.amount || 0).toLocaleString(
              "en-IN",
            )}
          </span>
        ),
      },
      {
        id: "usage",
        header: "Tokens Used",
        cell: ({ row }) => {
          const { tokensUsed, monthlyLimit } = row.original;
          const pct =
            monthlyLimit > 0
              ? Math.round((tokensUsed / monthlyLimit) * 100)
              : 0;
          const color =
            pct === 0
              ? "text-emerald-600"
              : pct < 50
                ? "text-amber-600"
                : "text-red-600";
          return (
            <div>
              <span className={`text-xs font-black ${color}`}>{pct}%</span>
              <div className="text-xs text-on-surface-variant">
                {tokensUsed?.toLocaleString("en-IN")} tokens
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const v = getValue();
          const cls =
            v === "pending"
              ? "status-pending"
              : v === "approved"
                ? "status-verified"
                : "bg-red-100 text-red-600 border border-red-200";
          return <span className={`status-badge ${cls}`}>{v}</span>;
        },
      },
      {
        accessorKey: "refundType",
        header: "Decision",
        cell: ({ getValue }) => {
          const v = getValue();
          if (!v)
            return <span className="text-xs text-on-surface-variant">—</span>;
          const cls =
            v === "full"
              ? "text-emerald-600"
              : v === "partial"
                ? "text-amber-600"
                : "text-red-500";
          return (
            <span className={`text-xs font-black capitalize ${cls}`}>{v}</span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Requested",
        cell: ({ getValue }) => (
          <span className="text-xs text-on-surface-variant">
            {formatDate(getValue())}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {row.original.status === "pending" && (
              <button
                onClick={() => setResolveTarget(row.original)}
                className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-container transition-colors"
              >
                Resolve
              </button>
            )}
            {row.original.status !== "pending" && (
              <button
                onClick={() => setResolveTarget(row.original)}
                className="p-2 rounded-xl hover:bg-surface-low text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon.Eye />
              </button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: requests,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  // Stats derived from requests

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;
  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">
            Admin
          </p>
          <h1 className="font-display text-4xl text-on-surface">
            Refund Requests
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={totalCount} />
        <StatCard
          label="Pending"
          value={statusFilter === "pending" ? totalCount : pendingCount}
          sub="awaiting review"
        />
        <StatCard
          label="Approved"
          value={statusFilter === "approved" ? totalCount : approvedCount}
        />
        <StatCard
          label="Rejected"
          value={statusFilter === "rejected" ? totalCount : rejectedCount}
        />
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-2">
          <h2 className="font-display text-xl text-on-surface">
            All Requests
            {totalCount > 0 && (
              <span className="text-sm font-body text-on-surface-variant ml-2">
                ({totalCount})
              </span>
            )}
          </h2>
          {/* Status filter pills */}
          <div className="flex gap-2 flex-wrap">
            {["", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  dispatch(setStatusFilter(s));
                  dispatch(setPage(1));
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                  statusFilter === s
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-low text-on-surface-variant border-surface-highest hover:border-primary/30"
                }`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
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
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="table-body-cell text-center text-on-surface-variant py-12"
                    >
                      No refund requests found
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

      {/* Resolve Modal */}
      {resolveTarget && (
        <ResolveModal
          request={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={() => {
            dispatch(
              fetchAllRefundRequests({ page, limit, status: statusFilter }),
            );
          }}
        />
      )}
    </div>
  );
}
