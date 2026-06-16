import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../redux/thunks/userThunks";
import API from "../services/axios";
import generateInvoicePdf from "../services/generateInvoicePdf";

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
  const generatedRef = useRef(false);

  const isSuccess = searchParams.has("session_id");
  const sessionId = searchParams.get("session_id");
  const user = useSelector((s) => s.user?.profile?.userDetail);

  useEffect(() => {
    if (!isSuccess || !sessionId || !user || generatedRef.current) return;
    const run = async () => {
      try {
        const { data } = await API.get(`/invoices/session/${sessionId}`);
        if (!data.success) throw new Error(data.message);
        const invoice = data.data;
        setInvoiceId(invoice.invoiceId);
        const doc = await generateInvoicePdf({ invoice, user });
        setPdfDoc(doc);
        setPdfReady(true);
        generatedRef.current = true;
        const pdfBlob = doc.output("blob");
        const formData = new FormData();
        formData.append("invoice", pdfBlob, `${invoice.invoiceId}.pdf`);
        formData.append("invoiceId", invoice.invoiceId);
        await API.post("/invoices/upload-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (err) {
        console.error("Invoice generation failed:", err.message);
        generatedRef.current = false;
        setPdfError(true);
      }
    };
    run();
  }, [isSuccess, sessionId, user, retryTrigger]);

  const handleRetry = () => {
    generatedRef.current = false;
    setPdfError(false);
    setPdfReady(false);
    setPdfDoc(null);
    setRetryTrigger((n) => n + 1);
  };

  useEffect(() => {
    if (!isSuccess) return;
    dispatch(getProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (!isSuccess) return;
    if (!pdfReady && !pdfError) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, pdfReady, pdfError]);

  const handleDownload = () => {
    if (!pdfDoc || !invoiceId) return;
    pdfDoc.save(`${invoiceId}.pdf`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-surface">
      {/* Background blobs */}
      <div className="fixed -z-10 rounded-full opacity-25 blur-[120px] w-120 h-120 bg-linear-to-br from-primary-fixed-dim to-primary -top-24 -right-24 animate-float" />
      <div
        className="fixed -z-10 rounded-full opacity-15 blur-[100px] w-80 h-80 bg-linear-to-br from-primary-fixed-dim to-primary-container -bottom-20 -left-20"
        style={{ animation: "float 18s ease-in-out infinite reverse" }}
      />

      <div className="flex flex-col items-center text-center text-reveal">
        {/* Icon */}
        <div
          className={`mb-8 flex items-center justify-center rounded-full w-22 h-22 border-2 ${isSuccess ? "bg-primary-fixed border-primary/15" : "bg-surface-low border-primary/10"}`}
        >
          {isSuccess ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="text-reveal"
              style={{ animationDelay: "0.3s" }}
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
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5 ${isSuccess ? "bg-primary-fixed text-primary" : "bg-surface-low text-primary-container"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full inline-block ${isSuccess ? "bg-primary" : "bg-primary-container"}`}
          />
          {isSuccess ? "Payment confirmed" : "Payment cancelled"}
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-on-surface font-display leading-tight">
          {isSuccess ? "You're all set." : "No worries."}
        </h1>

        <p className="text-base mb-10 max-w-sm leading-relaxed text-on-surface-variant">
          {isSuccess
            ? "Your Pro plan is now active. Enjoy full access to all features."
            : "Your payment was cancelled and you haven't been charged. You can upgrade anytime from your settings."}
        </p>

        {/* Card */}
        <div className="w-full max-w-sm rounded-4xl p-6 mb-8 bg-surface-lowest border border-primary/10 shadow-lavender">
          {isSuccess ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-on-surface">
                  Plan activated
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                  Active
                </span>
              </div>

              {/* Feature list */}
              <div className="flex flex-col gap-2 pt-4 border-t border-primary/8">
                {[
                  "AI Chat & Summaries",
                  "Writing Assistant",
                  "Auto Tag Generation",
                  "Analytics Access",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full shrink-0 bg-primary-fixed">
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
                    <span className="text-sm text-on-surface">{f}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade nudge */}
              <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-2xl bg-primary-fixed border border-primary/12">
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-primary">
                    Save 20% with annual billing
                  </span>
                  <span className="text-xs mt-0.5 text-primary-container">
                    Switch to yearly anytime
                  </span>
                </div>
                <button
                  onClick={() => navigate("/onboarding/plan")}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80 shrink-0 ml-3 bg-primary text-white"
                >
                  Upgrade →
                </button>
              </div>

              {/* Invoice strip */}
              <div className="mt-5 pt-4 border-t border-primary/8">
                {pdfReady ? (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all hover:opacity-80 bg-primary-fixed border border-primary/15"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-primary">
                        {invoiceId}
                      </span>
                      <span className="text-xs text-primary-container">
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
                  <div className="flex flex-col items-center gap-2 py-1">
                    <p className="text-xs text-center text-primary-container">
                      Invoice generation failed.
                    </p>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 bg-primary-fixed text-primary border border-primary/20"
                    >
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
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className="w-3 h-3 rounded-full border-2 animate-spin border-primary-fixed-dim border-t-primary" />
                    <span className="text-xs text-primary-container">
                      Generating invoice…
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-bold mb-3 text-on-surface">
                Still on Free plan
              </p>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                You still have access to AI Chat and AI Summaries with free tier
                limits. Upgrade whenever you're ready.
              </p>
            </>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate("/profile")}
            className="btn-editorial font-display"
          >
            {isSuccess ? "Go to dashboard →" : "Continue with Free →"}
          </button>

          {!isSuccess && (
            <button
              onClick={() => navigate("/onboarding/plan")}
              className="w-full py-3 px-6 rounded-full font-bold text-base transition-all text-primary bg-transparent border border-primary/20"
            >
              Try again
            </button>
          )}
        </div>

        {isSuccess && (
          <p className="text-xs mt-4 text-on-surface-variant">
            {!pdfReady && !pdfError
              ? "Please wait while your invoice is being prepared…"
              : `Redirecting automatically in ${countdown}s`}
          </p>
        )}
      </div>
    </div>
  );
}
