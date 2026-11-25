import React from 'react';
import { CheckCircle2, Clock, XCircle, UserCheck, UserX } from 'lucide-react';
import type { AppointmentStatus, AvailabilityStatus } from '../../types/hospital';

/**
 * Unboxed semantic status indicators: convey state via crisp icon + explicit text + semantic ink,
 * strictly avoiding pill capsules and decorative pulsing dots.
 */

export function AppointmentStatusText({ status }: { status: AppointmentStatus }) {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Completed
      </span>
    );
  }

  if (status === 'Cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Scheduled
    </span>
  );
}

export function AvailabilityStatusText({ status }: { status: AvailabilityStatus }) {
  if (status === 'Available') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Available
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
      <UserX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Unavailable
    </span>
  );
}
