import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Zap,
  Calendar,
  RefreshCw,
  XCircle,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  FileText,
  Download,
  AlertCircle,
  Clock,
  CheckCheck,
  XOctagon,
} from "lucide-react";
import API from "../services/axios";
import generateInvoicePdf from "../services/generateInvoicePdf";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscription,
  fetchUsage,
  fetchRefundStatus,
  fetchAddonPlans,
  fetchUpgradePlans,
  cancelSubscription,
  toggleAutoRenew,
  submitRefundRequest,
  addonCheckout,
  upgradeCheckout,
} from "../redux/thunks/subscriptionThunks";

// ── helpers ───────────────────────────────────────────────────────────────────
const REFUND_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing features I need",
  "Found a better alternative",
  "Accidental purchase",
  "Technical issues",
  "Other",
];

const featureLabel = {
  aiChat: "AI Chat",
  aiSummary: "AI Summary",
  writingAssist: "Writing Assistant",
  tagsGeneration: "Auto Tag Generation",
  analyticsAccess: "Analytics Access",
};

const limitLabel = {
  monthlyTokens: "Monthly Tokens",
};

// ── Sub-components (unchanged) ────────────────────────────────────────────────

function UsageBar({ usage }) {
  if (!usage) return null;

  const pct = usage.usedPercentage ?? 0;
  const isHigh = pct >= 80;
  const isFull = pct >= 100;
  const barWidth = Math.max(pct, pct > 0 ? 2 : 0);

  return (
    <div className="space-y-3 pt-2 border-t border-indigo-100/40">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
          Token Usage
        </p>
        <p
          className={`text-[9px] font-black uppercase tracking-widest ${isFull ? "text-red-500" : isHigh ? "text-amber-500" : "text-slate-400"}`}
        >
          {pct.toFixed(1)}%
        </p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p
            className={`text-xl font-black tracking-tighter ${isFull ? "text-red-600" : isHigh ? "text-amber-600" : "text-slate-800"}`}
          >
            {usage.used.toLocaleString("en-IN")}
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-0.5">
            tokens used
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black tracking-tighter text-slate-300">
            {usage.limit.toLocaleString("en-IN")}
          </p>
          <p className="text-[9px] font-bold text-slate-400 mt-0.5">
            monthly limit
          </p>
        </div>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isFull ? "bg-red-500" : isHigh ? "bg-amber-400" : "bg-fuchsia-600"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-[9px] font-bold text-slate-400">
        {usage.remaining.toLocaleString("en-IN")} tokens remaining this month
      </p>
      {isFull && (
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-red-500">
          <AlertCircle size={10} /> You've used all your tokens for this month.
        </p>
      )}
      {isHigh && !isFull && (
        <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500">
          <AlertTriangle size={10} /> Running low on tokens.
        </p>
      )}
      {usage.addonTokensRemaining > 0 && (
        <div className="flex items-center gap-1.5 p-2 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
          <Zap size={10} className="text-fuchsia-600 shrink-0" />
          <p className="text-[10px] font-bold text-fuchsia-700">
            +{usage.addonTokensRemaining.toLocaleString("en-IN")} addon tokens
            available
          </p>
        </div>
      )}
    </div>
  );
}

