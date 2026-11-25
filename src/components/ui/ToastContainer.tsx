import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useHospital();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2.5 pointer-events-none no-print"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          ) : (
            <Info className="h-5 w-5 shrink-0 text-[#2563EB]" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-lg transition-all"
          >
            <div className="pt-0.5">{icon}</div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-[#0F2544] leading-snug">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
