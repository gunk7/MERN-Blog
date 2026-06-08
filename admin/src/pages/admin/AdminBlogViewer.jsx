import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchBlogByIdAdmin,
  updateBlogStatusAdmin,
  deleteBlogAdmin,
} from "../../redux/thunks/adminThunks";
import { toast } from "react-toastify";
import { confirmAction } from "../../services/modalServices";
import {
  ArrowLeft, Eye, Heart, MessageSquare, Calendar, Tag,
  Trash2, CheckCircle, Clock, TrendingUp, MoreHorizontal, AlertCircle,
} from "lucide-react";

const fmt = (n = 0) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
  : String(n);

const fmtDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-US", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const Bone = ({ className }) => (
  <div className={`bg-surface-highest animate-pulse rounded-2xl ${className}`} />
);

const BlogSkeleton = () => (
  <div className="flex flex-col gap-6 max-w-3xl">
    <Bone className="h-72 rounded-4xl" />
    <div className="flex flex-col gap-3">
      <Bone className="h-4 w-24" />
      <Bone className="h-8 w-3/4" />
      <Bone className="h-4 w-1/2" />
    </div>
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => <Bone key={i} className="h-16 flex-1" />)}
    </div>
    {[1, 2, 3, 4, 5].map((i) => <Bone key={i} className="h-4" />)}
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    published: { cls: "status-badge status-verified", icon: <CheckCircle size={11} /> },
    draft:     { cls: "status-badge bg-surface-high text-on-surface-variant border border-surface-highest", icon: <Clock size={11} /> },
    scheduled: { cls: "status-badge bg-primary-fixed text-primary border border-primary-fixed-dim", icon: <TrendingUp size={11} /> },
    under_review: { cls: "status-badge bg-amber-100 text-amber-700 border border-amber-200", icon: <AlertCircle size={11} /> },
  };
  const { cls, icon } = map[status] || map.draft;
  return <span className={cls}>{icon} {status.replace("_", " ")}</span>;
};

const StatPill = ({ icon: Icon, value, label, accent }) => (
  <div className="bg-white border border-black/5 rounded-3xl p-4 shadow-lavender flex flex-col items-center gap-1 text-center">
    <Icon size={15} style={{ color: accent }} />
    <p className="text-xl font-display font-bold text-on-surface">{fmt(value)}</p>
    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
  </div>
);

