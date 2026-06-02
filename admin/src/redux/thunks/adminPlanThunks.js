import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

// --- FETCH ALL PLANS ---
export const fetchAllPlans = createAsyncThunk(
  "adminPlans/fetchAllPlans",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/admin/plan");
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch plans",
      );
    }
  },
);

// --- FETCH PLAN BY ID ---
export const fetchPlanById = createAsyncThunk(
  "adminPlans/fetchPlanById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/admin/plan/${id}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch plan",
      );
    }
  },
);

// --- FETCH PLAN STATS ---
export const fetchPlanStats = createAsyncThunk(
  "adminPlans/fetchPlanStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/admin/plan/stats/plans");
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch plan stats",
      );
    }
  },
);

// --- CREATE PLAN ---
export const createPlan = createAsyncThunk(
  "adminPlans/createPlan",
  async (planData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/admin/", planData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create plan",
      );
    }
  },
);

// --- UPDATE PLAN ---
export const updatePlan = createAsyncThunk(
  "adminPlans/updatePlan",
  async ({ id, data: planData }, { rejectWithValue }) => {
    try {
      const { data } = await API.patch(`/admin/${id}`, planData);
      return data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update plan",
      );
    }
  },
);

// --- DELETE PLAN ---
export const deletePlan = createAsyncThunk(
  "adminPlans/deletePlan",
  async (id, { rejectWithValue }) => {
    try {
      await API.delete(`/admin/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete plan",
      );
    }
  },
);
