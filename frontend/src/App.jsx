import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import Signup from "./pages/Signup";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import MyProfile from "./pages/MyProfile";
import ProtectedRoute from "./middleware/ProtectedRoute";
import BlogFeed from "./pages/blog/BlogFeed";
import BlogEditor from "./pages/blog/BlogEditor";
import PublicRoute from "./middleware/PublicRoute";
import BlogDetail from "./pages/blog/BlogDetail";
import MyBlog from "./pages/blog/MyBlog";
import PublicProfile from "./pages/PublicProfile";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Public routes — wrapped in Layout (header + footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blogs" element={<BlogFeed mode="all" />} />
          <Route path="/author/:userId" element={<BlogFeed mode="user" />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Guest only */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Logged-in users only */}
          <Route element={<ProtectedRoute />}>
            <Route path="/my-blogs" element={<MyBlog mode="mine" />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/userProfile/:username" element={<PublicProfile />} />
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
