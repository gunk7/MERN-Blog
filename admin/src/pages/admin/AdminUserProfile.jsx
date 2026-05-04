import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Heart,
  BookOpen,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  Users,
  Globe,
  ShieldCheck,
  UserX,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { toggleUserStatus } from "../../redux/thunks/adminThunks";

// ─── Local thunk (add to adminThunks.js and remove from here) ─────────────────
import { createAsyncThunk as cat } from "@reduxjs/toolkit";
export const fetchUserProfileAdmin = cat(
  "admin/fetchUserProfile",
  async (username, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/users/profile/${username}`);
      return response.data.data; // { userDetail, stats, blogs }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n = 0) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}k`
      : String(n);

const timeAgo = (date) => {
  const d = Math.floor((Date.now() - new Date(date)) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
};

const fmtDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Bone = ({ className }) => (
  <div
    className={`bg-surface-highest animate-pulse rounded-2xl ${className}`}
  />
);

const PageSkeleton = () => (
  <div className="flex flex-col gap-6 max-w-4xl">
    <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender flex gap-5">
      <Bone className="w-24 h-24 rounded-full shrink-0" />
      <div className="flex-1 flex flex-col gap-3 pt-1">
        <Bone className="h-6 w-52" />
        <Bone className="h-3 w-36" />
        <div className="flex gap-2 mt-1">
          <Bone className="h-6 w-20 rounded-full" />
          <Bone className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Bone key={i} className="h-24" />
      ))}
    </div>
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Bone key={i} className="h-20" />
      ))}
    </div>
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="bg-white border border-black/5 rounded-3.5xl p-4 flex gap-4"
      >
        <Bone className="w-14 h-14 rounded-xl shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Bone className="h-3 w-20" />
          <Bone className="h-4 w-full" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div
    className="bg-white border border-black/5 rounded-4xl p-5 shadow-lavender
               flex flex-col items-center gap-2 text-center"
  >
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center"
      style={{ background: accent + "18" }}
    >
      <Icon size={16} style={{ color: accent }} />
    </div>
    <p className="text-2xl font-display font-bold text-on-surface">
      {fmt(value)}
    </p>
    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant leading-tight">
      {label}
    </p>
  </div>
);

