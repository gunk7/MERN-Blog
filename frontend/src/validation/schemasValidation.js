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
const CATEGORIES = ["Technology", "Design", "Business", "Science", "Culture", "Health & Wellness", "Finance", "Education", "Travel", "Food & Lifestyle", "Sports", "Entertainment", "Politics", "Environment", "Personal"];

export const blogSchema = Yup.object({
  title: Yup.string()
    .trim()
    .required("Title is required"),

  description: Yup.string()
    .required("Description is required")
    .max(200, "Description must be 200 characters or less"),

  content: Yup.string()
    .required("Content is required")
    .max(5000, "Content cannot exceed 5000 characters"),

  category: Yup.string()
    .oneOf(CATEGORIES, "Please select a valid category")
    .required("Category is required"),

  status: Yup.string()
    .oneOf(BLOG_STATUSES)
    .default("draft"),

  scheduledFor: Yup.date()
    .nullable()
    .when("status", {
      is: "scheduled",
      then: (schema) =>
        schema
          .required("Please set a date for your scheduled post")
          .min(new Date(), "Scheduled date must be in the future"),
      otherwise: (schema) => schema.notRequired(),
    }),

  tags: Yup.array()
  .of(Yup.string())
  .nullable()
  .test("max-tags", "You can only add up to 10 tags", (val) => !val || val.length <= 10),

coverImage: Yup.mixed()
  .required("A cover image is required")
  .test("is-valid-image", "Invalid image format", (value) => {
    // 1. If it's a URL string (Edit Mode), it's valid
    if (typeof value === 'string' && value.length > 0) return true;
    
    // 2. If it's a File object (Create or New Upload), it's valid
    if (value && (value instanceof File || value.size)) return true;

    return false;
  })
  .test("fileSize", "File size is too large (Max 10MB)", (value) => {
    // Skip size check if it's already a URL string
    if (typeof value === 'string') return true;
    
    if (value && value.size) {
      return value.size <= 10 * 1024 * 1024;
    }
    return true;
  }),
});