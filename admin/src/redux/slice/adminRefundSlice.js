import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllRefundRequests,
  fetchRefundRequestById,
  resolveRefundRequest,
} from "../thunks/adminRefundThunks";

const adminRefundSlice = createSlice({
  name: "refund",
  initialState: {
    requests: [],
    totalCount: 0,
    page: 1,
    limit: 10,
    statusFilter: "",
    loading: false,
    error: null,

    // single
    selected: null,
    selectedLoading: false,
    selectedError: null,

    // resolve
    resolving: false,
    resolveError: null,
  },
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    clearSelected(state) {
      state.selected = null;
      state.selectedError = null;
    },
    clearResolveError(state) {
      state.resolveError = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAllRefundRequests
    builder
      .addCase(fetchAllRefundRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRefundRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.data ?? [];
        state.totalCount = action.payload.pagination?.total ?? 0;
      })
      .addCase(fetchAllRefundRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // fetchRefundRequestById
    builder
      .addCase(fetchRefundRequestById.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchRefundRequestById.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchRefundRequestById.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      });

    // resolveRefundRequest
    builder
      .addCase(resolveRefundRequest.pending, (state) => {
        state.resolving = true;
        state.resolveError = null;
        state.error = null;
      })
      .addCase(resolveRefundRequest.fulfilled, (state, action) => {
        state.resolving = false;
        const { id, status, refundType, refundAmount } = action.payload;
        const idx = state.requests.findIndex((r) => r._id === id);
        if (idx !== -1) {
          state.requests[idx] = {
            ...state.requests[idx],
            status,
            refundType,
            refundAmount,
          };
        }
        if (state.selected?._id === id) {
          state.selected = {
            ...state.selected,
            status,
            refundType,
            refundAmount,
          };
        }
      })
      .addCase(resolveRefundRequest.rejected, (state, action) => {
        state.resolving = false;
        state.resolveError = action.payload;
        state.error = action.payload;
      });
  },
});

export const {
  setPage,
  setLimit,
  setStatusFilter,
  clearSelected,
  clearResolveError,
  clearError,
} = adminRefundSlice.actions;

export default adminRefundSlice.reducer;
