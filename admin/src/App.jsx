import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages & Components
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import PublicRoute from "./middleware/PublicRoute";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import AdminUserProfile from "./pages/admin/AdminUserProfile";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Admin Route Group */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminOverview />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/blogs" element={<BlogManagement />} />
          <Route
            path="/users/profile/:username"
            element={<AdminUserProfile />}
          />
        </Route>

        {/* Public Route Group - Prevents logged-in users from seeing Login */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
