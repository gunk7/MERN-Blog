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
  const [isError, setIsError] = useState(false); // Track shake/error state
  const inputRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);

  // Auto-focus the first field on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

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
    if (shouldAutoSend && email) {
      dispatch(resendOtp({ email }));
      console.log("Auto-sending OTP for login flow...");
    }
  }, [shouldAutoSend, email, dispatch]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    if (!sanitizedValue && value !== "") return;

    // Reset error state as soon as the user starts correcting the code
    if (isError) setIsError(false);

    const newOtp = [...otp];
    newOtp[index] = sanitizedValue.substring(sanitizedValue.length - 1);
    setOtp(newOtp);

    if (sanitizedValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const filled = newOtp.join("");
    if (filled.length === 6 && !newOtp.includes("")) {
      submitOtp(filled);
    }
  };

  const handleKeyDown = (e, index) => {
    if (isError) setIsError(false);

    if (e.key === "Backspace") {
      const newOtp = [...otp];

      if (!otp[index] && index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (isError) setIsError(false);

    const pasted = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split("").concat(new Array(6).fill("")).slice(0, 6);
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  };

  const submitOtp = async (otpValue) => {
    const resultAction = await dispatch(verifyOtp({ email, otp: otpValue }));
    if (verifyOtp.fulfilled.match(resultAction)) {
      toast.success("Account Verified Successfully");
      onClose();
      navigate("/login");
    } else {
      toast.error(resultAction.payload || "Invalid Verification Code");

      // Trigger UI Error states
      setIsError(true);
      setOtp(new Array(6).fill("")); // Wipe inputs clear
      if (inputRefs.current[0]) inputRefs.current[0].focus(); // Refocus first input
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) return toast.warn("Enter 6-digit code");
    await submitOtp(otpValue);
  };

  const handleResend = async () => {
    if (timer > 0) return;
    const result = await dispatch(resendOtp({ email }));
    if (resendOtp.fulfilled.match(result)) {
      toast.success("A new code has been sent!");
      setTimer(30);
      setIsError(false);
      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } else {
      toast.error(result.payload || "Failed to resend");
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
      {/* Dynamic shake utility added dynamically using standard keyframes style block */}
      <style>{`
        @keyframes custom-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: custom-shake 0.4s ease-in-out;
        }
      `}</style>

      <div
        className={`card-auth text-reveal relative transition-all duration-300 ${isError ? "animate-shake" : ""}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-6 text-on-surface-variant hover:text-primary transition-colors"
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
                inputMode="numeric"
                pattern="[0-9]*"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className={`input-editorial p-0! w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold transition-all duration-200 focus:ring-2 focus:ring-primary/50 outline-none
                  ${isError ? "border-red-500! dark:border-red-500! text-red-500!" : ""}`}
              />
            ))}
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="btn-editorial w-full transition-all"
              disabled={loading}
            >
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
