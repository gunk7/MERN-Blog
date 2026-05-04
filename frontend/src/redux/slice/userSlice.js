import { createSlice } from "@reduxjs/toolkit";
import {
  getProfile,
  updateProfile,
  getPublicProfile,
  followUser,
  unfollowUser,
} from "../thunks/userThunks";

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    error: null,
    profile: null,

    publicProfile: null,
    publicProfileLoading: false,
    publicProfileError: null,

    followLoading: false,
  },
  reducers: {
    clearPublicProfile: (state) => {
      state.publicProfile = null;
      state.publicProfileError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // User Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      //updateProfile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ──  getPublicProfile ─────────────────────────────────────────
      .addCase(getPublicProfile.pending, (state) => {
        state.publicProfileLoading = true;
        state.publicProfileError = null;
        state.publicProfile = null;
      })
      .addCase(getPublicProfile.fulfilled, (state, action) => {
        state.publicProfileLoading = false;
        state.publicProfile = action.payload; // { userDetail, isOwner, isFollowing }
      })
      .addCase(getPublicProfile.rejected, (state, action) => {
        state.publicProfileLoading = false;
        state.publicProfileError = action.payload;
      })

      // ── followUser ───────────────────────────────────────────────
      .addCase(followUser.pending, (state) => {
        state.followLoading = true;
      })
      .addCase(followUser.fulfilled, (state) => {
        state.followLoading = false;
        if (state.publicProfile) {
          state.publicProfile.isFollowing = true;
          if (state.publicProfile.userDetail) {
            state.publicProfile.userDetail.followersCount =
              (state.publicProfile.userDetail.followersCount || 0) + 1;
          }
        }
      })
      .addCase(followUser.rejected, (state) => {
        state.followLoading = false;
      })

      // ── NEW: unfollowUser ─────────────────────────────────────────────
      .addCase(unfollowUser.pending, (state) => {
        state.followLoading = true;
      })
      .addCase(unfollowUser.fulfilled, (state) => {
        state.followLoading = false;
        if (state.publicProfile) {
          state.publicProfile.isFollowing = false;
          if (state.publicProfile.userDetail) {
            state.publicProfile.userDetail.followersCount = Math.max(
              0,
              (state.publicProfile.userDetail.followersCount || 1) - 1,
            );
          }
        }
      })
      .addCase(unfollowUser.rejected, (state) => {
        state.followLoading = false;
      });
  },
});
export const { clearPublicProfile } = userSlice.actions;
export default userSlice.reducer;
