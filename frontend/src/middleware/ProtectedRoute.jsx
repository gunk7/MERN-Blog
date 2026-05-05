import React from "react";
import { useSelector } from "react-redux";
import {
  isLoggedIn,
  selectAuthInitialized,
} from "../redux/selectors/authSelectors";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = ({ adminOnly = false }) => {
  const isAuthenticated = useSelector(isLoggedIn);
  const authInitialized = useSelector(selectAuthInitialized);
  const location = useLocation();

  // Wait for redux-persist to rehydrate before making any auth decision
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
