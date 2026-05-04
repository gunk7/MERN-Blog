import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchDashboardStats,
  fetchActivityChart,
} from "../../redux/thunks/adminThunks";
import {
  Users,
  FileText,
  Eye,
  Heart,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n = 0) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : String(n);

// ─── Skeleton bone ────────────────────────────────────────────────────────────
const Bone = ({ className }) => (
  <div
    className={`bg-surface-highest animate-pulse rounded-2xl ${className}`}
  />
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender flex flex-col gap-4 transition-all duration-300 hover:-translate-y-0.5">
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

// ─── Recharts Activity Component ─────────────────────────────────────────────
const ActivityChart = ({ data = [], color }) => {
  if (!data || !data.length)
    return (
      <div className="w-full h-48 mt-4 flex items-center justify-center rounded-2xl bg-surface-low border border-surface-highest/40">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50">
          No data yet
        </p>
      </div>
    );

  const slice = data.slice(-14);

  return (
    // position:relative + overflow:hidden stops Recharts from measuring
    // the full viewport width before the flex sidebar layout settles
    <div
      className="mt-4"
      style={{
        position: "relative",
        width: "100%",
        height: 192,
        overflow: "hidden",
      }}
    >
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <BarChart
          data={slice}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-surface-highest)"
          />

          <XAxis
            dataKey="_id"
            axisLine={false}
            tickLine={false}
            // Format "2026-04-22" to "Apr 22"
            tickFormatter={(str) =>
              new Date(str).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
            // Only show every 2nd or 3rd label to prevent crowding
            interval="preserveStartEnd"
            minTickGap={20}
            tick={{ fontSize: 9, fill: "var(--color-on-surface-variant)" }}
          />

          <YAxis
            allowDecimals={false} // FIX: Removes 0.75, 1.5, etc.[cite: 2]
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "var(--color-on-surface-variant)" }}
          />

          <Tooltip
            cursor={{ fill: "var(--color-surface-low)" }}
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })
            }
            contentStyle={{
              borderRadius: "1.5rem",
              border: "none",
              boxShadow: "var(--shadow-lavender)",
            }}
          />

          <Bar
            dataKey="count"
            fill={color}
            radius={[4, 4, 0, 0]}
            barSize={12} // Slightly wider bars look better with fewer days
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Top blog row ─────────────────────────────────────────────────────────────
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

// ─── Main page ────────────────────────────────────────────────────────────────
const AdminOverview = () => {
  const dispatch = useDispatch();
  const { stats, activity, loading } = useSelector((state) => state.adminBlogs);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchActivityChart());
  }, [dispatch]);

  const isLoading = loading.stats || loading.activity;

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8 flex flex-col gap-8 overflow-x-hidden w-full">
      {/* ── Header ── */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Wavelog
          </p>
          <h1 className="text-3xl font-display text-on-surface leading-tight">
            Overview
          </h1>
        </div>
      </header>

      {/* ── Stat cards ── */}
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
            icon={Heart}
            label="Total Likes"
            value={stats?.blogs?.totalLikes || 0}
            accent="#c45e7c"
          />
        </div>
      )}

      {/* ── Activity charts section ── */}
      <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender flex flex-col gap-8 overflow-hidden">
        <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Last 14 days activity
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <Bone className="h-4 w-24" />
              <Bone className="h-48 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Bone className="h-4 w-24" />
              <Bone className="h-48 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-1.5">
                <BookOpen size={11} /> New posts
              </p>
              <ActivityChart
                data={activity?.blogs || []}
                color="var(--color-primary)"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-1.5">
                <Users size={11} /> New signups
              </p>
              <ActivityChart data={activity?.users || []} color="#4e9e7a" />
            </div>
          </div>
        )}
      </div>

      {/* ── Top blogs ── */}
      <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Top posts by views
          </h2>
          <Link
            to="/dashboard/blogs"
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

      {/* ── User stats footer ── */}
      {!isLoading && stats?.users && (
        <div className="grid grid-cols-3 gap-4">
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
