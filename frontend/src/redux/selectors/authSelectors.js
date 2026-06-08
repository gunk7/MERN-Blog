import { createSelector } from "@reduxjs/toolkit";

const selectAuth = (state) => state.auth;

export const selectCurrentUser = (state) => state.auth.user;

export const selectAuthLoading = (state) => selectAuth(state).loading;
export const selectAuthError = (state) => selectAuth(state).error;
export const selectToken = (state) => selectAuth(state).accessToken;
export const selectAuthInitialized = (state) => state.auth.authInitialized;

export const selectIsVerifying = (state) => selectAuth(state).isVerifying;
export const selectTempEmail = (state) => selectAuth(state).tempEmail;

export const isLoggedIn = createSelector(
  [selectToken],
  (accessToken) => !!accessToken,
);
