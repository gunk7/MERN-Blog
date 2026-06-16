import { useState } from "react";
import { useDispatch } from "react-redux";
import { toggleBlog } from "../redux/thunks/blogThunks";

const LikeButton = ({ postId, initialCount = 0, initialLiked = false }) => {
  const dispatch = useDispatch();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false); // animation trigger

  const handleToggle = async () => {
    if (loading) return;

    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    if (nextLiked) setBurst(true);

    setLoading(true);
    try {
      await dispatch(toggleBlog(postId)).unwrap();
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(initialCount);
    } finally {
      setLoading(false);
      setTimeout(() => setBurst(false), 600);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={liked ? "Unlike this post" : "Like this post"}
      className={`
        group relative flex flex-col items-center gap-1 cursor-pointer
        transition-all duration-200 select-none
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      {/* Heart SVG */}
      <div className="relative w-14 h-14 flex items-center justify-center">
        {/* Burst ring — animates outward on like */}
        <span
          className={`
            absolute inset-0 rounded-full border-2 border-primary
            transition-all duration-500 ease-out
            ${burst ? "scale-150 opacity-0" : "scale-100 opacity-0"}
          `}
        />

        {/* Background pill */}
        <span
          className={`
            absolute inset-0 rounded-full transition-all duration-300
            ${
              liked
                ? "bg-primary/10 scale-100"
                : "bg-surface-highest/40 scale-90 group-hover:scale-100 group-hover:bg-primary/5"
            }
          `}
        />

        {/* Heart icon */}
        <svg
          viewBox="0 0 24 24"
          className={`
            w-6 h-6 relative z-10 transition-all duration-300
            ${
              liked
                ? "fill-primary stroke-primary scale-110"
                : "fill-none stroke-on-surface-variant group-hover:stroke-primary scale-100 group-hover:scale-110"
            }
            ${burst ? "animate-ping-once" : ""}
          `}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>

      {/* Count */}
      <p
        className={`
          text-4xl font-display font-black leading-none
          transition-all duration-300
          ${liked ? "text-primary scale-105" : "text-on-surface group-hover:text-primary"}
        `}
      >
        {count}
      </p>
      <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant">
        {liked ? "Liked" : "Likes"}
      </p>
    </button>
  );
};

export default LikeButton;
