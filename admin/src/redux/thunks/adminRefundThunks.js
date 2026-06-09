import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchAllRefundRequests = createAsyncThunk(
  "refunds/fetchRefunds",
  async ({ page, limit, status }, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/refunds/all", {
        params: { page, limit, ...(status && { status }) },
      });
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchRefundRequestById = createAsyncThunk(
  "refunds/fetchRefundRequestById",
  async (refundId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/admin/refunds/${refundId}`);
      console.log("Fetched refund request details:", response.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const resolveRefundRequest = createAsyncThunk(
  "refunds/resolveRefund",
  async (
    { refundId, refundType, refundAmount, userMessage, adminNote },
    { rejectWithValue },
  ) => {
    try {
      const response = await API.patch(`/api/admin/refunds/${refundId}/resolve`, {
        refundType,
        refundAmount,
        userMessage,
        adminNote,
      });
      return { id: refundId, ...response.data?.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
