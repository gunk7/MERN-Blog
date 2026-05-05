import React from "react";
import { useSelector } from "react-redux";
import { isLoggedIn, selectAuthInitialized } from "../redux/selectors/authSelectors";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PublicRoute = () => {
  const loggedIn = useSelector(isLoggedIn);
  const authInitialized = useSelector(selectAuthInitialized);
  const location = useLocation();

  // Wait for rehydration — don't redirect prematurely
  if (!authInitialized) return null;

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  if (loggedIn && isAuthPage) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;