import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { forgotPassword, resetPassword } from "../redux/thunks/authThunks";

const ForgotPassword = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const dispatch = useDispatch();

  if (!isOpen) return null;

  // Added this to handle typing
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(forgotPassword({ email: formData.email })).unwrap();
      setStep(2);
      setMessage({ type: "success", text: "OTP sent successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setMessage({ type: "error", text: "Passwords do not match." });
    }
    
    setLoading(true);
    try {
      await dispatch(
        resetPassword({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        })
      ).unwrap();

      // Clear state and close on success
      onClose();
    } catch (err) {
      setMessage({ type: "error", text: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-md p-4">
      <div
        className="card-auth text-reveal relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        <div className="mb-8">
          <h2 className="font-display text-3xl text-on-surface mb-2">
            {step === 1 ? "Recovery" : "Set Password"}
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {step === 1
              ? "Enter your email to receive a recovery code."
              : `Enter the code sent to ${formData.email}`}
          </p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 text-xs font-bold rounded-xl border-l-4 transition-all ${
              message.type === "error"
                ? "bg-red-50 border-red-400 text-red-700"
                : "bg-green-50 border-green-400 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={step === 1 ? handleRequestOTP : handleResetSubmit} className="space-y-5">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  className="input-editorial"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="hello@example.com"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-editorial">
                {loading ? "Verifying..." : "Send Reset Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">
                  6-Digit Code
                </label>
                <input
                  name="otp"
                  type="text"
                  maxLength="6"
                  className="input-editorial text-center tracking-[0.5em] font-bold text-xl"
                  onChange={handleInputChange}
                  placeholder="000000"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">
                    New Password
                  </label>
                  <input
                    name="newPassword"
                    type="password"
                    className="input-editorial"
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 ml-1">
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
              <button type="submit" disabled={loading} className="btn-editorial mt-2">
                {loading ? "Resetting..." : "Update Password"}
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all py-2 cursor-pointer"
              >
                ← Use a different email
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;