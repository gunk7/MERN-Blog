import { useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import generateInvoicePdf from "../services/generateInvoicePdf";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../redux/selectors/authSelectors";

// ── InvoiceCard ───────────────────────────────────────────────────────────────
export default function InvoiceCard({ invoice }) {
  const rawUser = useSelector(selectCurrentUser);
  const user = rawUser?.userDetail ?? rawUser;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    if (!user) {
      console.error("User not loaded yet");
      return;
    }

    setDownloadError(false);
    try {
      // Always generate client-side on demand — no stored PDF needed
      const doc = await generateInvoicePdf({ invoice, user });
      doc.save(`${invoice.invoiceId}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err.message);
      setDownloadError(true);
      // Auto-clear error after 4s
      setTimeout(() => setDownloadError(false), 4000);
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = new Date(invoice.paidAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const amount = `${invoice.currency === "INR" ? "₹" : "$"}${invoice.amount.toLocaleString("en-IN")}`;

  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl transition-all group">
      {/* Left — icon + details */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <FileText size={18} className="text-fuchsia-700" />
        </div>
        <div>
          <p className="font-black text-slate-800 text-sm tracking-tight">
            {invoice.invoiceId}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            {invoice.planName} Plan · {formattedDate}
          </p>
          {/* Inline error — only shown briefly after a failed attempt */}
          {downloadError && (
            <p className="flex items-center gap-1 text-[10px] font-bold text-red-500 mt-1">
              <AlertCircle size={10} />
              Failed to generate PDF. Try again.
            </p>
          )}
        </div>
      </div>

      {/* Right — amount + actions */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-black text-slate-900">{amount}</span>

        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          {invoice.status}
        </span>

        {/* Stripe invoice link */}
        {invoice.stripeInvoicePdfUrl && (
          <a
            href={invoice.stripeInvoicePdfUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 transition-all"
            title="View Stripe invoice"
          >
            <ExternalLink
              size={14}
              className="text-slate-400 hover:text-indigo-500"
            />
          </a>
        )}

        {/* Download custom PDF */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-2 rounded-xl bg-fuchsia-700 hover:bg-fuchsia-900 transition-all disabled:opacity-60"
          title="Download invoice PDF"
        >
          {downloading ? (
            <Loader2 size={14} className="text-white animate-spin" />
          ) : (
            <Download size={14} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
