import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard, Users, LogOut, ChevronLeft } from "lucide-react";
import { logout } from "../../redux/slice/authSlice";
import { selectCurrentUser } from "../../redux/selectors/authSelectors";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    // { to: "/dashboard/users", icon: <Users size={16} />, label: "Users" },
  ];

  return (
    <div className="min-h-screen bg-surface flex">

      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-surface-highest/60 flex flex-col shrink-0
          sticky top-0 h-screen transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-56"}
        `}
      >
        {/* Logo + collapse toggle */}
        <div className="px-3 py-5 border-b border-surface-highest/60 flex items-center justify-between min-h-18">
          {!collapsed && (
            <div>
              <span className="font-display text-xl text-on-surface">Wavelog.</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-0.5">
                Admin Console
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`
              w-7 h-7 rounded-lg flex items-center justify-center shrink-0
              text-on-surface-variant hover:bg-surface-low hover:text-on-surface
              transition-all duration-200
              ${collapsed ? "mx-auto" : "ml-auto"}
            `}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={16}
              className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
          {!collapsed && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 mb-2">
              Main
            </p>
          )}
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-200 overflow-hidden
                 ${collapsed ? "justify-center" : ""}
                 ${isActive
                   ? "bg-primary-fixed text-primary font-bold"
                   : "text-on-surface-variant hover:bg-surface-low hover:text-on-surface"
                 }`
              }
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-2 py-4 border-t border-surface-highest/60">
          {collapsed ? (
            <div className="flex justify-center mb-3">
              <div
                className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary"
                title={currentUser?.username ?? "Admin"}
              >
                {currentUser?.username?.slice(0, 2).toUpperCase() ?? "AD"}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {currentUser?.username?.slice(0, 2).toUpperCase() ?? "AD"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {currentUser?.username ?? "Admin"}
                </p>
                <p className="text-[10px] text-on-surface-variant">Super admin</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? "Log out" : undefined}
            className={`
              flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-sm
              text-on-surface-variant hover:bg-red-50 hover:text-red-600
              transition-all duration-200
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;