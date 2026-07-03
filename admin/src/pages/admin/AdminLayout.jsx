import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Calendar,
  CurrencyIcon,
  HandCoins,
  Bug,
  Terminal,
} from "lucide-react";
import { logout } from "../../redux/slice/authSlice";
import { selectCurrentUser } from "../../redux/selectors/authSelectors";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const navItems = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard size={16} />,
      label: "Overview",
    },
    { to: "/users", icon: <Users size={16} />, label: "Users" },
    { to: "/blogs", icon: <FileText size={16} />, label: "Posts" },
    { to: "/plans", icon: <CreditCard size={16} />, label: "Plans" },
    {
      to: "/subscriptions",
      icon: <Calendar size={16} />,
      label: "Subscriptions",
    },
    {
      to: "/transactions",
      icon: <CurrencyIcon size={16} />,
      label: "Transactions",
    },
    ,
    { to: "/refund", icon: <HandCoins size={16} />, label: "Refund " },
    { to: "/error", icon: <Bug size={16} />, label: "Errors" },
    { to: "/console", icon: <Terminal size={16} />, label: "Console" },
  ];

  const NavContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo + Toggle */}
      <div className="px-3 py-5 border-b border-surface-highest/60 flex items-center justify-between min-h-18">
        {(!collapsed || isMobile) && (
          <div className="animate-in fade-in duration-500">
            <span className="font-display text-xl text-on-surface">
              Wavelog.
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
              Admin Console
            </p>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-on-surface-variant hover:bg-surface-low rounded-lg"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-low transition-all ${collapsed ? "mx-auto" : "ml-auto"}`}
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
        {(!collapsed || isMobile) && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-2 animate-in fade-in duration-500">
            Main
          </p>
        )}
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => isMobile && setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
               ${collapsed && !isMobile ? "justify-center" : ""}
               ${isActive ? "bg-primary-fixed text-primary font-bold shadow-sm" : "text-on-surface-variant hover:bg-surface-low"}`
            }
          >
            <span className="shrink-0">{icon}</span>
            {(!collapsed || isMobile) && (
              <span className="truncate animate-in slide-in-from-left-2 duration-300">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-4 border-t border-surface-highest/60 bg-white">
        <NavLink
          to="/profile"
          onClick={() => isMobile && setIsMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 mb-3 px-1 rounded-xl transition-all duration-200 cursor-pointer
             ${collapsed && !isMobile ? "justify-center" : ""}
             ${isActive ? "bg-primary-fixed" : "hover:bg-surface-low"}`
          }
        >
          {!collapsed || isMobile ? (
            <div className="flex items-center gap-3 px-1.5 py-2 animate-in fade-in duration-300 w-full">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {currentUser?.username?.slice(0, 2).toUpperCase() ?? "AD"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {currentUser?.username ?? "Admin"}
                </p>
                <p className="text-[10px] text-on-surface-variant">
                  Super admin
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <div
                className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary"
                title={currentUser?.username}
              >
                {currentUser?.username?.slice(0, 2).toUpperCase() ?? "AD"}
              </div>
            </div>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${collapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut size={15} className="shrink-0" />
          {(!collapsed || isMobile) && <span>Log out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-surface flex flex-col md:flex-row overflow-hidden">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-white border-b border-surface-highest/60 sticky top-0 z-30">
        <span className="font-display text-lg text-on-surface">Wavelog.</span>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-on-surface-variant hover:bg-surface-low rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 bottom-0 w-70 max-w-[80%] transform transition-transform duration-300 ease-in-out shadow-2xl ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <NavContent isMobile={true} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex bg-white border-r border-surface-highest/60 flex-col shrink-0 transition-all duration-300 ease-in-out z-20 ${collapsed ? "w-18" : "w-52"}`}
      >
        <NavContent isMobile={false} />
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <Outlet context={{ sidebarCollapsed: collapsed }} />
      </main>
    </div>
  );
};

export default AdminLayout;
