import { createSlice } from "@reduxjs/toolkit";
import { login, refreshToken } from "../thunks/authThunks";

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  isVerifying: false,
  tempEmail: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
      state.isVerifying = false;
      state.tempEmail = null;
    },

    cancelVerification: (state) => {
      state.isVerifying = false;
      state.tempEmail = null;
    },

    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    setUser: (state, action) => {
      state.user = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // ── LOGIN ─────────────────────────────────────────────
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── REFRESH TOKEN ─────────────────────────────────────
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = action.payload;
      });
  },
});

export const { logout, cancelVerification, setTokens, setUser } =
  authSlice.actions;

export default authSlice.reducer;
