import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { selectCurrentUser } from "../../redux/selectors/authSelectors";
import { getAllBlogs, getBlogsByUser } from "../../redux/thunks/blogThunks";
import {
  ArrowRight,
  Lock,
  Sparkles,
  User,
  Clock,
  Search,
  ChevronDown,
} from "lucide-react";

// ─── Utilities ──────────────────────────────────────────────────────────────

const getAuthor = (item) =>
  item.author?.username || item.authorId?.username || "unknown";

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const readingTime = (text = "") => {
  const words = (text || "").trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

// ─── Editorial Feed Component (Visuals) ─────────────────────────────────────

const EditorialFeed = ({
  data,
  user,
  navigate,
  search,
  setSearch,
  limit,
  setLimit,
  totalBlogs,
  mode,
}) => {
  const handleRead = (e) => {
    if (!user) {
      e.preventDefault();
      navigate("/login");
    }
  };

  return (
    <div
      className={
        mode === "featured"
          ? "w-full"
          : " min-h-screen pb-20 font-body"
      }
    >
      <div className="max-w-300 mx-auto px-6">
        {/* Top Search Bar (Only for Full Archive) */}
        {mode !== "featured" && (
          <div className="mb-12 flex items-end gap-4 border-b border-surface-highest pb-4">
            <div className="w-1.5 h-10 bg-primary rounded-full"></div>
            <div className="flex flex-col">
              <span className="font-sans text-[10px] font-bold tracking-[0.3em] uppercase text-primary/60 leading-none">
                Fresh Content
              </span>
              <h2 className="font-display text-3xl text-on-surface mt-1">
                Latest Blogs
              </h2>
            </div>
          </div>
        )}

        {/* Grid Layout */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 ${mode === "featured" ? "mb-6" : "mb-16"}`}
        >
          {data.map((item, index) => (
            <Link
              key={item._id}
              to={`/blog/${item._id}`}
              onClick={handleRead}
              className="no-underline text-inherit block group animate-reveal"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <article className="h-full flex flex-col transition-transform duration-300 hover:-translate-y-1">
                <div
                  className={`w-full overflow-hidden relative bg-[#e8e5df] mb-5 ${mode === "featured" ? "aspect-4/5 rounded-[2.5rem] shadow-sm" : "aspect-16/10"}`}
                >
                  <img
                    src={`${import.meta.env.VITE_API_IMG_URL}/${item.coverImage}`}
                    alt={item.title}
                    className="w-full h-full object-cover block grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  />
                  {!user && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-2.5 shadow-xl">
                        <Lock size={16} className="text-[#1a1a18]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between mb-3">
                    <span className="font-sans text-[9px] tracking-[0.2em] uppercase text-primary font-bold">
                      {item.category || "Journal"}
                    </span>
                    <span className="font-sans text-[9px] text-[#bbb]">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight text-[#1a1a18] mb-3 tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="font-sans text-sm leading-relaxed text-[#666] mb-5 line-clamp-2 opacity-80">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#eee]">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-[#bbb]" />
                    <span className="font-display italic text-xs text-[#1a1a18]">
                      @{getAuthor(item)}
                    </span>
                  </div>
                  <span className="font-sans text-[10px] text-[#aaa]">
                    {readingTime(item.description)}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Footer Navigation */}
        {mode === "featured" ? (
          <div className="mt-8 text-center">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-[#1a1a18] font-bold uppercase tracking-[0.3em] text-[10px] hover:gap-4 transition-all"
            >
              Explore Full Journal <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          data.length < totalBlogs && (
            <div className="flex justify-center pt-10 border-t border-[#e0ddd7]">
              <button
                onClick={() => setLimit(limit + 6)}
                className="group flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer"
              >
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#1a1a18] font-bold">
                  Explore More
                </span>
                <div className="p-3 rounded-full border border-[#1a1a18] group-hover:bg-[#1a1a18] group-hover:text-white transition-all">
                  <ChevronDown size={20} />
                </div>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ─── Main BlogFeed Container (Logic) ────────────────────────────────────────

const BlogFeed = ({ mode = "all", limit: propLimit = 6 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // Set internal limit based on prop
  const [limit, setLimit] = useState(propLimit);

  const { blogs, userBlogs, loading, totalBlogs } = useSelector(
    (state) => state.blog,
  );
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    // If featured, force propLimit (usually 3). If archive, use state limit.
    const fetchLimit = mode === "featured" ? propLimit : limit;

    const query = {
      limit: fetchLimit,
      search: search.trim(),
      category: category === "All" ? "" : category,
    };

    if (mode === "user" && userId) {
      dispatch(getBlogsByUser({ userId, ...query }));
    } else {
      dispatch(getAllBlogs(query));
    }
  }, [dispatch, userId, mode, limit, category, search, propLimit]);

  if (loading && limit <= 6) {
    return (
      <div className="text-center py-20 italic opacity-40">
        syncing with archive…
      </div>
    );
  }

  // ─── CRITICAL FIX HERE ───
  // We slice the data to ENSURE the UI only shows 3 items in featured mode,
  // even if the backend returns more.
  const sourceBlogs = mode === "user" ? userBlogs || [] : blogs || [];
  const fetchLimit = mode === "featured" ? propLimit : limit;
  const displayBlogs = sourceBlogs.slice(0, fetchLimit);

  return (
    <EditorialFeed
      data={displayBlogs}
      user={user}
      navigate={navigate}
      search={search}
      setSearch={setSearch}
      limit={limit}
      setLimit={setLimit}
      totalBlogs={totalBlogs}
      mode={mode}
    />
  );
};

export default BlogFeed;