const StatusChanger = ({ blog, onChanged }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const options = ["published", "draft", "scheduled", "under_review"].filter(
    (s) => s !== blog.status,
  );

  const handleChange = async (newStatus) => {
    setOpen(false);
    let payload = { blogId: blog._id, status: newStatus };

    if (newStatus === "scheduled") {
      const input = window.prompt("Enter scheduled date (YYYY-MM-DD HH:MM):");
      if (!input) return;
      const scheduledFor = new Date(input);
      if (isNaN(scheduledFor)) return toast.error("Invalid date");
      payload.scheduledFor = scheduledFor;
    } else if (newStatus === "under_review") {
      const reason = window.prompt("Why is this blog under review?");
      if (reason === null) return;
      payload.adminNote = reason;
    }

    setLoading(true);
    dispatch(updateBlogStatusAdmin(payload))
      .unwrap()
      .then((updated) => {
        toast.success(`Status: ${newStatus}`);
        onChanged(updated);
      })
      .catch((e) => toast.error(e || "Failed"))
      .finally(() => setLoading(false));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5
                   rounded-xl shadow-lavender text-xs font-bold text-on-surface-variant
                   hover:text-on-surface transition-all duration-200 disabled:opacity-50"
      >
        <StatusBadge status={blog.status} />
        <MoreHorizontal size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 bg-white border border-black/5 rounded-2xl shadow-lavender py-1 min-w-36 overflow-hidden">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => handleChange(o)}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-low transition-colors capitalize"
              >
                → Move to {o.replace("_", " ")}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AdminBlogViewer = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const imgUrl = import.meta.env.VITE_API_IMG_URL;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    dispatch(fetchBlogByIdAdmin(id))
      .unwrap()
      .then((data) => setBlog(data?.data?.blog || data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [id, dispatch]);

  const handleDelete = async () => {
    const reason = window.prompt("Reason for flagging this post:");
    if (reason === null) return;

    const result = await confirmAction(
      "Flag this post?",
      "It will be moved to 'Under Review' and hidden from the public.",
      "warning",
      "Yes, Flag it!",
    );
    if (!result.isConfirmed) return;

    dispatch(deleteBlogAdmin({ blogId: blog._id, reason }))
      .unwrap()
      .then(() => {
        toast.success("Post flagged for review");
        navigate(-1);
      })
      .catch((e) => toast.error(e || "Delete failed"));
  };

  if (loading) return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <Bone className="w-24 h-4 mb-8" />
      <BlogSkeleton />
    </div>
  );

  if (error || !blog) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-6xl text-surface-highest mb-4">404</p>
        <p className="font-semibold text-on-surface">Blog not found</p>
        <p className="text-sm text-on-surface-variant mt-1">{error || "This post doesn't exist."}</p>
        <button onClick={() => navigate(-1)} className="mt-6 flex items-center gap-2 mx-auto text-sm font-bold text-primary hover:underline">
          <ArrowLeft size={14} /> Go back
        </button>
      </div>
    </div>
  );

  const author = blog.author;

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="max-w-3xl flex flex-col gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors w-fit"
        >
          <ArrowLeft size={14} /> Back to posts
        </button>

        {blog.coverImage && (
          <div className="w-full h-64 sm:h-80 rounded-4xl overflow-hidden border border-black/5 shadow-lavender">
            <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* ── Under Review Banner ── */}
        {blog.status === "under_review" && blog.adminNote && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-3xl">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-1">
                Under Review — Admin Note
              </p>
              <p className="text-sm text-amber-900 leading-relaxed">
                {blog.adminNote}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-black/5 rounded-4xl p-6 sm:p-8 shadow-lavender flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {blog.category && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-fixed px-3 py-1 rounded-full">
                  {blog.category}
                </span>
              )}
              <StatusChanger
                blog={blog}
                onChanged={(updated) => setBlog((b) => ({ ...b, ...updated }))}
              />
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200"
            >
              <Trash2 size={13} /> Flag & Remove
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-on-surface leading-tight">
            {blog.title}
          </h1>

          {blog.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {blog.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-surface-highest/40 text-xs text-on-surface-variant">
            {author && (
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center text-[9px] font-bold text-primary">
                  {author.username?.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium text-on-surface">{author.username}</span>
              </span>
            )}
            {blog.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar size={11} /> Published {fmtDate(blog.publishedAt)}
              </span>
            )}
            {blog.scheduledFor && blog.status === "scheduled" && (
              <span className="flex items-center gap-1 text-primary font-bold">
                <TrendingUp size={11} /> Scheduled for {fmtDate(blog.scheduledFor)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={11} /> Created {fmtDate(blog.createdAt)}
            </span>
            {blog.deletedAt && (
              <span className="flex items-center gap-1 text-red-500 font-bold">
                Flagged {fmtDate(blog.deletedAt)}
              </span>
            )}
          </div>

          {blog.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {blog.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-low px-3 py-1 rounded-full border border-surface-highest/60">
                  <Tag size={9} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatPill icon={Eye}          value={blog.viewsCount || 0}    label="Views"    accent="#d4845a" />
          <StatPill icon={Heart}        value={blog.likesCount || 0}     label="Likes"    accent="#c45e7c" />
          <StatPill icon={MessageSquare} value={blog.commentsCount || 0} label="Comments" accent="#6a5188" />
        </div>

        {blog.content && (
          <div className="bg-white border border-black/5 rounded-4xl p-6 sm:p-8 shadow-lavender">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-5">
              Content
            </h2>
            <div
              className="prose prose-sm max-w-none text-on-surface prose-headings:font-display prose-headings:text-on-surface prose-a:text-primary prose-img:rounded-2xl prose-blockquote:border-primary prose-blockquote:text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogViewer;