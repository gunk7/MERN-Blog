import { createSlice } from "@reduxjs/toolkit";
import {
  deleteConsoleLogs,
  fetchConsoleLogs,
  fetchConsoleLogStats,
} from "../thunks/adminConsoleLogThunks";

const adminConsoleLogSlice = createSlice({
  name: "adminConsoleLogs",
  initialState: {
    logs: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 1,
    },
    filters: {
      level: null,
      search: "",
      startDate: null,
      endDate: null,
      environment: null,
    },
    listStatus: "idle",
    listError: null,

    stats: { info: 0, warn: 0, error: 0, debug: 0, http: 0 },
    statsStatus: "idle",
    statsError: null,

    deleteStatus: "idle",
    deleteError: null,
  },

  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    resetFilters(state) {
      state.filters = {
        level: null,
        search: "",
        startDate: null,
        endDate: null,
        environment: null,
      };
      state.pagination.page = 1;
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
  },

  extraReducers: (builder) => {
    // --- fetchConsoleLogs ---
    builder
      .addCase(fetchConsoleLogs.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchConsoleLogs.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.logs = action.payload.data;
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination,
        };
      })
      .addCase(fetchConsoleLogs.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
      });

    // --- fetchConsoleLogStats ---
    builder
      .addCase(fetchConsoleLogStats.pending, (state) => {
        state.statsStatus = "loading";
        state.statsError = null;
      })
      .addCase(fetchConsoleLogStats.fulfilled, (state, action) => {
        state.statsStatus = "succeeded";
        state.stats = action.payload;
      })
      .addCase(fetchConsoleLogStats.rejected, (state, action) => {
        state.statsStatus = "failed";
        state.statsError = action.payload;
      });
    //---delete logs
    builder
      .addCase(deleteConsoleLogs.pending, (state) => {
        state.deleteStatus = "loading";
      })
      .addCase(deleteConsoleLogs.fulfilled, (state) => {
        state.deleteStatus = "succeeded";
      })
      .addCase(deleteConsoleLogs.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload;
      });
  },
});

export const { setFilters, resetFilters, setPage } =
  adminConsoleLogSlice.actions;
export default adminConsoleLogSlice.reducer;
