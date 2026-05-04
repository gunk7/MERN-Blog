import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Calendar,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  UserPlus,
  UserMinus,
  BookOpen,
} from "lucide-react";
import { getPublicProfile, followUser, unfollowUser } from "../redux/thunks/userThunks";
import { getBlogsByUser } from "../redux/thunks/blogThunks";
import { clearPublicProfile } from "../redux/slice/userSlice";
import { isLoggedIn, selectCurrentUser } from "../redux/selectors/authSelectors";

const PublicProfile = () => {
  const { username } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const access = useSelector(isLoggedIn);
  const currentUser = useSelector(selectCurrentUser);
  const {
    publicProfile,
    publicProfileLoading,
    publicProfileError,
    followLoading,
  } = useSelector((state) => state.users);
  const { blogs, loading: blogsLoading } = useSelector((state) => state.blog);

  // ── Redirect if not logged in ─────────────────────────────────────────
  useEffect(() => {
    if (!access) navigate("/login");
  }, [access, navigate]);

  // ── Fetch profile on username change ──────────────────────────────────
  useEffect(() => {
    if (!access) return;
    dispatch(clearPublicProfile());
    dispatch(getPublicProfile(username));
  }, [dispatch, username, access]);

  // ── Fetch blogs once userId is available ──────────────────────────────
  useEffect(() => {
    if (publicProfile?.userDetail?._id) {
      dispatch(getBlogsByUser(publicProfile.userDetail._id));
    }
  }, [dispatch, publicProfile?.userDetail?._id]);

  const handleFollow = () => {
    const id = publicProfile.userDetail._id;
    publicProfile.isFollowing
      ? dispatch(unfollowUser(id))
      : dispatch(followUser(id));
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (publicProfileLoading || !access) {
    return (
      <div className="layout-new-age items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────
  if (publicProfileError || !publicProfile) {
    return (
      <div className="layout-new-age items-center justify-center text-reveal">
        <div className="text-center space-y-6">
          <p className="font-display text-6xl text-primary/20 font-black">404</p>
          <h2 className="font-display text-3xl font-black text-on-surface tracking-tight">
            This profile doesn't exist.
          </h2>
          <p className="text-on-surface-variant">
            {publicProfileError || "The user you're looking for has vanished."}
          </p>
          <button
            onClick={() => navigate("/blogs")}
            className="btn-editorial max-w-xs mx-auto"
          >
            Back to Blogs
          </button>
        </div>
      </div>
    );
  }

  const { userDetail, isFollowing } = publicProfile;
  const isOwnProfile = currentUser?.username === username;

  const profileImage = userDetail?.profilePic
    ? `${import.meta.env.VITE_API_IMG_URL}/${userDetail.profilePic}`
    : "/default-avatar.png";

  return (
    <main className="min-h-screen bg-surface text-reveal">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative bg-surface-low border-b border-surface-highest overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-100 h-100 rounded-full bg-primary-fixed blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-12 py-20 sm:py-28 flex flex-col md:flex-row items-center md:items-end gap-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={profileImage}
              alt={userDetail?.username}
              onError={(e) => { e.target.src = "/default-avatar.png"; }}
              className="w-36 h-36 sm:w-48 sm:h-48 rounded-[2.5rem] object-cover shadow-lavender border-4 border-white"
            />
            <div className="absolute -bottom-3 -right-3 bg-primary text-white p-2.5 rounded-2xl shadow-lg border-4 border-white">
              <ShieldCheck size={18} />
            </div>
          </div>

          {/* Name block */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">
              Official Member
            </span>
            <h1 className="font-display text-5xl sm:text-7xl font-black text-on-surface tracking-tighter leading-none">
              {userDetail?.firstName} {userDetail?.lastName}
            </h1>
            <p className="text-on-surface-variant font-body text-lg">
              @{userDetail?.username}
            </p>
            {userDetail?.bio && (
              <p className="text-on-surface-variant/70 font-body text-base max-w-xl leading-relaxed pt-2 italic">
                {userDetail.bio}
              </p>
            )}
          </div>

          {/* Follow / Edit button */}
          <div className="shrink-0">
            {isOwnProfile ? (
              <button
                onClick={() => navigate("/profile")}
                className="btn-editorial w-auto px-8"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all active:scale-95 disabled:opacity-50
                  ${isFollowing
                    ? "bg-surface-highest text-on-surface-variant hover:bg-rose-50 hover:text-rose-600 border border-surface-highest"
                    : "bg-primary hover:bg-primary-container text-white shadow-lg"
                  }`}
              >
                {followLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isFollowing ? (
                  <><UserMinus size={18} /> Unfollow</>
                ) : (
                  <><UserPlus size={18} /> Follow</>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="border-b border-surface-highest bg-surface-lowest">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 py-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-surface-highest">
          <StatItem
            icon={<Users size={16} className="text-primary/60" />}
            count={userDetail?.followersCount ?? 0}
            label="Followers"
          />
          <StatItem
            icon={<ArrowUpRight size={16} className="text-primary/60" />}
            count={userDetail?.followingCount ?? 0}
            label="Following"
          />
          <StatItem
            icon={<BookOpen size={16} className="text-primary/60" />}
            count={blogsLoading ? "…" : blogs.length}
            label="Stories"
          />
          <StatItem
            icon={<Calendar size={16} className="text-primary/60" />}
            count={new Date(userDetail?.createdAt).getFullYear()}
            label="Joined"
          />
        </div>
      </section>

      {/* ── DETAILS + BLOGS ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Left: personal details */}
        <aside className="lg:col-span-3 space-y-8">
          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50">
              Details
            </h3>
            <DetailRow label="Country" value={userDetail?.country} />
            <DetailRow label="Gender"  value={userDetail?.gender}  />
          </div>
        </aside>

        {/* Right: blogs grid */}
        <div className="lg:col-span-9 space-y-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 flex items-center gap-3">
            <span className="w-8 h-px bg-primary/20" />
            Stories by {userDetail?.firstName}
          </h3>

          {blogsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary/40" size={32} />
            </div>
          ) : blogs.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <BookOpen size={40} className="text-primary/10" />
              <p className="font-display italic text-2xl text-on-surface-variant/30">
                No published stories yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

// ── Blog Card ─────────────────────────────────────────────────────────────────

const BlogCard = ({ blog }) => {
  const hasCover = blog.coverImage && !blog.coverImage.includes("default-cover");

  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="group flex flex-col rounded-4xl overflow-hidden border border-surface-highest bg-surface-lowest hover:shadow-lavender hover:-translate-y-1 transition-all duration-500"
    >
      {hasCover && (
        <div className="h-44 overflow-hidden shrink-0">
          <img
            src={`${import.meta.env.VITE_API_IMG_URL}/${blog.coverImage}`}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.parentElement.style.display = "none"; }}
          />
        </div>
      )}

      <div className="p-6 flex flex-col gap-2 flex-1">
        {blog.category && (
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
            {blog.category}
          </span>
        )}

        <h4 className="font-display font-black text-on-surface text-lg leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
          {blog.title}
        </h4>

        {blog.description && (
          <p className="text-on-surface-variant text-sm font-body leading-relaxed line-clamp-2 flex-1">
            {blog.description}
          </p>
        )}

        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30 mt-auto pt-3">
          {new Date(blog.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const StatItem = ({ icon, count, label }) => (
  <div className="flex flex-col items-center sm:items-start gap-1 px-6 py-2 first:pl-0">
    <div className="flex items-center gap-1.5 text-on-surface-variant/50">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="font-display font-black text-3xl text-on-surface">{count}</span>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">
      {label}
    </p>
    <p className="font-body font-bold text-on-surface">{value || "—"}</p>
  </div>
);

export default PublicProfile;