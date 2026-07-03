import { createSlice } from "@reduxjs/toolkit";
import {
  fetchErrorLogs,
  fetchErrorLogById,
  fetchErrorsByCategory,
  fetchErrorsByErrorCode,
  fetchErrorSourceContext,
  updateErrorResolution,
} from "../thunks/adminErrorThunks";

const adminErrorSlice = createSlice({
  name: "adminErrors",
  initialState: {
    errors: [],
    pagination: {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
    },
    filters: {
      category: null,
      level: null,
      source: null,
      environment: null,
      search: "",
      startDate: null,
      endDate: null,
    },
    listStatus: "idle",
    listError: null,

    selectedError: null,
    detailStatus: "idle",
    detailError: null,

    byCategory: [],
    byCategoryStatus: "idle",
    byCategoryError: null,

    byErrorCode: [],
    byErrorCodeStatus: "idle",
    byErrorCodeError: null,

    sourceContext: null,
    sourceContextStatus: "idle",
    sourceContextError: null,

    resolveStatus: "idle",
    resolveError: null,
  },

  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // reset to page 1 on filter change
    },
    resetFilters(state) {
      state.filters = {
        category: null,
        level: null,
        source: null,
        environment: null,
        search: "",
        startDate: null,
        endDate: null,
      };
      state.pagination.page = 1;
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
    clearSelectedError(state) {
      state.selectedError = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
    clearSourceContext(state) {
      state.sourceContext = null;
      state.sourceContextStatus = "idle";
      state.sourceContextError = null;
    },
  },

  extraReducers: (builder) => {
    // --- fetchErrorLogs ---
    builder
      .addCase(fetchErrorLogs.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchErrorLogs.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.errors = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchErrorLogs.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
      });

    // --- fetchErrorLogById ---
    builder
      .addCase(fetchErrorLogById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(fetchErrorLogById.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.selectedError = action.payload;
      })
      .addCase(fetchErrorLogById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload;
      });

    // --- fetchErrorsByCategory ---
    builder
      .addCase(fetchErrorsByCategory.pending, (state) => {
        state.byCategoryStatus = "loading";
        state.byCategoryError = null;
      })
      .addCase(fetchErrorsByCategory.fulfilled, (state, action) => {
        state.byCategoryStatus = "succeeded";
        state.byCategory = action.payload;
      })
      .addCase(fetchErrorsByCategory.rejected, (state, action) => {
        state.byCategoryStatus = "failed";
        state.byCategoryError = action.payload;
      });

    // --- fetchErrorsByErrorCode ---
    builder
      .addCase(fetchErrorsByErrorCode.pending, (state) => {
        state.byErrorCodeStatus = "loading";
        state.byErrorCodeError = null;
      })
      .addCase(fetchErrorsByErrorCode.fulfilled, (state, action) => {
        state.byErrorCodeStatus = "succeeded";
        state.byErrorCode = action.payload;
      })
      .addCase(fetchErrorsByErrorCode.rejected, (state, action) => {
        state.byErrorCodeStatus = "failed";
        state.byErrorCodeError = action.payload;
      });

    // --- fetchErrorSourceContext ---
    builder
      .addCase(fetchErrorSourceContext.pending, (state) => {
        state.sourceContextStatus = "loading";
        state.sourceContextError = null;
      })
      .addCase(fetchErrorSourceContext.fulfilled, (state, action) => {
        state.sourceContextStatus = "succeeded";
        state.sourceContext = action.payload;
      })
      .addCase(fetchErrorSourceContext.rejected, (state, action) => {
        state.sourceContextStatus = "failed";
        state.sourceContextError = action.payload;
      });

    // --- updateErrorResolution ---
    builder
      .addCase(updateErrorResolution.pending, (state) => {
        state.resolveStatus = "loading";
        state.resolveError = null;
      })
      .addCase(updateErrorResolution.fulfilled, (state, action) => {
        state.resolveStatus = "succeeded";
        state.selectedError = action.payload;
        state.errors = state.errors.map((error) =>
          error._id === action.payload._id ? action.payload : error,
        );
      })
      .addCase(updateErrorResolution.rejected, (state, action) => {
        state.resolveStatus = "failed";
        state.resolveError = action.payload;
      });
  },
});

export const {
  setFilters,
  resetFilters,
  setPage,
  clearSelectedError,
  clearSourceContext,
} = adminErrorSlice.actions;

export default adminErrorSlice.reducer;
