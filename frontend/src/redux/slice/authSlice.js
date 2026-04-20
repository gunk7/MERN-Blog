import { createSlice } from "@reduxjs/toolkit";
import { login, signup,verifyOtp } from "../thunks/authThunks";
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    isVerifying: false,
    tempEmail: null,
  },
  reducers: {
    logout: (state) => {
      state.loading = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isVerifying = false;
      state.tempEmail = null;
    },
    cancelVerification: (state) => {
      state.isVerifying = false;
      state.tempEmail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload;
        state.user = user;
        state.token = token;
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
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // Resetting these triggers the Modal to close in Signup UI
        state.isVerifying = false;
        state.tempEmail = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, cancelVerification } = authSlice.actions;

export default authSlice.reducer;
