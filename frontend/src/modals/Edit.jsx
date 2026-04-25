import React, { useEffect } from "react";
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
import {
  updateProfileByAdmin,
  fetchAllUsers,
} from "../redux/thunks/adminThunks";

const Edit = ({ isOpen, onClose, userId, onSubmit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.users);
  const access = useSelector(isLoggedIn);
  const today = new Date().toISOString().split("T")[0];

  const adminSelected = useSelector((state) => state.admin.selectedUser);
  const { profile } = useSelector((state) => state.users);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    if (!loading && !access) return navigate("/login");
  }, [access, loading, navigate]);

  const currentData = adminSelected || profile?.userDetail;

  const formik = useFormik({
    enableReinitialize: true,
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
        const targetId =
          adminSelected?._id || profile?.userDetail?._id || user?._id;

        if (!targetId) {
          console.error("ID Debug:", { adminSelected, profile, user });
          toast.error("User ID not found. Please log in again.");
          return;
        }

        if (adminSelected) {
          // --- ADMIN MODE ---
          await dispatch(
            updateProfileByAdmin({ userId: targetId, userData: values }),
          ).unwrap();
          toast.success("Profile updated by Admin successfully");
          dispatch(fetchAllUsers({ page: 1, limit: 5 }));
        } else {
          await dispatch(
            updateProfile({ userId: targetId, userData: values }),
          ).unwrap();
          toast.success("Profile updated successfully");
          dispatch(getProfile());
        }

        onClose();
      } catch (error) {
        toast.error(error?.message || "Failed to update profile");
        console.error("API_ERROR:", error);
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="card-auth text-reveal max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="font-display text-2xl font-bold mb-8 text-on-surface">
          Edit Identity
        </h2>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">
                  @
                </span>
                <input
                  name="username"
                  type="text"
                  {...formik.getFieldProps("username")}
                  className={`input-editorial pl-9 ${formik.touched.username && formik.errors.username ? "border-red-500" : ""}`}
                />
              </div>
              {formik.touched.username && formik.errors.username && (
                <span className="text-[10px] text-red-500 mt-1">
                  {formik.errors.username}
                </span>
              )}
            </div>

            {/* First Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                First Name
              </label>
              <input
                name="firstName"
                {...formik.getFieldProps("firstName")}
                className="input-editorial"
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <span className="text-[10px] text-red-500">
                  {formik.errors.firstName}
                </span>
              )}
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                Last Name
              </label>
              <input
                name="lastName"
                {...formik.getFieldProps("lastName")}
                className="input-editorial"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                Gender
              </label>
              <select
                name="gender"
                {...formik.getFieldProps("gender")}
                className="input-editorial"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                Country
              </label>
              <select
                name="country"
                {...formik.getFieldProps("country")}
                className="input-editorial"
              >
                <option value="">Select</option>
                <option value="India">India</option>
                <option value="Russia">Russia</option>
                <option value="Italy">Italy</option>
              </select>
            </div>

            {/* DOB */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                Date of Birth (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dob"
                  {...formik.getFieldProps("dob")}
                  max={today}
                  className={`input-editorial w-full appearance-none ${
                    formik.errors.dob ? "border-red-500" : ""
                  }`}
                  onClick={(e) => e.target.showPicker?.()}
                />
              </div>
              {formik.touched.dob && formik.errors.dob && (
                <span className="text-[10px] text-red-500 mt-1">
                  {formik.errors.dob}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
              Bio
            </label>
            <textarea
              name="bio"
              rows="3"
              {...formik.getFieldProps("bio")}
              className="input-editorial py-3"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
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
        </form>
      </div>
    </div>
  );
};

export default Edit;
