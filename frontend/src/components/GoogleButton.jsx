import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { googleLogin } from "../redux/slice/authSlice";
import { getProfile } from "../redux/thunks/userThunks";

const GoogleButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    const popup = window.open(
      "http://localhost:7878/api/auth/google",
      "Google Login",
      "width=500,height=600,left=400,top=100",
    );

    const handleMessage = (event) => {
      if (event.origin !== "http://localhost:7878") return;

      const { accessToken, refreshToken, error } = event.data;

      if (error) {
        toast.error("Google login failed");
        window.removeEventListener("message", handleMessage);
        return;
      }

      if (accessToken && refreshToken) {
        dispatch(googleLogin({ accessToken, refreshToken }));
        dispatch(getProfile())
          .unwrap()
          .then(() => navigate("/profile"))
          .catch(() => toast.error("Failed to load profile"));
      }

      window.removeEventListener("message", handleMessage);
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 border border-on-surface/20 rounded-lg py-3 px-4 font-bold text-sm hover:bg-on-surface/5 transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.05 29.5 1 24 1 14.82 1 7.02 6.48 3.44 14.22l7.08 5.5C12.27 13.4 17.68 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.42c-.54 2.9-2.18 5.36-4.64 7.02l7.18 5.58C43.18 37.6 46.1 31.5 46.1 24.5z"
        />
        <path
          fill="#FBBC05"
          d="M10.52 28.28A14.6 14.6 0 0 1 9.5 24c0-1.48.26-2.9.72-4.22l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.86.92 7.5 2.56 10.72l7.96-6.44z"
        />
        <path
          fill="#34A853"
          d="M24 47c5.5 0 10.12-1.82 13.5-4.96l-7.18-5.58c-1.82 1.22-4.14 1.94-6.32 1.94-6.32 0-11.68-3.9-13.48-9.22l-7.96 6.44C7.02 41.52 14.82 47 24 47z"
        />
      </svg>
      Continue with Google
    </button>
  );
};

export default GoogleButton;
