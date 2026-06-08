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
    hasPlan: false,
    loading: false,
    error: null,
    isVerifying: false,
    tempEmail: null,
    authInitialized: false,
  },
  reducers: {
    logout: (state) => {
      state.loading = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.hasPlan = false;
      state.error = null;
      state.isVerifying = false;
      state.tempEmail = null;
      state.authInitialized = true;
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
      state.hasPlan = action.payload.user.hasPlan ?? false;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(REHYDRATE, (state, action) => {
        state.authInitialized = true;

        if (action.payload?.auth) {
          state.accessToken = action.payload.auth.accessToken ?? null;
          state.refreshToken = action.payload.auth.refreshToken ?? null;
          state.hasPlan = action.payload.auth.hasPlan ?? false;
          state.user = null;
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
        state.hasPlan = action.payload.user.hasPlan ?? false;
        state.error = null;
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
