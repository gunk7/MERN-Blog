import React, { useState, useEffect, useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LogOut, PenSquare, Menu, X } from "lucide-react";
// Import the thunk and selectors
import { logoutUser } from "../redux/thunks/authThunks";
import {
  selectCurrentUser,
  selectToken,
  selectAuthLoading,
} from "../redux/selectors/authSelectors";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const access = useSelector(selectToken);
  const user = useSelector(selectCurrentUser);
  const isLoading = useSelector(selectAuthLoading);
  // Get refreshToken for backend revocation
  const refreshToken = useSelector((state) => state.auth.refreshToken);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // State for Logout Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Footer reveal: hidden by default, slides up into view only once the
  // user has scrolled all the way to the bottom; slides back out the
  // moment they scroll up again (mirrors the header's reveal/hide logic).
  const [footerVisible, setFooterVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef(null);

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

  // Footer: fixed to the bottom of the viewport. Reveals only when the user
  // hits the very bottom of the page. The instant they scroll back up —
  // even slightly — it slides out and stays hidden until they scroll back
  // down to the bottom again.
  useEffect(() => {
    let prevScrollY = window.scrollY;

    const controlFooter = () => {
      const currentScrollY = window.scrollY;
      const scrolledUp = currentScrollY < prevScrollY;
      const docHeight = document.documentElement.scrollHeight;
      const atBottom = currentScrollY + window.innerHeight >= docHeight - 4;

      if (scrolledUp) {
        setFooterVisible(false);
      } else if (atBottom) {
        setFooterVisible(true);
      }

      prevScrollY = currentScrollY;
    };

    window.addEventListener("scroll", controlFooter, { passive: true });
    // Run once on mount in case the page loads already scrolled to bottom
    controlFooter();
    return () => window.removeEventListener("scroll", controlFooter);
  }, []);

  // Measure footer height so <main> can reserve space for it and avoid
  // content being covered when the footer slides into view.
  useEffect(() => {
    if (!footerRef.current) return;
    const el = footerRef.current;
    const observer = new ResizeObserver((entries) => {
      setFooterHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Handle actual logout via thunk
  const handleConfirmLogout = async (allDevices = false) => {
    await dispatch(logoutUser({ refreshToken, allDevices }));
    setShowLogoutModal(false);
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col font-body bg-surface text-on-surface antialiased">
      {/* --- LOGOUT MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-primary/10">
            <h3 className="text-xl font-black tracking-tight mb-2">
              Confirm Logout
            </h3>
            <p className="text-on-surface-variant text-sm mb-6">
              Are you sure you want to end your session, {user?.firstName}?
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={isLoading}
                onClick={() => handleConfirmLogout(false)}
                className="bg-primary text-white py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-all"
              >
                {isLoading ? "Processing..." : "Logout"}
              </button>
              <button
                disabled={isLoading}
                onClick={() => handleConfirmLogout(true)}
                className="bg-surface-low text-primary py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                Logout all devices
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-on-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

            <nav className="hidden md:flex items-center gap-8 border-l border-primary/10 pl-10 text-[11px] font-bold uppercase tracking-[0.2em]">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <Link
                to="/blogs"
                className="hover:text-primary transition-colors"
              >
                Blogs
              </Link>
              {access && (
                <>
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
                  {/* Updated trigger to open Modal */}
                  <button
                    onClick={() => setShowLogoutModal(true)}
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
                {/* Updated trigger to open Modal */}
                <button
                  onClick={() => setShowLogoutModal(true)}
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

      {/* ── Sticky-footer wrapper ──────────────────────────────────────────
          The footer is now `fixed` to the viewport bottom rather than
          flowing in-document — it only slides into view once the user
          scrolls to the very bottom of the page, and slides back out the
          instant they scroll up. `main` reserves bottom padding equal to
          the footer's measured height so its content is never covered. */}
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out ai-panel-shift">
        <main
          className="flex-1 pt-20"
          style={{ paddingBottom: footerVisible ? footerHeight : 0 }}
        >
          <Outlet />
        </main>

        <footer
          ref={footerRef}
          className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-primary/10 py-12 px-6 transition-transform duration-500 ease-editorial ${
            footerVisible ? "translate-y-0" : "translate-y-full"
          }`}
        >
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
    </div>
  );
};

export default Layout;
