import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { blogSchema } from "../../validation/schemasValidation";
import { useDispatch, useSelector } from "react-redux";
import {
  createBlog,
  getBlogById,
  getMyBlogs,
  updateBlog,
} from "../../redux/thunks/blogThunks";
import { clearBlogState } from "../../redux/slice/blogSlice";
import { useNavigate, useParams } from "react-router-dom";

import {
  Save,
  PenSquare,
  AlertCircle,
  Sparkles,
  Calendar,
  UploadCloud,
  X,
  AlignLeft,
  ImageIcon,
  Plus, // New icon for description
} from "lucide-react";
import { toast } from "react-toastify";
import { confirmExit } from "../../services/modalServices";

const BLOG_STATUSES = ["draft", "published", "scheduled"];
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

const BlogEditor = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, currentBlog, createSuccess, updateSuccess } =
    useSelector((state) => state.blog);

  const [preview, setPreview] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      dispatch(getBlogById(id));
    }

    return () => {
      dispatch(clearBlogState());
    };
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (isEditMode && currentBlog && currentBlog._id === id) {
      setExistingImages(currentBlog.images || []);

      if (currentBlog.coverImage && !preview) {
        setPreview(
          `${import.meta.env.VITE_API_IMG_URL}/${currentBlog.coverImage}`,
        );
      }
    }
  }, [currentBlog?._id, id, isEditMode]);

  useEffect(() => {
    // Handle Success
    if (createSuccess || updateSuccess) {
      const message = isEditMode ? "Blog updated!" : "Blog published!";
      toast.success(message, {
        position: "bottom-right",
        autoClose: 3000,
      });

      // Reset state before navigating to prevent double-toasting
      dispatch(clearBlogState());
      navigate("/my-blogs");
    }

    // Handle Errors (Backend or Validation)
    if (error) {
      toast.error(error, {
        position: "bottom-right",
      });
    }
  }, [createSuccess, updateSuccess, error, dispatch, navigate, isEditMode]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: isEditMode && currentBlog ? currentBlog.title || "" : "",
      description:
        isEditMode && currentBlog ? currentBlog.description || "" : "",
      content: isEditMode && currentBlog ? currentBlog.content || "" : "",
      category: isEditMode && currentBlog ? currentBlog.category || "" : "",
      status:
        isEditMode && currentBlog ? currentBlog.status || "draft" : "draft",
      scheduledFor:
        isEditMode && currentBlog ? currentBlog.scheduledFor || "" : "",
      tags: isEditMode && currentBlog ? currentBlog.tags || [] : [],
      coverImage: isEditMode && currentBlog ? currentBlog.coverImage : null,
      images: [],
    },
    validationSchema: blogSchema,
    onSubmit: async (values) => {
      const formData = new FormData();

      // Basic Fields
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("content", values.content);
      formData.append("category", values.category);
      formData.append("status", values.status);

      if (values.status === "scheduled" && values.scheduledFor) {
        formData.append(
          "scheduledFor",
          new Date(values.scheduledFor).toISOString(),
        );
      }

      // Tags
      values.tags.forEach((tag) => formData.append("tags", tag));

      // 1. Cover Image Logic: Only append if a NEW file was picked
      if (values.coverImage instanceof File) {
        formData.append("coverImage", values.coverImage);
      }

      if (isEditMode) {
        if (existingImages.length === 0) {
          formData.append("existingImages", "empty");
        } else {
          existingImages.forEach((img) => {
            const identifier = typeof img === "string" ? img : img.filename;
            formData.append("existingImages", identifier);
          });
        }

        // 3. New Gallery Images:
        values.images.forEach((file) => {
          if (file instanceof File) formData.append("images", file);
        });

        dispatch(updateBlog({ id, formData }));
      } else {
        dispatch(createBlog(formData));
      }
    },
  });

  const showError = (field) =>
    (formik.touched[field] || formik.submitCount > 0) && formik.errors[field];

  const addTag = () => {
    const trimmedInput = tagInput.trim();

    if (trimmedInput && !formik.values.tags.includes(trimmedInput)) {
      const newTags = [...formik.values.tags, trimmedInput];
      formik.setFieldValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    const filteredTags = formik.values.tags.filter(
      (tag) => tag !== tagToRemove,
    );
    formik.setFieldValue("tags", filteredTags);
  };

  const handleBack = async () => {
    if (formik.dirty) {
      const result = await confirmExit();

      if (result.isConfirmed) {
        formik.handleSubmit();
      } else if (result.isDenied) {
        navigate("/my-blogs");
      }
    } else {
      navigate("/my-blogs");
    }
  };

  // handleImageChange
  const handleImageChange = (e) => {
    const file = e.currentTarget.files[0];
    if (file) {
      formik.setFieldValue("coverImage", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <section className="min-h-screen py-12 px-4 animate-reveal">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10 text-center relative">
          <span className="text-primary font-bold tracking-[0.3em] uppercase text-[10px]">
            {isEditMode ? "Update" : "Studio"}
          </span>

          <h2 className="text-4xl sm:text-5xl font-display font-black tracking-tighter text-on-surface mt-2">
            {isEditMode ? "Edit Post" : "New Post"}
          </h2>
          {/* Close Button - Moved and styled for visibility */}
          <button
            type="button"
            onClick={handleBack}
            className="absolute top-0 right-0 sm:-right-4 p-2 text-on-surface-variant/40 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all z-50"
            aria-label="Close"
          >
            <X size={28} />
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
            <AlertCircle size={20} />
            <p className="text-sm font-bold uppercase">
              {Array.isArray(error) ? error.join(", ") : error}
            </p>
          </div>
        )}

        <div className="card-auth max-w-none! w-full!">
          <form
            onSubmit={formik.handleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
                e.preventDefault();
              }
            }}
            className="space-y-8"
          >
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Cover Image
              </label>
              <div className="relative group">
                {preview ? (
                  <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-primary/10 shadow-inner">
                    <img
                      src={
                        preview?.startsWith("blob:") ||
                        preview?.startsWith("http")
                          ? preview
                          : `${import.meta.env.VITE_API_IMG_URL}/${preview}`
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        formik.setFieldValue("coverImage", null);
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-full text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-72 w-full border-2 border-dashed border-primary/20 rounded-2xl bg-surface-low hover:bg-surface-high transition-all cursor-pointer group">
                    <UploadCloud
                      size={48}
                      className="text-primary/30 mb-4 group-hover:scale-110 transition-transform"
                    />
                    <p className="text-sm font-bold text-on-surface-variant">
                      Upload Story Cover
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
               {/* Cover image error now visible on submit attempt */}
              {showError("coverImage") && (
                <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                  {formik.errors.coverImage}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Title
              </label>
              <input
                type="text"
                placeholder="Title of your masterpiece..."
                className="input-editorial text-3xl font-display py-6"
                {...formik.getFieldProps("title")}
              />
              {showError("title") && (
                <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                  {formik.errors.title}
                </p>
              )}
            </div>

            {/* Short Description - NEW FIELD */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Description (Max 200 chars)
              </label>
              <div className="relative">
                <textarea
                  rows="2"
                  placeholder="A brief hook for your readers..."
                  className="input-editorial pl-12 pt-4"
                  {...formik.getFieldProps("description")}
                />
                <AlignLeft
                  size={18}
                  className="absolute left-4 top-5 text-primary/30"
                />
              </div>
             {showError("description") && (
                <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                  {formik.errors.description}
                </p>
              )}
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Category
                </label>
                <select
                  className="input-editorial"
                  {...formik.getFieldProps("category")}
                >
                  <option value="">Select Topic</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                 {showError("category") && (
                  <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                    {formik.errors.category}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                  Status
                </label>
                <select
                  className="input-editorial"
                  {...formik.getFieldProps("status")}
                >
                  {BLOG_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
                {showError("status") && (
                  <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                    {formik.errors.status}
                  </p>
                )}
              </div>
            </div>

            {/* Scheduled Date */}
            {formik.values.status === "scheduled" && (
              <div className="space-y-2 animate-reveal bg-primary-fixed/20 p-6 rounded-3xl border border-primary/10">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                  <Calendar size={14} /> Set Publication Date
                </label>
                <input
                  type="datetime-local"
                  className="input-editorial"
                  {...formik.getFieldProps("scheduledFor")}
                />
                 {showError("scheduledFor") && (
                  <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                    {formik.errors.scheduledFor}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Tags
              </label>
              <p className="text-xs text-on-surface-variant/70 ml-1">
                Associate tags to this blog post. They will help in search
                discovery.
              </p>

              {/* Displaying Added Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formik.values.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium animate-reveal"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-rose-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Tag Input and Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="e.g. React, Web Design..."
                    className="input-editorial pl-10"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Sparkles
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={addTag}
                  className="flex items-center gap-2 px-6 py-2 border-2 border-primary text-primary rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Add Tag
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">
                Content
              </label>
              <textarea
                rows="12"
                placeholder="Begin your story..."
                className="input-editorial min-h-400px font-body leading-relaxed text-lg"
                {...formik.getFieldProps("content")}
              />
            {showError("content") && (
                <p className="text-xs text-rose-500 font-bold uppercase ml-1">
                  {formik.errors.content}
                </p>
              )}
            </div>

            {/* Gallery Images (Optional) */}
            <div className="space-y-4 bg-surface-low p-6 rounded-3xl border border-primary/5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Post Gallery (Optional)
                </label>
                <span className="text-[10px] text-primary/60 font-bold uppercase">
                  {existingImages.length + formik.values.images.length} Files
                  Selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Upload Trigger */}
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl hover:bg-surface-high cursor-pointer transition-all">
                  <ImageIcon size={24} className="text-primary/40 mb-2" />
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                    Add Media
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files);
                      formik.setFieldValue("images", [
                        ...formik.values.images,
                        ...files,
                      ]);
                    }}
                  />
                </label>

                {/* Existing server images (string URLs) */}
                {existingImages.map((img, index) => (
                  <div
                    key={img._id || index}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-primary/10"
                  >
                    <img
                      // Ensure there is a slash between URL and Path
                      src={`${import.meta.env.VITE_API_IMG_URL}/${img.url}`}
                      className="w-full h-full object-cover"
                      alt="Gallery"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExistingImages(
                          existingImages.filter((_, i) => i !== index),
                        )
                      }
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Newly added images (File objects) */}
                {formik.values.images.map((file, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-primary/10"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover"
                      alt="New gallery"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        formik.setFieldValue(
                          "images",
                          formik.values.images.filter((_, i) => i !== index),
                        )
                      }
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            {/* Action Button Group */}
            <div className="pt-10 flex flex-col sm:flex-row-reverse gap-4 border-t border-primary/5">
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-editorial flex-1"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    {isEditMode ? <Save size={22} /> : <PenSquare size={22} />}
                    <span>
                      {isEditMode ? "Save Changes" : "Publish Blog Post"}
                    </span>
                  </>
                )}
              </button>

              {/* Cancel Button - Styled to be clearly visible */}
              <button
                type="button"
                onClick={handleBack}
                className="px-8 py-4 rounded-2xl bg-surface-high border-2 border-primary/5 text-on-surface-variant font-bold uppercase tracking-widest text-[11px] hover:border-primary/20 hover:bg-surface-lowest transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default BlogEditor;
