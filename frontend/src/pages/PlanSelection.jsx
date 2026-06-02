import { useState, useEffect } from "react";
import API from "../services/axios";
import { toast } from "react-toastify";

// ─── helpers ────────────────────────────────────────────────────────────────

function featureLabel(key) {
  const map = {
    aiChat: "AI Chat",
    aiSummary: "AI Summary",
    writingAssist: "Writing Assistant",
    tagsGeneration: "Auto Tag Generation",
    analyticsAccess: "Analytics Access",
  };
  return map[key] ?? key;
}

function formatLimit(key, value) {
  const map = {
    monthlyTokens: `${(value / 1000).toFixed(0)}k tokens / month`,
    dailyAiRequests: `${value} AI requests / day`,
    maxInputChars: `${value.toLocaleString("en-IN")} chars input limit`,
    maxSummaryChars: `${value.toLocaleString("en-IN")} chars summary limit`,
  };
  return map[key] ?? `${value}`;
}

// ─── mock data matching your real schema ───────────────────────────────────

const MOCK_PLANS = [
  {
    _id: "6a06ddd49a36a69b825b8574",
    name: "Free",
    description: "Starter free plan for basic AI usage",
    price: 0,
    durationDays: 3650,
    interval: "one_time",
    status: "active",
    features: {
      aiChat: true,
      aiSummary: true,
      writingAssist: false,
      tagsGeneration: false,
      analyticsAccess: false,
    },
    limits: {
      monthlyTokens: 50000,
      dailyAiRequests: 15,
      maxInputChars: 3000,
      maxSummaryChars: 10000,
    },
    isActive: true,
    slug: "free-a69b825b8574",
  },
  // Placeholder paid plans — replace with real DB data when ready
  {
    _id: "placeholder-pro",
    name: "Pro",
    description:
      "For power users who need more AI capacity and advanced tools.",
    price: 499,
    durationDays: 30,
    interval: "monthly",
    status: "coming_soon",
    features: {
      aiChat: true,
      aiSummary: true,
      writingAssist: true,
      tagsGeneration: true,
      analyticsAccess: false,
    },
    limits: {
      monthlyTokens: 300000,
      dailyAiRequests: 100,
      maxInputChars: 15000,
      maxSummaryChars: 50000,
    },
    isActive: false,
    slug: "pro",
  },
  {
    _id: "placeholder-enterprise",
    name: "Enterprise",
    description: "Unlimited power for teams and organisations at scale.",
    price: 1499,
    durationDays: 30,
    interval: "monthly",
    status: "coming_soon",
    features: {
      aiChat: true,
      aiSummary: true,
      writingAssist: true,
      tagsGeneration: true,
      analyticsAccess: true,
    },
    limits: {
      monthlyTokens: 1000000,
      dailyAiRequests: 500,
      maxInputChars: 50000,
      maxSummaryChars: 200000,
    },
    isActive: false,
    slug: "enterprise",
  },
];

// ─── sub-components ─────────────────────────────────────────────────────────

