import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, LogIn, MoveRight, UserPlus } from "lucide-react";
import {
  selectCurrentUser,
  selectToken,
} from "../redux/selectors/authSelectors";
import { logout } from "../redux/slice/authSlice";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const access = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged Out Successfully");
    navigate("/");
  };

  return (
    <main className="layout-new-age">
      {/* Background Decorative Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <h2 className="font-display text-[25vw] text-primary/5 leading-none">
          {access ? "Welcome" : "Wavelog."}
        </h2>
      </div>

      {/* Main Content Body */}
      <section
        className="relative z-20 text-reveal"
        style={{ animationDelay: "0.2s" }}
      >
        <h1 className="font-display text-7xl sm:text-[9rem] text-on-surface leading-[0.85] mb-8">
          {access ? (
            <>
              Greetings, <br />
              <span className="italic text-primary-container">
                {user?.firstName}
              </span>
            </>
          ) : (
            <>
              Write. <br />
              <span className="italic">Explore.</span> <br />
              <span className="text-primary-container">Repeat.</span>
            </>
          )}
        </h1>

        <div className="flex flex-col sm:flex-row items-start gap-12 mt-12">
          <p className="font-body text-xl text-on-surface-variant max-w-sm leading-relaxed">
            {access
              ? "Your creative dashboard is live. Your latest drafts and community insights are ready for review."
              : "Welcome to a minimalist sanctuary for writers and readers alike. Discover stories that resonate."}
          </p>

          <div className="flex flex-col gap-4">
            {access ? (
              <button
                className="btn-editorial w-auto! px-10 py-5 rounded-2xl shadow-none hover:shadow-xl"
                onClick={() => navigate("/dashboard")}
              >
                Go to Workspace <MoveRight size={20} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  className="btn-editorial w-auto! px-4 py-5 rounded-2xl"
                  onClick={() => navigate("/signup")}
                >
                  <UserPlus size={20} /> Sign up
                </button>
                <button
                  className="p-5 font-bold hover:text-primary transition-colors flex items-center gap-2"
                  onClick={() => navigate("/login")}
                >
                  <LogIn size={20} /> Login
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
