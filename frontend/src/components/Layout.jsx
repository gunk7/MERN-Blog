import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut, PenSquare, Search, Menu, X } from "lucide-react";
import { logout } from "../redux/slice/authSlice";
import {
  selectCurrentUser,
  selectToken,
} from "../redux/selectors/authSelectors";

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const access = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);

  // States for Scroll and Mobile Menu
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Scroll logic for hiding/showing navbar
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
      {/* --- RESPONSIVE HEADER --- */}
      <header
        className={`w-full bg-white/95 backdrop-blur-md border-b border-primary/10 fixed top-0 z-50 transition-transform duration-500 ease-editorial ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-12">
            {/* Mobile Menu Toggle */}
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

            {/* Desktop Nav - Using v4 theme spacing and colors */}
            <nav className="hidden md:flex items-center gap-8 border-l border-primary/10 pl-10 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
             
              {access && (
                <Link
                  to="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </button>

            {access ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/write"
                  className="hidden sm:flex items-center gap-2 bg-surface-low text-primary px-4 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  <PenSquare size={16} /> Write
                </Link>

                {/* User Pill */}
                <div className="flex items-center gap-3 bg-surface border border-primary/5 p-1 rounded-full ml-1">
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider pl-3">
                    {user?.firstName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-on-surface-variant shadow-sm hover:text-rose-500 transition-colors"
                  >
                    <LogOut size={14} />
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
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* --- MOBILE OVERLAY MENU --- */}
        <div
          className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-primary/10 transition-all duration-500 ease-editorial overflow-hidden ${isMenuOpen ? "max-h-screen border-b-primary/20" : "max-h-0"}`}
        >
          <nav className="flex flex-col items-center gap-6 py-8 font-bold uppercase tracking-widest text-[11px]">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-primary"
            >
              Home
            </Link>
            <Link
              to="/trending"
              onClick={() => setIsMenuOpen(false)}
              className="hover:text-primary"
            >
              Trending
            </Link>
            {access ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-primary"
                >
                  Dashboard
                </Link>
                <Link
                  to="/write"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-primary"
                >
                  Write Post
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-rose-500 pt-4 border-t border-primary/5 w-1/2 text-center"
                >
                  Logout
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

      {/* --- CONTENT --- */}
      <main className="grow container mx-auto max-w-4xl px-6 pt-32 pb-12">
        {children}
      </main>

      {/* --- FOOTER --- */}
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

          <div className="flex flex-col items-center md:items-end gap-4">
            <nav className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <Link to="/about" className="hover:text-primary">
                About
              </Link>
              <Link to="/privacy" className="hover:text-primary">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-primary">
                Terms
              </Link>
            </nav>
            <div className="text-on-surface-variant/40 text-[9px] font-bold uppercase tracking-[0.3em]">
              © 2026 / Editorial Design System
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
