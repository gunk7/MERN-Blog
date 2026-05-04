import React, { useState } from "react";
import { Calendar, X, Clock } from "lucide-react";

const ScheduleModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedDate) return;
    onConfirm(selectedDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="card-auth relative z-10 animate-reveal w-full max-w-md border border-primary/10">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-on-surface-variant/40 hover:text-on-surface transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-6">
          <header className="space-y-1">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Clock size={14} /> Post Scheduling
            </label>
            <h2 className="text-2xl font-display text-on-surface">
              Set Publication Date
            </h2>
            <p className="text-xs text-on-surface-variant">
              Choose exactly when you want this post to go live.
            </p>
          </header>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant ml-1 uppercase">
                Date and Time
              </label>
              <input
                type="datetime-local"
                className="input-editorial"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 p-4 rounded-full font-bold text-sm text-on-surface-variant hover:bg-surface-low transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedDate}
                className="btn-editorial flex-2"
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