// ─── Status pill ──────────────────────────────────────────────────────────────
const BlogStatusPill = ({ status }) => {
  const map = {
    published: "bg-green-50 text-green-700 border-green-100",
    draft: "bg-surface-high text-on-surface-variant border-surface-highest",
    scheduled: "bg-primary-fixed text-primary border-primary-fixed-dim",
  };
  const dot = {
    published: "bg-green-500",
    draft: "bg-on-surface-variant/30",
    scheduled: "bg-primary",
  };
  return (
    <span
      className={`status-badge border ${map[status] || map.draft} text-[10px]`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dot[status] || dot.draft}`}
      />
      {status}
    </span>
  );
};

// ─── Info row ────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-surface-highest/40 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-surface-low flex items-center justify-center shrink-0">
        <Icon size={13} className="text-on-surface-variant" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-24 shrink-0">
        {label}
      </span>
      <span className="text-sm text-on-surface">{value}</span>
    </div>
  );
};

// ─── Blog row ────────────────────────────────────────────────────────────────
const BlogRow = ({ blog, rank }) => {
  const imgUrl = import.meta.env.VITE_API_IMG_URL;
  return (
    <div
      className="bg-white border border-black/5 rounded-3xl p-4 shadow-lavender
                    flex items-center gap-4 hover:-translate-y-0.5 transition-all duration-200"
    >
      <span className="font-display text-xl font-bold text-surface-highest w-5 text-center shrink-0">
        {rank}
      </span>
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-low shrink-0 border border-surface-highest/40">
        {blog.coverImage ? (
          <img
            src={`${imgUrl}/${blog.coverImage}`}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/20 text-xl">
            ✦
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {blog.category && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            {blog.category}
          </p>
        )}
        <p className="text-sm font-medium text-on-surface truncate">
          {blog.title}
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5 truncate">
          {blog.description}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <BlogStatusPill status={blog.status} />
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="flex items-center gap-0.5">
            <Eye size={10} /> {fmt(blog.viewsCount || 0)}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart size={10} /> {fmt(blog.likesCount || 0)}
          </span>
        </div>
        <span className="text-[10px] text-on-surface-variant/50">
          {timeAgo(blog.publishedAt || blog.createdAt)}
        </span>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AdminUserProfile = () => {
  const { username } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const imgUrl = import.meta.env.VITE_API_IMG_URL;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Fetch profile
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    dispatch(fetchUserProfileAdmin(username))
      .unwrap()
      .then((data) => setProfileData(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [username, dispatch]);

  const handleToggleStatus = async () => {
    if (!profileData?.userDetail) return;
    const { _id, active } = profileData.userDetail;
    setToggling(true);
    dispatch(toggleUserStatus({ userId: _id, active }))
      .unwrap()
      .then(() => {
        setProfileData((prev) => ({
          ...prev,
          userDetail: { ...prev.userDetail, active: !active },
        }));
        toast.success(
          `User ${active ? "deactivated" : "activated"} successfully`,
        );
      })
      .catch((err) => toast.error(err || "Failed to update status"))
      .finally(() => setToggling(false));
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 sm:p-8">
        <Bone className="w-16 h-4 mb-8" />
        <PageSkeleton />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-6xl text-surface-highest mb-4">404</p>
          <p className="font-semibold text-on-surface">User not found</p>
          <p className="text-sm text-on-surface-variant mt-1">
            {error || "This profile doesn't exist."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 flex items-center gap-2 mx-auto text-sm font-bold text-primary hover:underline"
          >
            <ArrowLeft size={14} /> Go back
          </button>
        </div>
      </div>
    );
  }

  const { userDetail: user, stats, blogs } = profileData;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="max-w-4xl flex flex-col gap-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest
                     text-on-surface-variant hover:text-on-surface transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to users
        </button>

        {/* ── Profile header card ── */}
        <div className="bg-white border border-black/5 rounded-4xl p-6 sm:p-8 shadow-lavender">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-surface-highest bg-surface-low shrink-0">
              {user.profilePic ? (
                <img
                  src={`${imgUrl}/${user.profilePic}`}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-fixed text-primary font-display font-bold text-2xl">
                  {user.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + badges + actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-display font-bold text-on-surface">
                    {fullName || user.username}
                  </h1>
                  {fullName && (
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      @{user.username}
                    </p>
                  )}
                </div>

                {/* Toggle active button */}
                <button
                  onClick={handleToggleStatus}
                  disabled={toggling}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                              border transition-all duration-200 disabled:opacity-50
                              ${
                                user.active
                                  ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                              }`}
                >
                  {user.active ? (
                    <>
                      <UserX size={13} /> Deactivate
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} /> Activate
                    </>
                  )}
                </button>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {user.isAccountVerified ? (
                  <span className="status-badge status-verified">
                    <CheckCircle size={11} /> Verified
                  </span>
                ) : (
                  <span className="status-badge status-pending">
                    <XCircle size={11} /> Unverified
                  </span>
                )}
                {user.role && (
                  <span className="status-badge bg-primary-fixed text-primary border border-primary-fixed-dim">
                    <ShieldCheck size={11} /> {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-on-surface-variant leading-relaxed mt-5 pt-5 border-t border-surface-highest/40">
              {user.bio}
            </p>
          )}

          {/* Info grid */}
          <div className="mt-5 pt-5 border-t border-surface-highest/40 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={MapPin} label="Country" value={user.country} />
            <InfoRow
              icon={Calendar}
              label="Joined"
              value={fmtDate(user.createdAt)}
            />
            <InfoRow
              icon={Calendar}
              label="Birthday"
              value={fmtDate(user.dateOfBirth)}
            />
            <InfoRow
              icon={Users}
              label="Followers"
              value={
                user.followersCount != null ? fmt(user.followersCount) : null
              }
            />
            <InfoRow
              icon={Users}
              label="Following"
              value={
                user.followingCount != null ? fmt(user.followingCount) : null
              }
            />
          </div>
        </div>

        {/* ── Stats row ── */}
        {stats && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={BookOpen}
                label="Total Posts"
                value={stats.totalBlogs}
                accent="#6a5188"
              />
              <StatCard
                icon={Eye}
                label="Total Views"
                value={stats.totalViews}
                accent="#d4845a"
              />
              <StatCard
                icon={Heart}
                label="Total Likes"
                value={stats.totalLikes}
                accent="#c45e7c"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={CheckCircle}
                label="Published"
                value={stats.totalPublished}
                accent="#4e9e7a"
              />
              <StatCard
                icon={Clock}
                label="Drafts"
                value={stats.totalDrafts}
                accent="#e5a84a"
              />
              <StatCard
                icon={TrendingUp}
                label="Scheduled"
                value={stats.totalScheduled}
                accent="#6a5188"
              />
            </div>
          </>
        )}

        {/* ── Top blogs ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Top posts by {user.firstName || user.username}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {blogs.length} shown · all statuses
            </span>
          </div>

          {blogs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {blogs.map((blog, i) => (
                <BlogRow key={blog._id} blog={blog} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div
              className="bg-white border border-black/5 rounded-4xl shadow-lavender
                            py-16 text-center text-sm italic text-on-surface-variant"
            >
              This user hasn't written any posts yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserProfile;
