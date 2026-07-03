import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";


export const fetchErrorLogs = createAsyncThunk(
  "adminErrors/fetchErrorLogs",
  async (
    { category, level, source, environment, search } = {},
    { rejectWithValue },
  ) => {
    try {
      const { data } = await API.get("/api/admin/errors", {
        params: { category, level, source, environment, search },
      });
      return data; // keep full response — slice needs pagination too
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch error logs",
      );
    }
  },
);

export const fetchErrorLogById = createAsyncThunk(
  "adminErrors/fetchErrorLogById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/api/admin/errors/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch error log",
      );
    }
  },
);

export const fetchErrorsByCategory = createAsyncThunk(
  "adminErrors/fetchErrorsByCategory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/admin/errors/by-category", {
        params,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch errors by category",
      );
    }
  },
);

export const fetchErrorsByErrorCode = createAsyncThunk(
  "adminErrors/fetchErrorsByErrorCode",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/admin/errors/by-error-code", {
        params,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch errors by error code",
      );
    }
  },
);

export const fetchErrorSourceContext = createAsyncThunk(
  "adminErrors/fetchErrorSourceContext",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/api/admin/errors/${id}/source`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch error source context",
      );
    }
  },
);

export const updateErrorResolution = createAsyncThunk(
  "adminErrors/updateErrorResolution",
  async ({ id, resolved, note }, { rejectWithValue }) => {
    try {
      const { data } = await API.patch(`/api/admin/errors/${id}/resolve`, {
        resolved,
        note,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update error resolution",
      );
    }
  },
);
