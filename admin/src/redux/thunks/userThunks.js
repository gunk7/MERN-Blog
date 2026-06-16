import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const getProfile = createAsyncThunk(
  "users/getProfile",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/user/");
      const data = response.data || [];
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const updateProfile = createAsyncThunk(
  "users/${userId}",
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/api/user/${userId}`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
