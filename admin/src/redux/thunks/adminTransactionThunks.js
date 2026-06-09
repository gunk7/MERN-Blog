import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

// 1. Fetch All Transactions (with explicit filter mapping)
export const fetchAllTransactions = createAsyncThunk(
  "admin/fetchAllTransactions",
  async (
    { page, limit, status, paymentProvider, startDate, endDate, currency } = {},
    { rejectWithValue },
  ) => {
    try {
      const response = await API.get("/api/admin/transactions/all", {
        params: {
          page,
          limit,
          status,
          paymentProvider,
          startDate,
          endDate,
          currency,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// 2. Fetch Transaction Stats
export const fetchTransactionStats = createAsyncThunk(
  "admin/fetchTransactionStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/admin/transactions/stats");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// 3. Fetch Transaction By ID
export const fetchTransactionById = createAsyncThunk(
  "admin/fetchTransactionById",
  async ({ transactionId }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/admin/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// 4. Fetch Specific User Transactions
export const fetchUserTransactions = createAsyncThunk(
  "admin/fetchUserTransactions",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/admin/transactions/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
