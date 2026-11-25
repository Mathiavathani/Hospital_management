import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  IndianRupee,
  Info,
  Printer,
  Receipt,
  X,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
} from '../services/storageService';
import type { DoctorCategory } from '../types/hospital';
import { PrintableBillSheet } from '../components/billing/PrintableBillSheet';
import { EmptyState } from '../components/ui/EmptyState';
import { AppointmentStatusText } from '../components/ui/StatusText';

export function ConsultationFeesPage() {
  const {
    consultationFees,
    doctors,
    appointments,
    settings,
    updateConsultationFee,
    printBillForAppointment,
    navigateWithIntent,
    pendingIntent,
    clearPendingIntent,
  } = useHospital();

  const [editingCategory, setEditingCategory] = useState<DoctorCategory | null>(null);
  const [feeDraft, setFeeDraft] = useState<string>('');
  const [feeError, setFeeError] = useState<string>('');

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
      ),
    [appointments]
  );

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    () =>
      sortedAppointments.find((a) => a.status !== 'Cancelled')?.appointmentId ||
      sortedAppointments[0]?.appointmentId ||
      ''
  );

  // Keep selected appointment valid if appointments change (e.g. Reset Demo Data)
  useEffect(() => {
    if (sortedAppointments.length === 0) {
      setSelectedAppointmentId('');
      return;
    }
    if (!sortedAppointments.some((a) => a.appointmentId === selectedAppointmentId)) {
      setSelectedAppointmentId(sortedAppointments[0].appointmentId);
    }
  }, [selectedAppointmentId, sortedAppointments]);

  // Consume deep-link bill selection intent from Appointments page
  useEffect(() => {
    if (!pendingIntent) return;
    if (pendingIntent.action === 'select-bill' && pendingIntent.payload?.id) {
      setSelectedAppointmentId(pendingIntent.payload.id);
      clearPendingIntent();
    }
  }, [clearPendingIntent, pendingIntent]);

  const selectedAppointment = useMemo(
    () => sortedAppointments.find((a) => a.appointmentId === selectedAppointmentId) || null,
    [selectedAppointmentId, sortedAppointments]
  );

  const totalBilledRevenue = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== 'Cancelled')
        .reduce((sum, a) => sum + a.consultationFee, 0),
    [appointments]
  );

  const startEditingFee = (category: DoctorCategory, currentFee: number) => {
    setEditingCategory(category);
    setFeeDraft(String(currentFee));
    setFeeError('');
  };

  const saveFeeEdit = (category: DoctorCategory) => {
    const parsed = Number(feeDraft);
    const result = updateConsultationFee(category, parsed);
    if (!result.success) {
      setFeeError(result.error || 'Enter a valid positive amount.');
      return;
    }
    setEditingCategory(null);
    setFeeError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
            Consultation Fees &amp; Billing
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
            Category-based fee schedule · {formatINR(totalBilledRevenue)} active consultation revenue across {appointments.filter((a) => a.status !== 'Cancelled').length} non-cancelled bookings
          </p>
        </div>

        {selectedAppointment && (
          <button
            type="button"
            onClick={() => printBillForAppointment(selectedAppointment)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="h-4 w-4" />
            Print Selected Bill
          </button>
        )}
      </div>

      {/* Fee Immutability Policy Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-[#EFF6FF] px-4 py-3.5 text-xs sm:text-sm text-[#0F2544]">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#2563EB]" aria-hidden="true" />
        <p className="leading-relaxed">
          <span className="font-semibold">Billing Policy:</span> Updating a category fee
          immediately applies to all newly booked appointments for doctors in that category.
          Previously booked appointments and bills retain their originally recorded fee.
        </p>
      </div>

      {/* Category Consultation Fee Schedule Table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F2544]">
              Doctor Category Fee Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Polymorphic fee mapping across the five doctor categories
            </p>
          </div>
          <IndianRupee className="h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3.5 pl-6 pr-3 whitespace-nowrap">Doctor Category</th>
                <th className="py-3.5 px-3 whitespace-nowrap">Specializations Covered</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">Active Doctors</th>
                <th className="py-3.5 px-3 text-right whitespace-nowrap">Consultation Fee</th>
                <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {consultationFees.map((config) => {
                const categoryDoctors = doctors.filter((d) => d.category === config.category);
                const liveSpecializations = Array.from(
                  new Set([
                    ...categoryDoctors.map((d) => d.specialization),
                    ...config.defaultSpecializations,
                  ])
                );
                const isEditing = editingCategory === config.category;

                return (
                  <tr key={config.category} className="hover:bg-[#EFF6FF]/35 transition-colors">
                    <td className="py-4 pl-6 pr-3">
                      <p className="font-semibold text-[#0F2544] whitespace-nowrap">
                        {config.category}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        Java subclass: {config.javaSubclass}
                      </p>
                    </td>
                    <td className="py-4 px-3 max-w-md">
                      <p className="text-xs leading-relaxed text-slate-600">
                        {liveSpecializations.join(' · ')}
                      </p>
                    </td>
                    <td className="py-4 px-3 text-right font-mono text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                      {categoryDoctors.length}
                    </td>
                    <td className="py-4 px-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="inline-flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm text-slate-500">₹</span>
                            <input
                              type="number"
                              min={50}
                              step={50}
                              value={feeDraft}
                              onChange={(e) => {
                                setFeeDraft(e.target.value);
                                setFeeError('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveFeeEdit(config.category);
                                if (e.key === 'Escape') setEditingCategory(null);
                              }}
                              aria-label={`Edit consultation fee for ${config.category}`}
                              className="h-8 w-24 rounded-md border border-[#2563EB] px-2 text-right font-mono text-sm font-semibold text-[#0F2544] tabular-nums focus:outline-none"
                              autoFocus
                            />
                          </div>
                          {feeError && (
                            <p className="mt-1 text-[11px] font-medium text-rose-600">{feeError}</p>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-base font-bold text-[#0F2544] tabular-nums">
                          {formatINR(config.fee)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 pl-3 pr-6 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveFeeEdit(config.category)}
                            className="inline-flex items-center gap-1 rounded-md bg-[#0F2544] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#16335B]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(null);
                              setFeeError('');
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100"
                            aria-label="Cancel fee edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingFee(config.category, config.fee)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#0F2544] hover:bg-slate-50 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[#2563EB]" />
                          Edit Fee
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Consultation Bill Generator & Printable Receipt */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Left: Selectable Bill Directory */}
        <div className="xl:col-span-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-display text-base font-bold text-[#0F2544]">
              Appointment Bills ({sortedAppointments.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select any appointment to preview and print its consultation bill
            </p>
          </div>

          {sortedAppointments.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Receipt}
                title="No bills available"
                description="Book an appointment first to generate a printable consultation bill."
                actionLabel="Book Appointment"
                onAction={() =>
                  navigateWithIntent('appointments', { action: 'open-book-appointment' })
                }
              />
            </div>
          ) : (
            <div className="max-h-[540px] divide-y divide-slate-100 overflow-y-auto">
              {sortedAppointments.map((apt) => {
                const isSelected = apt.appointmentId === selectedAppointment?.appointmentId;
                return (
                  <button
                    key={apt.appointmentId}
                    type="button"
                    onClick={() => setSelectedAppointmentId(apt.appointmentId)}
                    className={`flex w-full items-start justify-between gap-3 px-5 py-3.5 text-left transition-colors ${
                      isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#2563EB] tabular-nums">
                          {apt.billId}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {apt.appointmentId}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#0F2544] truncate">
                        {apt.patientName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {apt.doctorName} · {apt.doctorSpecialization}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-400 tabular-nums">
                        {formatReadableDate(apt.date)} at {formatTime12h(apt.time)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-mono text-sm font-bold text-[#0F2544] tabular-nums">
                        {formatINR(apt.consultationFee)}
                      </p>
                      <AppointmentStatusText status={apt.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Live Printable Consultation Bill Preview */}
        <div className="xl:col-span-7 space-y-3">
          {selectedAppointment ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500">
                  Live Bill Preview · {selectedAppointment.billId}
                </p>
                <button
                  type="button"
                  onClick={() => printBillForAppointment(selectedAppointment)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F2544] hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  <Printer className="h-3.5 w-3.5 text-[#2563EB]" />
                  Print Demo Bill
                </button>
              </div>
              <PrintableBillSheet appointment={selectedAppointment} settings={settings} />
            </>
          ) : (
            <EmptyState
              icon={Receipt}
              title="Select an appointment to generate a bill"
              description="Once an appointment is selected from the list, its formatted consultation receipt will appear here."
            />
          )}
        </div>
      </section>
    </div>
  );
}
