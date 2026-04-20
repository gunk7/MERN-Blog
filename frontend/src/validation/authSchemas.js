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
  // 1. Changed username to not be required (or remove it if you don't edit it here)
  username: Yup.string(), 
  
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  
  // 2. Added .nullable() and made country optional to prevent silent blocking
  country: Yup.string().nullable(), 
  
  bio: Yup.string().max(200, "Bio must be at most 200 characters.").nullable(),
  
  // 3. Keep these as they are
  dob: Yup.date().nullable(),
  gender: Yup.string().oneOf(["male", "female", "other"]).nullable(),
});
