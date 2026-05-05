import { createSlice } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist"; // 👈 add this import
import { login, signup, verifyOtp, logoutUser } from "../thunks/authThunks";
import { getProfile } from "../thunks/userThunks";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
    isVerifying: false,
    tempEmail: null,
    authInitialized: false, // 👈 add this
  },
  reducers: {
    logout: (state) => {
      state.loading = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.isVerifying = false;
      state.tempEmail = null;
      // ✅ keep authInitialized: true — user is still "initialized", just logged out
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
    googleLogin: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user || null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 👇 This fires automatically when redux-persist restores state
      .addCase(REHYDRATE, (state, action) => {
        state.authInitialized = true;
        if (action.payload?.auth) {
          state.accessToken =
            action.payload.auth.accessToken ?? state.accessToken;
          state.refreshToken =
            action.payload.auth.refreshToken ?? state.refreshToken;
          state.user = action.payload.auth.user ?? state.user;
        }
      })
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
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.isVerifying = true;
        state.tempEmail = action.meta.arg.email;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.isVerifying = false;
        state.tempEmail = null;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        state.isVerifying = false;
        state.tempEmail = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload; // 👈 keeps auth.user in sync
      });
  },
});

export const { logout, cancelVerification, setTokens, setUser, googleLogin } =
  authSlice.actions;

export default authSlice.reducer;
