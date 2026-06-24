import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createBlog,
  getBlogById,
  updateBlog,
} from "../../redux/thunks/blogThunks";
import {
  clearBlogState,
  saveDraft,
  clearDraft,
} from "../../redux/slice/blogSlice";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  PenSquare,
  AlertCircle,
  Calendar,
  X,
  Plus,
  ChevronRight,
  ImagePlus,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { selectCurrentUser } from "../../redux/selectors/authSelectors";
import { toast } from "react-toastify";
import { confirmExit } from "../../services/modalServices";
import FriendlyMarkdownEditor from "../../components/editor/FriendlyMarkdownEditor";
import FloatingAIHub from "../../components/FloatingAIHub";
import { blogSchema } from "../../validation/schemasValidation";

const BLOG_STATUSES = ["draft", "published", "scheduled"];
const CATEGORIES = [
  "None",
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

const FieldLabel = ({ children, required }) => (
  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-2">
    {children}
    {required && <span className="text-rose-500 ml-0.5">*</span>}
  </p>
);

const BlogEditor = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, currentBlog, createSuccess, updateSuccess } =
    useSelector((state) => state.blog);

  const draft = useSelector((state) => state.blog.draft);
  const user = useSelector(selectCurrentUser);

  const draftKey = user?._id ? `blog_draft_${user._id}` : "blog_draft_guest";

  const [preview, setPreview] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [editor, setEditor] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const [panelOpen] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);
  const attemptedStatusRef = React.useRef("draft");
  const fallbackTriedRef = React.useRef(false);
  const canFallbackToDraft =
    !isEditMode ||
    originalStatus === "draft" ||
    originalStatus === "under_review";

  useEffect(() => {
    if (isEditMode) dispatch(getBlogById(id));
    return () => dispatch(clearBlogState());
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentBlog && currentBlog._id === id) {
      if (currentBlog.coverImage) {
        Promise.resolve().then(() => setPreview(currentBlog.coverImage));
      }
      if (originalStatus === null) {
        setOriginalStatus(currentBlog.status);
      }
    }
  }, [currentBlog, currentBlog?._id, id, isEditMode, originalStatus]);

  useEffect(() => {
    if (createSuccess || updateSuccess) {
      fallbackTriedRef.current = false;
      sessionStorage.removeItem(draftKey);

      dispatch(clearDraft());

      toast.success(isEditMode ? "Blog updated!" : "Blog published!", {
        position: "bottom-right",
        autoClose: 3000,
      });

      dispatch(clearBlogState());

      navigate("/my-blogs");
    }

    if (error) {
      const attemptedStatus = attemptedStatusRef.current;
      const wasPublishAttempt =
        attemptedStatus === "published" || attemptedStatus === "scheduled";

      if (
        wasPublishAttempt &&
        canFallbackToDraft &&
        !fallbackTriedRef.current
      ) {
        fallbackTriedRef.current = true;

        toast.error(
          `Couldn't ${attemptedStatus === "scheduled" ? "schedule" : "publish"} your post (${error}). Saved as a draft instead so you don't lose your work.`,
          { position: "bottom-right", autoClose: 5000 },
        );

        dispatch(clearBlogState());
        formik.setFieldValue("status", "draft");

        const draftFormData = new FormData();
        draftFormData.append("title", formik.values.title);
        draftFormData.append("description", formik.values.description);
        draftFormData.append(
          "contentHtml",
          formik.values.contentHtml?.trim() || "",
        );
        draftFormData.append(
          "contentJson",
          JSON.stringify(formik.values.contentJson || null),
        );
        draftFormData.append("category", formik.values.category);
        draftFormData.append("status", "draft");
        formik.values.tags.forEach((tag) => draftFormData.append("tags", tag));
        if (formik.values.coverImage instanceof File) {
          draftFormData.append("coverImage", formik.values.coverImage);
        } else if (
          typeof formik.values.coverImage === "string" &&
          formik.values.coverImage
        ) {
          draftFormData.append("existingCoverImage", formik.values.coverImage);
        }
        draftFormData.append(
          "images",
          JSON.stringify(formik.values.images || []),
        );

        if (isEditMode) dispatch(updateBlog({ id, formData: draftFormData }));
        else dispatch(createBlog(draftFormData));
      } else {
        toast.error(error, {
          position: "bottom-right",
        });
      }
    }
  }, [
    createSuccess,
    updateSuccess,
    error,
    dispatch,
    navigate,
    isEditMode,
    draftKey,
    canFallbackToDraft,
  ]);

  const formik = useFormik({
    enableReinitialize: true,
    validationSchema: blogSchema,
    initialValues: {
      title: isEditMode && currentBlog ? currentBlog.title || "" : "",
      description:
        isEditMode && currentBlog ? currentBlog.description || "" : "",
      contentJson:
        isEditMode && currentBlog ? currentBlog.contentJson || {} : {},
      contentHtml:
        isEditMode && currentBlog ? currentBlog.contentHtml || "" : "",
      category:
        isEditMode && currentBlog ? currentBlog.category || "None" : "None",
      status:
        isEditMode && currentBlog ? currentBlog.status || "draft" : "draft",
      scheduledFor:
        isEditMode && currentBlog ? currentBlog.scheduledFor || "" : "",
      tags: isEditMode && currentBlog ? currentBlog.tags || [] : [],
      coverImage:
        isEditMode && currentBlog ? currentBlog.coverImage || null : null,
      images: isEditMode && currentBlog ? currentBlog.images || [] : [],
    },
    onSubmit: async (values) => {
      attemptedStatusRef.current = values.status;
      fallbackTriedRef.current = false;
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("contentHtml", values.contentHtml?.trim() || "");
      formData.append(
        "contentJson",
        JSON.stringify(values.contentJson || null),
      );
      formData.append("category", values.category);
      formData.append("status", values.status);
      if (values.status === "scheduled" && values.scheduledFor) {
        formData.append(
          "scheduledFor",
          new Date(values.scheduledFor).toISOString(),
        );
      }
      values.tags.forEach((tag) => formData.append("tags", tag));
      if (values.coverImage instanceof File) {
        formData.append("coverImage", values.coverImage);
      } else if (typeof values.coverImage === "string" && values.coverImage) {
        formData.append("existingCoverImage", values.coverImage); // tell backend to keep it
      }
      formData.append("images", JSON.stringify(values.images || []));
      if (isEditMode) dispatch(updateBlog({ id, formData }));
      else dispatch(createBlog(formData));
    },
  });

  const addTag = (value = tagInput) => {
    const trimmed = value.trim().toLowerCase();
    if (
      trimmed &&
      !formik.values.tags.includes(trimmed) &&
      formik.values.tags.length < 10
    ) {
      formik.setFieldValue("tags", [...formik.values.tags, trimmed]);
      setTagInput("");
    }
  };
  // AUTO SAVE TO REDUX
  useEffect(() => {
    if (isEditMode || !draftRestored) return;

    const timeout = setTimeout(() => {
      dispatch(
        saveDraft({
          title: formik.values.title,
          description: formik.values.description,
          contentHtml: formik.values.contentHtml,
          contentJson: formik.values.contentJson,
          category: formik.values.category,
          status: formik.values.status,
          tags: formik.values.tags,
        }),
      );
    }, 500);

    return () => clearTimeout(timeout);
  }, [formik.values, isEditMode, dispatch, draftRestored]);

  // SAVE TO SESSION STORAGE
  useEffect(() => {
    if (isEditMode || !draftRestored) return;

    const handleUnload = () => {
      const { title, contentHtml } = formik.values;

      if (title || contentHtml) {
        sessionStorage.setItem(draftKey, JSON.stringify(formik.values));
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [formik.values, isEditMode, draftKey, draftRestored]);

  // RESTORE DRAFT
  useEffect(() => {
    if (isEditMode || draftRestored) return;

    // REDUX DRAFT
    if (draft?.title || draft?.contentHtml) {
      formik.setValues({
        ...formik.initialValues,
        ...draft,
      });

      toast.info("Draft restored.", {
        position: "bottom-right",
        autoClose: 2500,
        toastId: "draft-restored",
      });

      Promise.resolve().then(() => setDraftRestored(true));
      return;
    }

    // SESSION STORAGE DRAFT
    const saved = sessionStorage.getItem(draftKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed?.title || parsed?.contentHtml) {
          formik.setValues({
            ...formik.initialValues,
            ...parsed,
          });

          toast.info("Draft restored after reload.", {
            position: "bottom-right",
            autoClose: 2500,
            toastId: "draft-restored-session",
          });
        }
      } catch (err) {
        console.error("Corrupted draft session data", err);
      }
    }

    Promise.resolve().then(() => setDraftRestored(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, draft, draftKey, draftRestored]);

  const removeTag = (tag) =>
    formik.setFieldValue(
      "tags",
      formik.values.tags.filter((t) => t !== tag),
    );

  const handleBack = async () => {
    if (formik.dirty) {
      const result = await confirmExit();
      if (result.isConfirmed) formik.handleSubmit();
      else if (result.isDenied) navigate("/my-blogs");
    } else {
      navigate("/my-blogs");
    }
  };

  const handleCoverChange = (e) => {
    const file = e.currentTarget.files[0];
    if (file) {
      formik.setFieldValue("coverImage", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* ── Flip perspective wrapper ── */}
      <div style={{ perspective: "1600px" }}>
        <div
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.75s cubic-bezier(0.4, 0.2, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            position: "relative",
            minHeight: "100vh",
          }}
        >
          {/* ══════════════════════════════════════════════
              FRONT — Writing canvas
          ══════════════════════════════════════════════ */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              pointerEvents: flipped ? "none" : "all",
            }}
            className={`absolute inset-0 min-h-screen bg-surface flex flex-col transition-all duration-300 ease-in-out ${panelOpen ? "pr-72" : "pr-0"}`}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-primary/8">
              <div className="w-full px-6 lg:px-16 h-14 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <X size={14} />
                  <span className="hidden sm:inline">Discard</span>
                </button>

                <div className="flex items-center gap-2">
                  {formik.values.category !== "None" && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary">
                      {formik.values.category}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isEditMode)
                      formik.setFieldValue("status", "published"); // ← this is missing
                    setFlipped(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                  {isEditMode ? <Save size={13} /> : <PenSquare size={13} />}
                  <span>{isEditMode ? "Save" : "Next"}</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Canvas — full width, generous padding */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-6 lg:px-16 py-10">
              {error && (
                <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                  <AlertCircle size={18} />
                  <p className="text-sm font-bold">
                    {Array.isArray(error) ? error.join(", ") : error}
                  </p>
                </div>
              )}
              {/* Title */}
              <textarea
                rows={1}
                placeholder="Title of your masterpiece…"
                className="w-full bg-transparent text-4xl sm:text-6xl font-black tracking-tight text-on-surface placeholder:text-on-surface-variant/15 border-0 outline-none resize-none leading-tight mb-4 overflow-hidden"
                value={formik.values.title}
                onChange={(e) => {
                  formik.setFieldValue("title", e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />

              {/* Editor */}
              <form
                onSubmit={formik.handleSubmit}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    e.target.tagName !== "TEXTAREA" &&
                    e.target.tagName !== "DIV"
                  ) {
                    e.preventDefault();
                  }
                }}
              >
                <FriendlyMarkdownEditor
                  value={formik.values.contentHtml}
                  title={formik.values.title}
                  images={formik.values.images}
                  onChange={(html, json) => {
                    formik.setFieldValue("contentHtml", html);
                    formik.setFieldValue("contentJson", json);
                  }}
                  onImagesChange={(images) =>
                    formik.setFieldValue("images", images)
                  }
                  onEditorReady={setEditor}
                />
              </form>
              {formik.touched.contentHtml && formik.errors.contentHtml && (
                <span className="text-[10px] text-rose-500 font-bold mt-2 block">
                  {formik.errors.contentHtml}
                </span>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              BACK — Publish settings
          ══════════════════════════════════════════════ */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              pointerEvents: flipped ? "all" : "none", // ← fix #1
            }}
            className="absolute inset-0 min-h-screen bg-surface flex flex-col"
          >
            {/* Top bar — back */}
            <div className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-primary/8">
              <div className="w-full px-6 lg:px-16 h-14 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFlipped(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to writing
                </button>

                <button
                  type="button"
                  onClick={() => formik.handleSubmit()}
                  disabled={loading || !formik.isValid}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    "Saving…"
                  ) : (
                    <>
                      {isEditMode ? (
                        <Save size={13} />
                      ) : (
                        <PenSquare size={13} />
                      )}
                      {isEditMode ? "Save Changes" : "Publish Post"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Settings body — fix #2: NO title/description here, only metadata */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-6 lg:px-16 py-12 overflow-y-auto">
              <div className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-on-surface mb-1">
                  {isEditMode ? "Save your changes" : "Ready to publish?"}
                </h1>
                <p className="text-sm text-on-surface-variant/50">
                  Fill in a few details before your story goes live.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* ── Left column ── */}
                <div className="space-y-7">
                  {/* Cover preview on back */}
                  <div>
                    <FieldLabel required={formik.values.status !== "draft"}>
                      Cover Image
                    </FieldLabel>
                    {preview ? (
                      <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-primary/10 group">
                        <img
                          src={preview}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 bg-white/90 rounded-full text-xs font-bold text-black hover:bg-white transition">
                            Change
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleCoverChange}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setPreview(null);
                              formik.setFieldValue("coverImage", null);
                            }}
                            className="px-3 py-1.5 bg-rose-500 text-white rounded-full text-xs font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 w-full h-48 border-2 border-dashed border-primary/15 rounded-2xl bg-surface-low hover:bg-surface-high hover:border-primary/30 transition-all cursor-pointer">
                        <ImagePlus size={16} className="text-primary/30" />
                        <span className="text-sm font-bold text-on-surface-variant/30">
                          Add cover image
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleCoverChange}
                        />
                      </label>
                    )}
                    {formik.errors.coverImage && (
                      <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                        {formik.errors.coverImage}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <FieldLabel required={formik.values.status !== "draft"}>
                      Short Description
                    </FieldLabel>
                    <div className="relative">
                      <textarea
                        rows={4}
                        placeholder="A brief hook for your readers…"
                        className="w-full bg-surface-low rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 border border-primary/10 focus:border-primary/40 outline-none resize-none transition-colors"
                        {...formik.getFieldProps("description")}
                      />
                      <span
                        className={`absolute bottom-2 right-3 text-[10px] font-mono ${formik.values.description.length > 180 ? "text-amber-500" : "text-on-surface-variant/30"}`}
                      >
                        {formik.values.description.length}/200
                      </span>
                    </div>
                    {formik.touched.description &&
                      formik.errors.description && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                          {formik.errors.description}
                        </span>
                      )}
                  </div>
                </div>

                {/* ── Right column ── */}
                <div className="space-y-7">
                  {/* Category */}
                  <div>
                    <FieldLabel required={formik.values.status !== "draft"}>
                      Category
                    </FieldLabel>
                    <select
                      className="w-full bg-surface-low rounded-2xl px-4 py-3 text-sm text-on-surface border border-primary/10 focus:border-primary/40 outline-none appearance-none transition-colors"
                      {...formik.getFieldProps("category")}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "None" ? "Select a category…" : cat}
                        </option>
                      ))}
                    </select>
                    {formik.touched.category && formik.errors.category && (
                      <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                        {formik.errors.category}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <div className="flex gap-2">
                      {BLOG_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => formik.setFieldValue("status", s)}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
          ${
            formik.values.status === s
              ? "bg-primary text-white shadow-sm"
              : "bg-surface-low text-on-surface-variant hover:bg-surface-high border border-primary/10"
          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  {formik.values.status === "scheduled" && (
                    <div>
                      <FieldLabel required>Publication Date</FieldLabel>
                      <div className="flex items-center gap-2 bg-surface-low rounded-2xl px-4 py-3 border border-primary/10">
                        <Calendar
                          size={14}
                          className="text-primary/50 shrink-0"
                        />
                        <input
                          type="datetime-local"
                          className="flex-1 bg-transparent text-sm text-on-surface outline-none"
                          {...formik.getFieldProps("scheduledFor")}
                        />
                      </div>
                      {formik.touched.scheduledFor &&
                        formik.errors.scheduledFor && (
                          <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                            {formik.errors.scheduledFor}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <FieldLabel>Tags</FieldLabel>
                      <span className="text-[10px] font-bold text-on-surface-variant/30 uppercase">
                        {formik.values.tags.length} / 10
                      </span>
                    </div>

                    {formik.values.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {formik.values.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary border border-primary/15 rounded-full text-[11px] font-bold"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-rose-500 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a tag…"
                        className="flex-1 bg-surface-low rounded-xl px-4 py-2.5 text-sm text-on-surface border border-primary/10 focus:border-primary/40 outline-none"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addTag()}
                        disabled={formik.values.tags.length >= 10}
                        className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="text-[10px] text-on-surface-variant/30 mt-2 flex items-center gap-1">
                      <Tag size={10} />
                      Use the AI panel to auto-generate tags from your content
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingAIHub
        editor={editor}
        showWritingTools={true}
        showSummary={false}
        onTagsGenerated={(tags) => {
          const existing = formik.values.tags;
          const merged = [
            ...existing,
            ...tags.filter((t) => !existing.includes(t)),
          ].slice(0, 10);
          formik.setFieldValue("tags", merged);
        }}
      />
    </div>
  );
};

export default BlogEditor;
