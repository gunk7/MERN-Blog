import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { googleLogin } from "../redux/slice/authSlice";
import { getProfile } from "../redux/thunks/userThunks";

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log("full URL:", window.location.href);
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    console.log("URL params:", window.location.search);
    console.log("accessToken:", accessToken);
    console.log("refreshToken:", refreshToken);

    if (!accessToken || !refreshToken) {
      navigate("/login?error=no_token");
      return;
    }

    dispatch(googleLogin({ accessToken, refreshToken }));

    dispatch(getProfile(accessToken))
      .unwrap()
      .then(() => {
        navigate("/profile");
      })
      .catch((err) => {
        console.log("profile error:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center font-body text-on-surface">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
      <p className="text-on-surface-variant text-sm italic">
        Logging you in...
      </p>
    </div>
  );
}
