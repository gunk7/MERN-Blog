import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const createComment = createAsyncThunk(
  "comments/createComment",
  async ({ blogId, content, parentCommentId = null }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/comments/", {
        blogId,
        content,
        parentCommentId,
      });

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An Error Occurred While Creating a Comment",
      );
    }
  },
);

export const fetchComments = createAsyncThunk(
  "comments/fetchComments",
  async ({ blogId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/comments/blog/${blogId}`, {
        params: { page, limit },
      });

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An Error Occurred While Fetching Comments",
      );
    }
  },
);

export const fetchReplies = createAsyncThunk(
  "comments/fetchReplies",
  async ({ commentId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/comments/replies/${commentId}`, {
        params: { page, limit },
      });

      return { commentId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An Error Occurred While Fetching Replies",
      );
    }
  },
);

export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const { data } = await API.put(`/comments/${commentId}`, {
        content,
      });

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An Error Occurred While Updating the Comment",
      );
    }
  },
);

export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async ({ commentId }, { rejectWithValue }) => {
    try {
      await API.delete(`/comments/${commentId}`);

      return { commentId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "An Error Occurred While Deleting the Comment",
      );
    }
  },
);

export const toggleLike = createAsyncThunk(
  "comments/toggleLike",
  async ({ commentId, isLiked }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/comments/like/${commentId}`);

      return { commentId, ...data };
    } catch (error) {
      console.error(error);
      return rejectWithValue(
        error.response?.data?.message ||
          "An Error Occurred While Toggling Like",
      );
    }
  },
);
