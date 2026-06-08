import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllTransactions,
  fetchTransactionStats,
  fetchTransactionById,
  fetchUserTransactions,
} from "../thunks/adminTransactionThunks";

const initialState = {
  loading: false,
  transactions: [],
  transactionStats: null,
  currentTransaction: null,
  userTransactions: [],
  error: null,

  totalCount: 0,
  page: 1,
  limit: 10,
  filters: {
    status: "",
    paymentProvider: "",
    currency: "",
    startDate: "",
    endDate: "",
  },
};

const adminTransactionSlice = createSlice({
  name: "adminTransactions",
  initialState,
  reducers: {
    clearCurrentTransaction(state) {
      state.currentTransaction = null;
    },
    clearError(state) {
      state.error = null;
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    setLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    updateFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1; // reset on every filter change
    },
    clearFilters(state) {
      state.filters = {
        status: "",
        paymentProvider: "",
        currency: "",
        startDate: "",
        endDate: "",
      };
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    // fetchAllTransactions
    builder
      .addCase(fetchAllTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload?.data || [];
        state.totalCount = action.payload?.pagination?.total || 0;
        // Don't sync page/limit back from the response — the reducers own that
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchTransactionStats — use its own loading flag to avoid
    // colliding with the table's loading state
    builder
      .addCase(fetchTransactionStats.fulfilled, (state, action) => {
        state.transactionStats = action.payload?.data;
      })
      .addCase(fetchTransactionStats.rejected, (state, action) => {
        state.error = action.payload;
      });

    // fetchTransactionById
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTransaction = action.payload?.data;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchUserTransactions
    builder
      .addCase(fetchUserTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.userTransactions = action.payload?.data || [];
      })
      .addCase(fetchUserTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCurrentTransaction,
  clearError,
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
} = adminTransactionSlice.actions;

export default adminTransactionSlice.reducer;
