import { useEffect } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, Mail, Lock } from "lucide-react";
import { loginSchema } from "../validation/schemasValidation";
import { login } from "../redux/thunks/authThunks";
import {
  isLoggedIn,
  selectAuthLoading,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const access = useSelector(isLoggedIn);
  const loading = useSelector(selectAuthLoading);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    if (access && user) {
      if (user.role === "admin") {
        navigate("/dashboard");
      } else {
        toast.error("Access denied: Admins only");
      }
    }
  }, [access, user, navigate]);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (data, { resetForm }) => {
      try {
        const res = await dispatch(login(data)).unwrap();

        if (res.user?.role !== "admin") {
          toast.error("Access denied: Admins only");
          return;
        }

        toast.success(`Welcome Admin`);
        resetForm();
        navigate("/dashboard");
      } catch (err) {
        toast.error(err || "Invalid credentials");
      }
    },
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6 font-body antialiased text-on-surface">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-2">
          Admin Login
        </h1>
        <p className="text-on-surface-variant text-base sm:text-lg italic">
          Authorized access only
        </p>
      </div>

      {/* Card */}
      <div className="card-auth">
        <form onSubmit={formik.handleSubmit}>
          <fieldset disabled={loading} className="flex flex-col gap-5 sm:gap-6">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Mail size={16} className="text-primary" /> Email Address
              </label>
              <input
                type="email"
                placeholder="admin@example.com"
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

            {/* Password */}
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

            {/* Submit */}
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
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default Login;
