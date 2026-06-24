import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { getBlogById, getBlogBySlug } from "../../redux/thunks/blogThunks";
import { clearCurrentBlog } from "../../redux/slice/blogSlice";

import CommentsSection from "../../components/CommentsSection";
import LikeButton from "../../components/LikeButton";
import FloatingAIHub from "../../components/FloatingAIHub";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import TableOfContents from "../../components/editor/TableOfContents";
import { extractHeadings } from "../../utils/content";

const BlogDetail = () => {
  const { slug, id } = useParams();
  const dispatch = useDispatch();
  const { currentBlog, loading, error } = useSelector((state) => state.blog);

  const [scrollY, setScrollY] = useState(0);
  const [showStickyBack, setShowStickyBack] = useState(false);

  useEffect(() => {
    if (id) dispatch(getBlogById(id));
    else if (slug) dispatch(getBlogBySlug(slug));
    return () => dispatch(clearCurrentBlog());
  }, [dispatch, slug, id]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setShowStickyBack(y > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-surface">
        <div className="animate-pulse text-primary font-display text-4xl italic tracking-tighter">
          Fetching Story...
        </div>
      </div>
    );
  }

  if (error || !currentBlog) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-surface">
        <div className="card-auth text-center max-w-md">
          <h2 className="text-primary font-display text-3xl mb-4">
            Story Missing
          </h2>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            {typeof error === "string"
              ? error
              : "This chronicle seems to have been misplaced or removed from our archives."}
          </p>
          <Link to="/blogs" className="btn-editorial inline-block">
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  const getReadingTime = (content) => {
    const words = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    return Math.max(1, Math.ceil(words / 200));
  };

  const processedContent = (currentBlog?.contentHtml || "")
    .replace(/<div id="upload-[^"]*".*?<\/div>/gs, "")
    .replace(/<div style="color:red">.*?<\/div>/gs, "");

  const headings = extractHeadings(processedContent);
  const hasCover = Boolean(currentBlog.coverImage);

  return (
    <div className="min-h-screen bg-surface">
      {/* ── STICKY TOP BAR ── */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${showStickyBack ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-full pointer-events-none"}`}
      >
        <div className="bg-surface/90 backdrop-blur-md border-b border-surface-highest">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <Link
              to="/blogs"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-surface-highest
                         text-sm font-bold text-on-surface-variant hover:bg-surface-low
                         hover:text-primary transition-all shrink-0"
            >
              <span>←</span> Back to Blogs
            </Link>
            <p className="hidden sm:block truncate text-xs font-semibold text-on-surface-variant/40 flex-1 text-center">
              {currentBlog.title}
            </p>
            <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
              {getReadingTime(currentBlog.contentHtml)} min read
            </span>
          </div>
        </div>
      </div>

      {/* ── COVER ── */}
      {hasCover && (
        <div className="w-full relative overflow-hidden h-145">
          <img
            src={currentBlog.coverImage}
            alt="Cover"
            className="absolute inset-0 w-full h-[120%] object-cover object-center
                       brightness-[0.78] saturate-110 will-change-transform"
            style={{
              transform: `translateY(${scrollY * 0.35}px)`,
              opacity: Math.max(0, 1 - scrollY / (580 * 0.65)),
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/10 via-transparent to-surface" />
          <div className="absolute bottom-10 left-6 xl:left-[max(1.5rem,calc(50%-38rem))]">
            <span
              className="inline-block px-5 py-1.5 rounded-full text-[11px] font-bold
                             uppercase tracking-widest text-white bg-white/15
                             border border-white/30 backdrop-blur-md"
            >
              {currentBlog.category}
            </span>
          </div>
        </div>
      )}

      {/* ── PAGE BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {/* Inline back link — fades when sticky bar appears */}
        <nav
          className={`flex items-center mb-10 transition-opacity duration-200
          ${showStickyBack ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <Link
            to="/blogs"
            className="group flex items-center gap-2 font-bold tracking-tight
                       text-primary-container hover:text-primary transition-colors"
          >
            <span className="group-hover:-translate-x-1 inline-block transition-transform">
              ←
            </span>
            Back To Blogs
          </Link>
        </nav>

        {/* ── TWO COLUMN: TOC + content ── */}
        <div className="flex flex-col xl:flex-row gap-12 items-start">
          {/* TOC sidebar — desktop only, sticky */}
          {headings.length > 0 && (
            <aside className="w-full xl:w-52 shrink-0 xl:sticky xl:top-28 xl:self-start">
              <TableOfContents headings={headings} />
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* ── HEADER ── */}
            <header className="mb-12">
              {!hasCover && (
                <span
                  className="inline-block mb-4 px-4 py-1.5 bg-primary-fixed text-primary
                                 rounded-full text-[11px] font-bold uppercase tracking-widest"
                >
                  {currentBlog.category}
                </span>
              )}

              <h1
                className="font-display text-5xl md:text-7xl text-on-surface
                             leading-[0.95] tracking-tighter mb-6"
              >
                {currentBlog.title}
              </h1>

              {currentBlog.description && (
                <p
                  className="font-body text-xl md:text-2xl text-on-surface-variant
                               leading-relaxed mb-8 opacity-80 italic
                               border-l-4 border-primary/20 pl-6"
                >
                  {currentBlog.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 py-6 border-y border-surface-highest text-on-surface-variant">
                <Link
                  to={`/userProfile/${currentBlog.author?.username}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={
                      currentBlog.author?.profile?.profilePic
                        ? currentBlog.author.profile.profilePic
                        : `https://ui-avatars.com/api/?name=${currentBlog.author?.profile?.firstName || "A"}&background=random&color=fff`
                    }
                    className="w-11 h-11 rounded-full object-cover grayscale-[0.5]
                               group-hover:grayscale-0 transition-all border border-primary/20"
                    alt="Author"
                  />
                  <div className="flex flex-col">
                    <span
                      className="font-bold text-on-surface tracking-tight
                                     group-hover:text-primary transition-colors leading-tight"
                    >
                      {currentBlog.author?.profile?.firstName || "Unknown"}{" "}
                      {currentBlog.author?.profile?.lastName || "Author"}
                    </span>
                    <span className="text-xs italic opacity-60">Author</span>
                  </div>
                </Link>

                <div className="hidden md:block h-7 w-px bg-surface-highest" />

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

                <div className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
                  {getReadingTime(currentBlog.contentHtml)} min read
                </div>
              </div>
            </header>

            {/* ── ARTICLE ── */}
            <article
              className="font-body mb-16
              first-letter:text-7xl first-letter:font-display
              first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]"
            >
              <MarkdownRenderer content={processedContent} variant="editor" />
            </article>

            {/* ── TAGS ── */}
            {currentBlog.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10 pt-8 border-t border-surface-highest">
                {currentBlog.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-black text-primary/50 uppercase tracking-tighter
                               px-3 py-1 rounded-full border border-primary/15
                               hover:text-primary hover:border-primary/40
                               transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── FOOTER ── */}
            <footer className="mb-12">
              <div className="bg-surface-low rounded-3xl px-8 py-7 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-8">
                  <div className="group cursor-pointer text-center">
                    <p className="text-4xl font-display font-black text-primary group-hover:scale-110 transition-transform">
                      {currentBlog.viewsCount || 0}
                    </p>
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant">
                      Views
                    </p>
                  </div>
                  <div className="border-l border-surface-highest pl-8">
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
          </div>
        </div>
      </div>

      <FloatingAIHub
        docText={currentBlog.contentHtml?.replace(/<[^>]*>/g, "") || ""}
        showWritingTools={false}
        showSummary={true}
      />
    </div>
  );
};

export default BlogDetail;
