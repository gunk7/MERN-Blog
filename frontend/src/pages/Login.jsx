import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, Mail, Lock } from "lucide-react";
import { loginSchema } from "../validation/schemasValidation";
import { login } from "../redux/thunks/authThunks";
import { selectAuthLoading } from "../redux/selectors/authSelectors";
import OtpModal from "../modals/OtpModal";
import ForgotPassword from "../modals/ForgotPassword";
import GoogleButton from "../components/GoogleButton";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);

  // --- Modal States ---
  const [openOtpModal, setOpenOtpModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [isForgotPwdOpen, setIsForgotPwdOpen] = useState(false);
  const [shouldAutoSend, setShouldAutoSend] = useState(false);

  /*   useEffect(() => {
    if (access && user) {
      if (user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    }
  }, [access, user, navigate]) */ const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (data, { resetForm }) => {
      try {
        const res = await dispatch(login(data)).unwrap();
        toast.success(`Welcome back, ${res.user?.username || "User"}!`);
        resetForm();

        if (!res.user?.hasPlan) {
          navigate("/onboarding/plan"); // ← new users go here
        } else {
          navigate("/profile"); // ← existing users go here
        }
      } catch (err) {
        // ...rest unchanged
      }
    },
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 font-body antialiased text-on-surface">
      {/* Header - Using responsive sizes and theme colors */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-2">
          Welcome Back
        </h1>
        <p className="text-on-surface-variant text-base sm:text-lg italic">
          Log in to your account
        </p>
      </div>

      {/* Card - Using the component from tailwind.config.js */}
      <div className="card-auth">
        <form onSubmit={formik.handleSubmit}>
          <fieldset disabled={loading} className="flex flex-col gap-5 sm:gap-6">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Mail size={16} className="text-primary" /> Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className={`input-editorial ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-400"
                    : ""
                }`}
                {...formik.getFieldProps("email")}
              />
              {formik.touched.email && formik.errors.email && (
                <span className="text-red-500 text-xs ml-1">
                  {formik.errors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Lock size={16} className="text-primary" /> Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input-editorial ${
                  formik.touched.password && formik.errors.password
                    ? "border-red-400"
                    : ""
                }`}
                {...formik.getFieldProps("password")}
              />
              {formik.touched.password && formik.errors.password && (
                <span className="text-red-500 text-xs ml-1">
                  {formik.errors.password}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-on-surface-variant text-sm sm:text-base">
                {/* Changed from Link to button for modal trigger */}
                <button
                  type="button" // Important: prevents form submission
                  onClick={() => setIsForgotPwdOpen(true)}
                  className="text-primary font-bold underline decoration-2 underline-offset-4 hover:text-primary-container transition-colors cursor-pointer"
                >
                  Forgot Your Password?
                </button>
              </p>
            </div>
            {/* Submit Button - Using component from config */}
            <button
              type="submit"
              disabled={loading}
              className="btn-editorial mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Log in</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-3 my-6 sm:my-8">
              <hr className="flex-1 border-on-surface/10" />
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                or
              </span>
              <hr className="flex-1 border-on-surface/10" />
            </div>

            <GoogleButton />
          </fieldset>
        </form>

        <hr className="my-6 sm:my-8 border-on-surface/10" />

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-on-surface-variant text-sm sm:text-base">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-bold underline decoration-2 underline-offset-4 hover:text-primary-container transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      {openOtpModal && (
        <OtpModal
          email={unverifiedEmail}
          shouldAutoSend={shouldAutoSend}
          onClose={() => setOpenOtpModal(false)}
        />
      )}
      {isForgotPwdOpen && (
        <ForgotPassword
          isOpen={isForgotPwdOpen}
          onClose={() => setIsForgotPwdOpen(false)}
        />
      )}
    </div>
  );
};

export default Login;
