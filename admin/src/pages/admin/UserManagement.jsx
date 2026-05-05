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
import axios from "axios";
const UserManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const token = useSelector(isLoggedIn);
  const currentUser = useSelector(selectCurrentUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [countries, setCountries] = useState([]);

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

  useEffect(() => {
    let mounted = true;

    const getCountries = async () => {
      try {
        const { data } = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name",
        );

        const sortedNames = data
          .map((c) => c.name.common)
          .sort((a, b) => a.localeCompare(b));

        if (mounted) setCountries(sortedNames);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };

    if (!countries.length) getCountries();

    return () => {
      mounted = false;
    };
  }, []);

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
        navigate("/users");
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
        navigate("/users");
      }
    },
    [currentUser, dispatch],
  );

  const imgUrl = import.meta.env.VITE_API_IMG_URL;
  const defaultAvatar = `${imgUrl}
            /uploads/images/profilePics/blank.jpg`;
  const columns = useMemo(
    () => [
      {
        id: "avatar",
        header: "Profile Photo",
        cell: ({ row }) => (
          <div
            className="flex items-center justify-center"
            onClick={() => {
              navigate(`/users/profile/${row.original.username}`);
            }}
          >
            <img
              src={
                row.original.profilePic
                  ? `${imgUrl}/${row.original.profilePic}`
                  : defaultAvatar || "/src/assets/image.png"
              }
              onError={(e) => {
                e.target.onerror = null; // prevents infinite loop
                e.target.src = defaultAvatar || "/src/assets/image.png";
              }}
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
            <div className="flex items-center justify-center">
              <button
                onClick={() => handleToggleVerify(row.original._id, active)}
                className={`
            relative inline-flex h-6 w-11 items-center rounded-full 
            transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${active ? "bg-green-500 focus:ring-green-500" : "bg-gray-300 focus:ring-gray-400"}
          `}
                title={
                  active
                    ? "Verified - Click to unverify"
                    : "Unverified - Click to verify"
                }
              >
                <span
                  className={`
              flex h-4 w-4 transform items-center justify-center rounded-full bg-white 
              transition-transform duration-300 shadow-sm
              ${active ? "translate-x-6" : "translate-x-1"}
            `}
                >
                  {/* Minimalist Verified Icon (Checkmark) */}
                  {active && (
                    <svg
                      className="h-3 w-3 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </span>
                
              </button>
            </div>
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
    [imgUrl, navigate, handleToggleVerify, handleDelete, handleEdit],
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
            User Dashboard
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
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
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

export default UserManagement;
