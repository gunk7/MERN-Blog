import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchConsoleLogs = createAsyncThunk(
  "adminConsoleLogs/fetchConsoleLogs",
  async (
    { level, search, startDate, endDate, environment, page, limit } = {},
    { rejectWithValue },
  ) => {
    try {
      const { data } = await API.get("/api/admin/console-logs", {
        params: { level, search, startDate, endDate, environment, page, limit },
      });
      return data; // full response including pagination
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch console logs",
      );
    }
  },
);

export const fetchConsoleLogStats = createAsyncThunk(
  "adminConsoleLogs/fetchConsoleLogStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/admin/console-logs/stats");
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch console log stats",
      );
    }
  },
);

export const deleteConsoleLogs = createAsyncThunk(
  "adminConsoleLogs/deleteConsoleLogs",
  async (
    { level, search, startDate, endDate, environment, amount, keep } = {},
    { rejectWithValue },
  ) => {
    try {
      const { data } = await API.delete("/api/admin/console-logs", {
        params: {
          level,
          search,
          startDate,
          endDate,
          environment,
          amount,
          keep,
        },
      });

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete console logs",
      );
    }
  },
);
