import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { Search, X, ChevronDown } from "lucide-react";
import { isLoggedIn } from "../../redux/selectors/authSelectors";
import { getAllBlogs } from "../../redux/thunks/blogThunks";
import {
  setQuery,
  toggleCategory,
  clearCategories,
} from "../../redux/slice/blogSlice";

const CATEGORIES = [
  "Technology",
  "Design",
  "Business",
  "Science",
  "Culture",
  "Health & Wellness",
  "Finance",
  "Education",
  "Travel",
  "Food & Lifestyle",
  "Sports",
  "Entertainment",
  "Politics",
  "Environment",
  "Personal",
];
const VISIBLE_CHIPS = 6;

const getAuthor = (item) =>
  item.author?.username || item.authorId?.username || "unknown";
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const BlogFeed = ({ mode = "all", limit: propLimit = 6 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { blogs, userBlogs, loading, pagination, query } = useSelector(
    (state) => state.blog,
  );

  const isAuthenticated = useSelector(isLoggedIn);
  const [showAllChips, setShowAllChips] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const hasFetchedOnce = useRef(false);

  const selectedCategories = query.categories || [];
  const searchInput = query.search || "";

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "200px" });

  const data = mode === "user" ? userBlogs : blogs;

  const isInitialLoading = loading && query.page === 1 && data.length === 0;
  const isFiltering =
    (loading && query.page === 1 && data.length > 0) ||
    (isTransitioning && data.length > 0);
  const isLoadingMore = loading && query.page > 1;

  const handleSearchChange = (val) => {
    dispatch(setQuery({ search: val, page: 1 }));
  };

  // Filter-driven fetch (search / categories) — debounced, always resets to page 1
  useEffect(
    () => {
      const t = setTimeout(async () => {
        setIsTransitioning(true);
        try {
          await dispatch(getAllBlogs()).unwrap();
        } finally {
          setIsTransitioning(false);
          hasFetchedOnce.current = true;
        }
      }, 600);

      return () => clearTimeout(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.search, JSON.stringify(query.categories)],
  );

  // Page-driven fetch — ONLY fires when page itself changes, never on filter changes
  useEffect(
    () => {
      if (query.page > 1 && !loading) {
        dispatch(getAllBlogs());
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.page],
  );

  // Infinite scroll — gated so it can't fire before the first page has actually loaded
  useEffect(
    () => {
      if (
        inView &&
        !loading &&
        hasFetchedOnce.current &&
        pagination.hasNextPage &&
        mode !== "featured"
      ) {
        dispatch(setQuery({ page: query.page + 1 }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inView],
  );

  const visibleChips = showAllChips
    ? CATEGORIES
    : CATEGORIES.slice(0, VISIBLE_CHIPS);
  const hiddenCount = CATEGORIES.length - VISIBLE_CHIPS;

  return (
    <div className={mode === "featured" ? "w-full" : "min-h-screen pb-20"}>
      <div className="max-w-7xl mx-auto px-6">
        {mode !== "featured" && (
          <div className="mb-8 space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40"
                size={18}
              />

              <input
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search blogs..."
                className="input-editorial pl-11 pr-10"
              />

              {isTransitioning && searchInput && (
                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 rounded-full border border-primary/20 border-t-primary animate-spin" />
                </div>
              )}

              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                label="All"
                active={selectedCategories.length === 0}
                onClick={() => {
                  dispatch(setQuery({ page: 1 }));
                  dispatch(clearCategories());
                }}
                hideX
              />
              {visibleChips.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  active={selectedCategories.includes(cat)}
                  onClick={() => {
                    dispatch(setQuery({ page: 1 }));
                    dispatch(toggleCategory(cat));
                  }}
                />
              ))}
              {!showAllChips && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllChips(true)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-dashed border-primary/30 text-primary/60 hover:text-primary hover:border-primary transition-all flex items-center gap-1"
                >
                  +{hiddenCount} More <ChevronDown size={12} />
                </button>
              )}
              {showAllChips && (
                <button
                  onClick={() => setShowAllChips(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-dashed border-primary/30 text-primary/60 hover:text-primary transition-all"
                >
                  Show less
                </button>
              )}
              {selectedCategories.length > 0 && (
                <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-primary/40">
                  {selectedCategories.length} selected
                </span>
              )}
            </div>
          </div>
        )}

        {/* Blogs */}
        <div className="relative">
          {(isFiltering || isInitialLoading) && (
            <div className="absolute inset-x-0 top-0 z-20 px-2">
              <div className="loading-bar-editorial">
                <div className="loading-bar-progress" />
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isInitialLoading || isTransitioning
              ? Array.from({ length: 6 }).map((_, i) => (
                  <BlogSkeleton key={i} />
                ))
              : (mode === "featured" ? data.slice(0, propLimit) : data).map(
                  (item) => (
                    <Link
                      key={item._id}
                      to={`/blog/${item.slug}`}
                      onClick={(e) => {
                        if (!isAuthenticated) {
                          e.preventDefault();
                          navigate("/login");
                        }
                      }}
                      className="group block"
                    >
                      <div className="overflow-hidden rounded-2xl mb-3 h-52 bg-surface-low">
                        <img
                          src={
                            item.coverImage ||
                            import.meta.env.VITE_DEFAULT_COVER
                          }
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={item.title}
                        />
                      </div>
                      {item.category && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                          {item.category}
                        </span>
                      )}
                      <h3 className="font-display font-black text-on-surface mt-1 group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant opacity-70 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                      <div className="flex justify-between text-xs text-on-surface-variant/50 mt-2">
                        <span>@{getAuthor(item)}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </Link>
                  ),
                )}
          </div>
          {!loading && data.length === 0 && (
            <div className="text-center py-20 font-display italic text-2xl text-on-surface-variant/30">
              No blogs found.
            </div>
          )}
          {mode !== "featured" && (
            <div ref={ref} className="h-16 flex justify-center items-center">
              {isLoadingMore && (
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              )}
            </div>
          )}
          {!pagination.hasNextPage &&
            mode !== "featured" &&
            data.length > 0 && (
              <div className="text-center text-xs text-on-surface-variant/30 font-bold uppercase tracking-widest py-6">
                You've reached the end
              </div>
            )}
        </div>

        {mode === "featured" && (
          <div className="text-center mt-6">
            <Link
              to="/blogs"
              className="text-primary font-bold text-sm hover:underline"
            >
              Explore More →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const BlogSkeleton = () => (
  <div className="animate-in fade-in duration-300">
    <div className="relative h-52 rounded-2xl skeleton-editorial mb-3">
      <div className="skeleton-shimmer" />
    </div>
    <div className="relative h-3 w-20 rounded-full skeleton-editorial mb-3">
      <div className="skeleton-shimmer" />
    </div>
    <div className="relative h-7 w-full rounded-xl skeleton-editorial mb-2">
      <div className="skeleton-shimmer" />
    </div>
    <div className="relative h-4 w-4/5 rounded-xl skeleton-editorial mb-4">
      <div className="skeleton-shimmer" />
    </div>
    <div className="flex justify-between">
      <div className="relative h-3 w-16 rounded-full skeleton-editorial">
        <div className="skeleton-shimmer" />
      </div>
      <div className="relative h-3 w-20 rounded-full skeleton-editorial">
        <div className="skeleton-shimmer" />
      </div>
    </div>
  </div>
);

const Chip = ({ label, active, onClick, hideX = false }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
      active
        ? "bg-primary text-white border-primary"
        : "bg-surface-low text-on-surface-variant border-surface-highest hover:border-primary/40 hover:text-primary"
    }`}
  >
    {label}
    {active && !hideX && <span className="ml-1.5 opacity-70">×</span>}
  </button>
);

export default BlogFeed;
