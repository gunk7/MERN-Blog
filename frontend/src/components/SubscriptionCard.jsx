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
} from "lucide-react";
import API from "../services/axios";
import generateInvoicePdf from "../services/generateInvoicePdf";
import { useSelector } from "react-redux";

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
  maxInputChars: "Max Input Characters",
  summaryHits: "Summary Requests",
  tagHits: "Tag Generations",
  writingAssistHits: "Writing Assist Requests",
};
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

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 disabled:opacity-50 ${
        checked ? "bg-fuchsia-700" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

// ── Invoice row — three states: has pdfUrl / has invoice but no pdf / no invoice ──
function InvoiceRow({ transactionId, user }) {
  const [invoice, setInvoice] = useState(null); // null = not fetched yet, false = not found
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      setFetching(false);
      return;
    }

    const fetch = async () => {
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

    fetch();
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

  // Still loading invoice from API
  if (fetching) {
    return (
      <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl">
        <Loader2 size={14} className="animate-spin text-slate-400" />
        <span className="text-xs font-bold text-slate-400">
          Loading invoice…
        </span>
      </div>
    );
  }

  // No invoice record found at all
  if (!invoice) {
    return (
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
        <FileText size={14} className="text-slate-300 shrink-0" />
        <p className="text-xs font-bold text-slate-400">
          Invoice not available yet.
        </p>
      </div>
    );
  }

  const formattedDate = new Date(
    invoice.paidAt || invoice.createdAt,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
      {/* Invoice meta */}
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

      {/* PDF action */}
      {invoice.pdfUrl ? (
        // ── Stored PDF exists — download directly ──
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
        // ── No stored PDF — generate on demand ──
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

// ── main component ────────────────────────────────────────────────────────────
export default function SubscriptionCard({ onGoToPlans }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [togglingRenew, setTogglingRenew] = useState(false);
  const [upgradePlans, setUpgradePlans] = useState([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState(null);
  const [refundEligible, setRefundEligible] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const user = useSelector((s) => s.user?.profile?.userDetail);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/subscription/my");
      if (data.success) {
        setSub(data.data);

        // Check refund eligibility — fetch latest transaction
        const txRes = await API.get("/transaction/my");
        console.log(txRes.data);
        if (txRes.data.success) {
          const latestPaid = txRes.data.data.find((tx) => tx.status === "paid");
          if (latestPaid?.paidAt) {
            const hoursSince =
              (Date.now() - new Date(latestPaid.paidAt)) / (1000 * 60 * 60);
            setRefundEligible(hoursSince <= 24);
          }
        }
      } else {
        setSub(null);
      }
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpgradePlans = async () => {
    try {
      const { data } = await API.get("/plans/all");
      if (data.success) {
        setUpgradePlans(
          data.data.filter((p) => p.price > 0 && p.status !== "coming_soon"),
        );
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err.message);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    const finalReason = refundReason === "Other" ? customReason : refundReason;
    try {
      const { data } = await API.post("/subscription/refund", {
        reason: finalReason,
      });
      if (data.success) {
        setSub((prev) => ({ ...prev, status: "cancelled", autoRenew: false }));
        setConfirmRefund(false);
        setRefundEligible(false);
        setRefundReason("");
        setCustomReason("");
      }
    } catch (err) {
      console.error("Refund failed:", err.message);
    } finally {
      setRefunding(false);
    }
  };

  const handleToggleUpgrade = async () => {
    if (!showUpgrade && upgradePlans.length === 0) await fetchUpgradePlans();
    setShowUpgrade((p) => !p);
  };

  const handleUpgrade = async (planId) => {
    setUpgrading(planId);
    try {
      const { data } = await API.post("/subscription/checkout", { planId });
      if (data.success) window.location.href = data.data.checkoutUrl;
    } catch (err) {
      console.error("Upgrade failed:", err.message);
    } finally {
      setUpgrading(null);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (togglingRenew) return;
    setTogglingRenew(true);
    try {
      const { data } = await API.patch("/subscription/toggle-auto-renew");
      if (data.success)
        setSub((prev) => ({ ...prev, autoRenew: data.data.autoRenew }));
    } catch (err) {
      console.error("Toggle failed:", err.message);
    } finally {
      setTogglingRenew(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data } = await API.patch("/subscription/cancel");
      if (data.success) {
        setSub((prev) => ({
          ...prev,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          autoRenew: false,
        }));
        setConfirmCancel(false);
      }
    } catch (err) {
      console.error("Cancel failed:", err.message);
    } finally {
      setCancelling(false);
    }
  };

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

  // ── loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex items-center justify-center min-h-40 mt-8">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  // ── no subscription ───────────────────────────────────────────────────────────
  if (!sub) {
    return (
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
    );
  }

  const isFree = sub.planSnapshot?.price === 0;
  const isActive = sub.status === "active";
  const isCancelled = sub.status === "cancelled";

  // transactionId — may be populated object or raw string ID
  const transactionId = sub.transactionId?._id ?? sub.transactionId ?? null;

  // ── has subscription ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm mt-8">
      {/* Section header */}
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
        {/* Left — plan info */}
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
                  {sub.planSnapshot?.interval === "monthly" ? "month" : "year"}
                </p>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2 pt-2 border-t border-indigo-100/40">
            {activeFeatures.map(([key]) => (
              <div key={key} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-fuchsia-700 shrink-0" />
                <span className="text-sm font-bold text-slate-700">
                  {featureLabel[key] ?? key}
                </span>
              </div>
            ))}
          </div>

          {/* Limits */}
          {sub.planSnapshot?.limits && (
            <div className="space-y-2 pt-2 border-t border-indigo-100/40">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                Usage Limits
              </p>
              {Object.entries(sub.planSnapshot.limits).map(([key, value]) => (
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

          {/* Invoice */}

          {/* ── Invoice row — only for paid plans ── */}
          {!isFree && transactionId && (
            <div className="pt-2 border-t border-indigo-100/40">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-3">
                Invoice
              </p>
              <InvoiceRow transactionId={transactionId} user={user} />
            </div>
          )}
        </div>

        {/* Right — dates + controls */}
        <div className="space-y-4">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-5 rounded-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Started
              </p>
              <p className="font-black text-slate-800 text-sm">
                {new Date(sub.startDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div
              className={`p-5 rounded-2xl ${daysRemaining <= 7 ? "bg-red-50" : "bg-slate-50"}`}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                {isCancelled ? "Access Until" : "Renews On"}
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
          </div>

          {/* Auto-renew toggle */}
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

          {/* Upgrade button */}
          {(isFree || isCancelled) && (
            <button
              onClick={handleToggleUpgrade}
              className="w-full flex items-center justify-between p-5 bg-fuchsia-700 hover:bg-fuchsia-900 text-white rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3 font-bold text-sm">
                <Zap size={16} /> Upgrade Plan
              </div>
              <ChevronRight
                size={16}
                className="opacity-70 group-hover:translate-x-1 transition-all"
              />
            </button>
          )}

          {/* Upgrade plan list */}
          {showUpgrade && upgradePlans.length > 0 && (
            <UpgradePlans
              plans={upgradePlans}
              upgrading={upgrading}
              onSelect={handleUpgrade}
            />
          )}

          {/* Cancel button */}
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
                      You'll keep access until {endDateFormatted}. This cannot
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
          {/* Refund button — only within 24hrs of payment */}
          {isActive && !isFree && refundEligible && (
            <>
              {!confirmRefund ? (
                <button
                  onClick={() => setConfirmRefund(true)}
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
              ) : (
                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-orange-500 mt-0.5 shrink-0"
                    />
                    <p className="text-sm font-bold text-orange-700">
                      Your subscription will be cancelled immediately and your
                      payment refunded. This cannot be undone.
                    </p>
                  </div>
                  {/* Reason input */}
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
                    {/* Show textarea only when "Other" is selected */}
                    {refundReason === "Other" && (
                      <textarea
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Please describe your reason…"
                        rows={2}
                        className="w-full text-xs font-bold text-slate-700 placeholder:text-slate-300 bg-white border border-orange-100 rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-orange-300 transition-all mt-1"
                      />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleRefund}
                      disabled={
                        refunding ||
                        !refundReason ||
                        (refundReason === "Other" && !customReason.trim())
                      }
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {refunding ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />{" "}
                          Processing…
                        </>
                      ) : (
                        "Yes, refund me"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmRefund(false);
                        setRefundReason("");
                        setCustomReason("");
                      }}
                      className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-50 transition-all"
                    >
                      Keep plan
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Cancelled notice */}
          {isCancelled && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-700">
                Cancelled on{" "}
                {new Date(sub.cancelledAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                . Access continues until {endDateFormatted}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── upgrade plan picker ───────────────────────────────────────────────────────
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
