import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchAllUsage = createAsyncThunk(
  "admin/fetchAllUsage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/usage/all", {
        params: { month, page, limit },
      });
      return response.data || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchUserUsage = createAsyncThunk(
  "admin/fetchUserUsage",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/admin/usage/${userId}`, {
        params: { userId },
      });
      return response.data || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
