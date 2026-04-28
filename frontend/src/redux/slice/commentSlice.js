import { createSlice } from "@reduxjs/toolkit";
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  fetchReplies,
} from "../thunks/commentThunks";

const commentSlice = createSlice({
  name: "comments",
  initialState: {
    comments: [],
    replies: {},
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },

    loading: false,
    error: null,
    likeLoading: {},
  },

  reducers: {
    clearComments: (state) => {
      state.comments = [];
      state.replies = {};
      state.pagination = { page: 1, limit: 10, total: 0 };
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetching Logic
      .addCase(fetchComments.fulfilled, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.comments = action.payload.comments;
        } else {
          state.comments = [...state.comments, ...action.payload.comments];
        }
        state.pagination = action.payload.pagination;
      })

      // Creation Logic (Handles both top-level and replies)
      .addCase(createComment.fulfilled, (state, action) => {
        const newComment = action.payload;
        if (newComment.parentId) {
          const pId = newComment.parentId;
          if (!state.replies[pId]) state.replies[pId] = [];
          state.replies[pId].unshift(newComment);
        } else {
          state.comments.unshift(newComment);
        }
      })

      .addCase(fetchReplies.fulfilled, (state, action) => {
        const { commentId, replies } = action.payload;
        state.replies[commentId] = replies;
      })

      .addCase(updateComment.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.comments.findIndex((c) => c._id === updated._id);
        if (index !== -1) {
          state.comments[index] = updated;
        } else {
          Object.keys(state.replies).forEach((parentId) => {
            const rIndex = state.replies[parentId].findIndex(
              (r) => r._id === updated._id,
            );
            if (rIndex !== -1) state.replies[parentId][rIndex] = updated;
          });
        }
      })

      .addCase(deleteComment.fulfilled, (state, action) => {
        const { commentId } = action.payload;
        state.comments = state.comments.filter((c) => c._id !== commentId);
        delete state.replies[commentId];
      })

      .addCase(toggleLike.fulfilled, (state, action) => {
        const { commentId, likes, isLiked } = action.payload;
        state.likeLoading[commentId] = false;
        const comment = state.comments.find((c) => c._id === commentId);
        if (comment) {
          comment.likes = likes;
          comment.isLiked = isLiked;
        }
      })

      // --- Common Matchers ---

      // Global Pending (Except for Likes to prevent whole-screen blocking)
      .addMatcher(
        (action) =>
          action.type.startsWith("comments/") &&
          action.type.endsWith("/pending"),
        (state, action) => {
          if (action.type.includes("toggleLike")) {
            state.likeLoading[action.meta.arg.commentId] = true;
          } else {
            state.loading = true;
          }
          state.error = null;
        },
      )
      // Global Rejected State
      .addMatcher(
        (action) =>
          action.type.startsWith("comments/") &&
          action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.likeLoading[action.meta.arg?.commentId] = false;
          state.error = action.payload;
        },
      )
      // Stop general loading on success
      .addMatcher(
        (action) =>
          action.type.startsWith("comments/") &&
          action.type.endsWith("/fulfilled"),
        (state) => {
          state.loading = false;
        },
      );
  },
});

export const { clearComments, clearError } = commentSlice.actions;

export default commentSlice.reducer;
