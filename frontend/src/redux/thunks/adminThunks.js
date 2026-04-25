import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";


export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await API.get("/admin/", { params });
      const data = response.data || [];
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
  }
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
