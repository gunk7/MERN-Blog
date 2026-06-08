import { createSlice } from "@reduxjs/toolkit";
import {
  deleteBlogAdmin,
  fetchAllBlogsAdmin,
  fetchBlogByIdAdmin,
  fetchDashboardStats,
  updateBlogStatusAdmin,
  fetchActivityChart,
} from "../thunks/adminThunks";

const adminBlogSlice = createSlice({
  name: "adminBlogs",
  initialState: {
    blogs: [],
    totalCount: 0,
    page: 1,
    limit: 10,
    filters: {
      search: "",
      status: "", // "published" | "draft" | "scheduled" | ""
      category: "",
    },

    //single blog
    selectedBlog: null,

    //dashboard Status

    stats: null,
    activity: null,

    // Loading states per operation
    loading: {
      list: false,
      detail: false,
      statusUpdate: false,
      delete: false,
      stats: false,
      activity: false,
    },

    error: null,
  },

  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },

    setLimit: (dtate, action) => {
      state.limit = action.payload;
    },

    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
    },
    clearFilters: (state) => {
      state.filters = { search: "", status: "", category: "" };
      state.page = 1;
    },
    setSelectedBlog: (state, action) => {
      state.selectedBlog = action.payload;
    },
    clearSelectedBlog: (state) => {
      state.selectedBlog = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ── Fetch all blogs ───────────────────────────────────────────────────────
    builder
      .addCase(fetchAllBlogsAdmin.pending, (state) => {
        state.loading.list = true;
        state.error = null;
      })
      .addCase(fetchAllBlogsAdmin.fulfilled, (state, action) => {
        state.loading.list = false;
        state.blogs = action.payload.blogs || [];
        state.totalCount = action.payload.pagination?.totalBlogs || 0;
      })
      .addCase(fetchAllBlogsAdmin.rejected, (state, action) => {
        state.loading.list = false;
        state.error = action.payload;
      });

    // ── Fetch single blog ─────────────────────────────────────────────────────
    builder
      .addCase(fetchBlogByIdAdmin.pending, (state) => {
        state.loading.detail = true;
        state.error = null;
      })
      .addCase(fetchBlogByIdAdmin.fulfilled, (state, action) => {
        state.loading.detail = false;
        state.selectedBlog = action.payload.data?.blog || action.payload;
      })
      .addCase(fetchBlogByIdAdmin.rejected, (state, action) => {
        state.loading.detail = false;
        state.error = action.payload;
      });

    // ── Update blog status ────────────────────────────────────────────────────
    builder
      .addCase(updateBlogStatusAdmin.pending, (state) => {
        state.loading.statusUpdate = true;
        state.error = null;
      })
      .addCase(updateBlogStatusAdmin.fulfilled, (state, action) => {
        state.loading.statusUpdate = false;
        const updated = action.payload?.blog || action.payload;
        if (!updated?._id) return;

        // Patch the blog in the list without a refetch
        const idx = state.blogs.findIndex((b) => b._id === updated._id);
        if (idx !== -1) {
          state.blogs[idx] = { ...state.blogs[idx], ...updated };
        }

        // Also update selectedBlog if it's open
        if (state.selectedBlog?._id === updated._id) {
          state.selectedBlog = { ...state.selectedBlog, ...updated };
        }
      })
      .addCase(updateBlogStatusAdmin.rejected, (state, action) => {
        state.loading.statusUpdate = false;
        state.error = action.payload;
      });

    // ── Delete blog ───────────────────────────────────────────────────────────
    builder
      .addCase(deleteBlogAdmin.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteBlogAdmin.fulfilled, (state, action) => {
        state.loading.delete = false;
        const deletedId = action.payload; // thunk returns blogId
        state.blogs = state.blogs.filter((b) => b._id !== deletedId);
        state.totalCount = Math.max(0, state.totalCount - 1);
        if (state.selectedBlog?._id === deletedId) {
          state.selectedBlog = null;
        }
      })
      .addCase(deleteBlogAdmin.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      });

    // ── Dashboard stats ───────────────────────────────────────────────────────
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      });

    // ── Activity chart ────────────────────────────────────────────────────────
    builder
      .addCase(fetchActivityChart.pending, (state) => {
        state.loading.activity = true;
        state.error = null;
      })
      .addCase(fetchActivityChart.fulfilled, (state, action) => {
        state.loading.activity = false;
        state.activity = action.payload;
      })
      .addCase(fetchActivityChart.rejected, (state, action) => {
        state.loading.activity = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
  clearError,
  setSelectedBlog,
  clearSelectedBlog,
} = adminBlogSlice.actions;

export default adminBlogSlice.reducer;
