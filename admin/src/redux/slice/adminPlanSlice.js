import { createSlice } from "@reduxjs/toolkit";
import {
  fetchAllPlans,
  fetchPlanById,
  fetchPlanStats,
  createPlan,
  updatePlan,
  deletePlan,
} from "../thunks/adminPlanThunks";

const adminPlansSlice = createSlice({
  name: "adminPlans",
  initialState: {
    plans: [],
    selectedPlan: null,
    stats: null,

    loading: false,
    detailLoading: false,
    statsLoading: false,
    actionLoading: false,
    error: null,

    modal: {
      type: null, // "create" | "edit" | "delete" | null
      isOpen: false,
    },
  },
  reducers: {
    setSelectedPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },
    clearSelectedPlan: (state) => {
      state.selectedPlan = null;
    },
    openModal: (state, action) => {
      state.modal.type = action.payload; // "create" | "edit" | "delete"
      state.modal.isOpen = true;
    },
    closeModal: (state) => {
      state.modal.type = null;
      state.modal.isOpen = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- FETCH ALL PLANS ---
    builder
      .addCase(fetchAllPlans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAllPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // --- FETCH PLAN BY ID ---
    builder
      .addCase(fetchPlanById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPlanById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedPlan = action.payload;
      })
      .addCase(fetchPlanById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      });

    // --- FETCH PLAN STATS ---
    builder
      .addCase(fetchPlanStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(fetchPlanStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchPlanStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      });

    // --- CREATE PLAN ---
    builder
      .addCase(createPlan.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createPlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.plans.push(action.payload);
        state.modal = { type: null, isOpen: false };
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // --- UPDATE PLAN ---
    builder
      .addCase(updatePlan.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updatePlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.plans.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.plans[idx] = action.payload;
        state.selectedPlan = null;
        state.modal = { type: null, isOpen: false };
      })
      .addCase(updatePlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });

    // --- DELETE PLAN ---
    builder
      .addCase(deletePlan.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deletePlan.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.plans = state.plans.filter((p) => p._id !== action.meta.arg);
        state.selectedPlan = null;
        state.modal = { type: null, isOpen: false };
      })
      .addCase(deletePlan.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setSelectedPlan,
  clearSelectedPlan,
  openModal,
  closeModal,
  clearError,
} = adminPlansSlice.actions;

export default adminPlansSlice.reducer;