function AddonSection({
  plans = [],
  purchasing,
  onSelect,
  addonTokensRemaining,
  onOpen,
}) {
  const [open, setOpen] = useState(false);
  const safePlans = Array.isArray(plans) ? plans : [];

  const handleToggle = () => {
    if (!open && plans.length === 0) onOpen();
    setOpen((p) => !p);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-indigo-100/40">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
          Addon Tokens
        </p>
        {addonTokensRemaining > 0 && (
          <span className="text-[9px] font-black text-fuchsia-700">
            {addonTokensRemaining.toLocaleString("en-IN")} remaining
          </span>
        )}
      </div>
      {addonTokensRemaining > 0 ? (
        <div className="flex items-center gap-2 p-3 bg-fuchsia-50 rounded-xl border border-fuchsia-100">
          <Zap size={12} className="text-fuchsia-600 shrink-0" />
          <p className="text-[10px] font-bold text-fuchsia-700">
            You have {addonTokensRemaining.toLocaleString("en-IN")} addon tokens
            available.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle size={12} className="text-red-500 shrink-0" />
          <p className="text-[10px] font-bold text-red-600">
            No addon tokens. Purchase a pack to continue using AI features.
          </p>
        </div>
      )}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 bg-fuchsia-700 hover:bg-fuchsia-900 text-white rounded-2xl transition-all group"
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          <Zap size={14} /> Buy Token Pack
        </div>
        <ChevronRight
          size={14}
          className={`opacity-70 transition-all duration-300 ${open ? "rotate-90" : "group-hover:translate-x-1"}`}
        />
      </button>
      {open && (
        <div className="space-y-2">
          {safePlans.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 size={16} className="animate-spin text-slate-400" />
            </div>
          ) : (
            safePlans.map((plan) => (
              <button
                key={plan._id}
                onClick={() => onSelect(plan._id)}
                disabled={!!purchasing}
                className="w-full flex items-center justify-between p-4 bg-indigo-50/60 hover:bg-indigo-100/60 rounded-2xl border border-indigo-100/40 transition-all group disabled:opacity-60"
              >
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800">
                    {plan.name}
                  </p>
                  <p className="text-[9px] font-bold text-indigo-400 mt-0.5">
                    {plan.limit.monthlyTokens.toLocaleString("en-IN")} tokens
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-700">
                    ₹{plan.price.toLocaleString("en-IN")}
                  </span>
                  {purchasing === plan._id ? (
                    <Loader2
                      size={14}
                      className="animate-spin text-indigo-400"
                    />
                  ) : (
                    <ArrowUpRight
                      size={14}
                      className="text-indigo-400 group-hover:text-fuchsia-700 transition-colors"
                    />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
      label: "Active",
    },
    cancelled: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      label: "Cancelled",
    },
    past_due: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-100",
      label: "Past Due",
    },
    expired: {
      bg: "bg-slate-50",
      text: "text-slate-500",
      border: "border-slate-100",
      label: "Expired",
    },
    trialing: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-100",
      label: "Trialing",
    },
  };
  const s = map[status] || map.expired;
  return (
    <span
      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.label}
    </span>
  );
}

function PastSubscriptions({ subs }) {
  if (!subs.length) return null;
  return (
    <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
            History
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
            Past Subscriptions
          </h2>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl">
          <Calendar size={20} className="text-slate-400" />
        </div>
      </div>
      <div className="space-y-3">
        {subs.map((s) => {
          const isFree = s.planSnapshot?.price === 0;
          const start = new Date(s.startDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          const end = new Date(s.endDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
          return (
            <div
              key={s._id}
              className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-100">
                  <ShieldCheck size={16} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700">
                    {s.planSnapshot?.name || s.planId?.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {start} → {end}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-slate-500">
                  {isFree
                    ? "Free"
                    : `₹${s.planSnapshot?.price?.toLocaleString("en-IN")}`}
                </span>
                <StatusBadge status={s.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 disabled:opacity-50 ${checked ? "bg-fuchsia-700" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

function RefundStatusBanner({ refundData }) {
  if (!refundData) return null;
  const { status, refundAmount, userMessage, requestedAt, resolvedAt } =
    refundData;
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  if (status === "pending") {
    return (
      <div className="flex items-start gap-3 p-5 bg-amber-50 rounded-2xl border border-amber-100">
        <Clock size={16} className="text-amber-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-black text-amber-700">
            Refund Request Pending
          </p>
          <p className="text-[10px] font-bold text-amber-500 mt-0.5">
            Submitted on {fmt(requestedAt)}. Our team is reviewing your request
            and will notify you by email.
          </p>
        </div>
      </div>
    );
  }
  if (status === "approved") {
    return (
      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
        <div className="flex items-start gap-3">
          <CheckCheck size={16} className="text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black text-emerald-700">
              Refund Approved
            </p>
            <p className="text-[10px] font-bold text-emerald-500 mt-0.5">
              Resolved on {fmt(resolvedAt)}
            </p>
          </div>
          {refundAmount > 0 && (
            <span className="ml-auto text-lg font-black text-emerald-700">
              ₹{refundAmount.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        {userMessage && (
          <p className="text-xs font-bold text-emerald-600 pl-7">
            {userMessage}
          </p>
        )}
        <p className="text-[10px] font-bold text-emerald-400 pl-7">
          May take 5–7 business days to reflect in your account.
        </p>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-2">
        <div className="flex items-start gap-3">
          <XOctagon size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black text-red-700">
              Refund Not Approved
            </p>
            <p className="text-[10px] font-bold text-red-400 mt-0.5">
              Resolved on {fmt(resolvedAt)}
            </p>
          </div>
        </div>
        {userMessage && (
          <p className="text-xs font-bold text-red-600 pl-7">{userMessage}</p>
        )}
      </div>
    );
  }
  return null;
}

function InvoiceRow({ transactionId, user }) {
  const [invoice, setInvoice] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      setFetching(false);
      return;
    }
    const load = async () => {
      try {
        const { data } = await API.get(
          `/invoices/transaction/${transactionId}`,
        );
        setInvoice(data.success ? data.data : false);
      } catch {
        setInvoice(false);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [transactionId]);

  const handleGenerate = async () => {
    if (generating || !invoice) return;
    setGenerating(true);
    setGenError(false);
    try {
      const doc = await generateInvoicePdf({ invoice, user });
      doc.save(`${invoice.invoiceId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err.message);
      setGenError(true);
      setTimeout(() => setGenError(false), 4000);
    } finally {
      setGenerating(false);
    }
  };

  if (fetching)
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl">
        <Loader2 size={14} className="animate-spin text-slate-400" />
        <span className="text-xs font-bold text-slate-400">
          Loading invoice…
        </span>
      </div>
    );

  if (!invoice)
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
        <FileText size={14} className="text-slate-300 shrink-0" />
        <p className="text-xs font-bold text-slate-400">
          Invoice not available yet.
        </p>
      </div>
    );

  const formattedDate = new Date(
    invoice.paidAt || invoice.createdAt,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-xl border border-slate-100">
          <FileText size={14} className="text-fuchsia-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-slate-800 truncate">
            {invoice.invoiceId}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            {formattedDate}
          </p>
        </div>
        <span className="text-sm font-black text-slate-900 shrink-0">
          {invoice.currency === "INR" ? "₹" : "$"}
          {invoice.amount?.toLocaleString("en-IN")}
        </span>
      </div>
      {invoice.pdfUrl ? (
        <a
          href={invoice.pdfUrl}
          download={`${invoice.invoiceId}.pdf`}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-fuchsia-700 hover:bg-fuchsia-900 text-white text-xs font-black rounded-xl transition-all"
        >
          <Download size={13} /> Download Invoice PDF
        </a>
      ) : (
        <>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-fuchsia-700 hover:bg-fuchsia-900 text-white text-xs font-black rounded-xl transition-all disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Generating…
              </>
            ) : (
              <>
                <FileText size={13} /> Generate Invoice PDF
              </>
            )}
          </button>
          {genError && (
            <p className="flex items-center justify-center gap-1 text-[10px] font-bold text-red-500">
              <AlertCircle size={10} /> Generation failed. Try again.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function UpgradePlans({ plans, upgrading, onSelect }) {
  return (
    <div className="space-y-2 pt-2">
      {plans.map((plan) => (
        <button
          key={plan._id}
          onClick={() => onSelect(plan._id)}
          disabled={!!upgrading}
          className="w-full flex items-center justify-between p-4 bg-indigo-50/60 hover:bg-indigo-100/60 rounded-2xl border border-indigo-100/40 transition-all group disabled:opacity-60"
        >
          <div className="text-left">
            <p className="text-sm font-black text-slate-800">{plan.name}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mt-0.5">
              ₹{plan.price.toLocaleString("en-IN")} /{" "}
              {plan.interval === "monthly" ? "month" : "year"}
            </p>
          </div>
          {upgrading === plan._id ? (
            <Loader2 size={16} className="animate-spin text-indigo-400" />
          ) : (
            <ArrowUpRight
              size={16}
              className="text-indigo-400 group-hover:text-fuchsia-700 transition-colors"
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SubscriptionCard({ onGoToPlans }) {
  const dispatch = useDispatch();
  const {
    current: sub,
    past: pastSubs,
    usage,
    refundData,
    addonPlans,
    upgradePlans,
    loading,
  } = useSelector((s) => s.subscription);

  const user = useSelector((s) => s.user?.profile?.userDetail);

  // ── UI-only local state ───────────────────────────────────────────────────
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [togglingRenew, setTogglingRenew] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState("");
  const [purchasingAddon, setPurchasingAddon] = useState(null);

  useEffect(() => {
    dispatch(fetchSubscription());
    dispatch(fetchUsage());
    //  dispatch(fetchRefundStatus());
  }, [dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await dispatch(cancelSubscription()).unwrap();
      setConfirmCancel(false);
    } catch (err) {
      console.error("Cancel failed:", err);
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (togglingRenew) return;
    setTogglingRenew(true);
    try {
      await dispatch(toggleAutoRenew()).unwrap();
    } catch (err) {
      console.error("Toggle failed:", err);
    } finally {
      setTogglingRenew(false);
    }
  };

  const handleToggleUpgrade = async () => {
    if (!showUpgrade && upgradePlans.length === 0) {
      await dispatch(fetchUpgradePlans());
    }
    setShowUpgrade((p) => !p);
  };

  const handleUpgrade = async (planId) => {
    setUpgrading(planId);
    try {
      const url = await dispatch(upgradeCheckout({ planId })).unwrap();
      window.location.href = url;
    } catch (err) {
      console.error("Upgrade failed:", err);
    } finally {
      setUpgrading(null);
    }
  };

  const handleAddonCheckout = async (planId) => {
    setPurchasingAddon(planId);
    try {
      const url = await dispatch(addonCheckout({ planId })).unwrap();
      window.location.href = url;
    } catch (err) {
      console.error("Addon checkout failed:", err);
    } finally {
      setPurchasingAddon(null);
    }
  };

  const handleSubmitRefund = async () => {
    const finalReason = refundReason === "Other" ? customReason : refundReason;
    if (!finalReason.trim()) return;

    setSubmittingRefund(true);
    setRefundError("");
    try {
      await dispatch(submitRefundRequest({ reason: finalReason })).unwrap();
      await dispatch(fetchRefundStatus());
      setShowRefundDialog(false);
      setRefundReason("");
      setCustomReason("");
    } catch (err) {
      setRefundError(err || "Failed to submit request. Please try again.");
    } finally {
      setSubmittingRefund(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const daysRemaining = sub?.endDate
    ? Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / 86400000))
    : 0;

  const endDateFormatted = sub?.endDate
    ? new Date(sub.endDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const activeFeatures = sub?.planSnapshot?.features
    ? Object.entries(sub.planSnapshot.features).filter(([, v]) => v)
    : [];

  const transactionId = sub?.transactionId?._id ?? sub?.transactionId ?? null;

  // ── Render: loading ───────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex items-center justify-center min-h-40 mt-8">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );

  // ── Render: no subscription ───────────────────────────────────────────────
  if (!sub)
    return (
      <>
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
                Subscription
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
                Current Plan
              </h2>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <ShieldCheck size={20} className="text-fuchsia-700" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
            <div className="p-5 bg-indigo-50/40 rounded-3xl">
              <Zap size={32} className="text-indigo-300" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-700 tracking-tight">
                No active subscription
              </p>
              <p className="text-sm font-bold text-slate-400 mt-1 max-w-xs">
                You're currently on the free tier. Upgrade to unlock writing
                tools, analytics, and more.
              </p>
            </div>
            <button
              onClick={onGoToPlans}
              className="mt-2 flex items-center gap-2 px-8 py-4 bg-fuchsia-700 hover:bg-fuchsia-900 text-white rounded-2xl font-bold transition-all"
            >
              <Zap size={16} /> View available plans
            </button>
          </div>
        </div>
        <PastSubscriptions subs={pastSubs} />
      </>
    );

  // ── Render: has subscription ──────────────────────────────────────────────
  const isFree = sub.planSnapshot?.price === 0;
  const isActive = sub.status === "active";
  const isCancelled = sub.status === "cancelled";
  const hasPendingRefund = refundData?.status === "pending";
  const hasResolvedRefund =
    refundData?.status === "approved" || refundData?.status === "rejected";

  // ── Cancelled state: show "get a new plan" button instead of upgrade panel ─
  if (isCancelled) {
    return (
      <>
        <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm mt-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
                Subscription
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
                Current Plan
              </h2>
            </div>
            <StatusBadge status={sub.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT — plan info */}
            <div className="bg-indigo-50/30 p-8 rounded-[3rem] border border-indigo-100/20 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                    Plan
                  </p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {sub.planSnapshot?.name || sub.planId?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                    Price
                  </p>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter">
                    {isFree
                      ? "Free"
                      : `₹${sub.planSnapshot?.price?.toLocaleString("en-IN")}`}
                  </p>
                  {!isFree && (
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                      /{" "}
                      {sub.planSnapshot?.interval === "monthly"
                        ? "month"
                        : "year"}
                    </p>
                  )}
                </div>
              </div>

              {activeFeatures.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-indigo-100/40">
                  {activeFeatures.map(([key]) => (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle2
                        size={14}
                        className="text-fuchsia-700 shrink-0"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {featureLabel[key] ?? key}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!isFree && transactionId && (
                <div className="pt-2 border-t border-indigo-100/40">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                    Invoice
                  </p>
                  <InvoiceRow transactionId={transactionId} user={user} />
                </div>
              )}
            </div>

            {/* RIGHT — controls for cancelled */}
            <div className="space-y-4">
              <div className="p-5 bg-amber-50 rounded-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Cancelled On
                </p>
                <p className="font-black text-sm text-slate-800">
                  {new Date(sub.cancelledAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Get new plan button → redirects to plans page */}
              <button
                onClick={onGoToPlans}
                className="w-full flex items-center justify-between p-5 bg-fuchsia-700 hover:bg-fuchsia-900 text-white rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Zap size={16} /> Get a new plan
                </div>
                <ChevronRight
                  size={16}
                  className="opacity-70 group-hover:translate-x-1 transition-all"
                />
              </button>

              {/* Refund section */}
              {!isFree && (
                <>
                 {/*  */}
                  {/* Button always shows until dialog is opened */}
                  {!showRefundDialog && (
                    <button
                      onClick={async () => {
                        await dispatch(fetchRefundStatus());
                        setShowRefundDialog(true);
                      }}
                      className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-orange-50 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3 font-bold text-sm text-slate-500 group-hover:text-orange-600">
                        <AlertCircle size={16} /> Request Refund
                      </div>
                      <ChevronRight
                        size={16}
                        className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-orange-400"
                      />
                    </button>
                  )}

                  {/* Dialog: show status if exists, form if not */}
                  {showRefundDialog && (
                    <>
                      {refundData ? (
                        // Already has a request for this sub — show it
                        <RefundStatusBanner refundData={refundData} />
                      ) : (
                        // No request yet — show form
                        <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 space-y-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              size={16}
                              className="text-orange-500 mt-0.5 shrink-0"
                            />
                            <p className="text-sm font-bold text-orange-700">
                              Your request will be reviewed by our team. You'll
                              be notified by email once a decision is made.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">
                              Reason for refund
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {REFUND_REASONS.map((r) => (
                                <button
                                  key={r}
                                  onClick={() =>
                                    setRefundReason(r === refundReason ? "" : r)
                                  }
                                  className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${
                                    refundReason === r
                                      ? "bg-orange-500 text-white border-orange-500"
                                      : "bg-white text-slate-500 border-slate-200 hover:border-orange-300 hover:text-orange-600"
                                  }`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                            {refundReason === "Other" && (
                              <textarea
                                value={customReason}
                                onChange={(e) =>
                                  setCustomReason(e.target.value)
                                }
                                placeholder="Please describe your reason…"
                                rows={2}
                                className="w-full text-xs font-bold text-slate-700 placeholder:text-slate-300 bg-white border border-orange-100 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-orange-300 transition-all mt-1"
                              />
                            )}
                          </div>
                          {refundError && (
                            <p className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                              <AlertCircle size={12} /> {refundError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={handleSubmitRefund}
                              disabled={
                                submittingRefund ||
                                !refundReason ||
                                (refundReason === "Other" &&
                                  !customReason.trim())
                              }
                              className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                              {submittingRefund ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />{" "}
                                  Submitting…
                                </>
                              ) : (
                                "Submit Request"
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowRefundDialog(false);
                                setRefundReason("");
                                setCustomReason("");
                                setRefundError("");
                              }}
                              className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <p className="text-xs font-bold text-amber-700">
                  Cancelled on{" "}
                  {new Date(sub.cancelledAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  . You no longer have access to paid features.
                </p>
              </div>
            </div>
          </div>
        </div>
        <PastSubscriptions subs={pastSubs} />
      </>
    );
  }

  // ── Render: active / trialing / past_due ──────────────────────────────────
  return (
    <>
      <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
              Subscription
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
              Current Plan
            </h2>
          </div>
          <StatusBadge status={sub.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="bg-indigo-50/30 p-8 rounded-[3rem] border border-indigo-100/20 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                  Plan
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  {sub.planSnapshot?.name || sub.planId?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                  Price
                </p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">
                  {isFree
                    ? "Free"
                    : `₹${sub.planSnapshot?.price?.toLocaleString("en-IN")}`}
                </p>
                {!isFree && (
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                    /{" "}
                    {sub.planSnapshot?.interval === "monthly"
                      ? "month"
                      : "year"}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-indigo-100/40">
              {activeFeatures.map(([key]) => (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle2
                    size={14}
                    className="text-fuchsia-700 shrink-0"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    {featureLabel[key] ?? key}
                  </span>
                </div>
              ))}
            </div>

            <UsageBar usage={usage} />

            {sub.planSnapshot?.limit && (
              <div className="space-y-2 pt-2 border-t border-indigo-100/40">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                  Usage Limits
                </p>
                {Object.entries(sub.planSnapshot.limit).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {limitLabel[key] ?? key}
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {value === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        value.toLocaleString("en-IN")
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!isFree && transactionId && (
              <div className="pt-2 border-t border-indigo-100/40">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                  Invoice
                </p>
                <InvoiceRow transactionId={transactionId} user={user} />
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <div
              className={`p-5 rounded-2xl ${daysRemaining <= 7 ? "bg-red-50" : "bg-slate-50"}`}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Renews On
              </p>
              <p
                className={`font-black text-sm ${daysRemaining <= 7 ? "text-red-700" : "text-slate-800"}`}
              >
                {endDateFormatted}
              </p>
              <p
                className={`text-[9px] font-bold mt-0.5 ${daysRemaining <= 7 ? "text-red-400" : "text-slate-400"}`}
              >
                {daysRemaining} days remaining
              </p>
            </div>

            {isActive && !isFree && (
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <RefreshCw size={16} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-black text-slate-800">
                      Auto-renew
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {sub.autoRenew ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={sub.autoRenew}
                  onChange={handleToggleAutoRenew}
                  disabled={togglingRenew}
                />
              </div>
            )}

            {usage &&
              isActive &&
              !isFree &&
              !showUpgrade &&
              (usage.remaining === 0 ||
                usage.usedPercentage >= 80 ||
                (usage.addonTokensRemaining ?? 0) > 0) && (
                <AddonSection
                  plans={addonPlans}
                  purchasing={purchasingAddon}
                  onSelect={handleAddonCheckout}
                  addonTokensRemaining={usage.addonTokensRemaining ?? 0}
                  onOpen={() => dispatch(fetchAddonPlans())}
                />
              )}

            {isActive && !isFree && (
              <>
                {!confirmCancel ? (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-red-50 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3 font-bold text-sm text-slate-500 group-hover:text-red-600">
                      <XCircle size={16} /> Cancel Subscription
                    </div>
                    <ChevronRight
                      size={16}
                      className="opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-red-400"
                    />
                  </button>
                ) : (
                  <div className="p-5 bg-red-50 rounded-2xl border border-red-100 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={16}
                        className="text-red-500 mt-0.5 shrink-0"
                      />
                      <p className="text-sm font-bold text-red-700">
                        Your subscription will be cancelled{" "}
                        <span className="underline">immediately</span>. You'll
                        lose access to all paid features right now. This cannot
                        be undone.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {cancelling ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Cancelling…
                          </>
                        ) : (
                          "Yes, cancel"
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-50 transition-all"
                      >
                        Keep plan
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <PastSubscriptions subs={pastSubs} />
    </>
  );
}
