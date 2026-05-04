import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllUsers,
  deleteUser,
  toggleUserStatus,
  fetchUserProfileAdmin,
} from "../thunks/adminThunks";

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    selectedUser: null,
    totalCount: 0,

    selectedUserProfile: {
      userDetail: null,
      stats: null,
      blogs: [],
    },

    loading: false,
    profileLoading: false,
    error: null,
    page: 1,
    limit: 10,
    filters: { search: "", searchBy: "All", country: "", gender: "" },
  },
  reducers: {
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1; // Reset to page 1 on search
    },
    clearFilters: (state) => {
      state.filters = { search: "", searchBy: "All", country: "", gender: "" };
      state.page = 1;
    },
    clearSelectedUserProfile: (state) => {
      state.selectedUserProfile = { userDetail: null, stats: null, blogs: [] };
    },
  },
  extraReducers: (builder) => {
    // --- FETCH ALL USERS ---
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        const userData = action.payload?.users?.data;
        const pagination = action.payload?.users?.pagination;

        state.users = Array.isArray(userData) ? userData : [];
        state.totalCount = pagination?.totalItems || 0;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // --- FETCH DETAILED USER PROFILE ---
    builder
      .addCase(fetchUserProfileAdmin.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfileAdmin.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.selectedUserProfile = action.payload; // Sets userDetail, stats, and blogs
      })
      .addCase(fetchUserProfileAdmin.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      });

    builder.addCase(deleteUser.fulfilled, (state, action) => {
      const deletedId = action.meta.arg;
      state.users = state.users.filter((user) => user._id !== deletedId);
      state.totalCount -= 1;
    });

    // --- TOGGLE STATUS ---
    builder.addCase(toggleUserStatus.fulfilled, (state, action) => {
      const { userId, newStatus } = action.payload;
      const user = state.users.find((u) => u._id === userId);
      if (user) {
        // Note: Ensure key matches your data (isVerified vs isAccountVerified)
        user.isAccountVerified = newStatus;
      }
    });
  },
});

export const {
  setSelectedUser,
  clearSelectedUser,
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
  clearSelectedUserProfile,
} = adminSlice.actions;
export default adminSlice.reducer;
