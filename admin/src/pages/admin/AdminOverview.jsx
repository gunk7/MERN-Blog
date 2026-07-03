import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
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

// ─── Recharts Activity Chart ─────────────────────────────────────────────────
const RechartsActivity = ({ data = [], color, chartTab }) => {
  if (!data.length)
    return (
      <p className="text-xs italic text-on-surface-variant text-center py-8">
        No data available.
      </p>
    );

  const chartData = data
    .filter((d) => d?.date)
    .map((d) => ({
      date: (() => {
        const [year, month, day] = d.date.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      })(),
      count: d.count,
    }));

  return (
    <div style={{ width: "100%", height: 192, minWidth: 0 }} className="mt-2">
      <ResponsiveContainer width="100%" height={192}>
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
            formatter={(value) => [
              value,
              chartTab === "posts" ? "Post Count" : "User Count",
            ]}
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "1.5rem",
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0px 10px 30px rgba(106, 81, 136, 0.06)",
              fontFamily: '"Times New Roman", serif',
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

// ─── Post Status Donut Chart ──────────────────────────────────────────────────
const STATUS_META = [
  { key: "published", label: "Published", color: "#4e9e7a" },
  { key: "draft", label: "Draft", color: "#6a5188" },
  { key: "scheduled", label: "Scheduled", color: "#d4845a" },
  { key: "under_review", label: "Under Review", color: "#888780" },
];

const PostStatusChart = ({ stats }) => {
  const counts = STATUS_META.map((s) => stats?.blogs?.[s.key] || 0);
  const total = counts.reduce((a, b) => a + b, 0);

  const size = 144;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = STATUS_META.map((s, i) => {
    const pct = total ? counts[i] / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotate = (offset / circumference) * 360 - 90;
    offset += dash;
    return { ...s, dash, gap, rotate, count: counts[i], pct };
  });

  return (
    <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender text-reveal">
      <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-5">
        Post status breakdown
      </h2>
      <div className="flex items-center gap-8 flex-wrap">
        {/* SVG Donut */}
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {total === 0 ? (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="#f0edf5"
                strokeWidth={stroke}
              />
            ) : (
              slices.map((s) => (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={0}
                  transform={`rotate(${s.rotate} ${size / 2} ${size / 2})`}
                  strokeLinecap="butt"
                />
              ))
            )}
            <text
              x={size / 2}
              y={size / 2 - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fontWeight="bold"
              fill="#1a1523"
            >
              {fmt(total)}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 14}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#6b637a"
              style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              TOTAL
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-[180px]">
          {slices.map((s) => {
            const pct = total ? Math.round((s.count / total) * 100) : 0;
            return (
              <div key={s.key} className="flex items-center gap-2 text-[13px]">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: s.color }}
                />
                <span className="flex-1 text-on-surface-variant">
                  {s.label}
                </span>
                <span className="font-bold text-on-surface w-8 text-right">
                  {fmt(s.count)}
                </span>
                <span className="text-on-surface-variant w-9 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Top Blog Row ─────────────────────────────────────────────────────────────
const TopBlogRow = ({ blog, rank }) => {
  const imgUrl = import.meta.env.VITE_API_IMG_URL;
  return (
    <div className="flex items-center gap-4 py-3 border-t border-surface-highest/40 first:border-t-0">
      <span className="font-display text-2xl font-bold text-surface-highest w-7 shrink-0 text-center">
        {rank}
      </span>
      {blog.coverImage ? (
        <img
          src={`${blog.coverImage}`}
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

// ─── Days Toggle ──────────────────────────────────────────────────────────────
const DAY_OPTIONS = [7, 14, 30, 90];

// ─── Admin Overview ───────────────────────────────────────────────────────────
const AdminOverview = () => {
  const dispatch = useDispatch();
  const { stats, activity, loading } = useSelector((state) => state.adminBlogs);
  const [chartTab, setChartTab] = useState("posts");
  const [days, setDays] = useState(30);

  const load = () => {
    dispatch(fetchDashboardStats());
    dispatch(fetchActivityChart(days));
  };

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchActivityChart(days));
  }, [dispatch, days]);

  const isLoading = loading.stats || loading.activity;

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8 flex flex-col gap-8">
      {/* ── Header ── */}
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

      {/* ── Stat Cards ── */}
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

      {/* ── Post Status Breakdown ── */}
      {isLoading ? (
        <Bone className="h-52" />
      ) : (
        <PostStatusChart stats={stats} />
      )}

      {/* ── Activity Chart ── */}
      <div className="bg-white border border-black/5 rounded-4xl p-6 shadow-lavender flex flex-col gap-4 text-reveal">
        {/* Chart header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Activity
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Days range selector */}
            <div className="flex items-center gap-1 bg-surface-low rounded-xl p-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    days === d
                      ? "bg-white text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            {/* Posts / Signups tab */}
            <div className="flex items-center gap-1 bg-surface-low rounded-xl p-1">
              <button
                onClick={() => setChartTab("posts")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                  chartTab === "posts"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <BookOpen size={10} /> New Posts
              </button>
              <button
                onClick={() => setChartTab("signups")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                  chartTab === "signups"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Users size={10} /> Signups
              </button>
            </div>
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

      {/* ── Top Posts ── */}
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

      {/* ── User Stats Footer ── */}
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
