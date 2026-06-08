import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchAllSubscriptions = createAsyncThunk(
  "admin/fetchAllSubscriptions",
  async (
    { page, limit, search, name, interval, status },
    { rejectWithValue },
  ) => {
    try {
      const response = await API.get("/admin/subscription/all", {
        params: { page, limit, search, name, interval, status },
      });
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchSubscriptionStats = createAsyncThunk(
  "admin/fetchSubscriptionStats",
  async ({ search, name, interval, status }, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/subscription/stats", {
        params: { search, name, interval, status },
      });
      return response.data || {};
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
