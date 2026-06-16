import { createSlice } from "@reduxjs/toolkit";
import {
  fetchSubscription,
  fetchUsage,
  fetchRefundStatus,
  fetchAddonPlans,
  fetchUpgradePlans,
  cancelSubscription,
  toggleAutoRenew,
} from "../thunks/subscriptionThunks";

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    current: null,
    past: [],
    usage: null,
    refundData: null,
    addonPlans: [],
    upgradePlans: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── fetchSubscription ──────────────────────────────────────────────────
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload.current ?? null;
        state.past = action.payload.past ?? [];
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.current = null;
        state.past = [];
        state.error = action.payload;
      });

    // ── fetchUsage ────────────────────────────────────────────────────────
    builder
      .addCase(fetchUsage.fulfilled, (state, action) => {
        state.usage = action.payload;
      })
      .addCase(fetchUsage.rejected, (state) => {
        state.usage = null;
      });

    // ── fetchRefundStatus ─────────────────────────────────────────────────
    builder
      .addCase(fetchRefundStatus.fulfilled, (state, action) => {
        state.refundData = action.payload; // null if 404
      })
      .addCase(fetchRefundStatus.rejected, (state) => {
        state.refundData = null;
      });

    // ── fetchAddonPlans ───────────────────────────────────────────────────
    builder.addCase(fetchAddonPlans.fulfilled, (state, action) => {
      state.addonPlans = action.payload;
    });

    // ── fetchUpgradePlans ─────────────────────────────────────────────────
    builder.addCase(fetchUpgradePlans.fulfilled, (state, action) => {
      state.upgradePlans = action.payload;
    });

    // ── cancelSubscription ────────────────────────────────────────────────
    builder.addCase(cancelSubscription.fulfilled, (state, action) => {
      state.current = action.payload;
    });

    // ── toggleAutoRenew ───────────────────────────────────────────────────
    builder.addCase(toggleAutoRenew.fulfilled, (state, action) => {
      if (state.current) state.current.autoRenew = action.payload;
    });
  },
});

export const { clearError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
