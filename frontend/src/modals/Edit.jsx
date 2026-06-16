import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  isLoggedIn,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { editProfileSchema } from "../validation/schemasValidation";
import { getProfile, updateProfile } from "../redux/thunks/userThunks";
import { X, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import API from "../services/axios";
import { isUsernameUnsuitable } from "../services/apiService";

const Edit = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.users);
  const access = useSelector(isLoggedIn);
  const today = new Date().toISOString().split("T")[0];

  const { profile } = useSelector((state) => state.users);
  const user = useSelector(selectCurrentUser);
  const [countries, setCountries] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (!loading && !access) return navigate("/login");
  }, [access, loading, navigate]);

  useEffect(() => {
    const getCountries = async () => {
      try {
        const { data } = await API.get(
          "https://restcountries.com/v3.1/all?fields=name",
        );
        setCountries(data.map((c) => c.name.common).sort());
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    getCountries();
  }, []);

  const currentData = profile?.userDetail;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreview(null);
    setRemoveImage(true);
  };

  const formik = useFormik({
    enableReinitialize: true,
    validateOnMount: false,
    initialValues: {
      username: currentData?.username || user?.username || "",
      firstName: currentData?.firstName || "",
      lastName: currentData?.lastName || "",
      dob: currentData?.dob
        ? new Date(currentData.dob).toISOString().split("T")[0]
        : "",
      gender: currentData?.gender || "Prefer not to say",
      country: currentData?.country || "",
      bio: currentData?.bio || "",
    },
    validationSchema: editProfileSchema,
    onSubmit: async (values) => {
      try {
        const targetId = profile?.userDetail?._id || user?._id;
        if (!targetId) return toast.error("User ID not found.");

        if (values.username !== currentData?.username) {
          const isBad = await isUsernameUnsuitable(values.username);
          if (isBad)
            return toast.error("Please choose a more appropriate username.");
        }

        const formData = new FormData();
        Object.keys(values).forEach((key) => formData.append(key, values[key]));
        if (selectedImage) formData.append("profilePic", selectedImage);
        if (removeImage) formData.append("removeImage", "true");

        await dispatch(
          updateProfile({ userId: targetId, userData: formData }),
        ).unwrap();
        toast.success("Profile updated successfully");
        dispatch(getProfile());

        onClose();
      } catch (error) {
        toast.error(error?.message || "Failed to update profile");
      }
    },
  });

  // Touch all fields then submit — ensures all errors are visible on first click
  const handleSave = () => {
    formik.setTouched(
      Object.keys(formik.values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}),
    );
    formik.submitForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-md">
      <div className="card-auth max-w-2xl w-full h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary/10 sticky top-0 bg-card z-10">
          <h2 className="font-display text-xl font-bold text-on-surface">
            Edit Identity
          </h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="editProfileForm"
            onSubmit={formik.handleSubmit}
            className="space-y-6"
          >
            {/* Profile pic */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={
                    preview
                      ? preview
                      : currentData?.profilePic && !removeImage
                        ? currentData.profilePic
                        : import.meta.env.VITE_DEFAULT_AVATAR
                  }
                  alt="profile"
                  className="w-20 h-20 rounded-full object-cover border"
                />
                {(preview || currentData?.profilePic) && !removeImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <label className="btn-editorial cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Username */}
              <Field
                label="Username"
                error={formik.touched.username && formik.errors.username}
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                    @
                  </span>
                  <input
                    name="username"
                    type="text"
                    {...formik.getFieldProps("username")}
                    className={`input-editorial pl-9 ${formik.touched.username && formik.errors.username ? "border-red-400" : ""}`}
                  />
                </div>
              </Field>

              {/* First Name */}
              <Field
                label="First Name"
                error={formik.touched.firstName && formik.errors.firstName}
              >
                <input
                  name="firstName"
                  {...formik.getFieldProps("firstName")}
                  className={`input-editorial ${formik.touched.firstName && formik.errors.firstName ? "border-red-400" : ""}`}
                />
              </Field>

              {/* Last Name */}
              <Field
                label="Last Name"
                error={formik.touched.lastName && formik.errors.lastName}
              >
                <input
                  name="lastName"
                  {...formik.getFieldProps("lastName")}
                  className={`input-editorial ${formik.touched.lastName && formik.errors.lastName ? "border-red-400" : ""}`}
                />
              </Field>

              {/* Gender */}
              <Field
                label="Gender"
                error={formik.touched.gender && formik.errors.gender}
              >
                <select
                  name="gender"
                  {...formik.getFieldProps("gender")}
                  className={`input-editorial ${formik.touched.gender && formik.errors.gender ? "border-red-400" : ""}`}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              {/* Country */}
              <Field
                label="Country"
                error={formik.touched.country && formik.errors.country}
              >
                <select
                  name="country"
                  {...formik.getFieldProps("country")}
                  className={`input-editorial ${formik.touched.country && formik.errors.country ? "border-red-400" : ""}`}
                >
                  <option value="">Select Country</option>
                  {countries.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Date of Birth */}
              <Field
                label="Date of Birth"
                error={formik.touched.dob && formik.errors.dob}
                fullWidth
              >
                <input
                  type="date"
                  name="dob"
                  {...formik.getFieldProps("dob")}
                  max={today}
                  className={`input-editorial ${formik.touched.dob && formik.errors.dob ? "border-red-400" : ""}`}
                />
              </Field>
            </div>

            {/* Bio */}
            <Field label="Bio" error={formik.touched.bio && formik.errors.bio}>
              <textarea
                name="bio"
                rows="3"
                {...formik.getFieldProps("bio")}
                className={`input-editorial py-3 ${formik.touched.bio && formik.errors.bio ? "border-red-400" : ""}`}
              />
            </Field>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-primary/10 sticky bottom-0 bg-card">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="btn-editorial flex-1"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} /> Save Identity
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-editorial bg-surface text-on-surface border border-primary/20 flex-1"
            >
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Reusable field wrapper ────────────────────────────────────────────────────

const Field = ({ label, error, fullWidth, children }) => (
  <div className={`flex flex-col gap-1 ${fullWidth ? "md:col-span-2" : ""}`}>
    <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
      {label}
    </label>
    {children}
    {error && <span className="text-[10px] text-red-500 mt-0.5">{error}</span>}
  </div>
);

export default Edit;
