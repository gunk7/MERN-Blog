import * as Yup from "yup";

export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid Email Format")
    .required("Email is required."),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .required("Password is Required"),
});

export const signupSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
});

export const editProfileSchema = Yup.object({
  username: Yup.string().nullable(),
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  country: Yup.string().nullable(),
  bio: Yup.string().max(200, "Bio must be at most 200 characters.").nullable(),
  dob: Yup.date()
    .nullable()
    .max(new Date(), "Date of Birth cannot be in the future."),
  gender: Yup.string().oneOf(["male", "female", "other"]).nullable(),
});

const BLOG_STATUSES = ["draft", "published", "scheduled"];
const CATEGORIES = [
  "None",
  "Technology",
  "Design",
  "Business",
  "Science",
  "Culture",
  "Health & Wellness",
  "Animals",
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

export const blogSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),

  description: Yup.string()
    .trim()
    .max(200, "Description must be 200 characters or less")
    .when("status", {
      is: (status) => status !== "draft",
      then: (schema) => schema.required("Description is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

  contentHtml: Yup.string()
    .trim()
    .max(20000, "Content is too large")
    .when("status", {
      is: (status) => status !== "draft",
      then: (schema) => schema.required("Content is required"),
      otherwise: (schema) => schema.notRequired(),
    }),

  contentJson: Yup.object(),

  category: Yup.string()
    .oneOf(CATEGORIES, "Please select a valid category")
    .when("status", {
      is: (status) => status !== "draft",
      then: (schema) =>
        schema
          .required("Category is required")
          .notOneOf(["None"], "Please select a category"),
      otherwise: (schema) => schema.notRequired(),
    }),

  status: Yup.string().oneOf(BLOG_STATUSES).required(),

  scheduledFor: Yup.date()
    .nullable()
    .when("status", {
      is: "scheduled",
      then: (schema) =>
        schema
          .required("Please set a date for your scheduled post")
          .min(
            new Date(Date.now() + 60 * 1000),
            "Scheduled date must be in the future",
          ),
      otherwise: (schema) => schema.notRequired(),
    }),

  tags: Yup.array()
    .of(
      Yup.string()
        .trim()
        .lowercase()
        .max(30, "Tag cannot exceed 30 characters"),
    )
    .max(10, "You can only add up to 10 tags")
    .default([]),

  coverImage: Yup.mixed().when("status", {
    is: (status) => status !== "draft",
    then: (schema) =>
      schema
        .test("cover-required", "A cover image is required", (value) => {
          if (typeof value === "string" && value.length > 0) return true;
          if (value instanceof File) return true;
          return false;
        })
        .test("fileType", "Unsupported image format", (value) => {
          if (typeof value === "string") return true;
          if (value instanceof File) {
            return ["image/jpeg", "image/png", "image/webp"].includes(
              value.type,
            );
          }
          return false;
        })
        .test("fileSize", "File size is too large (Max 10MB)", (value) => {
          if (typeof value === "string") return true;
          if (value instanceof File) return value.size <= 10 * 1024 * 1024;
          return true;
        }),
    otherwise: (schema) => schema.notRequired(),
  }),

  images: Yup.array()
    .of(
      Yup.object({
        url: Yup.string().required("Image URL is required"),
        publicId: Yup.string().nullable(),
        size: Yup.number()
          .max(5 * 1024 * 1024, "Each image must be under 5MB")
          .nullable(),
        order: Yup.number().nullable(),
      }),
    )
    .max(10, "You can upload at most 10 inline images")
    .default([]),
});
