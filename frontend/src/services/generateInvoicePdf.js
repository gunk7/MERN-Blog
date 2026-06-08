import jsPDF from "jspdf";
import API from "../services/axios";

export default async function generateInvoicePdf({ invoice, user }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const purple = [106, 81, 136];
  const dark = [38, 30, 53];
  const muted = [107, 99, 122];
  const light = [243, 235, 255];

  const formatAmount = (amount, currency) => {
    const formatted = Number(amount).toLocaleString("en-IN");
    return currency === "INR" ? `Rs. ${formatted}` : `$${formatted}`;
  };

  const intervalLabel = (() => {
    const interval = invoice.planInterval || invoice.planId?.interval;
    if (interval === "yearly" || interval === "annual") return "Annual";
    if (interval === "monthly") return "Monthly";
    return "";
  })();

  const descriptionLine = intervalLabel
    ? `${invoice.planName} Plan (${intervalLabel})`
    : `${invoice.planName} Plan`;

  const billingPeriod = invoice.paidAt
    ? (() => {
        const start = new Date(invoice.paidAt);
        const end = new Date(invoice.paidAt);
        const interval = invoice.planInterval || invoice.planId?.interval;
        if (interval === "yearly") end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);
        return `${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} – ${end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
      })()
    : null;

  // ── Header bar ──────────────────────────────────────────────────
  doc.setFillColor(...purple);
  doc.rect(0, 0, W, 72, "F");
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("Wavelog.", 40, 46);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(220, 200, 255);
  doc.text("INVOICE", W - 40, 38, { align: "right" });
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(invoice.invoiceId, W - 40, 54, { align: "right" });

  // ── From block ──────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("FROM", 40, 106);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text("Wavelog.", 40, 122);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Punjab, India", 40, 136);
  doc.text("support@wavelog.in", 40, 150);

  // ── To block ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("BILLED TO", W / 2, 106);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(`${user.firstName} ${user.lastName}`, W / 2, 122);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(user.email, W / 2, 136);
  doc.text(`ID: ${user._id}`, W / 2, 150);

  // ── Divider ─────────────────────────────────────────────────────
  doc.setDrawColor(220, 210, 235);
  doc.setLineWidth(0.5);
  doc.line(40, 172, W - 40, 172);

  // ── Meta row ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("DATE ISSUED", 40, 190);
  doc.text("DATE PAID", 200, 190);
  doc.text("STATUS", W - 160, 190);

  const issuedDate = new Date(invoice.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const paidDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text(issuedDate, 40, 206);
  doc.text(paidDate, 200, 206);

  doc.setFillColor(232, 245, 233);
  doc.roundedRect(W - 160, 194, 52, 18, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(46, 125, 50);
  doc.text("PAID", W - 134, 206, { align: "center" });

  doc.line(40, 224, W - 40, 224);

  // ── Table header ────────────────────────────────────────────────
  doc.setFillColor(...light);
  doc.rect(40, 234, W - 80, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...purple);
  doc.text("DESCRIPTION", 56, 252);
  doc.text("QTY", W / 2 - 60, 252, { align: "center" });
  doc.text("UNIT PRICE", W / 2 + 40, 252, { align: "center" });
  doc.text("AMOUNT", W - 56, 252, { align: "right" });

  // ── Line item ───────────────────────────────────────────────────
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(descriptionLine, 56, 284);

  if (billingPeriod) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(billingPeriod, 56, 296);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text("1", W / 2 - 60, 284, { align: "center" });
  doc.text(formatAmount(invoice.amount, invoice.currency), W / 2 + 40, 284, {
    align: "center",
  });

  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(formatAmount(invoice.amount, invoice.currency), W - 56, 284, {
    align: "right",
  });

  // ── Divider ─────────────────────────────────────────────────────
  doc.setDrawColor(220, 210, 235);
  doc.line(40, 310, W - 40, 310);

  // ── Subtotal / Total rows ────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Subtotal", W - 220, 328);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text(formatAmount(invoice.amount, invoice.currency), W - 56, 328, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Total", W - 220, 344);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text(formatAmount(invoice.amount, invoice.currency), W - 56, 344, {
    align: "right",
  });

  // ── Total paid block ─────────────────────────────────────────────
  doc.setFillColor(...purple);
  doc.rect(W - 220, 360, 180, 44, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(220, 200, 255);
  doc.text("TOTAL PAID", W - 130, 377, { align: "center" });
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(formatAmount(invoice.amount, invoice.currency), W - 130, 396, {
    align: "center",
  });

  // ── Stripe ref ──────────────────────────────────────────────────
  if (invoice.stripeInvoiceId) {
    doc.setFont("times", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(`Stripe ref: ${invoice.stripeInvoiceId}`, 40, 377);
  }

  // ── Footer ──────────────────────────────────────────────────────
  doc.setFillColor(...light);
  doc.rect(0, H - 56, W, 56, "F");
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text("Thank you for subscribing to Wavelog.", W / 2, H - 34, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("support@wavelog.in  ·  Punjab, India", W / 2, H - 20, {
    align: "center",
  });

  // ── Upload to server ────────────────────────────────────────────
  try {
    const pdfBlob = doc.output("blob");
    const formData = new FormData();
    formData.append("invoice", pdfBlob, `${invoice.invoiceId}.pdf`);
    formData.append("invoiceId", invoice.invoiceId);

    await API.post("/invoices/upload-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (err) {
    console.error("PDF upload failed:", err.response?.data || err.message);
  }

  return doc;
}
