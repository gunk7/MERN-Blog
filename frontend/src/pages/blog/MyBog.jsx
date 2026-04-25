import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  getMyBlogs,
  deleteBlog,
  updateBlog,
} from "../../redux/thunks/blogThunks";
import {
  Edit3,
  Trash2,
  Globe,
  FileText,
  Clock,
  ThumbsUp,
  MessageSquare,
  Plus,
  MoreHorizontal,
  Bookmark,
} from "lucide-react";
import { toast } from "react-toastify";
import { confirmAction } from "../../services/modalServices";
import { clearBlogState } from "../../redux/slice/blogSlice";

const MyBlogs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("published");

  const { userBlogs, loading, updateSuccess, deleteSuccess } = useSelector(
    (state) => state.blog,
  );

  useEffect(() => {
    dispatch(getMyBlogs());
  }, [dispatch]);

  useEffect(() => {
    if (updateSuccess || deleteSuccess) {
      dispatch(getMyBlogs());
      dispatch(clearBlogState());
    }
  }, [updateSuccess, deleteSuccess, dispatch]);
  const filteredData = useMemo(() => {
    return (userBlogs || []).filter((blog) => blog.status === activeTab);
  }, [userBlogs, activeTab]);

  const handleDelete = async (id) => {
    const result = await confirmAction(
      "Are you sure?",
      "Permanently remove this Blog from your Blogs?",
      "warning",
      "Delete",
    );

    if (result.isConfirmed) {
      dispatch(deleteBlog(id)).then(() => {
        toast.error("Story deleted.");
        navigate("/my-blogs");
      });
    }
  };

  const toggleStatus = async (blog) => {
    const newStatus = blog.status === "published" ? "draft" : "published";

    const result = await confirmAction(
      "Change Status?",
      `Do you want to move this Blog to ${newStatus}?`,
      "question",
      "Yes, move it",
    );

    if (result.isConfirmed) {
      const formData = new FormData();
      formData.append("status", newStatus);

      dispatch(updateBlog({ id: blog._id, formData })).then(() => {
        // Logic inside the curly braces runs ONLY after success
        toast.success(`Moved to ${newStatus}`);
        navigate("/my-blogs");
      });
    }
  };
  // TanStack Table Column Definitions
  const columns = useMemo(
    () => [
      {
        accessorKey: "content",
        header: "Article",
        cell: ({ row }) => {
          const blog = row.original;
          return (
            <div className="flex flex-col md:flex-row gap-8 py-10 group border-b border-primary/5 last:border-0">
              {/* Left Side: Editorial Content */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-primary font-bold uppercase tracking-[0.2em] text-[10px]">
                    {blog.category}
                  </span>
                  <span className="text-on-surface-variant/30 text-[10px]">
                    •
                  </span>
                  <span className="text-on-surface-variant/60 text-[11px] font-body">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {blog.status === "scheduled" && (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold italic">
                      <Clock size={12} /> Scheduled
                    </div>
                  )}
                </div>

                <h3
                  onClick={() => navigate(`/blog/${blog._id}`)}
                  className="text-2xl font-display font-black leading-tight text-on-surface group-hover:text-primary transition-colors cursor-pointer mb-2"
                >
                  {blog.title}
                </h3>

                <p className="text-on-surface-variant text-sm font-body line-clamp-2 leading-relaxed opacity-70 mb-4 max-w-2xl">
                  {blog.description ||
                    "No description provided for this editorial piece."}
                </p>

                {/* Engagement Mockup from Image */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-6 text-on-surface-variant/40">
                    {/* <div className="flex items-center gap-1.5 text-xs">
                      <ThumbsUp size={14} /> 12.4K
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <MessageSquare size={14} /> 256
                    </div>
                    <div className="hidden sm:block">
                      <Bookmark size={14} />
                    </div> */}
                  </div>

                  {/* Inline Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleStatus(blog)}
                      className="p-2 hover:bg-surface-high rounded-full transition-colors text-on-surface-variant"
                      title={
                        blog.status === "published" ? "Unpublish" : "Publish"
                      }
                    >
                      {blog.status === "published" ? (
                        <FileText size={18} />
                      ) : (
                        <Globe size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/edit-blog/${blog._id}`)}
                      className="p-2 hover:bg-surface-high rounded-full transition-colors text-on-surface-variant"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-colors text-on-surface-variant"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side: Small Image Box (Style from image_7014a5.png) */}
              <div
                onClick={() => navigate(`/blog/${blog._id}`)}
                className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden cursor-pointer shadow-sm border border-primary/5"
              >
                <img
                  src={`${import.meta.env.VITE_API_IMG_URL}/${blog.coverImage}`}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading)
    return (
      <div className="p-24 text-center italic font-display text-3xl animate-pulse">
        syncing your archive...
      </div>
    );

  return (
    <div className="min-h-screen bg-white px-6 py-12 sm:px-20 lg:px-40">
      <div className="max-w-5xl mx-auto">
        {/* Minimal Header */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tighter">
              Your Stories<span className="text-primary">.</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40 mt-1">
              Refine and Manage your Blogs
            </p>
          </div>
          <Link
            to="/write"
            className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary transition-colors"
          >
            <Plus size={16} /> Write
          </Link>
        </header>

        {/* Tab System */}
        <div className="flex gap-8 border-b border-primary/5 mb-4">
          {["published", "draft", "scheduled"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab
                  ? "text-on-surface"
                  : "text-on-surface-variant/40 hover:text-on-surface-variant"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black animate-reveal" />
              )}
            </button>
          ))}
        </div>

        {/* TanStack "Table" Body */}
        <div className="flex flex-col">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="py-32 text-center">
              <p className="font-display italic text-2xl text-on-surface-variant/30">
                The {activeTab} volume is currently empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBlogs;
