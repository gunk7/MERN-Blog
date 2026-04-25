import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// Added BookText icon for the "My Blogs" link
import { LogOut, PenSquare, Search, Menu, X, BookText } from "lucide-react";
import { logout } from "../redux/slice/authSlice";
import {
  selectCurrentUser,
  selectToken,
} from "../redux/selectors/authSelectors";

const Layout = ({}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const access = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dashboardLink = user?.role === "admin" ? "/dashboard" : "/profile";
  const dashboardLabel = user?.role === "admin" ? "Dashboard" : "Profile";

  useEffect(() => {
    const controlNavbar = () => {
      if (isMenuOpen) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => window.removeEventListener("scroll", controlNavbar);
  }, [lastScrollY, isMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-surface text-on-surface antialiased">
      <header
        className={`w-full bg-white/95 backdrop-blur-md border-b border-primary/10 fixed top-0 z-50 transition-transform duration-500 ease-editorial ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-12">
            <button
              className="md:hidden p-1 text-on-surface hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              to="/"
              className="text-2xl md:text-3xl font-black tracking-tighter"
            >
              Wavelog<span className="text-primary">.</span>
            </Link>

            {/* --- DESKTOP NAV --- */}
            <nav className="hidden md:flex items-center gap-8 border-l border-primary/10 pl-10 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <Link
                to="/blogs"
                className="hover:text-primary transition-colors"
              >
                Blogs{" "}
              </Link>

              {access && (
                <>
                  {/* ADDED: My Blogs Link for Desktop */}
                  <Link
                    to="/my-blogs"
                    className="hover:text-primary transition-colors"
                  >
                    My Blogs
                  </Link>
                  <Link
                    to={dashboardLink}
                    className="hover:text-primary transition-colors"
                  >
                    {dashboardLabel}
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {access ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/write"
                  className="hidden sm:flex items-center gap-2 bg-surface-low text-primary px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  <PenSquare size={16} /> Write
                </Link>

                <div className="flex items-center gap-3 bg-surface border border-primary/5 p-1 rounded-full ml-1">
                  <Link
                    to={dashboardLink}
                    className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider pl-3 hover:text-primary transition-colors"
                  >
                    {user?.firstName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-on-surface-variant shadow-sm hover:text-rose-500 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-on-surface text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-primary transition-all active:scale-95"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* --- MOBILE OVERLAY MENU --- */}
        <div
          className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-primary/10 transition-all duration-500 ease-editorial overflow-hidden ${isMenuOpen ? "max-h-screen" : "max-h-0"}`}
        >
          <nav className="flex flex-col items-center gap-6 py-8 font-bold uppercase tracking-widest text-[11px]">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-primary"
            >
              Home
            </Link>

            {access ? (
              <>
                <Link
                  to={dashboardLink}
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-primary"
                >
                  {dashboardLabel}
                </Link>

                {/* ADDED: My Blogs Link for Mobile */}
                <Link
                  to="/my-blogs"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-primary flex items-center gap-2"
                >
                  My Blogs
                </Link>

                <Link
                  to="/write"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-primary flex items-center gap-2"
                >
                  <PenSquare size={14} /> Write Post
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-rose-500 pt-4 border-t border-primary/5 w-1/2 flex justify-center"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="text-primary"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="grow container mx-auto max-w-7xl px-6 pt-32 pb-12">
        {<Outlet />}
      </main>

      <footer className="bg-white border-t border-primary/10 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <h2 className="text-2xl font-black tracking-tighter">
              Wavelog<span className="text-primary">.</span>
            </h2>
            <p className="text-[10px] text-on-surface-variant italic font-body">
              Where thoughts find their rhythm.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
