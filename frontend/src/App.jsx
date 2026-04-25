import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import Singup from "./pages/Singup";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import MyProfile from "./pages/MyProfile";
import Dashboard from "./pages/admin/Dashboard";
import ProtectedRoute from "./middlware/ProtectedRoute";
import BlogFeed from "./pages/blog/BlogFeed";
import BlogEditor from "./pages/blog/BlogEditor";
import PublicRoute from "./middlware/PublicRoute";
import BlogDetail from "./pages/blog/BlogDetail";
import MyBog from "./pages/blog/MyBog";
import AdminLayout from "./pages/admin/AdminLayout";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Admin routes — no header/footer */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add this */}
        </Route>

        {/* Public routes — wrapped in Layout (header + footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blogs" element={<BlogFeed mode="all" />} />
          <Route path="/author/:userId" element={<BlogFeed mode="user" />} />
          <Route path="/blog/:id" element={<BlogDetail />} />

          {/* Guest only */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Singup />} />
          </Route>

          {/* Logged-in users only */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my-blogs" element={<MyBog mode="mine" />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/write" element={<BlogEditor />} />
            <Route path="/edit-blog/:id" element={<BlogEditor />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
