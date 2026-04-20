import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isLoggedIn } from "../redux/selectors/authSelectors";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { editProfileSchema } from "../validation/authSchemas";
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

  useEffect(() => {
    if (!loading && !access) return navigate("/login");
  }, [access, loading, navigate]);

  // 1. Get the Admin's target AND the Logged-in user's profile
  const adminSelected = useSelector((state) => state.admin.selectedUser);
  const { profile } = useSelector((state) => state.users);

  // 3. Logic:
  // Priority 1: Admin is editing someone else (adminSelected)
  // Priority 2: User is editing themselves (profile.userDetail)
  const currentData = adminSelected || profile?.userDetail;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: currentData?.username || "", // Required for schema
      firstName: currentData?.firstName || "",
      lastName: currentData?.lastName || "",
      dob: currentData?.dob
        ? new Date(currentData.dob).toISOString().split("T")[0]
        : "",
      gender: currentData?.gender || "",
      country: currentData?.country || "",
      bio: currentData?.bio || "",
    },
    validationSchema: editProfileSchema,
    onSubmit: async (values) => {
      try {
        const targetId =
          adminSelected?._id || profile?.userDetail?._id || profile?.user?.id;

        if (!targetId) {
          toast.error("User ID identification failed.");
          return;
        }

        // 2. Choose the Thunk based on the context
        if (adminSelected) {
          // ADMIN MODE
          await dispatch(
            updateProfileByAdmin({ userId: targetId, userData: values }),
          ).unwrap();
          toast.success("User updated by Admin");
          dispatch(fetchAllUsers({ page: 1, limit: 5 })); // Refresh Admin Table
        } else {
          // USER MODE (Self)
          await dispatch(updateProfile(values)).unwrap(); // Usually doesn't need ID in body if using token
          toast.success("Profile updated successfully");
          dispatch(getProfile()); // Refresh MyProfile nested state
        }

        onClose();
      } catch (error) {
        // If your backend sends a specific message, show that; otherwise a default
        toast.error(error?.message || "Failed to update profile");
        console.error("API_ERROR:", error);
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="card-auth text-reveal max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
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
            {/* --- First Name --- */}
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

            {/* --- Last Name --- */}
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

            {/* --- Gender --- */}
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

            {/* --- Country --- */}
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

            {/* --- Date of Birth --- */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                {...formik.getFieldProps("dob")}
                className="input-editorial"
              />
            </div>
          </div>

          {/* --- Bio --- */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">
              Bio
            </label>
            <textarea
              name="bio"
              rows="3"
              {...formik.getFieldProps("bio")}
              className="input-editorial py-3"
              placeholder="Tell your story..."
            />
            {formik.errors.bio && (
              <span className="text-[10px] text-red-500">
                {formik.errors.bio}
              </span>
            )}
          </div>

          {/* --- Action Buttons --- */}
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
              className="btn-editorial bg-surface text-on-surface border border-primary/20 hover:bg-surface-high flex-1"
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
