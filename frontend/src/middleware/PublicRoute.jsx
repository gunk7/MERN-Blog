import React from "react";
import { useSelector } from "react-redux";
import {
  isLoggedIn,
  selectAuthInitialized,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";

import { Navigate, Outlet, useLocation } from "react-router-dom";

const PublicRoute = () => {
  const loggedIn = useSelector(isLoggedIn);
  const authInitialized = useSelector(selectAuthInitialized);
  const user = useSelector(selectCurrentUser);

  const location = useLocation();

  if (!authInitialized) return null;

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  // wait until user is fetched
  if (loggedIn && user && isAuthPage) {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
