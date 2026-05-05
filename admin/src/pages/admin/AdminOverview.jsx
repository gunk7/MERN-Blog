import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
// 1. Import Recharts components
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchDashboardStats,
  fetchActivityChart,
} from "../../redux/thunks/adminThunks";
import {
  Users,
  FileText,
  Eye,
  TrendingUp,
  BookOpen,
  RefreshCw,
} from "lucide-react";

const fmt = (n = 0) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : String(n);

const Bone = ({ className }) => (
  <div
    className={`bg-surface-highest animate-pulse rounded-2xl ${className}`}
  />
);

// ─── Recharts Component ──────────────────────────────────────────────────────
const RechartsActivity = ({ data = [], color, chartTab }) => {
  // Added chartTab prop
  if (!data.length)
    return (
      <p className="text-xs italic text-on-surface-variant text-center py-8">
        No data available.
      </p>
    );

  // Format data for Recharts
  const chartData = data.slice(-14).map((d) => ({
    date: new Date(d._id).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    count: d.count,
  }));

  return (
    <div className="h-48 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(0,0,0,0.05)"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b637a", fontSize: 10, fontWeight: "bold" }}
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6b637a", fontSize: 10 }}
          />
          <Tooltip
            // Custom formatter to show specific labels[cite: 1]
            formatter={(value) => [
              value,
              chartTab === "posts" ? "Post Count" : "User Count",
            ]}
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "1.5rem",
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0px 10px 30px rgba(106, 81, 136, 0.06)", // shadow-lavender
              fontFamily: '"Times New Roman", serif', // font-display[cite: 1]
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorGradient)"
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5 text-reveal">
    <div className="flex items-start justify-between">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: accent + "18" }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      {sub !== undefined && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-low px-2 py-1 rounded-full">
          +{sub} this week
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-display font-bold text-on-surface">
        {fmt(value)}
      </p>
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1">
        {label}
      </p>
    </div>
  </div>
);

const TopBlogRow = ({ blog, rank }) => {
  const imgUrl = import.meta.env.VITE_API_IMG_URL;
  return (
    <div className="flex items-center gap-4 py-3 border-t border-surface-highest/40 first:border-t-0">
      <span className="font-display text-2xl font-bold text-surface-highest w-7 shrink-0 text-center">
        {rank}
      </span>
      {blog.coverImage ? (
        <img
          src={`${imgUrl}/${blog.coverImage}`}
          alt={blog.title}
          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-surface-highest/40"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-surface-low shrink-0 flex items-center justify-center text-on-surface-variant/30 text-lg">
          ✦
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface truncate">
          {blog.title}
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          by {blog.author?.username || "—"}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs font-bold text-on-surface-variant shrink-0">
        <Eye size={11} />
        {fmt(blog.viewsCount)}
      </div>
    </div>
  );
};

const AdminOverview = () => {
  const dispatch = useDispatch();
  const { stats, activity, loading } = useSelector((state) => state.adminBlogs);
  const [chartTab, setChartTab] = useState("posts");

  const load = () => {
    dispatch(fetchDashboardStats());
    dispatch(fetchActivityChart());
  };

  useEffect(() => {
    load();
  }, [dispatch]);

  const isLoading = loading.stats || loading.activity;

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8 flex flex-col gap-8">
      <header className="flex items-end justify-between text-reveal">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Wavelog
          </p>
          <h1 className="text-3xl font-display text-on-surface leading-tight">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />{" "}
            Refresh
          </button>
          <Link
            to="/users"
            className="text-xs font-bold text-primary hover:underline"
          >
            Manage Users →
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.users?.total || 0}
            sub={stats?.users?.newThisWeek}
            accent="#6a5188"
          />
          <StatCard
            icon={FileText}
            label="Published"
            value={stats?.blogs?.published || 0}
            sub={stats?.blogs?.newThisWeek}
            accent="#4e9e7a"
          />
          <StatCard
            icon={Eye}
            label="Total Views"
            value={stats?.blogs?.totalViews || 0}
            accent="#d4845a"
          />
          <StatCard
            icon={TrendingUp}
            label="Scheduled"
            value={stats?.blogs?.scheduled || 0}
            accent="#6a5188"
          />
        </div>
      )}

      {/* ── Activity Chart ── */}
      <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender flex flex-col gap-4 text-reveal">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Activity
          </h2>
          <div className="flex items-center gap-1 bg-surface-low rounded-xl p-1">
            <button
              onClick={() => setChartTab("posts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${chartTab === "posts" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <BookOpen size={10} /> New Posts
            </button>
            <button
              onClick={() => setChartTab("signups")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${chartTab === "signups" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              <Users size={10} /> Signups
            </button>
          </div>
        </div>

        {isLoading ? (
          <Bone className="h-48" />
        ) : (
          <RechartsActivity
            data={
              chartTab === "posts"
                ? activity?.blogs || []
                : activity?.users || []
            }
            color={chartTab === "posts" ? "#6a5188" : "#4e9e7a"}
            chartTab={chartTab} 
          />
        )}
      </div>

      <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender text-reveal">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Top posts by views
          </h2>
          <Link
            to="/blogs"
            className="text-xs font-bold text-primary hover:underline"
          >
            All posts →
          </Link>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <Bone key={i} className="h-14" />
            ))}
          </div>
        ) : stats?.topBlogs?.length ? (
          <div>
            {stats.topBlogs.map((blog, i) => (
              <TopBlogRow key={blog._id} blog={blog} rank={i + 1} />
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-on-surface-variant py-8 text-center">
            No published posts yet.
          </p>
        )}
      </div>

      {!isLoading && stats?.users && (
        <div className="grid grid-cols-3 gap-4 text-reveal">
          {[
            {
              label: "Verified",
              value: stats.users.verified,
              color: "text-green-600",
            },
            {
              label: "Unverified",
              value: stats.users.unverified,
              color: "text-amber-600",
            },
            {
              label: "New This Week",
              value: stats.users.newThisWeek,
              color: "text-primary",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-white border border-black/5 rounded-4xl p-5 shadow-lavender text-center"
            >
              <p className={`text-2xl font-display font-bold ${color}`}>
                {fmt(value)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
