import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isLoggedIn } from "../redux/selectors/authSelectors";
import { useNavigate } from "react-router-dom";
import { changePassword, changePasswordReq } from "../redux/thunks/authThunks";

const UpdatePassword = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const access = useSelector(isLoggedIn);

  // Component States
  const [step, setStep] = useState(1); // 1: Request, 2: Verify & Change
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    otp: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Protect Route
  useEffect(() => {
    if (!access) {
      navigate("/login");
    }
  }, [access, navigate]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when typing
  };

  // Step 1: Request the OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(changePasswordReq());
      setStep(2);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit the full change
  const handleSubmitChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    try {
      await dispatch(changePassword(formData));
      onClose(); // Close modal on success
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid OTP or Current Password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
      <div className="card-auth text-reveal relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <h2 className="font-display text-3xl text-on-surface mb-2">
            {step === 1 ? "Security Check" : "Update Password"}
          </h2>
          <p className="text-on-surface-variant text-sm">
            {step === 1
              ? "We need to send a verification code to your email to continue."
              : "Enter the 6-digit code and choose a new secure password."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl animate-pulse">
            {error}
          </div>
        )}

        <form
          onSubmit={step === 1 ? handleRequestOTP : handleSubmitChange}
          className="space-y-5"
        >
          {step === 1 ? (
            /* --- Step 1: Request View --- */
            <div className="py-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-editorial"
              >
                {loading ? "Sending..." : "Send Verification Code"}
              </button>
            </div>
          ) : (
            /* --- Step 2: Input View --- */
            <>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    Verification Code
                  </label>
                  <input
                    name="otp"
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    className="input-editorial text-center tracking-[0.5em] font-bold"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                    Current Password
                  </label>
                  <input
                    name="oldPassword"
                    type="password"
                    className="input-editorial"
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                      New
                    </label>
                    <input
                      name="newPassword"
                      type="password"
                      className="input-editorial"
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                      Confirm
                    </label>
                    <input
                      name="confirmPassword"
                      type="password"
                      className="input-editorial"
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-editorial pt-4"
              >
                {loading ? "Processing..." : "Confirm Change"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
                Resend Code
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
