import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminProfile } from "../../redux/thunks/adminThunks";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(email = "", username = "") {
  if (username && username.length >= 2)
    return username.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({ email, username }) {
  return (
    <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center">
      <span className="font-display text-2xl text-primary">
        {getInitials(email, username)}
      </span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface-low rounded-2xl px-4 py-3">
      <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">
        {label}
      </span>
      <span className="text-sm text-on-surface break-all">{value || "—"}</span>
    </div>
  );
}

function ProviderBadge({ provider }) {
  return (
    <span className="status-badge bg-primary-fixed text-primary border border-primary-fixed-dim text-xs capitalize">
      {provider}
    </span>
  );
}

function VerifiedBadge({ verified }) {
  return verified ? (
    <span className="status-badge status-verified">Verified</span>
  ) : (
    <span className="status-badge status-pending">Unverified</span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 flex flex-col gap-8 animate-pulse">
      <div className="h-8 w-40 bg-surface-high rounded-2xl" />
      <div className="bg-white border border-black/5 rounded-4xl p-8 shadow-lavender flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-surface-high" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-48 bg-surface-high rounded-xl" />
            <div className="h-4 w-32 bg-surface-high rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-16 bg-surface-high rounded-2xl" />
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const dispatch = useDispatch();
  const {
    adminProfile: profile,
    adminProfileLoading: loading,
    adminProfileError: error,
  } = useSelector((s) => s.admin);
  useEffect(() => {
    dispatch(getAdminProfile());
  }, [dispatch]);

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-surface p-6 md:p-10 flex items-center justify-center">
        <div className="bg-white border border-black/5 rounded-4xl p-10 shadow-lavender text-center max-w-sm w-full">
          <p className="text-on-surface-variant text-sm mb-2">
            Failed to load profile
          </p>
          <p className="text-xs text-on-surface-variant">{error}</p>
          <button
            onClick={() => dispatch(getAdminProfile())}
            className="btn-editorial mt-6 rounded-full py-3 text-sm px-6 w-auto"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 flex flex-col gap-8">
      {/* Page header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">
          Admin
        </p>
        <h1 className="font-display text-4xl text-on-surface">My Profile</h1>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-black/5 rounded-4xl p-8 shadow-lavender flex flex-col gap-8">
        {/* Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar email={profile.email} username={profile.username} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-display text-2xl text-on-surface">
                {profile.username || profile.email.split("@")[0]}
              </h2>
              <span className="status-badge bg-surface-highest text-on-surface-variant border border-surface-highest text-xs capitalize">
                {profile.role}
              </span>
              <VerifiedBadge verified={profile.isAccountVerified} />
            </div>
            <p className="text-sm text-on-surface-variant">{profile.email}</p>
            <p className="text-xs text-on-surface-variant">
              Member since {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-highest" />

        {/* Details grid */}
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-4">
            Account Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Username" value={profile.username} />
            <InfoRow label="Role" value={profile.role} />
            <InfoRow label="Joined" value={formatDate(profile.createdAt)} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-highest" />

        {/* Auth providers */}
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3">
            Auth Providers
          </p>
          <div className="flex flex-wrap gap-2">
            {(profile.authProviders || []).map((p) => (
              <ProviderBadge key={p} provider={p} />
            ))}
          </div>
        </div>

        {/* Account status */}
        <div>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3">
            Account Status
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-surface-low rounded-2xl px-4 py-3">
              <span className="text-sm text-on-surface">Email verified</span>
              <VerifiedBadge verified={profile.isAccountVerified} />
            </div>
            <div className="flex items-center justify-between bg-surface-low rounded-2xl px-4 py-3">
              <span className="text-sm text-on-surface">Account role</span>
              <span className="status-badge bg-primary-fixed text-primary border border-primary-fixed-dim text-xs capitalize">
                {profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
