import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/", { params });
      const data = response.data || [];
      console.log(response);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateProfileByAdmin = createAsyncThunk(
  "users/updateProfile",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/admin/${userId}`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/admin/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const toggleUserStatus = createAsyncThunk(
  "users/toggleStatus",
  async ({ userId, active }, { rejectWithValue }) => {
    try {
      const response = await API.patch(`/admin/${userId}`, {
        active,
      });
      return { userId, newStatus: !active };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
// ─── Fetch Detailed User Profile for Admin ────────────────────────────────────
export const fetchUserProfileAdmin = createAsyncThunk(
  "adminUsers/fetchProfile",
  async (username, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/profile/${username}`);
      // Based on your controller, the data is in response.data.data
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// ─── Fetch all blogs (admin view) ────────────────────────────────────────────
// Supports filters: { status, search, category, page, limit }
export const fetchAllBlogsAdmin = createAsyncThunk(
  "adminBlogs/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/blogs", { params });
      console.log(response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.error?.message || error.message);
    }
  },
);

// ─── Fetch single blog by ID (admin view) ────────────────────────────────────

export const fetchBlogByIdAdmin = createAsyncThunk(
  "adminBlogs/fetchById",
  async (blogId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/blogs/${blogId}`);
      console.log(response);
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message);
    }
  },
);

// ─── Update blog status ───────────────────────────────────────────────────────
// payload: { blogId, status: "published" | "draft" | "scheduled", scheduledFor? }
export const updateBlogStatusAdmin = createAsyncThunk(
  "adminBlogs/updateStatus",
  async ({ blogId, status, scheduledFor }, { rejectWithValue }) => {
    try {
      const res = await API.patch(`/admin/blogs/${blogId}/status`, {
        status,
        ...(scheduledFor && { scheduledFor }),
      });
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error?.message);
    }
  },
);

// ─── Delete blog (admin force delete) ────────────────────────────────────────
// hard = true for permanent delete, false for soft-delete
export const deleteBlogAdmin = createAsyncThunk(
  "adminBlogs/delete",
  async ({ blogId, hard = false }, { rejectWithValue }) => {
    try {
      await API.delete(`/admin/blogs/${blogId}`, { params: { hard } });
      return blogId; // return id so we can remove it from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// dashboard status
export const fetchDashboardStats = createAsyncThunk(
  "adminStats/fetchOverview",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/stats");
      return response.data.data; // { users, blogs, topBlogs }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// ─── Fetch activity chart data (last 30 days) ────────────────────────────────
export const fetchActivityChart = createAsyncThunk(
  "adminStats/fetchActivity",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/stats/activity");
      return response.data.data; // { blogs: [{_id, count}], users: [{_id, count}] }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
