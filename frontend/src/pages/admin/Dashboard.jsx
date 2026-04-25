import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search, Trash2, Edit2 } from "lucide-react";

import Edit from "../../modals/Edit";
import {
  isLoggedIn,
  selectCurrentUser,
} from "../../redux/selectors/authSelectors";
import {
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
  setSelectedUser,
  clearSelectedUser,
} from "../../redux/slice/adminSlice";
import {
  fetchAllUsers,
  deleteUser,
  toggleUserStatus,
} from "../../redux/thunks/adminThunks";
import { confirmAction } from "../../services/modalServices";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = useSelector(isLoggedIn);
  const currentUser = useSelector(selectCurrentUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    users = [],
    loading = false,
    totalCount = 0,
    filters = {},
    page = 1,
    limit = 10,
  } = useSelector((state) => state.admin || {});

  const isFiltered = !!(
    filters.search ||
    (filters.username && filters.username !== "") ||
    (filters.gender && filters.gender !== "") ||
    (filters.country && filters.country !== "") ||
    (filters.searchBy && filters.searchBy !== "All")
  );

  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(updateFilters({ search: searchTerm }));
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch, filters.search]);

  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      dispatch(fetchAllUsers({ ...filters, page, limit }));
    }
  }, [dispatch, token, filters, page, limit]);

  const handleClearFilters = () => {
    setSearchTerm("");
    dispatch(clearFilters());
  };

  const handleFilterChange = useCallback(
    (key, value) => {
      dispatch(updateFilters({ [key]: value }));
    },
    [dispatch],
  );

  const handleToggleVerify = useCallback(
    async (userId, currentStatus) => {
      const actionName = currentStatus ? "Unverify" : "Verify";
      const result = await confirmAction(
        `Confirm ${actionName}?`,
        `Change status to ${currentStatus ? "Unverified" : "Verified"}?`,
        "question",
        `Yes, ${actionName}!`,
      );
      if (result.isConfirmed) {
        dispatch(toggleUserStatus({ userId, active: !currentStatus }))
          .unwrap()
          .then(() => toast.success(`User status updated`))
          .catch((err) => toast.error(err || "Update failed"));
        dispatch(fetchAllUsers());
        navigate("/dashboard");
      }
    },
    [dispatch],
  );

  const handleEdit = useCallback(
    (user) => {
      dispatch(setSelectedUser(user));
      setIsEditModalOpen(true);
    },
    [dispatch],
  );

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    dispatch(clearSelectedUser());
  };

  const handleUpdateUser = () => {
    handleCloseModal();
    dispatch(fetchAllUsers({ ...filters, page, limit }));
  };

  const handleDelete = useCallback(
    async (targetId) => {
      if (currentUser?._id === targetId) {
        return toast.error("You cannot delete your own account.");
      }
      const result = await confirmAction(
        "Are you sure?",
        "User will be removed permanently.",
        "warning",
        "Yes, delete it!",
      );
      if (result.isConfirmed) {
        dispatch(deleteUser(targetId))
          .unwrap()
          .then(() => toast.success("User deleted successfully"))
          .catch((err) => toast.error(err || "Failed to remove user"));
        navigate("/dashboard");
      }
    },
    [currentUser, dispatch],
  );

  const imgUrl = import.meta.env.VITE_API_IMG_URL;

  const columns = useMemo(
    () => [
      {
        id: "avatar",
        header: "Photo",
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <img
              src={
                row.original.profilePic
                  ? `${imgUrl}/${row.original.profilePic}`
                  : "src/assets/image.png"
              }
              alt="Profile"
              className="w-9 h-9 rounded-full border border-primary/10 object-contain p-0.5 bg-surface-low"
            />
          </div>
        ),
      },
      {
        header: "Username",
        accessorKey: "username",
        cell: ({ getValue }) => (
          <span className="font-medium text-on-surface">{getValue()}</span>
        ),
      },
      { header: "First Name", accessorKey: "firstName" },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ getValue }) => (
          <span className="text-on-surface-variant">{getValue()}</span>
        ),
      },
      {
        header: "Gender",
        accessorKey: "gender",
        cell: ({ getValue }) => {
          const val = getValue();
          return (
            <span className="text-on-surface-variant">
              {val ? val.charAt(0).toUpperCase() + val.slice(1) : "—"}
            </span>
          );
        },
      },
      {
        header: "Country",
        accessorKey: "country",
        cell: ({ getValue }) => (
          <span className="text-on-surface-variant">{getValue() || "—"}</span>
        ),
      },
      {
        header: "Status",
        accessorKey: "isVerified",
        cell: ({ row }) => {
          const active = row.original.isAccountVerified;
          return (
            <button
              onClick={() => handleToggleVerify(row.original._id, active)}
              className={`
                relative inline-flex items-center rounded-full text-xs font-bold
                transition-all duration-300 cursor-pointer select-none
                w-36 h-8 px-1
                ${
                  active
                    ? "bg-green-100 border border-green-200"
                    : "bg-amber-100 border border-amber-200"
                }
              `}
              title={`Click to ${active ? "unverify" : "verify"}`}
            >
              {/* sliding pill */}
              <span
                className={`
                  absolute top-1 h-6 w-18 rounded-full transition-all duration-300
                  ${active ? "left-1 bg-green-500" : "left-19 bg-amber-400"}
                `}
              />
              {/* labels */}
              <span
                className={`
                  relative z-10 flex-1 text-center transition-colors duration-300
                  ${active ? "text-white" : "text-amber-700/60"}
                `}
              >
                Verified
              </span>
              <span
                className={`
                  relative z-10 flex-1 text-center transition-colors duration-300
                  ${!active ? "text-white" : "text-green-700/60"}
                `}
              >
                Unverified
              </span>
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              className="p-2 text-primary/60 hover:text-primary hover:bg-primary-fixed rounded-full transition-all duration-200"
              onClick={() => handleEdit(row.original)}
              title="Edit User"
            >
              <Edit2 size={15} />
            </button>
            <button
              className="p-2 text-red-400/60 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
              onClick={() => handleDelete(row.original._id)}
              title="Delete User"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [imgUrl, handleToggleVerify, handleDelete, handleEdit],
  );

  const table = useReactTable({
    data: users,
    columns,
    pageCount: Math.ceil(totalCount / limit),
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
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
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-display text-on-surface leading-tight">
            Admin Dashboard
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant">
            <span className="font-bold text-primary">{totalCount}</span> users
            total
          </p>
        </div>
      </header>

      {/* Main card */}
      <div className="table-container flex flex-col flex-1">
        {/* Filters bar */}
        <div className="px-6 py-4 border-b border-surface-highest/50 flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-65 relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={15}
            />
            <input
              className="input-editorial pl-11 py-2.5 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user database..."
            />
          </div>

          {/* Dropdowns */}
          <div className="flex gap-2 flex-wrap">
            {["searchBy", "country", "gender"].map((key) => (
              <select
                key={key}
                className="input-editorial w-auto py-2.5 px-3 text-xs font-bold cursor-pointer"
                value={filters[key]}
                onChange={(e) => handleFilterChange(key, e.target.value)}
              >
                {key === "searchBy" && (
                  <>
                    <option value="All">All Fields</option>
                    <option value="email">Email</option>
                    <option value="username">Username</option>
                  </>
                )}
                {key === "country" && (
                  <>
                    <option value="">All Countries</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="Russia">Russia</option>
                    <option value="Italy">Italy</option>
                    <option value="Canada">Canada</option>
                  </>
                )}
                {key === "gender" && (
                  <>
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            ))}

            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-primary text-xs font-bold hover:underline transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
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
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-20 text-center text-sm italic text-on-surface-variant"
                  >
                    Syncing user data...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface-low/40 transition-colors duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="table-body-cell text-center">
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
                    className="py-20 text-center text-sm italic text-on-surface-variant"
                  >
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <footer className="px-6 py-4 border-t border-surface-highest/50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-on-surface-variant uppercase">
            <span>
              Total: <span className="text-primary">{totalCount}</span>
            </span>
            <select
              className="bg-transparent border-none outline-none cursor-pointer text-primary text-xs font-bold"
              value={limit}
              onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
            >
              {[5, 10, 20].map((s) => (
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
              {page} <span className="text-on-surface-variant/30 mx-1">/</span>{" "}
              {table.getPageCount() || 1}
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

      {isEditModalOpen && (
        <Edit
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default Dashboard;
