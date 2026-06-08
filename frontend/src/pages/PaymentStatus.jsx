import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../redux/thunks/userThunks";
import API from "../services/axios";
import generateInvoicePdf from "../services/generateInvoicePdf";

// ── Main component ────────────────────────────────────────────────────────────
export default function PaymentStatus() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(null); // add alongside other state
  const generatedRef = useRef(false); // prevent double generation in StrictMode

  const isSuccess = searchParams.has("session_id");
  const sessionId = searchParams.get("session_id");
  const user = useSelector((s) => s.user?.profile?.userDetail);

  // ── Fetch invoice + generate PDF once user is loaded ────────────────────────
  useEffect(() => {
    if (!isSuccess || !sessionId || !user || generatedRef.current) return;

    const run = async () => {
      try {
        // 1. Fetch invoice from backend
        const { data } = await API.get(`/invoices/session/${sessionId}`);
        if (!data.success) throw new Error(data.message);
        const invoice = data.data;
        setInvoiceId(invoice.invoiceId);

        // 2. Generate PDF in browser
        const doc = await generateInvoicePdf({ invoice, user });
        setPdfDoc(doc);
        setPdfReady(true);
        generatedRef.current = true; // lock ONLY after success so retries work

        // 3. Upload PDF blob to backend silently
        const pdfBlob = doc.output("blob");
        const formData = new FormData();
        formData.append("invoice", pdfBlob, `${invoice.invoiceId}.pdf`);
        formData.append("invoiceId", invoice.invoiceId);
        await API.post("/invoices/upload-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error("Invoice generation failed:", err.message);
        generatedRef.current = false; // allow retry on failure
        setPdfError(true);
      }
    };

    run();
  }, [isSuccess, sessionId, user, retryTrigger]); // retryTrigger re-runs the effect

  // ── Retry handler ────────────────────────────────────────────────────────────
  const handleRetry = () => {
    generatedRef.current = false;
    setPdfError(false);
    setPdfReady(false);
    setPdfDoc(null);
    setRetryTrigger((n) => n + 1);
  };

  // ── Auto-redirect countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (isSuccess) {
      dispatch(getProfile());
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/profile");
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess]);

  const handleDownload = () => {
    if (!pdfDoc || !invoiceId) return;
    pdfDoc.save(`${invoiceId}.pdf`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#faf9ff" }}
    >
      {/* Background blobs */}
      <div
        className="fixed -z-10 rounded-full opacity-25 blur-[120px]"
        style={{
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, #d8bafa, #6a5188)",
          top: "-100px",
          right: "-100px",
          animation: "float 15s ease-in-out infinite",
        }}
      />
      <div
        className="fixed -z-10 rounded-full opacity-15 blur-[100px]"
        style={{
          width: "320px",
          height: "320px",
          background: "radial-gradient(circle, #d8bafa, #8e74ae)",
          bottom: "-80px",
          left: "-80px",
          animation: "float 18s ease-in-out infinite reverse",
        }}
      />

      <div
        className="flex flex-col items-center text-center"
        style={{
          animation: "reveal 0.7s cubic-bezier(0.23,1,0.32,1) forwards",
        }}
      >
        {/* Icon */}
        <div
          className="mb-8 flex items-center justify-center rounded-full"
          style={{
            width: "88px",
            height: "88px",
            background: isSuccess ? "#f3ebff" : "#f6f2ff",
            border: `2px solid rgba(106,81,136,${isSuccess ? "0.15" : "0.1"})`,
          }}
        >
          {isSuccess ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              style={{
                animation: "reveal 0.5s 0.3s cubic-bezier(0.23,1,0.32,1) both",
              }}
            >
              <path
                d="M8 20L16 28L32 12"
                stroke="#6a5188"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path
                d="M11 11L25 25M25 11L11 25"
                stroke="#8e74ae"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
          style={{
            background: isSuccess ? "#f3ebff" : "#f6f2ff",
            color: isSuccess ? "#6a5188" : "#8e74ae",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: isSuccess ? "#6a5188" : "#8e74ae" }}
          />
          {isSuccess ? "Payment confirmed" : "Payment cancelled"}
        </div>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl font-bold mb-4"
          style={{
            color: "#261e35",
            fontFamily: "'Times New Roman', serif",
            lineHeight: 1.15,
          }}
        >
          {isSuccess ? "You're all set." : "No worries."}
        </h1>

        <p
          className="text-base mb-10 max-w-sm leading-relaxed"
          style={{ color: "#6b637a" }}
        >
          {isSuccess
            ? "Your Pro plan is now active. Enjoy full access to all features."
            : "Your payment was cancelled and you haven't been charged. You can upgrade anytime from your settings."}
        </p>

        {/* Card */}
        <div
          className="w-full max-w-sm rounded-4xl p-6 mb-8"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(106,81,136,0.1)",
            boxShadow: "0 4px 24px rgba(106,81,136,0.06)",
          }}
        >
          {isSuccess ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-sm font-bold"
                  style={{ color: "#261e35" }}
                >
                  Plan activated
                </span>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: "#e8f5e9", color: "#2e7d32" }}
                >
                  Active
                </span>
              </div>

              {/* Feature list */}
              <div
                className="flex flex-col gap-2 pt-4"
                style={{ borderTop: "1px solid rgba(106,81,136,0.08)" }}
              >
                {[
                  "AI Chat & Summaries",
                  "Writing Assistant",
                  "Auto Tag Generation",
                  "Analytics Access",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0"
                      style={{ background: "#f3ebff" }}
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path
                          d="M1.5 4.5L3.5 6.5L7.5 2.5"
                          stroke="#6a5188"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-sm" style={{ color: "#261e35" }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Upgrade nudge ── */}
              <div
                className="mt-4 flex items-center justify-between px-4 py-3 rounded-2xl"
                style={{
                  background: "#f3ebff",
                  border: "1px solid rgba(106,81,136,0.12)",
                }}
              >
                <div className="flex flex-col items-start">
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#6a5188" }}
                  >
                    Save 20% with annual billing
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: "#8e74ae" }}>
                    Switch to yearly anytime
                  </span>
                </div>
                <button
                  onClick={() => navigate("/onboarding/plan")}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80 shrink-0 ml-3"
                  style={{ background: "#6a5188", color: "#fff" }}
                >
                  Upgrade →
                </button>
              </div>

              {/* ── Invoice download strip ── */}
              <div
                className="mt-5 pt-4"
                style={{ borderTop: "1px solid rgba(106,81,136,0.08)" }}
              >
                {pdfReady ? (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all hover:opacity-80"
                    style={{
                      background: "#f3ebff",
                      border: "1px solid rgba(106,81,136,0.15)",
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "#6a5188" }}
                      >
                        {invoiceId}
                      </span>
                      <span className="text-xs" style={{ color: "#8e74ae" }}>
                        Download invoice PDF
                      </span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 2v8M5 7l3 3 3-3M3 13h10"
                        stroke="#6a5188"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : pdfError ? (
                  // ── Retry state ──
                  <div className="flex flex-col items-center gap-2 py-1">
                    <p
                      className="text-xs text-center"
                      style={{ color: "#8e74ae" }}
                    >
                      Invoice generation failed.
                    </p>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                      style={{
                        background: "#f3ebff",
                        color: "#6a5188",
                        border: "1px solid rgba(106,81,136,0.2)",
                      }}
                    >
                      {/* Retry icon */}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M1 6a5 5 0 1 0 1.5-3.5M1 2v3h3"
                          stroke="#6a5188"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Generate invoice
                    </button>
                  </div>
                ) : (
                  // ── Loading state ──
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span
                      className="w-3 h-3 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: "#d8bafa",
                        borderTopColor: "#6a5188",
                      }}
                    />
                    <span className="text-xs" style={{ color: "#8e74ae" }}>
                      Generating invoice…
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p
                className="text-sm font-bold mb-3"
                style={{ color: "#261e35" }}
              >
                Still on Free plan
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#6b637a" }}
              >
                You still have access to AI Chat and AI Summaries with free tier
                limits. Upgrade whenever you're ready.
              </p>
            </>
          )}
        </div>

        {/* CTAs */}
        <div
          className="flex flex-col gap-3 w-full"
          style={{ maxWidth: "320px" }}
        >
          <button
            onClick={() => navigate("/profile")}
            className="btn-editorial"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {isSuccess ? "Go to dashboard →" : "Continue with Free →"}
          </button>

          {!isSuccess && (
            <button
              onClick={() => navigate("/onboarding/plan")}
              className="w-full py-3 px-6 rounded-full font-bold text-base transition-all"
              style={{
                color: "#6a5188",
                background: "transparent",
                border: "1.5px solid rgba(106,81,136,0.2)",
              }}
            >
              Try again
            </button>
          )}
        </div>

        {isSuccess && (
          <p className="text-xs mt-4" style={{ color: "#6b637a" }}>
            Redirecting automatically in {countdown}s
          </p>
        )}
      </div>
    </div>
  );
}
