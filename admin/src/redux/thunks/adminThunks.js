import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/", { params });
      const data = response.data || [];
      return data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  },
);

export const getAdminProfile = createAsyncThunk(
  "admin/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/me");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateProfileByAdmin = createAsyncThunk(
  "users/updateProfile",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/api/admin/${userId}`, userData);
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
      const response = await API.delete(`/api/admin/${userId}`);
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
      const response = await API.patch(`/api/admin/${userId}`, {
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
      const response = await API.get(`/api/admin/profile/${username}`);
      // Based on your controller, the data is in response.data.data
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// ─── Fetch all blogs (admin view) ────────────────────────────────────────────
export const fetchAllBlogsAdmin = createAsyncThunk(
  "adminBlogs/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const cleanParams = { ...params };

      // "deleted" tab → send deleted=true, remove status
      if (cleanParams.status === "deleted") {
        delete cleanParams.status;
        cleanParams.deleted = true;
      }

      const response = await API.get("/api/admin/blogs", { params: cleanParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || error.message);
    }
  },
);

// ─── Fetch single blog by ID (admin view) ────────────────────────────────────

export const fetchBlogByIdAdmin = createAsyncThunk(
  "adminBlogs/fetchById",
  async (blogId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/admin/blogs/${blogId}`);
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
  async ({ blogId, status, adminNote, scheduledFor }, { rejectWithValue }) => {
    try {
      const res = await API.patch(`/api/admin/blogs/${blogId}/status`, {
        status,
        adminNote,
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
  "admin/deleteBlog",
  async ({ blogId, reason, hard }, { rejectWithValue }) => {
    try {
      // Constructs URL: /api/admin/blogs/123?reason=Content+Policy&hard=false
      const { data } = await API.delete(`/api/admin/blogs/${blogId}`, {
        params: { reason, hard },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  },
);

// dashboard status
export const fetchDashboardStats = createAsyncThunk(
  "adminStats/fetchOverview",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/stats");
      return response.data.data; // { users, blogs, topBlogs }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// ─── Fetch activity chart data (last 30 days) ────────────────────────────────
export const fetchActivityChart = createAsyncThunk(
  "adminStats/fetchActivity",
  async (days = 30, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/stats/activity", {
        params: { days },
      });
      console.log(response);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
