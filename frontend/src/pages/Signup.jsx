import React, { useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Lock, User } from "lucide-react";
import { signupSchema } from "../validation/schemasValidation";
import { signup } from "../redux/thunks/authThunks"; // ✅ import cancelVerification
import { cancelVerification } from "../redux/slice/authSlice";
import {
  selectAuthLoading,
  selectIsVerifying,
  selectTempEmail,
} from "../redux/selectors/authSelectors";
import OtpModal from "../modals/OtpModal";
import { isUsernameUnsuitable } from "../services/apiService";
import GoogleButton from "../components/GoogleButton";

const Signup = () => {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const isVerifying = useSelector(selectIsVerifying);
  const tempEmail = useSelector(selectTempEmail);

  const [showModal, setShowModal] = useState(false); // ✅ start as false

  const formik = useFormik({
    initialValues: { username: "", email: "", password: "" },
    validationSchema: signupSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // Start checking
        const isBad = await isUsernameUnsuitable(values.username);

        if (isBad) {
          //  Halt if unsuitable
          return toast.error(
            "This username contains unsuitable language. Please choose another.",
          );
        }
        await dispatch(signup(values)).unwrap();
        toast.success("Signup Successfully! Please verify your email.");
        setShowModal(true);
        resetForm();
      } catch (error) {
        toast.error(error || "Signup failed");
      }
    },
  });

  const handleCancelVerification = () => {
    setShowModal(false);
    dispatch(cancelVerification()); // ✅ resets isVerifying in redux too
  };

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
                {formik.touched.email && formik.errors.email && (
                  <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider px-1">
                    {formik.errors.email}
                  </span>
                )}
              </div>

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
          /* Shown on page refresh — lets user re-open modal or restart */
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
                onClick={() => setShowModal(true)} // ✅ re-opens the modal
                className="btn-editorial w-full"
              >
                Enter Code
              </button>

              <button
                onClick={handleCancelVerification} // ✅ fixed: was calling non-imported fn
                className="text-xs font-bold text-rose-500 uppercase tracking-widest hover:underline"
              >
                Restart with different email
              </button>
            </div>
          </div>
        )}

        {!isVerifying && (
          <>
            <div className="flex items-center gap-3 my-8">
              <hr className="flex-1 border-on-surface/10" />
              <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                or
              </span>
              <hr className="flex-1 border-on-surface/10" />
            </div>
            <GoogleButton />
          </>
        )}
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
        </div>
      </div>

      {/* ✅ Modal lives OUTSIDE the conditional, controlled purely by showModal */}
      {isVerifying && showModal && (
        <OtpModal
          email={tempEmail}
          shouldAutoSend={false}
          onClose={() => setShowModal(false)} // ✅ closes modal but keeps isVerifying state
        />
      )}
    </div>
  );
};

export default Signup;
