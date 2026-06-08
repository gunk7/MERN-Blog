import { createSlice } from "@reduxjs/toolkit";
import { fetchAllSubscriptions, fetchSubscriptionStats } from "../thunks/adminSubscriptionThunks";

const initialState = {
  loading: false,
  subscriptions: [],
  totalCount: 0,
  page: 1,
  limit: 10,
  filters: {
    search: "",
    name: "",
    interval: "",
    status: "",
  },
  stats: null,
  error: null,
};

const adminSubscriptionSlice = createSlice({
  name: "adminSubscriptions",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1; // reset page on filter change
    },
    clearFilters: (state) => {
      state.filters = { search: "", name: "", interval: "", status: "" };
      state.page = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all subscriptions
    builder
      .addCase(fetchAllSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        const { data    = [], pagination = {} } = action.payload || {};
        state.subscriptions = Array.isArray(data) ? data : [];
        state.totalCount = pagination.totalItems || 0;
        state.page = pagination.page || state.page;
        state.limit = pagination.limit || state.limit;
      })
      .addCase(fetchAllSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // Fetch subscription stats
    builder
      .addCase(fetchSubscriptionStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSubscriptionStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setPage,
  setLimit,
  updateFilters,
  clearFilters,
  clearError,
} = adminSubscriptionSlice.actions;

export default adminSubscriptionSlice.reducer;
