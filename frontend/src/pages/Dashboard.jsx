import React, { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Search,
  Trash2,
  Edit2,
} from "lucide-react";

import Edit from "../modals/Edit";
import { logout } from "../redux/slice/authSlice"; // Added back for the logout button
import {
  isLoggedIn,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";

import {
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
  setSelectedUser,
  clearSelectedUser,
} from "../redux/slice/adminSlice";
import {
  fetchAllUsers,
  deleteUser,
  toggleUserStatus,
} from "../redux/thunks/adminThunks";
import { confirmAction } from "../services/modalServices";

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
    (filters.gender && filters.gender !== "") ||
    (filters.country && filters.country !== "") ||
    (filters.searchBy && filters.searchBy !== "All")
  );

  const [searchTerm, setSearchTerm] = useState(filters.search || "");

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // --- DEBOUNCE SEARCH ---
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== filters.search) {
        dispatch(updateFilters({ search: searchTerm }));
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch, filters.search]);

  // Auth Guard
  useEffect(() => {
    if (!token) navigate("/");
  }, [token, navigate]);

  // --- MAIN FETCH EFFECT ---
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
      }
    },
    [dispatch],
  );

  const handleEdit = useCallback(
    (user) => {
      dispatch(setSelectedUser(user)); // Put the specific user in Redux
      setIsEditModalOpen(true);
    },
    [dispatch],
  );


  // Close handler must clean up:
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    dispatch(clearSelectedUser()); // Ensure Redux is empty for the next use
  };

  const handleUpdateUser = () => {
  handleCloseModal(); // Close and clear
  dispatch(fetchAllUsers({ ...filters, page, limit })); // Refresh table
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
      }
    },
    [currentUser, dispatch],
  );

  const imgUrl = import.meta.env.VITE_API_IMG_URL;

  // --- TABLE COLUMNS ---
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
                  : "/default-avatar.png"
              }
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-black/5 shadow-sm"
            />
          </div>
        ),
      },
      { header: "Username", accessorKey: "username" },
      { header: "Email", accessorKey: "email" },
      {
        header: "Gender",
        accessorKey: "gender",
        cell: ({ getValue }) => {
          const val = getValue();
          return val ? val.charAt(0).toUpperCase() + val.slice(1) : "N/A";
        },
      },
      {
        header: "Country",
        accessorKey: "country",
        cell: ({ getValue }) => getValue() || "N/A",
      },
      {
        header: "Status",
        accessorKey: "isVerified",
        cell: ({ row }) => {
          const active = row.original.isAccountVerified;
          return (
            <button
              onClick={() => handleToggleVerify(row.original._id, active)}
              className={`status-badge flex items-center gap-1 mx-auto ${
                active ? "status-verified" : "status-pending"
              }`}
            >
              {active ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
              {active ? "Verified" : "Pending"}
            </button>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
              onClick={() => handleEdit(row.original)}
              title="Edit User"
            >
              <Edit2 size={18} />
            </button>
            <button
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              onClick={() => handleDelete(row.original._id)}
              title="Delete User"
            >
              <Trash2 size={18} />
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
    <div className="min-h-screen w-full bg-[#fcfcfc] flex flex-col">
      {/* --- Top Header --- */}
      <header className="px-8 py-5 bg-white border-b border-black/5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-on-surface" >
            Admin Dashboard
          </h1>
          <p className="text-xs text-on-surface-variant font-medium italic">
            Management Portal
          </p>
        </div>
        
      </header>

      {/* --- Content Area --- */}
      <div className="flex-1 flex flex-col p-8 gap-6">
        {/* --- Filters --- */}
        <section className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[320px] relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              className="input-editorial pl-12 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user database..."
            />
          </div>

          <div className="flex gap-2">
            {["searchBy", "country", "gender"].map((key) => (
              <select
                key={key}
                className="input-editorial w-auto! py-2! px-3! text-xs! font-bold bg-white border-gray-200 cursor-pointer"
                value={filters[key]}
                onChange={(e) => handleFilterChange(key, e.target.value)}
              >
                {key === "searchBy" && (
                  <>
                    <option value="All">All Fields</option>
                    <option value="firstName">First Name</option>
                    <option value="email">Email</option>
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
                className="px-3 text-primary text-xs font-bold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </section>

        {/* --- Table Section --- */}
        <main className="flex-1 bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-center">
              <thead className="bg-surface-low/30 sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-black/5"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-black/3">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="p-20 text-sm italic text-gray-400"
                    >
                      Syncing user data...
                    </td>
                  </tr>
                ) : users.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-primary/1 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="p-4 text-sm text-on-surface"
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
                      className="p-20 text-sm italic text-gray-400"
                    >
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* --- Pagination Footer --- */}
          <footer className="px-8 py-4 bg-white border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
              <span>
                Total: <span className="text-primary">{totalCount}</span>
              </span>
              <select
                className="bg-transparent border-none outline-none cursor-pointer text-primary"
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

            <div className="flex items-center gap-6">
              <button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                className="disabled:opacity-20 hover:text-primary transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-display text-lg font-bold">
                {page} <span className="text-black/10 mx-1">/</span>{" "}
                {table.getPageCount() || 1}
              </span>
              <button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                className="disabled:opacity-20 hover:text-primary transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </footer>
        </main>
      </div>

      {isEditModalOpen && (
        <Edit
          isOpen={isEditModalOpen}
          onClose={handleCloseModal} // Use the combined close/cleanup handler
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default Dashboard;
