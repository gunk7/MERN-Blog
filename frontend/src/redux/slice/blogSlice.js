import { createSlice } from "@reduxjs/toolkit";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogsByUser,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  getBlogBySlug,
  searchUsers,
} from "../thunks/blogThunks";

const DRAFT_INITIAL = {
  title: "",
  description: "",
  contentHtml: "",
  contentJson: {},
  category: "None",
  status: "draft",
  tags: [],
};

const blogSlice = createSlice({
  name: "blog",
  initialState: {
    loading: false,
    error: null,

    blogs: [],
    userBlogs: [],
    currentBlog: null,

    //Blog Draft
    draft: DRAFT_INITIAL,

    // ── search results for Accounts tab
    userSearchResults: [],
    userSearchLoading: false,
    userSearchPagination: null,

    activeTab: "all",

    query: {
      search: "",
      categories: [], // ← was `category: ""`, now an array for multi-select
      page: 1,
      limit: 10,
    },

    pagination: {
      totalBlogs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },

    createSuccess: false,
    updateSuccess: false,
    deleteSuccess: false,
  },

  reducers: {
    clearBlogState: (state) => {
      state.error = null;
      state.createSuccess = false;
      state.updateSuccess = false;
      state.deleteSuccess = false;
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
    },
    resetBlogs: (state) => {
      state.blogs = [];
      state.pagination = {
        totalBlogs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    },
    setQuery: (state, action) => {
      const isPageUpdate = Object.keys(action.payload).includes("page");
      state.query = {
        ...state.query,
        ...action.payload,
        page: isPageUpdate ? action.payload.page : 1,
      };
    },

    // Toggle a category in/out of the selected array
    toggleCategory: (state, action) => {
      const cat = action.payload;
      const idx = state.query.categories.indexOf(cat);
      if (idx === -1) {
        state.query.categories.push(cat);
      } else {
        state.query.categories.splice(idx, 1);
      }
      state.query.page = 1;
      // reset blogs so fresh fetch happens
      state.blogs = [];
      state.pagination = {
        totalBlogs: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    },

    clearCategories: (state) => {
      state.query.categories = [];
      state.query.page = 1;
      state.blogs = [];
    },

    clearUserSearch: (state) => {
      state.userSearchResults = [];
      state.userSearchPagination = null;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    saveDraft: (state, action) => {
      state.draft = { ...state.draft, ...action.payload };
    },
    clearDraft: (state) => {
      state.draft = DRAFT_INITIAL;
    },
  },

  extraReducers: (builder) => {
    builder
      // ── getAllBlogs ───────────────────────────────────────────────────
      .addCase(getAllBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const { blogs, pagination } = action.payload;
        if (state.query.page === 1) {
          state.blogs = blogs;
        } else {
          const existingIds = new Set(state.blogs.map((b) => b._id));
          state.blogs.push(...blogs.filter((b) => !existingIds.has(b._id)));
        }
        state.pagination = pagination;
      })

      // ── getBlogById ───────────────────────────────────────────────────
      .addCase(getBlogById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentBlog = null;
      })
      .addCase(getBlogById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })

      // ── getBlogsByUser ────────────────────────────────────────────────
      .addCase(getBlogsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBlogsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload.blogs || action.payload;
      })

      // ── getBlogBySlug ─────────────────────────────────────────────────
      .addCase(getBlogBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentBlog = null;
      })
      .addCase(getBlogBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })

      // ── getMyBlogs ────────────────────────────────────────────────────
      .addCase(getMyBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.userBlogs = action.payload;
      })

      // ── createBlog ────────────────────────────────────────────────────
      .addCase(createBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createSuccess = false;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.userBlogs.unshift(action.payload);
        state.draft = DRAFT_INITIAL;
      })

      // ── updateBlog ────────────────────────────────────────────────────
      .addCase(updateBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.updateSuccess = true;
        const updatedBlog =
          action.payload.data?.blog || action.payload.blog || action.payload;
        if (!updatedBlog?._id) return;
        const update = (list) => {
          const i = list.findIndex((b) => b._id === updatedBlog._id);
          if (i !== -1) list[i] = updatedBlog;
        };
        update(state.blogs);
        update(state.userBlogs);
        if (state.currentBlog?._id === updatedBlog._id) {
          state.currentBlog = updatedBlog;
        }
      })

      // ── deleteBlog ────────────────────────────────────────────────────
      .addCase(deleteBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.deleteSuccess = false;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.deleteSuccess = true;
        const id = action.payload?.data?.blog?._id ?? action.payload;
        state.blogs = state.blogs.filter((b) => b._id !== id);
        state.userBlogs = state.userBlogs.filter((b) => b._id !== id);
        if (state.currentBlog?._id === id) state.currentBlog = null;
      })

      // ── searchUsers ───────────────────────────────────────────────────
      .addCase(searchUsers.pending, (state) => {
        state.userSearchLoading = true;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.userSearchLoading = false;
        state.userSearchResults = action.payload.users;
        state.userSearchPagination = action.payload.pagination;
      })
      .addCase(searchUsers.rejected, (state) => {
        state.userSearchLoading = false;
      })

      // ── all rejected ──────────────────────────────────────────────────
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        },
      );
  },
});

export const {
  clearBlogState,
  clearCurrentBlog,
  resetBlogs,
  setQuery,
  toggleCategory,
  clearCategories,
  clearUserSearch,
  setActiveTab,
  saveDraft,
  clearDraft,
} = blogSlice.actions;

export default blogSlice.reducer;
