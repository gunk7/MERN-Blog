import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages & Components
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import AdminUserProfile from "./pages/admin/AdminUserProfile";
import AdminBlogViewer from "./pages/admin/AdminBlogViewer";

// Middleware
import PublicRoute from "./middleware/PublicRoute";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Admin routes */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminOverview />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/blogs" element={<BlogManagement />} />
          <Route
            path="/users/profile/:username"
            element={<AdminUserProfile />}
          />
          <Route path="/blogs/:id" element={<AdminBlogViewer />} />
        </Route>

        {/* Public routes */}
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