function Tick({ active }) {
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0"
      style={{ background: active ? "#f3ebff" : "#f0eaff" }}
    >
      {active ? (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path
            d="M1.5 4.5L3.5 6.5L7.5 2.5"
            stroke="#6a5188"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path
            d="M2.5 4.5H6.5"
            stroke="#c4b5d4"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-4xl p-6 h-80 animate-pulse"
      style={{ background: "#f6f2ff", border: "1px solid rgba(0,0,0,0.05)" }}
    />
  );
}

function PlanCard({ plan, selected, onSelect }) {
  const isFree = plan.price === 0;
  const isComingSoon = plan.status === "coming_soon";
  const activeFeatures = Object.entries(plan.features).filter(([, v]) => v);
  const inactiveFeatures = Object.entries(plan.features).filter(([, v]) => !v);

  return (
    <div
      onClick={() => !isComingSoon && onSelect(plan._id)}
      className="relative flex flex-col transition-all duration-300"
      style={{
        cursor: isComingSoon ? "default" : "pointer",
        opacity: isComingSoon ? 0.6 : 1,
      }}
    >
      {/* Popular badge */}
      {plan.name === "Pro" && (
        <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
          <span
            className="text-[11px] font-bold px-4 py-1 rounded-full tracking-wide"
            style={{ background: "#6a5188", color: "#fff" }}
          >
            Coming Soon
          </span>
        </div>
      )}

      <div
        className="rounded-4xl p-6 flex flex-col h-full transition-all duration-300"
        style={{
          background: selected ? "#f3ebff" : "#ffffff",
          border: selected
            ? "2px solid #6a5188"
            : "1px solid rgba(106,81,136,0.12)",
          boxShadow: selected
            ? "0 8px 32px rgba(106,81,136,0.14)"
            : "0 4px 16px rgba(106,81,136,0.04)",
          transform: selected ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full mb-2 inline-block"
              style={{
                background: isFree ? "#e8f5e9" : "#f3ebff",
                color: isFree ? "#2e7d32" : "#6a5188",
              }}
            >
              {plan.name}
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="font-bold leading-none"
                style={{
                  fontSize: "2rem",
                  color: "#261e35",
                  fontFamily: "'Times New Roman', serif",
                }}
              >
                {isFree ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
              </span>
              {!isFree && (
                <span className="text-xs" style={{ color: "#6b637a" }}>
                  /{plan.interval === "monthly" ? "mo" : "yr"}
                </span>
              )}
            </div>
          </div>

          {/* Radio */}
          {!isComingSoon && (
            <div
              className="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                borderColor: selected ? "#6a5188" : "#d8bafa",
                background: selected ? "#6a5188" : "transparent",
              }}
            >
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          )}
          {isComingSoon && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full mt-1"
              style={{ background: "#f0eaff", color: "#8e74ae" }}
            >
              Soon
            </span>
          )}
        </div>

        <p
          className="text-sm mb-5 leading-relaxed"
          style={{ color: "#6b637a" }}
        >
          {plan.description}
        </p>

        {/* Features */}
        <div className="flex flex-col gap-2 mb-4">
          {activeFeatures.map(([key]) => (
            <div key={key} className="flex items-center gap-2">
              <Tick active={true} />
              <span className="text-sm" style={{ color: "#261e35" }}>
                {featureLabel(key)}
              </span>
            </div>
          ))}
          {inactiveFeatures.map(([key]) => (
            <div key={key} className="flex items-center gap-2">
              <Tick active={false} />
              <span className="text-sm" style={{ color: "#c4b5d4" }}>
                {featureLabel(key)}
              </span>
            </div>
          ))}
        </div>

        {/* Limits */}
        <div
          className="mt-auto pt-4 flex flex-col gap-1.5"
          style={{ borderTop: "1px solid rgba(106,81,136,0.1)" }}
        >
          {Object.entries(plan.limits).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: "#8e74ae" }}>
                •
              </span>
              <span className="text-[12px]" style={{ color: "#6b637a" }}>
                {formatLimit(key, val)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function PlanSelection({ onContinue, userName = "" }) {
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await API.get("/plans/all");
        if (data.success) {
          setPlans(data.data);
          const free = data.data.find((p) => p.price === 0);
          if (free) setSelectedId(free._id);
        } else {
          toast.error(data.message || "Failed to load plans");
        }
      } catch {
        toast.error("Could not fetch plans");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const selectedPlan = plans.find((p) => p._id === selectedId);

  const handleContinue = async () => {
    if (!selectedPlan || submitting) return;
    setSubmitting(true);
    try {
      if (selectedPlan.price === 0) {
        // Free plan
        const { data } = await API.post("/subscription/free");
        if (data.success) {
          onContinue?.(selectedPlan);
        } else {
          toast.error(data.message || "Something went wrong");
        }
      } else {
        // Paid plan — redirect to Stripe checkout
        const { data } = await API.post("/subscription/checkout", {
          planId: selectedPlan._id,
        });
        if (data.success) {
          window.location.href = data.data.checkoutUrl;
        } else {
          toast.error(data.message || "Could not create checkout session");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden"
      style={{ background: "#faf9ff" }}
    >
      {/* Background blobs */}
      <div
        className="fixed -z-10 w-105 h-105 rounded-full opacity-30 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #d8bafa, #6a5188)",
          top: "-80px",
          right: "-80px",
          animation: "float 15s ease-in-out infinite",
        }}
      />
      <div
        className="fixed -z-10 w-75 h-75 rounded-full opacity-20 blur-[80px]"
        style={{
          background: "radial-gradient(circle, #d8bafa, #8e74ae)",
          bottom: "-60px",
          left: "-60px",
          animation: "float 18s ease-in-out infinite reverse",
        }}
      />

      {/* Header */}
      <div
        className="text-center mb-10"
        style={{
          animation: "reveal 0.7s cubic-bezier(0.23,1,0.32,1) forwards",
        }}
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
          style={{ background: "#f3ebff", color: "#6a5188" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: "#6a5188" }}
          />
          Account verified
        </div>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{
            color: "#261e35",
            fontFamily: "'Times New Roman', serif",
            lineHeight: 1.2,
          }}
        >
          {userName ? `Welcome, ${userName}.` : "Choose your plan"}
        </h1>
        <p className="text-base" style={{ color: "#6b637a", maxWidth: 420 }}>
          Start for free — upgrade anytime as your needs grow. No credit card
          required.
        </p>
      </div>

      {/* Plan cards */}
      <div
        className="w-full grid gap-4 mb-8"
        style={{
          maxWidth: 860,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          animation: "reveal 0.85s cubic-bezier(0.23,1,0.32,1) forwards",
        }}
      >
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : plans.map((plan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                selected={selectedId === plan._id}
                onSelect={setSelectedId}
              />
            ))}
      </div>

      {/* CTA */}
      <div
        className="flex flex-col items-center gap-3 w-full"
        style={{
          maxWidth: 340,
          animation: "reveal 1s cubic-bezier(0.23,1,0.32,1) forwards",
        }}
      >
        <button
          onClick={handleContinue}
          disabled={!selectedPlan || submitting}
          className="btn-editorial"
          style={{ fontFamily: "'Times New Roman', serif" }}
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                style={{ display: "inline-block" }}
              />
              Setting up your account…
            </span>
          ) : selectedPlan?.price === 0 ? (
            "Continue with Free plan →"
          ) : (
            `Continue with ${selectedPlan?.name} →`
          )}
        </button>

        {selectedPlan?.price === 0 && (
          <p className="text-xs text-center" style={{ color: "#6b637a" }}>
            You can upgrade to Pro or Enterprise later from your settings.
          </p>
        )}
      </div>
    </div>
  );
}
