import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
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
import FloatingAIHub from "./components/FloatingAIHub";
import PlanSelection from "./pages/PlanSelection";
import PaymentStatus from "./pages/PaymentStatus";

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();

  const showChat =
    location.pathname === "/" ||
    location.pathname === "/blogs" ||
    location.pathname.startsWith("/author/");

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      {showChat && (
        <FloatingAIHub showWritingTools={false} showSummary={false} />
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/blogs" element={<BlogFeed mode="all" />} />
          <Route path="/author/:userId" element={<BlogFeed mode="user" />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/blog/id/:id" element={<BlogDetail />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>

          {/* Standalone — no auth required, no redirect */}

          <Route element={<ProtectedRoute />}>
            <Route path="/my-blogs" element={<MyBlog mode="mine" />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/userProfile/:username" element={<PublicProfile />} />
            <Route path="/write" element={<BlogEditor />} />
            <Route path="/edit-blog/:id" element={<BlogEditor />} />
            <Route path="/onboarding/plan" element={<PlanSelectionWrapper />} />
            <Route path="/payment-success" element={<PaymentStatus />} />
            <Route path="/payment-cancel" element={<PaymentStatus />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

function PlanSelectionWrapper() {
  const navigate = useNavigate();
  return <PlanSelection onContinue={() => navigate("/profile")} />;
}

export default App;
