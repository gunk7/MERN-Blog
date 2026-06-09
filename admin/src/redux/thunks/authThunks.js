import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const login = createAsyncThunk(
  "auth/login",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/login", values);
      const inputdata = res?.data?.data || {};
      return inputdata;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login Failed");
    }
  },
);

// ── Refresh Token Thunk ───────────────────────────────────────────────────────
export const refreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const refreshToken = state.auth?.refreshToken;

      if (!refreshToken) {
        return rejectWithValue("No refresh token available");
      }

      const res = await API.post("/api/auth/refresh", {
        refreshToken,
      });

      const inputdata = res?.data?.data || {};

      return {
        accessToken: inputdata.accessToken,
        refreshToken: inputdata.refreshToken,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Token Refresh Failed",
      );
    }
  },
);
