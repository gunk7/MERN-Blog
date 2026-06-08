import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const fetchSubscription = createAsyncThunk(
  "subscription/fetchSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/subscription/my");
      return data.data; // { current, past }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch subscription",
      );
    }
  },
);

export const fetchUsage = createAsyncThunk(
  "subscription/fetchUsage",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/usage/my");
      return data.usage;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch usage",
      );
    }
  },
);

export const fetchRefundStatus = createAsyncThunk(
  "subscription/fetchRefundStatus",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/subscription/refund-status");
      if (!data.success) return null;
      return data.data;
    } catch (err) {
      // 404 = no refund request yet — not an error
      if (err.response?.status === 404) return null;
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch refund status",
      );
    }
  },
);

export const fetchAddonPlans = createAsyncThunk(
  "subscription/fetchAddonPlans",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/addon/addon-plans");
      return Array.isArray(data.data?.plans) ? data.data.plans : [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch addon plans",
      );
    }
  },
);

export const fetchUpgradePlans = createAsyncThunk(
  "subscription/fetchUpgradePlans",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/api/plans/all");
      return data.success
        ? data.data.filter((p) => p.price > 0 && p.status !== "coming_soon")
        : [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch upgrade plans",
      );
    }
  },
);

export const cancelSubscription = createAsyncThunk(
  "subscription/cancelSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.patch("/api/subscription/cancel");
      return data.data; // updated subscription
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to cancel subscription",
      );
    }
  },
);

export const toggleAutoRenew = createAsyncThunk(
  "subscription/toggleAutoRenew",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.patch("/api/subscription/toggle-auto-renew");
      return data.data.autoRenew; // boolean
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to toggle auto-renew",
      );
    }
  },
);

export const submitRefundRequest = createAsyncThunk(
  "subscription/submitRefundRequest",
  async ({ reason }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/api/subscription/refund-request", {
        reason,
      });
      return data.data; // { requestId }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to submit refund request",
      );
    }
  },
);

export const addonCheckout = createAsyncThunk(
  "subscription/addonCheckout",
  async ({ planId }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/api/addon/addon-checkout", { planId });
      return data.data.checkoutUrl;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Addon checkout failed",
      );
    }
  },
);

export const upgradeCheckout = createAsyncThunk(
  "subscription/upgradeCheckout",
  async ({ planId }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/api/subscription/checkout", { planId });
      return data.data.checkoutUrl;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Upgrade checkout failed",
      );
    }
  },
);
