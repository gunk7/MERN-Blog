import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/thunks/authThunks";
// Using your selectors
import {
  selectAuthLoading,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";

const LogoutModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  // Accessing state via your selectors
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);

  // We need the refreshToken for the backend pull operation
  const refreshToken = useSelector((state) => state.auth.refreshToken);

  if (!isOpen) return null;

  const handleLogout = (allDevices = false) => {
    dispatch(logoutUser({ refreshToken, allDevices }));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Logout</h2>
        <p>Hi {user?.username || "there"}, are you sure you want to log out?</p>

        <div className="modal-actions">
          <button disabled={isLoading} onClick={() => handleLogout(false)}>
            {isLoading ? "Processing..." : "Logout"}
          </button>

          <button
            disabled={isLoading}
            className="secondary"
            onClick={() => handleLogout(true)}
          >
            Logout from all devices
          </button>

          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
