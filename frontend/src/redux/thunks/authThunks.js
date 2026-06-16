import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";
import { logout } from "../slice/authSlice";

export const login = createAsyncThunk(
  "auth/login",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/login", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Login Failed");
    }
  },
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/signup", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Signup Failed");
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/verify", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(
        err.response.data.message || "Otp Verification Failed",
      );
    }
  },
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/resendOtp", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(err.response.data.message || "Otp Resend Failed");
    }
  },
);

export const changePasswordReq = createAsyncThunk(
  "auth/changePasswordReq",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/change_password_request", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(err.response.data.message || "Otp Resend Failed");
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/change_password", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(
        err.response.data.message || "Password Change Failed",
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/forgot_password", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(
        err.response.data.message || "Password Change Failed",
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (values, { rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/reset_password", values);
      const inputdata = res?.data?.data || null;
      return inputdata;
    } catch (err) {
      return rejectWithValue(
        err.response.data.message || "Password Change Failed",
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (logoutData, { dispatch, rejectWithValue }) => {
    try {
      const res = await API.post("/api/auth/logout", logoutData);
      dispatch(logout());
      return res?.data;
    } catch (error) {
      dispatch(logout());
      return rejectWithValue(error?.response?.data?.message || "Logout Failed");
    }
  },
);
