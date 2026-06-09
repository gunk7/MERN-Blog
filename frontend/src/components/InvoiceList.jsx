import { useEffect, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import API from "../services/axios";
import InvoiceCard from "./InvoiceCard";

export default function InvoiceList({}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get("/api/invoices/my");
        if (data.success) setInvoices(data.data);
        else setError(data.message);
      } catch (err) {
        setError("Could not load invoices.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
            Billing
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mt-1">
            Invoices
          </h2>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl">
          <Receipt size={20} className="text-fuchsia-700" />
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-sm font-bold text-slate-400 py-12">
          {error}
        </p>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="p-5 bg-slate-50 rounded-3xl">
            <Receipt size={28} className="text-slate-300" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            No invoices yet
          </p>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="flex flex-col gap-3">
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice._id} invoice={invoice} />
          ))}
        </div>
      )}
    </div>
  );
}
