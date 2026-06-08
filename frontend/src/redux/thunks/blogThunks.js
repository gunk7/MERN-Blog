import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const createBlog = createAsyncThunk(
  "blog/createBlog",
  async (FormData, { rejectedWithValue }) => {
    try {
      const response = await API.post("/api/blogs/", FormData);
      return response.data;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message ||
          "An error occurred While creating the blog",
      );
    }
  },
);

export const getAllBlogs = createAsyncThunk(
  "blog/getAllBlogs",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const stateQuery = getState().blog.query;
      // categories is an array in state e.g. ["Technology", "Design"]
      // serialize to "Technology,Design" for the backend
      const categoryParam =
        Array.isArray(stateQuery.categories) && stateQuery.categories.length > 0
          ? stateQuery.categories.join(",")
          : undefined;

      const finalParams = {
        search: stateQuery.search,
        category: categoryParam,
        page: stateQuery.page,
        limit: stateQuery.limit,
        ...params,
      };

      const response = await API.get("/api/blogs", { params: finalParams });
      return {
        blogs: response.data.blogs,
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching blogs",
      );
    }
  },
);

export const searchUsers = createAsyncThunk(
  "blog/searchUsers",
  async ({ q, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await API.get("/api/user/search", {
        params: { q, page, limit: 10 },
      });
      console.log(response);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error searching users",
      );
    }
  },
);

/* export const getAllBlogs = createAsyncThunk(
  "blog/getAllBlogs",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const stateQuery = getState().blog.query;

      const finalParams = {
        search: stateQuery.search,
        category: stateQuery.category,
        page: stateQuery.page,
        limit: stateQuery.limit,
        ...params,
      };

      const response = await API.get("/blogs", { params: finalParams });

      return {
        blogs: response.data.blogs,
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Error fetching blogs",
      );
    }
  },
); */

export const getBlogById = createAsyncThunk(
  "blogs/getById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/blogs/id/${id}`);
      return response.data.data.blog;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch blog",
      );
    }
  },
);

export const getBlogBySlug = createAsyncThunk(
  "blogs/getBySlug",
  async (slug, { rejectWithValue }) => {
    try {
      const response = await API.get(`/api/blogs/slug/${slug}`);
      return response.data.data.blog;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch blog by slug",
      );
    }
  },
);

export const getBlogsByUser = createAsyncThunk(
  "blogs/getByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/api/blogs/user/${userId}`);
      return data.data.blogs;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user blogs",
      );
    }
  },
);

export const getMyBlogs = createAsyncThunk(
  "blog/getMyBlogs",
  async (_, { rejectedWithValue }) => {
    try {
      const response = await API.get("/api/blogs/my-blogs");
      return response.data.data.blogs;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message ||
          "An error occurred While fetching my blogs",
      );
    }
  },
);

export const updateBlog = createAsyncThunk(
  "blog/updateBlog",
  async ({ id, formData }, { rejectedWithValue }) => {
    try {
      const response = await API.put(`/api/blogs/${id}`, formData);
      return response.data.data.blog;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message ||
          "An error occurred While updating the blog",
      );
    }
  },
);

export const deleteBlog = createAsyncThunk(
  "blog/deleteBlog",
  async (id, { rejectedWithValue }) => {
    try {
      const response = await API.delete(`/api/blogs/${id}`);
      return response.data;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message ||
          "An error occurred While deleting the blog",
      );
    }
  },
);

export const toggleBlog = createAsyncThunk(
  "blog/toggleBlog",
  async (id, { rejectedWithValue }) => {
    try {
      const response = await API.post(`/api/blogs/like/${id}`);
      return response.data;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message || "An error occurred",
      );
    }
  },
);
