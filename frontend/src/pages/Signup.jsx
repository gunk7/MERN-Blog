import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { signupSchema } from "../validation/schemasValidation";
import { signup } from "../redux/thunks/authThunks";
import {
  isLoggedIn,
  selectAuthLoading,
  selectIsVerifying,
  selectTempEmail,
} from "../redux/selectors/authSelectors";
import OtpModal from "../modals/OtpModal";

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const access = useSelector(isLoggedIn);
  const loading = useSelector(selectAuthLoading);
  const isVerifying = useSelector(selectIsVerifying);
  const tempEmail = useSelector(selectTempEmail);

  const [openOtpModal, setOpenOtpModal] = useState("");
  const [signUpData, setSignUpData] = useState({ email: "" });
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (access) navigate("/dashboard");
  }, [access, navigate]);

  useEffect(() => {
    if (isVerifying) {
      setShowModal(true);
    }
  }, [isVerifying]);

  const formik = useFormik({
    initialValues: { username: "", email: "", password: "" },
    validationSchema: signupSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await dispatch(signup(values)).unwrap();
        toast.success("Signup Successfully! Please verify your email.");
        resetForm();
      } catch (error) {
        toast.error(error || "Signup failed");
      }
    },
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 font-body antialiased text-on-surface">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-6xl font-bold tracking-tight mb-2">
          Sign up for <span className="text-primary box">Wavelog</span>
        </h1>
      </div>

      <div className="card-auth sm:max-w-125">
        {!isVerifying ? (
          <form onSubmit={formik.handleSubmit}>
            <fieldset disabled={loading} className="flex flex-col gap-5">
              {/* Username */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold flex items-center gap-2 px-1">
                  <User size={16} className="text-primary" /> Username
                </label>
                <input
                  type="text"
                  placeholder="johndoe"
                  className={`input-editorial ${formik.touched.username && formik.errors.username ? "border-rose-500" : ""}`}
                  {...formik.getFieldProps("username")}
                />
                {formik.touched.username && formik.errors.username && (
                  <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider px-1">
                    {formik.errors.username}
                  </span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold flex items-center gap-2 px-1">
                  <Mail size={16} className="text-primary" /> Email address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`input-editorial ${formik.touched.email && formik.errors.email ? "border-rose-500" : ""}`}
                  {...formik.getFieldProps("email")}
                />
              </div>
              {formik.touched.email && formik.errors.email && (
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider px-1">
                  {formik.errors.email}
                </span>
              )}

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold flex items-center gap-2 px-1">
                  <Lock size={16} className="text-primary" /> Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input-editorial ${formik.touched.password && formik.errors.password ? "border-rose-500" : ""}`}
                  {...formik.getFieldProps("password")}
                />
                {formik.touched.password && formik.errors.password && (
                  <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider px-1">
                    {formik.errors.password}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-editorial mt-2"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </fieldset>
          </form>
        ) : (
          /* This UI shows if they refresh the page. It gives them a way to go back if they made a mistake. */
          <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-primary" size={32} />
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              Verification pending for <br />
              <span className="font-bold text-on-surface">{tempEmail}</span>
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowModal(true)}
                className="btn-editorial w-full"
              >
                Enter Code
              </button>

              <button
                onClick={() => dispatch(cancelVerification())}
                className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline"
              >
                Restart with different email
              </button>
            </div>
          </div>
        )}

        {/* Divider - "Or continue with" */}
        {/* <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-on-surface/10"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="bg-white px-4 text-on-surface-variant">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Buttons - Kept within your Design System style */}
        {/* <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 bg-surface-low border border-primary/5 py-2.5 rounded-xl hover:bg-primary/5 transition-colors font-bold text-xs uppercase tracking-wider">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="w-4 h-4"
              alt="Google"
            />
            Google
          </button>
          <button className="flex items-center justify-center gap-2 bg-surface-low border border-primary/5 py-2.5 rounded-xl hover:bg-primary/5 transition-colors font-bold text-xs uppercase tracking-wider">
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              className="w-4 h-4"
              alt="Github"
            />
            GitHub
          </button>
        </div> */}

        <hr className="my-8 border-on-surface/10" />

        <div className="text-center">
          <p className="text-on-surface-variant text-sm">
            Already a member?{" "}
            <Link
              to="/login"
              className="text-on-surface font-bold underline decoration-2 underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all"
            >
              Login to your account
            </Link>
          </p>
          {isVerifying && (
            <OtpModal
              email={tempEmail}
              shouldAutoSend={false}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
