// MyProfile.jsx
import React, { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  User,
  CreditCard,
  FileText,
  Zap,
} from "lucide-react";
import { getProfile } from "../redux/thunks/userThunks";
import Edit from "../modals/Edit";
import {
  isLoggedIn,
  selectCurrentUser,
} from "../redux/selectors/authSelectors";
import UpdatePassword from "../modals/UpdatePassword";
import InvoiceList from "../components/InvoiceList";
import SubscriptionCard from "../components/SubscriptionCard";

// ── tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: FileText },
];

const MyProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPwdOpen, setIsPwdOpen] = useState(false);

  const { profile, loading } = useSelector((state) => state.users);
  const access = useSelector(isLoggedIn);
  const user = useSelector(selectCurrentUser);

  useEffect(() => {
    if (!access) navigate("/login");
  }, [access, navigate]);
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  const handleUpdateUser = () => {
    setIsEditModalOpen(false);
    dispatch(getProfile());
  };

  const { userDetail, isOwner } = profile || {};

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBFE]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#FBFBFE] pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* ── HERO HEADER — always visible ────────────────────────────────── */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <img
                src={
                  userDetail?.profilePic
                    ? userDetail.profilePic
                    : "/src/assets/image.png"
                }
                alt="Profile"
                className="w-32 h-32 md:w-48 md:h-48 rounded-[3.5rem] object-cover shadow-xl border-4 border-white"
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

        {/* ── TAB LAYOUT ──────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Sidebar tabs — vertical on desktop, horizontal on mobile ── */}
          <aside className="w-full lg:w-64 shrink-0">
            {/* Mobile: horizontal scrollable pills */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all shrink-0 ${
                    activeTab === id
                      ? "bg-fuchsia-700 text-white shadow-sm"
                      : "bg-white text-slate-500 border border-slate-100 hover:border-indigo-200 hover:text-slate-800"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop: vertical card */}
            <div className="hidden lg:flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-3 gap-1 sticky top-32">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-sm transition-all text-left ${
                    activeTab === id
                      ? "bg-fuchsia-700 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                  {activeTab === id && (
                    <ChevronRight size={14} className="ml-auto opacity-70" />
                  )}
                </button>
              ))}
            </div>
          </aside>
          {/* ── Tab content ─────────────────────────────────────────────── */}
          <TabContent
            activeTab={activeTab}
            userDetail={userDetail}
            navigate={navigate}
          />
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
// ── animated tab content ──────────────────────────────────────────────────────
function TabContent({ activeTab, userDetail, navigate, authUser }) {
  const [displayTab, setDisplayTab] = useState(activeTab);
  const [animState, setAnimState] = useState("in"); // "in" | "out"
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (activeTab === prevTab.current) return;

    // 1. slide current content out
    setAnimState("out");

    const timer = setTimeout(() => {
      // 2. swap content while invisible
      setDisplayTab(activeTab);
      prevTab.current = activeTab;
      // 3. slide new content in
      setAnimState("in");
    }, 180); // matches the CSS transition duration

    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <div
      className="flex-1 min-w-0 transition-all duration-[180ms] ease-in-out"
      style={{
        opacity: animState === "out" ? 0 : 1,
        transform: animState === "out" ? "translateY(10px)" : "translateY(0px)",
      }}
    >
      {displayTab === "profile" && <ProfileTab userDetail={userDetail} />}
      {displayTab === "subscription" && (
        <SubscriptionCard onGoToPlans={() => navigate("/onboarding/plan")} />
      )}
      {displayTab === "invoices" &&
        (userDetail ? (
          <InvoiceList /> // ← merge _id
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        ))}
    </div>
  );
}

// ── profile tab extracted into its own component ──────────────────────────────
// ── profile tab extracted into its own component ──────────────────────────────
function ProfileTab({ userDetail }) {
  const [isPwdOpen, setIsPwdOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* ── Personal details + bio ─────────────────────────────────────── */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
              Personal
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
              Profile Details
            </h2>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <User size={20} className="text-fuchsia-700" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT — detail rows */}
          <div className="bg-indigo-50/30 p-8 rounded-[3rem] border border-indigo-100/20 space-y-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
              Personnel Details
            </p>
            <div className="space-y-5">
              <DetailRow label="Email" value={userDetail?.email} />
              <DetailRow label="Country" value={userDetail?.country} />
              <DetailRow label="Gender" value={userDetail?.gender} />
              {/* <DetailRow
                label="Date of Birth"
                value={
                  userDetail?.dob
                    ? new Date(userDetail.dob).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "Hidden"
                }
              /> */}
            </div>
          </div>

          {/* RIGHT — bio + stats */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                About Me
              </p>
              <p className="text-xl font-bold text-slate-800 leading-relaxed">
                {userDetail?.bio || "No biography provided yet."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                Activity
              </p>
              <div className="grid grid-cols-3 gap-3">
                <StatPill
                  icon={<Users size={14} className="text-blue-500" />}
                  count={userDetail?.followersCount ?? 0}
                  label="Followers"
                />
                <StatPill
                  icon={<ArrowUpRight size={14} className="text-emerald-500" />}
                  count={userDetail?.followingCount ?? 0}
                  label="Following"
                />
                <StatPill
                  icon={<Calendar size={14} className="text-amber-500" />}
                  count={
                    userDetail?.createdAt
                      ? new Date(userDetail.createdAt).toLocaleDateString(
                          "en-GB",
                          { month: "short", year: "numeric" },
                        )
                      : "—"
                  }
                  label="Joined"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Account settings ───────────────────────────────────────────── */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
              Security
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
              Account Settings
            </h2>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <Lock size={20} className="text-slate-400" />
          </div>
        </div>

        <button
          onClick={() => setIsPwdOpen(true)}
          className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-fuchsia-900 hover:text-white rounded-2xl transition-all group"
        >
          <div className="flex items-center gap-3 font-bold text-sm text-slate-700 group-hover:text-white">
            <Lock size={16} /> Change Password
          </div>
          <ChevronRight
            size={16}
            className="text-slate-400 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all group-hover:text-white"
          />
        </button>
      </div>

      {isPwdOpen && (
        <UpdatePassword
          isOpen={isPwdOpen}
          onClose={() => setIsPwdOpen(false)}
        />
      )}
    </div>
  );
}

// ── compact pill stat (used inside ProfileTab) ────────────────────────────────
const StatPill = ({ icon, count, label }) => (
  <div className="flex flex-col items-center gap-2 p-4 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/20">
    <div className="p-2 bg-white rounded-xl border border-slate-100">
      {icon}
    </div>
    <div className="text-center">
      <div className="text-lg font-black text-slate-900 tracking-tighter">
        {count}
      </div>
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
        {label}
      </div>
    </div>
  </div>
);

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
