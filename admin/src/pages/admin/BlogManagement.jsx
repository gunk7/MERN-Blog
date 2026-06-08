import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Eye,
  MoreHorizontal,
  Calendar,
  AlertCircle,
} from "lucide-react";

import {
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
} from "../../redux/slice/adminBlogSlice";
import {
  fetchAllBlogsAdmin,
  deleteBlogAdmin,
  updateBlogStatusAdmin,
} from "../../redux/thunks/adminThunks";
import { confirmAction } from "../../services/modalServices";
import ScheduleModal from "../../modals/ScheduleModal";

const fmt = (n = 0) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    published: "status-badge status-verified",
    draft:
      "status-badge bg-surface-high text-on-surface-variant border border-surface-highest",
    scheduled:
      "status-badge bg-primary-fixed text-primary border border-primary-fixed-dim",
    under_review:
      "status-badge bg-amber-100 text-amber-700 border border-amber-200",
  };
  return (
    <span
      className={
        map[status] || "status-badge bg-surface-high text-on-surface-variant"
      }
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "published"
            ? "bg-green-500"
            : status === "scheduled"
              ? "bg-primary"
              : status === "under_review"
                ? "bg-amber-500"
                : "bg-on-surface-variant/40"
        }`}
      />
      {status.replace("_", " ")}
    </span>
  );
};

// ─── Status dropdown ──────────────────────────────────────────────────────────
const StatusSelect = ({ blog }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.adminBlogs);
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const options = ["published", "draft", "scheduled", "under_review"].filter(
    (s) => s !== blog.status,
  );

  const handleStatusClick = (newStatus) => {
    setOpen(false);

    if (newStatus === "scheduled") {
      setIsModalOpen(true);
      return;
    }

    if (newStatus === "under_review") {
      const reason = window.prompt("Reason for flagging this post:");
      if (reason === null) return;
      dispatch(
        updateBlogStatusAdmin({
          blogId: blog._id,
          status: "under_review",
          adminNote: reason,
        }),
      )
        .unwrap()
        .then(() => toast.success("Moved to review"))
        .catch((e) => toast.error(e || "Failed to update status"));
      return;
    }

    dispatch(updateBlogStatusAdmin({ blogId: blog._id, status: newStatus }))
      .unwrap()
      .then(() => toast.success(`Moved to ${newStatus}`))
      .catch((e) => toast.error(e || "Failed to update status"));
  };

  const handleScheduleConfirm = (date) => {
    dispatch(
      updateBlogStatusAdmin({
        blogId: blog._id,
        status: "scheduled",
        scheduledFor: new Date(date),
      }),
    )
      .unwrap()
      .then(() => {
        toast.success("Blog scheduled successfully");
        setIsModalOpen(false);
      })
      .catch((e) => toast.error(e || "Scheduling failed"));
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          disabled={loading?.statusUpdate}
          className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <StatusBadge status={blog.status} />
          <MoreHorizontal size={12} className="text-on-surface-variant" />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-0 bottom-full mb-1 z-20 bg-white border border-black/5 rounded-2xl shadow-lavender py-1 min-w-36 flex flex-col overflow-hidden">
              {options.map((o) => (
                <button
                  key={o}
                  onClick={() => handleStatusClick(o)}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-low transition-colors capitalize"
                >
                  → {o.replace("_", " ")}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleScheduleConfirm}
      />
    </>
  );
};

// ─── Admin Note pill ──────────────────────────────────────────────────────────
const AdminNotePill = ({ note }) => {
  const [expanded, setExpanded] = useState(false);
  if (!note) return null;
  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      className="flex items-start gap-1.5 mt-1.5 text-left group max-w-xs"
    >
      <AlertCircle size={11} className="text-amber-500 shrink-0 mt-0.5" />
      <span
        className={`text-[10px] text-amber-700 leading-relaxed ${
          expanded ? "" : "line-clamp-1"
        }`}
      >
        {note}
      </span>
    </button>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const BlogManagement = () => {
  const dispatch = useDispatch();
  const imgUrl = import.meta.env.VITE_API_IMG_URL;

  const {
    blogs = [],
    totalCount = 0,
    page = 1,
    limit = 10,
    filters = {},
    loading = {},
  } = useSelector((s) => s.adminBlogs || {});

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const isFiltered = !!(filters.search || filters.status || filters.category);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const d = Math.floor(Math.abs(diff) / 86400000);
    if (diff < 0) {
      if (d === 0) return "Coming up today";
      if (d === 1) return "Tomorrow";
      return `In ${d} days`;
    }
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== filters.search)
        dispatch(updateFilters({ search: searchTerm }));
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, dispatch, filters.search]);

  useEffect(() => {
    dispatch(fetchAllBlogsAdmin({ ...filters, page, limit }));
  }, [dispatch, filters, page, limit]);

  const handleClearFilters = () => {
    setSearchTerm("");
    dispatch(clearFilters());
  };

  const handleDelete = useCallback(
    async (blogId) => {
      const reason = window.prompt("Reason for flagging this post:");
      if (reason === null) return;

      const result = await confirmAction(
        "Flag this post?",
        "It will be moved to 'Under Review' and hidden from the public.",
        "warning",
        "Yes, Flag it",
      );
      if (!result.isConfirmed) return;

      dispatch(deleteBlogAdmin({ blogId, reason }))
        .unwrap()
        .then(() => toast.success("Post flagged for review"))
        .catch((e) => toast.error(e || "Action failed"));
    },
    [dispatch],
  );

  const columns = useMemo(
    () => [
      {
        id: "cover",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {row.original.coverImage ? (
              <img
                src={row.original.coverImage}
                alt={row.original.title}
                className="w-10 h-10 rounded-xl object-cover border border-surface-highest/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-on-surface-variant/30">
                ✦
              </div>
            )}
          </div>
        ),
      },
      {
        header: "Title",
        accessorKey: "title",
        cell: ({ row }) => (
          <div className="max-w-xs text-left">
            <Link
              to={`/blogs/${row.original._id}`}
              className="font-medium text-on-surface truncate hover:text-primary transition-colors duration-200 block"
            >
              {row.original.title}
            </Link>
            {row.original.category && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-0.5">
                {row.original.category}
              </p>
            )}
          </div>
        ),
      },
      {
        header: "Author",
        id: "author",
        cell: ({ row }) => {
          const a = row.original.author;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {a?.username?.slice(0, 2).toUpperCase() ?? "—"}
              </div>
              <span className="text-sm text-on-surface-variant truncate max-w-25">
                {a?.username || "—"}
              </span>
            </div>
          );
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <StatusSelect blog={row.original} />
            {/* ← Show adminNote under status badge */}
            {row.original.status === "under_review" &&
              row.original.adminNote && (
                <AdminNotePill note={row.original.adminNote} />
              )}
            {row.original.status === "scheduled" &&
              row.original.scheduledFor && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-primary px-2 py-0.5 bg-primary-fixed rounded-md animate-pulse border border-primary/10">
                  <Calendar size={10} />
                  {new Date(row.original.scheduledFor).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
          </div>
        ),
      },
      {
        header: "Views",
        accessorKey: "viewsCount",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-on-surface-variant text-xs font-bold justify-center">
            <Eye size={11} /> {fmt(row.original.viewsCount || 0)}
          </span>
        ),
      },
      {
        header: "Date",
        id: "date",
        cell: ({ row }) => (
          <span className="text-xs text-on-surface-variant">
            {row.original.publishedAt ? (
              timeAgo(row.original.publishedAt)
            ) : (
              <span className="italic opacity-50">—</span>
            )}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              className="p-2 text-red-400/60 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
              onClick={() => handleDelete(row.original._id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [imgUrl, handleDelete, timeAgo],
  );

  const table = useReactTable({
    data: blogs,
    columns,
    pageCount: Math.ceil(totalCount / limit),
    state: { pagination: { pageIndex: page - 1, pageSize: limit } },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: page - 1, pageSize: limit })
          : updater;
      if (next.pageIndex + 1 !== page) dispatch(setPage(next.pageIndex + 1));
      if (next.pageSize !== limit) dispatch(setLimit(next.pageSize));
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8 flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Content
          </p>
          <h1 className="text-3xl font-display text-on-surface leading-tight">
            All Posts
          </h1>
        </div>
        <p className="text-xs text-on-surface-variant">
          <span className="font-bold text-primary">{totalCount}</span> posts
          total
        </p>
      </header>

      <div className="table-container flex flex-col flex-1">
        <div className="px-6 py-4 border-b border-surface-highest/50 space-y-4">
          {/* ── Filter Tabs — Deleted removed ── */}
          <div className="flex gap-1.5 bg-surface-low p-1 rounded-2xl w-fit border border-surface-highest/50">
            {[
              { label: "All", value: "" },
              { label: "Review", value: "under_review" },
              { label: "Scheduled", value: "scheduled" },
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
            ].map((tab) => (
              <button
                key={tab.label}
                onClick={() => dispatch(updateFilters({ status: tab.value }))}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  (filters.status || "") === tab.value
                    ? "bg-white text-primary shadow-lavender border border-black/5"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-64 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                size={15}
              />
              <input
                className="input-editorial pl-11 py-2.5 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search posts..."
              />
            </div>
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-primary text-xs font-bold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="table-header-cell">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading.list ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-20 text-center italic text-on-surface-variant"
                  >
                    Loading posts...
                  </td>
                </tr>
              ) : blogs.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-low/40 transition-colors duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="table-body-cell text-center whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-20 text-center italic text-on-surface-variant"
                  >
                    No posts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="px-6 py-4 border-t border-surface-highest/50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            <span>
              Total: <span className="text-primary">{totalCount}</span>
            </span>
            <select
              className="bg-transparent border-none outline-none text-primary"
              value={limit}
              onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
            >
              {[10, 15, 20].map((s) => (
                <option key={s} value={s}>
                  Show {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="disabled:opacity-20 hover:text-primary transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-display text-lg font-bold text-on-surface">
              {page} / {table.getPageCount() || 1}
            </span>
            <button
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="disabled:opacity-20 hover:text-primary transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BlogManagement;
