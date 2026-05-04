import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import {
  Search,
  X,
  Users,
  BookOpen,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { selectCurrentUser } from "../../redux/selectors/authSelectors";
import {
  getAllBlogs,
  getBlogsByUser,
  searchUsers,
} from "../../redux/thunks/blogThunks";
import {
  setQuery,
  resetBlogs,
  toggleCategory,
  clearCategories,
  clearUserSearch,
  setActiveTab,
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
  const { userId } = useParams();

  const {
    blogs,
    userBlogs,
    loading,
    pagination,
    query,
    userSearchResults = [],
    userSearchLoading = false,
    activeTab = "all",
  } = useSelector((state) => state.blog);

  const user = useSelector(selectCurrentUser);
  const [showAllChips, setShowAllChips] = useState(false);

  const selectedCategories = query.categories || [];
  const searchInput = query.search || "";

  const { ref, inView } = useInView({ threshold: 0, rootMargin: "200px" });

  const data = mode === "user" ? userBlogs : blogs;
  const isInitialLoading = loading && query.page === 1 && data.length === 0;
  const isFiltering = loading && query.page === 1 && data.length > 0;
  const isLoadingMore = loading && query.page > 1;

  const showBlogs = activeTab === "all" || activeTab === "blogs";
  const showAccounts = activeTab === "all" || activeTab === "accounts";

  const handleSearchChange = (val) => {
    dispatch(setQuery({ search: val, page: 1 }));
  };

  // Debounced fetch — fires on search, tab, or category change
  useEffect(() => {
    const t = setTimeout(() => {
      if (showBlogs) {
        dispatch(resetBlogs());
        dispatch(getAllBlogs());
      }
      if (showAccounts) {
        dispatch(clearUserSearch());
        if (searchInput.trim()) dispatch(searchUsers({ q: searchInput }));
      }
    }, 600);
    return () => clearTimeout(t);
  }, [query.search, activeTab, JSON.stringify(query.categories)]);

  // Infinite scroll — load next page
  useEffect(() => {
    if (
      inView &&
      !loading &&
      pagination.hasNextPage &&
      mode !== "featured" &&
      showBlogs
    ) {
      dispatch(setQuery({ page: query.page + 1 }));
    }
  }, [inView]);

  // Fetch when page increments
  useEffect(() => {
    if (query.page > 1 && !loading && showBlogs) dispatch(getAllBlogs());
  }, [query.page]);

  // Tab change — search stays intact
  const handleTabChange = (tab) => dispatch(setActiveTab(tab));

  const visibleChips = showAllChips
    ? CATEGORIES
    : CATEGORIES.slice(0, VISIBLE_CHIPS);
  const hiddenCount = CATEGORIES.length - VISIBLE_CHIPS;

  if (isInitialLoading && showBlogs && activeTab !== "accounts") {
    return (
      <div className="text-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

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
                placeholder="Search blogs or accounts..."
                className="input-editorial pl-11 pr-10"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category chips — shown on all + blogs tabs */}
            {showBlogs && (
              <div className="flex flex-wrap items-center gap-2">
                <Chip
                  label="All"
                  active={selectedCategories.length === 0}
                  onClick={() => dispatch(clearCategories())}
                  hideX
                />
                {visibleChips.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={selectedCategories.includes(cat)}
                    onClick={() => dispatch(toggleCategory(cat))}
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
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-surface-highest">
              <TabButton
                active={activeTab === "all"}
                onClick={() => handleTabChange("all")}
                icon={<LayoutGrid size={14} />}
                label="All"
              />
              <TabButton
                active={activeTab === "blogs"}
                onClick={() => handleTabChange("blogs")}
                icon={<BookOpen size={14} />}
                label="Blogs"
              />
              <TabButton
                active={activeTab === "accounts"}
                onClick={() => handleTabChange("accounts")}
                icon={<Users size={14} />}
                label="Accounts"
              />
            </div>
          </div>
        )}

        {/* Accounts section */}
        {showAccounts && (
          <div className={showBlogs && data.length > 0 ? "mb-10" : ""}>
            {activeTab === "all" &&
              searchInput.trim() &&
              userSearchResults.length > 0 && (
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 mb-4 flex items-center gap-2">
                  <Users size={12} /> Accounts
                </h4>
              )}
            {userSearchLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            {!userSearchLoading &&
              activeTab === "accounts" &&
              !searchInput.trim() && (
                <div className="text-center py-20 font-display italic text-2xl text-on-surface-variant/30">
                  Type a username to find people.
                </div>
              )}
            {!userSearchLoading &&
              searchInput.trim() &&
              userSearchResults.length === 0 && (
                <p className="text-sm text-on-surface-variant/40 italic py-4">
                  No accounts found for "{searchInput}".
                </p>
              )}
            <div className="space-y-2">
              {userSearchResults.map((u) => (
                <Link
                  key={u._id}
                  to={`/profile/${u.username}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-surface-lowest border border-surface-highest hover:border-primary/20 hover:shadow-lavender transition-all group"
                >
                  <img
                    src={
                      u.profilePic
                        ? `${import.meta.env.VITE_API_IMG_URL}/${u.profilePic}`
                        : `https://ui-avatars.com/api/?name=${u.firstName || u.username}&background=random&color=fff`
                    }
                    alt={u.username}
                    className="w-11 h-11 rounded-xl object-cover border border-surface-highest shrink-0"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-on-surface-variant/50">
                      @{u.username}
                    </p>
                    {u.bio && (
                      <p className="text-xs text-on-surface-variant/40 truncate mt-0.5">
                        {u.bio}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-on-surface">
                      {u.followersCount}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                      Followers
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Blogs section */}
        {showBlogs && (
          <div className="relative">
            {activeTab === "all" && userSearchResults.length > 0 && (
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 mb-4 flex items-center gap-2">
                <BookOpen size={12} /> Blogs
              </h4>
            )}
            {isFiltering && (
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/30 flex items-center justify-center z-10">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(mode === "featured" ? data.slice(0, propLimit) : data).map(
                (item) => (
                  <Link
                    key={item._id}
                    to={`/blog/${item.slug}`}
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        navigate("/login");
                      }
                    }}
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-2xl mb-3 h-52 bg-surface-low">
                      <img
                        src={`${import.meta.env.VITE_API_IMG_URL}/${item.coverImage}`}
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
        )}

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

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${
      active
        ? "text-on-surface"
        : "text-on-surface-variant/40 hover:text-on-surface-variant"
    }`}
  >
    {icon} {label}
    {active && (
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
    )}
  </button>
);

export default BlogFeed;
