import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getBlogById, getBlogBySlug } from "../../redux/thunks/blogThunks";
import CommentsSection from "../../components/CommentsSection";
import LikeButton from "../../components/LikeButton";
const BlogDetail = () => {
  const { slug, id } = useParams();
  const dispatch = useDispatch();

  const { currentBlog, loading, error } = useSelector((state) => state.blog);

  useEffect(() => {
    if (id) dispatch(getBlogById(id));
    else if (slug) dispatch(getBlogBySlug(slug));
  }, [dispatch, slug, id]);

  const getReadingTime = (content) => {
    const words = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    return Math.ceil(words / 200);
  };

  if (loading) {
    return (
      <div className="layout-new-age flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-primary font-display text-4xl italic tracking-tighter">
          Fetching Story...
        </div>
      </div>
    );
  }

  if (error || !currentBlog) {
    return (
      <div className="layout-new-age flex justify-center items-center min-h-screen">
        <div className="card-auth text-center max-w-md">
          <h2 className="text-primary font-display text-3xl mb-4">
            Story Missing
          </h2>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            {error ||
              "This chronicle seems to have been misplaced or removed from our archives."}
          </p>
          <Link to="/blogs" className="btn-editorial inline-block">
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-new-age min-h-screen bg-surface">
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-20 text-reveal">
        {/* Navigation & Metadata Header */}
        <nav className="flex justify-between items-center mb-16">
          <Link
            to="/blogs"
            className="group flex items-center gap-2 text-primary-container font-bold tracking-tight hover:text-primary transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>{" "}
            Back To Blogs
          </Link>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
              {getReadingTime(currentBlog.content)} min read
            </span>

            <span className="px-5 py-1.5 bg-primary-fixed text-primary rounded-full text-[11px] font-bold uppercase tracking-widest">
              {currentBlog.category}
            </span>

            {currentBlog.tags?.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] font-black text-primary/40 uppercase tracking-tighter hover:text-primary transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        </nav>

        {/* Hero Section */}
        <header className="mb-16">
          <h1 className="font-display text-6xl md:text-8xl text-on-surface leading-[0.95] tracking-tighter mb-8">
            {currentBlog.title}
          </h1>

          {/* ─── ADDED DESCRIPTION (LEDE) ─── */}
          {currentBlog.description && (
            <p className="font-body text-xl md:text-2xl text-on-surface-variant leading-relaxed mb-10 opacity-80 italic border-l-4 border-primary/20 pl-6">
              {currentBlog.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-8 py-8 border-y border-surface-highest text-on-surface-variant">
            <div className="flex items-center gap-4">
              <Link
                to={`/userProfile/${currentBlog.author?.username}`}
                className="flex items-center gap-4 group"
              >
                <img
                  src={
                    currentBlog.author?.profile?.profilePic
                      ? `${import.meta.env.VITE_API_IMG_URL}/${currentBlog.author.profile.profilePic}`
                      : "https://ui-avatars.com/api/?name=" +
                        (currentBlog.author?.profile?.firstName || "A") +
                        "&background=random&color=fff"
                  }
                  className="w-12 h-12 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all border border-primary/20"
                  alt="Author"
                  onError={(e) => {
                    e.target.src =
                      "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                  }}
                />
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                    {currentBlog.author?.profile?.firstName}{" "}
                    {currentBlog.author?.profile?.lastName}
                  </span>
                  <span className="text-xs italic">Author</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:block h-8 w-px bg-surface-highest" />

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-primary/60">
                Published
              </span>
              <span className="text-sm font-medium">
                {currentBlog.createdAt
                  ? new Date(currentBlog.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )
                  : "Recently"}
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {currentBlog.coverImage &&
          !currentBlog.coverImage.includes("default-cover") && (
            <figure className="mb-16 -mx-4 md:-mx-12 lg:-mx-24">
              <div className="overflow-hidden rounded-4xl md:rounded-[3rem] shadow-2xl">
                <img
                  src={`${import.meta.env.VITE_API_IMG_URL}/${currentBlog.coverImage}`}
                  alt="Cover"
                  className="w-full aspect-20/10 object-cover hover:scale-[1.02] transition-transform duration-[2s] ease-out"
                  onError={(e) => {
                    e.currentTarget.parentElement.parentElement.style.display =
                      "none";
                  }}
                />
              </div>
            </figure>
          )}

        {/* Main Article Content */}
        <article
          className="prose prose-xl prose-primary max-w-none font-body text-on-surface leading-relaxed mb-20
                   first-letter:text-7xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]
                   selection:bg-primary-fixed-dim selection:text-primary"
          dangerouslySetInnerHTML={{ __html: currentBlog.content }}
        />

        {/* Gallery Section */}
        {currentBlog.images?.length > 0 && (
          <section className="mb-20">
            <h3 className="font-display text-2xl italic mb-8 text-primary/40">
              Visual Supplements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentBlog.images.map((img, idx) => (
                <img
                  key={idx}
                  src={`${import.meta.env.VITE_API_IMG_URL}/${img.url}`}
                  alt={`Asset ${idx}`}
                  className="rounded-4xl w-full h-80 object-cover hover:shadow-lavender transition-all duration-500"
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer Interaction Section */}
        <footer className="pt-12 border-t border-surface-highest">
          <div className="bg-surface-low rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-10">
              <div className="group cursor-pointer text-center">
                <p className="text-4xl font-display font-black text-primary group-hover:scale-110 transition-transform">
                  {currentBlog.viewsCount || 0}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant">
                  Views
                </p>
              </div>
              <div className="border-l border-surface-highest pl-10">
                <LikeButton
                  postId={currentBlog._id}
                  initialCount={currentBlog.likesCount || 0}
                  initialLiked={currentBlog.isLiked || false}
                />
              </div>
            </div>
          </div>
        </footer>

        <CommentsSection postId={currentBlog._id} />
      </main>
    </div>
  );
};

export default BlogDetail;
