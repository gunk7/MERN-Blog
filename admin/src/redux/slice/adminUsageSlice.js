import { createSlice } from "@reduxjs/toolkit";
import { fetchAllUsage, fetchUserUsage } from "../thunks/adminUsageThunks";

const initialState = {
  loading: false,
  usageData: null,
  userUsage: null,
  error: null,
};

const adminUsageSlice = createSlice({
  name: "adminUsage",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all usage
    builder
      .addCase(fetchAllUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.usageData = action.payload;
      })
      .addCase(fetchAllUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    // Fetch user usage
    builder
      .addCase(fetchUserUsage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.userUsage = action.payload;
      })
      .addCase(fetchUserUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminUsageSlice.actions;
export default adminUsageSlice.reducer;
