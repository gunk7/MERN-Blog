import React from "react";
import { useSelector } from "react-redux";
import {
  isLoggedIn,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ adminOnly = false }) => {
  const isAuthenticated = useSelector(isLoggedIn);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
