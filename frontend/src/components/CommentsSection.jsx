import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  createComment,
  fetchComments,
  fetchReplies,
  updateComment,
  deleteComment,
  toggleLike,
} from "../redux/thunks/commentThunks";
import { clearComments, clearError } from "../redux/slice/commentSlice";
import { selectCurrentUser } from "../redux/selectors/authSelectors";

// ─────────────────────────────────────────────
// LIKE BUTTON
// ─────────────────────────────────────────────
const LikeButton = ({
  commentId,
  initialLikes = 0,
  initialLiked = false,
  currentUser,
}) => {
  const dispatch = useDispatch();
  const likeLoading = useSelector(
    (state) => state.comment.likeLoading[commentId] ?? false,
  );

  const [optimisticLiked, setOptimisticLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(initialLikes);

  useEffect(() => {
    setOptimisticLiked(initialLiked);
    setOptimisticCount(initialLikes);
  }, [initialLiked, initialLikes]);

  const handleToggle = async () => {
    if (!currentUser || likeLoading) return;

    const wasLiked = optimisticLiked;
    const newLiked = !wasLiked;

    // Optimistic update: like → increment, unlike → decrement
    setOptimisticLiked(newLiked);
    setOptimisticCount((prev) => (wasLiked ? Math.max(0, prev - 1) : prev + 1));

    const result = await dispatch(toggleLike({ commentId, isLiked: newLiked }));

    // Rollback on failure
    if (toggleLike.rejected.match(result)) {
      setOptimisticLiked(wasLiked);
      setOptimisticCount((prev) =>
        wasLiked ? prev + 1 : Math.max(0, prev - 1),
      );
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!currentUser || likeLoading}
      className={`flex items-center gap-1.5 transition-all duration-200 group/like
        ${!currentUser ? "cursor-default opacity-50" : "cursor-pointer"}
        ${optimisticLiked ? "text-primary" : "text-on-surface-variant/40 hover:text-primary/60"}
      `}
      title={
        !currentUser ? "Login to like" : optimisticLiked ? "Unlike" : "Like"
      }
    >
      <span
        className={`text-base transition-transform duration-200 ${optimisticLiked ? "scale-110" : "group-hover/like:scale-110"}`}
      >
        {optimisticLiked ? "♥" : "♡"}
      </span>
      {optimisticCount > 0 && (
        <span className="text-[11px] font-black uppercase tracking-widest">
          {optimisticCount}
        </span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────
// COMMENT INPUT
// ─────────────────────────────────────────────
const CommentInput = ({
  postId,
  user,
  onCommentAdded,
  parentCommentId = null,
  onCancel = null,
  placeholder = "Share your thoughts...",
}) => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.comment.loading);
  const error = useSelector((state) => state.comment.error);
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    dispatch(clearError());

    const result = await dispatch(
      createComment({
        blogId: postId,
        content: text.trim(),
        parentCommentId: parentCommentId,
      }),
    );

    if (createComment.fulfilled.match(result)) {
      const newComment =
        result.payload?.data?.comment ||
        result.payload?.comment ||
        result.payload;
      onCommentAdded(newComment);
      setText("");
      if (onCancel) onCancel();
    }
  };

  if (!user) {
    return (
      <div className="bg-surface-low rounded-4xl p-6 flex items-center justify-between">
        <p className="text-on-surface-variant italic text-sm">
          Join the conversation
        </p>
        <Link
          to="/login"
          className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-low rounded-4xl p-6">
      <div className="flex gap-4 items-start">
        <img
          src={
            user?.profile?.profilePic
              ? `${import.meta.env.VITE_API_IMG_URL}/${user.profile.profilePic}`
              : `https://ui-avatars.com/api/?name=${user?.profile?.firstName || "U"}&background=random&color=fff`
          }
          alt="You"
          className="w-10 h-10 rounded-full object-cover shrink-0 mt-1 border border-primary/20"
          onError={(e) => {
            e.target.src =
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
          }}
        />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant/40 text-sm leading-relaxed resize-none outline-none border-b border-surface-highest focus:border-primary/40 transition-colors pb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          <div className="flex justify-end items-center gap-3 mt-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-on-surface-variant uppercase tracking-widest font-bold hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || loading}
              className="px-6 py-2 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              {loading ? "Posting..." : parentCommentId ? "Reply" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stable empty array — prevents useSelector returning a new [] reference each render
const EMPTY_REPLIES = [];

// ─────────────────────────────────────────────
// COMMENT CARD  (fully recursive — replies can have replies)
// ─────────────────────────────────────────────
const CommentCard = ({
  comment,
  currentUser,
  postId,
  onUpdated,
  onDeleted,
  depth = 0, // 0 = top-level, 1 = reply, 2 = reply-to-reply, …
}) => {
  const dispatch = useDispatch();
  const reduxReplies = useSelector(
    (state) => state.comment.replies[comment._id] || EMPTY_REPLIES,
  );

  // ── replies are NEVER shown on initial load ──────────────────────────────
  const [showReplies, setShowReplies] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false); // fetched at least once?
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content || "");
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(
    comment.replyCount ?? comment.repliesCount ?? 0,
  );

  const isOwner = currentUser?._id === (comment.author?._id || comment.userId);
  const isReply = depth > 0;

  // Do NOT auto-fetch replies — wait for user interaction
  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    // Fetch only on first expand; subsequent toggles use cached redux state
    if (!repliesLoaded || reduxReplies.length === 0) {
      setRepliesLoading(true);
      await dispatch(fetchReplies({ commentId: comment._id }));
      setRepliesLoading(false);
      setRepliesLoaded(true);
    }

    setShowReplies(true);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    setEditLoading(true);

    const result = await dispatch(
      updateComment({ commentId: comment._id, content: editText.trim() }),
    );

    if (updateComment.fulfilled.match(result)) {
      const updated =
        result.payload?.data?.comment ||
        result.payload?.comment ||
        result.payload;
      onUpdated(updated);
      setIsEditing(false);
    }

    setEditLoading(false);
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteComment({ commentId: comment._id }));
    if (deleteComment.fulfilled.match(result)) {
      onDeleted(comment._id);
    }
    setShowDeleteConfirm(false);
  };

  const authorName = comment.author?.profile?.firstName
    ? `${comment.author.profile.firstName} ${comment.author.profile.lastName || ""}`.trim()
    : comment.author?.username || "Anonymous";

  const authorPic = comment.author?.profile?.profilePic
    ? `${import.meta.env.VITE_API_IMG_URL}/${comment.author.profile.profilePic}`
    : `https://ui-avatars.com/api/?name=${authorName}&background=random&color=fff`;

  return (
    <div className="group">
      <div className="bg-surface-low rounded-4xl p-6 hover:bg-surface-highest/30 transition-colors duration-300">
        {/* Author row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={authorPic}
              alt={authorName}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-primary/10"
              onError={(e) => {
                e.target.src =
                  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
              }}
            />
            <div className="min-w-0">
              <span className="font-bold text-sm text-on-surface tracking-tight truncate block">
                {authorName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-[0.15em] text-on-surface-variant/40">
                  {timeAgo(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-[10px] italic text-on-surface-variant/30">
                    · edited
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && !isEditing && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditText(comment.content);
                }}
                className="text-[11px] uppercase font-black tracking-widest text-on-surface-variant/50 hover:text-primary transition-colors px-2 py-1"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[11px] uppercase font-black tracking-widest text-on-surface-variant/50 hover:text-red-400 transition-colors px-2 py-1"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Content / Edit mode */}
        <div className="mt-3 ml-12">
          {isEditing ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                autoFocus
                className="w-full bg-transparent text-on-surface text-sm leading-relaxed resize-none outline-none border-b border-primary/30 focus:border-primary transition-colors pb-1"
              />
              <div className="flex gap-3 mt-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs uppercase font-black tracking-widest text-on-surface-variant/50 hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!editText.trim() || editLoading}
                  className="px-5 py-1.5 bg-primary text-on-primary rounded-full text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30"
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface leading-relaxed">
              {comment.content}
            </p>
          )}

          {/* Actions row */}
          {!isEditing && (
            <div className="flex items-center gap-5 mt-4">
              <LikeButton
                commentId={comment._id}
                initialLikes={comment.likesCount ?? comment.likes?.length ?? 0}
                initialLiked={comment.isLiked ?? false}
                currentUser={currentUser}
              />

              {/* Reply button — available at any depth if logged in */}
              {currentUser && (
                <button
                  onClick={() => setShowReplyInput((prev) => !prev)}
                  className="text-[11px] uppercase font-black tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  Reply
                </button>
              )}

              {/* Show / hide replies button — shown when there are replies */}
              {localReplyCount > 0 && (
                <button
                  onClick={handleToggleReplies}
                  disabled={repliesLoading}
                  className="text-[11px] uppercase font-black tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  {repliesLoading
                    ? "Loading..."
                    : showReplies
                      ? "Hide replies"
                      : `${localReplyCount} ${localReplyCount === 1 ? "reply" : "replies"}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="mt-2 ml-4 bg-surface-low rounded-2xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant">
            Delete this comment?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs uppercase font-black tracking-widest text-on-surface-variant/50 hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-1.5 bg-red-500/10 text-red-400 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Reply input */}
      {showReplyInput && (
        <div
          className="mt-3 pl-10 ml-4"
          style={{ borderLeft: "2px solid rgba(128,128,128,0.25)" }}
        >
          <CommentInput
            postId={postId}
            user={currentUser}
            onCommentAdded={async () => {
              setLocalReplyCount((prev) => prev + 1);
              await dispatch(fetchReplies({ commentId: comment._id }));
              setRepliesLoaded(true);
              setShowReplies(true);
              setShowReplyInput(false);
            }}
            parentCommentId={comment._id}
            onCancel={() => setShowReplyInput(false)}
            placeholder={`Reply to ${authorName}...`}
          />
        </div>
      )}

      {/* ── Nested replies — recursive, indented with left border ── */}
      {showReplies && reduxReplies.length > 0 && (
        <div
          className="mt-2 pl-10 ml-4 space-y-2"
          style={{ borderLeft: "2px solid rgba(128,128,128,0.25)" }}
        >
          {reduxReplies.map((reply) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              currentUser={currentUser}
              postId={postId}
              depth={depth + 1}
              onUpdated={() =>
                dispatch(fetchReplies({ commentId: comment._id }))
              }
              onDeleted={() => {
                setLocalReplyCount((prev) => Math.max(0, prev - 1));
                dispatch(fetchReplies({ commentId: comment._id }));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// COMMENTS SECTION (main export)
// ─────────────────────────────────────────────
const CommentsSection = ({ postId }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const comments = useSelector((state) => state.comment.comments);
  const pagination = useSelector((state) => state.comment.pagination);
  const loading = useSelector((state) => state.comment.loading);
  const error = useSelector((state) => state.comment.error);

  const [page, setPage] = useState(1);
  const hasMore = page < Math.ceil(pagination.total / pagination.limit);

  const loadComments = useCallback(
    (pageNum = 1) => {
      if (!postId) return;
      dispatch(fetchComments({ blogId: postId, page: pageNum, limit: 10 }));
    },
    [dispatch, postId],
  );

  useEffect(() => {
    dispatch(clearComments());
    setPage(1);
    loadComments(1);
  }, [postId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadComments(next);
  };

  const handleRefresh = () => {
    dispatch(clearComments());
    setPage(1);
    loadComments(1);
  };

  return (
    <section className="mt-20 pt-12 border-t border-surface-highest">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4 mb-10">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-4xl md:text-5xl text-on-surface tracking-tighter">
            Conversations
          </h2>
          {pagination.total > 0 && (
            <span className="text-sm font-black uppercase tracking-[0.2em] text-primary/40">
              {pagination.total} {pagination.total === 1 ? "voice" : "voices"}
            </span>
          )}
        </div>
      </div>

      {/* Input */}
      <CommentInput
        postId={postId}
        user={user}
        onCommentAdded={handleRefresh}
      />

      {/* List */}
      <div className="mt-10 space-y-4">
        {error && (
          <p className="text-center text-on-surface-variant italic py-8">
            {error}
          </p>
        )}

        {!loading && comments.length === 0 && !error && (
          <div className="text-center py-16">
            <p className="font-display text-3xl italic text-on-surface-variant/30 mb-2">
              No voices yet
            </p>
            <p className="text-sm text-on-surface-variant/50 tracking-wide">
              Be the first to share your thoughts
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <CommentCard
            key={comment._id}
            comment={comment}
            currentUser={user}
            postId={postId}
            depth={0}
            onUpdated={handleRefresh}
            onDeleted={handleRefresh}
          />
        ))}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-10 py-3 rounded-full border border-primary/20 text-primary text-sm font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all duration-300 disabled:opacity-40"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loading && comments.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-surface-low rounded-4xl p-6 animate-pulse h-24"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentsSection;
