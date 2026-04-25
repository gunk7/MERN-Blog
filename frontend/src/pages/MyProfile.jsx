import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  ShieldCheck,
  Loader2,
  Edit3,
  Lock,
  ArrowUpRight,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { getProfile } from "../redux/thunks/userThunks";
import Edit from "../modals/Edit";
import {
  isLoggedIn,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";
import UpdatePassword from "../modals/UpdatePassword";

const MyProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPwdOpen, setIsPwdOpen] = useState(false);

  const { profile, loading } = useSelector((state) => state.users);
  const access = useSelector(isLoggedIn);
  const user = useSelector(selectCurrentUser);
  useEffect(() => {
    if (!access) navigate("/login");
  }, [access, navigate]);

  const handleUpdateUser = () => {
    setIsEditModalOpen(false);
    // Refresh the profile data so the UI updates with new Bio/Name/etc.
    dispatch(getProfile());
  };

  useEffect(() => {
    if (!profile) dispatch(getProfile());
  }, [dispatch, profile]);

  const { userDetail, isOwner } = profile || {};
  const profileImage = userDetail?.profilePic
    ? `${import.meta.env.VITE_API_IMG_URL}/${userDetail.profilePic}`
    : "/default-avatar.png";

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBFE]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    /* h-full min-h-screen ensures the background covers everything */
    <main className="min-h-screen w-full bg-[#FBFBFE] pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* --- HERO HEADER --- */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center md:items-center justify-between gap-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <img
                src={ "src/assets/image.png"}
                alt="Profile"
                className="w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] object-cover shadow-xl border-4 border-white"
              />

              <div className="absolute -bottom-2 -right-2 bg-purple-900 text-white p-3 rounded-2xl shadow-lg border-4 border-white">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="text-center md:text-left">
              <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">
                Official Member
              </span>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mt-1">
                {userDetail?.firstName} {userDetail?.lastName}
              </h1>
              <p className="text-slate-400 font-medium text-lg mt-1">
                @{userDetail?.username || user?.username}
              </p>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-8 py-4 bg-fuchsia-700 text-white rounded-2xl font-bold hover:bg-fuchsia-900 transition-all flex items-center gap-2"
            >
              <Edit3 size={18} /> Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* --- LEFT COLUMN: COMBINED ABOUT & DETAILS (Spans 8 columns) --- */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-indigo-50/30 p-8 rounded-[3rem] border border-indigo-100/20 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Personnel Details
                  </h3>
                  <div className="space-y-5">
                    <DetailRow label="Email" value={userDetail?.email} />
                    <DetailRow label="Country" value={userDetail?.country} />
                    <DetailRow label="Gender" value={userDetail?.gender} />
                    <DetailRow
                      label="Date of Birth"
                      value={
                        userDetail?.dob
                          ? new Date(profile.userDetail.dob).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Hidden"
                      }
                    />
                  </div>
                </div>
                {/* About Sub-section */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-indigo-100"></span> About Me
                  </h3>
                  <p className="text-2xl font-bold text-slate-800 leading-relaxed">
                    {userDetail?.bio || "No biography provided yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: STATS & SECURITY (Spans 4 columns) --- */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Stats Group */}
            <div className="grid grid-cols-1 gap-4">
              <StatCard
                icon={<Users className="text-blue-500" />}
                count={userDetail?.followersCount}
                label="Followers"
              />
              <StatCard
                icon={<ArrowUpRight className="text-emerald-500" />}
                count={userDetail?.followingCount}
                label="Following"
              />
              <StatCard
                icon={<Calendar className="text-amber-500" />}
                count={new Date(userDetail?.createdAt).getFullYear()}
                label="Joined"
              />
            </div>

            {/* Security Actions Group */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-2">
                Account Safety
              </h3>

              <button
                onClick={() => setIsPwdOpen(true)}
                className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-fuchsia-900 hover:text-white rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Lock size={16} /> Change Password
                </div>
                <ChevronRight
                  size={16}
                  className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <Edit
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateUser}
        />
      )}
      {isPwdOpen && (
        <UpdatePassword
          isOpen={isPwdOpen}
          onClose={() => setIsPwdOpen(false)}
        />
      )}
    </main>
  );
};

// Reusable Helpers
const StatCard = ({ icon, count, label }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
    <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
    <div>
      <div className="text-3xl font-black text-slate-900">{count || 0}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
      {label}
    </p>
    <p className="font-bold text-slate-800 break-all">{value || "—"}</p>
  </div>
);

export default MyProfile;
