import { createAsyncThunk } from "@reduxjs/toolkit";
import API from "../../services/axios";

export const createBlog = createAsyncThunk(
  "blog/createBlog",
  async (FormData, { rejectedWithValue }) => {
    try {
      const response = await API.post("/blogs/", FormData);
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
  async (_, { rejectedWithValue }) => {
    try {
      const response = await API.get("/blogs");
      return response.data.data.blogs;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message ||
          "An error occurred While fetching all blogs",
      );
    }
  },
);

export const getBlogById = createAsyncThunk(
  "blogs/getById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/blogs/${id}`);
      return response.data.data.blog;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch blog");
    }
  }
);

export const getBlogsByUser = createAsyncThunk(
  "blogs/getByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/blogs/user/${userId}`);
      return data.data.blogs;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch user blogs");
    }
  }
);

export const getMyBlogs = createAsyncThunk(
  "blog/getMyBlogs",
  async (_, { rejectedWithValue }) => {
    try {
      const response = await API.get("/blogs/my-blogs");
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
      const response = await API.put(`/blogs/${id}`, formData);
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
      const response = await API.delete(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      return rejectedWithValue(
        error.response?.data?.message ||
          "An error occurred While deleting the blog",
      );
    }
  },
);
