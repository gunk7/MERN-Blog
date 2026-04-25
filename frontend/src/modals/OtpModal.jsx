import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resendOtp, verifyOtp } from "../redux/thunks/authThunks";
import { toast } from "react-toastify";
import { selectAuthLoading } from "../redux/selectors/authSelectors";

const OtpModal = ({ email, onClose, shouldAutoSend = false }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const maskedEmail = email
    ? email.replace(
        /^(.)(.*)(.@.*)$/,
        (_, a, b, c) => a + "*".repeat(b.length) + c,
      )
    : "";
  useEffect(() => {
    // Only trigger the API call if specifically requested (Login flow)
    if (shouldAutoSend && email) {
      dispatch(resendOtp({ email }));
      console.log("Auto-sending OTP for login flow...");
    }
  }, [shouldAutoSend, email, dispatch]);

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) return toast.warn("Enter 6-digit code");

    const resultAction = await dispatch(verifyOtp({ email, otp: otpValue }));
    if (verifyOtp.fulfilled.match(resultAction)) {
      toast.success("Account Verified Successfully");
      onClose();
      navigate("/login");
    } else {
      toast.error(resultAction.payload);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    const result = await dispatch(resendOtp({ email }));
    if (resendOtp.fulfilled.match(result)) {
      toast.success("A new code has been sent!");
      setTimer(30);
      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } else {
      toast.error(result.payload || "Failed to resend");
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
      <div className="card-auth text-reveal relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-6 text-on-surface-variant hover:text-primary"
        >
          ✕
        </button>

        <h3 className="text-2xl font-display text-primary mb-2">
          Verify Email
        </h3>
        <p className="text-on-surface-variant mb-8">
          We sent a code to{" "}
          <span className="text-primary font-bold">{maskedEmail}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="input-editorial p-0! w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold"
              />
            ))}
          </div>

          <div className="space-y-4">
            <button type="submit" className="btn-editorial" disabled={loading}>
              {loading ? "VERIFYING..." : "ACTIVATE ACCOUNT"}
            </button>

            <div className="text-center">
              {timer > 0 ? (
                <p className="text-on-surface-variant text-sm">
                  Resend available in{" "}
                  <span className="text-primary font-bold">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  className="text-primary font-bold hover:underline underline-offset-4 transition-all"
                  disabled={loading}
                  onClick={handleResend}
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default OtpModal;
