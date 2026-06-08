import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogIn, MoveRight, UserPlus } from "lucide-react";
import {
  selectCurrentUser,
  selectToken,
} from "../redux/selectors/authSelectors";
import BlogFeed from "./blog/BlogFeed"; // Ensure the path to your universal BlogFeed component is correct

const Home = () => {
  const navigate = useNavigate();

  const access = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);

  const handleRedirect = () => {
    navigate("/profile");
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* HERO SECTION */}
      <main className="layout-new-age justify-start! min-h-[85vh] relative">
        {/* Background Decorative Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <h2 className="font-display text-[25vw] text-primary/5 leading-none translate-y-[-10%]">
            {access ? "Welcome" : "Wavelog."}
          </h2>
        </div>

        <section
          className="relative z-20 text-reveal mt-10 sm:mt-20"
          style={{ animationDelay: "0.2s" }}
        >
          <h1 className="font-display text-6xl sm:text-[9rem] text-on-surface leading-[0.85] mb-8">
            {access ? (
              <>
                Greetings, <br />
                <span className="italic text-primary-container mt-6">
                  {user?.username}.
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
                  className="btn-editorial w-auto! px-10 py-5 rounded-2xl shadow-none hover:shadow-lavender"
                  onClick={handleRedirect}
                >
                  Go to Profile <MoveRight size={20} />
                </button>
              ) : (
                <div className="flex flex-wrap gap-4">
                  <button
                    className="btn-editorial w-auto! px-8 py-5 rounded-2xl shadow-none"
                    onClick={() => navigate("/signup")}
                  >
                    <UserPlus size={20} /> Sign up
                  </button>
                  <button
                    className="p-5 font-bold text-on-surface hover:text-primary transition-colors flex items-center gap-2 group"
                    onClick={() => navigate("/login")}
                  >
                    <LogIn size={20} />
                    <span className="border-b border-transparent group-hover:border-primary">
                      Login
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* BLOG FEED SECTION */}
      <section className="relative z-30 -mt-5 pb-24">
        {/* Section Divider/Header */}
        <div
          className="max-w-7xl mx-auto px-8 sm:px-20 mb-16 flex items-end justify-between text-reveal"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="space-y-1">
            <p className="font-body uppercase tracking-[0.3em] text-[10px] text-primary font-bold">
              Volume 01
            </p>
            <h2 className="font-display text-5xl sm:text-6xl italic text-on-surface">
              the latest entries
            </h2>
          </div>
        </div>

        {/* Universal Blog Component 
          mode="featured" with limit 3 handles the getAllBlogs dispatch 
        */}
        <BlogFeed mode="featured" limit={3} />
      </section>
    </div>
  );
};

export default Home;
