import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const getProfile = createAsyncThunk(
  "users/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      // No need to pass headers here anymore!
      const response = await API.get("/api/user/");

      // Extracting data based on your controller's response structure
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/api/user/${userId}`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const getPublicProfile = createAsyncThunk(
  "user/getPublicProfile",
  async (username, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/user/profile/${username}`);
      console.log(response);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "User not found");
    }
  },
);

export const followUser = createAsyncThunk(
  "user/followUser",
  async (followingId, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/api/follow/${followingId}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to follow");
    }
  },
);

// ── NEW: unfollow ─────────────────────────────────────────────────────────

export const unfollowUser = createAsyncThunk(
  "user/unfollowUser",
  async (followingId, { rejectWithValue }) => {
    try {
      const { data } = await API.delete(`/api/follow/${followingId}`);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to unfollow",
      );
    }
  },
);
