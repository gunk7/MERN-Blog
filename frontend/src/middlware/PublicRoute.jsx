import React from "react";
import { useSelector } from "react-redux";
import { isLoggedIn, selectCurrentUser } from "../redux/selectors/authSelectors";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const loggedIn = useSelector(isLoggedIn);
  const user = useSelector(selectCurrentUser);

  if (loggedIn) {
    if (user?.role === "admin") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
