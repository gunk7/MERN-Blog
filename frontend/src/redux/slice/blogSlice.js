import { createSlice } from "@reduxjs/toolkit";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogsByUser,
  getMyBlogs,
  updateBlog,
  deleteBlog,
} from "../thunks/blogThunks";

const blogSlice = createSlice({
  name: "blog",
  initialState: {
    loading: false,
    error: null,
    blogs: [],
    userBlogs: [],
    currentBlog: null,
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
  },
  extraReducers: (builder) => {
    builder
      // ── Get All
      .addCase(getAllBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload;
      })

      // ── Get By ID
      .addCase(getBlogById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentBlog = null;
      })
      .addCase(getBlogById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })

      // ── Get By User (public profile)
      .addCase(getBlogsByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBlogsByUser.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload;
      })

      // ── Get My Blogs (own dashboard)
      .addCase(getMyBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.userBlogs = action.payload;
      })

      // ── Create
      .addCase(createBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createSuccess = false;
      })
      .addCase(createBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.userBlogs.unshift(action.payload);
      })

      // ── Update
      .addCase(updateBlog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
     .addCase(updateBlog.fulfilled, (state, action) => {
  state.loading = false;
  state.updateSuccess = true;

  // 1. Extract the actual blog object based on your API structure
  // Based on your logs, it's likely action.payload.data.blog or action.payload.blog
  const updatedBlog = action.payload.data?.blog || action.payload.blog || action.payload;

  if (!updatedBlog || !updatedBlog._id) return;

  const update = (list) => {
    const i = list.findIndex((b) => b._id === updatedBlog._id);
    if (i !== -1) {
      list[i] = updatedBlog;
    }
  };

  update(state.blogs);
  update(state.userBlogs);

  // 2. Update currentBlog so the UI reflects the new images immediately
  if (state.currentBlog?._id === updatedBlog._id) {
    state.currentBlog = updatedBlog;
  }
})

      // ── Delete
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

      // ── All rejected
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        },
      );
  },
});

export const { clearBlogState, clearCurrentBlog } = blogSlice.actions;
export default blogSlice.reducer;
