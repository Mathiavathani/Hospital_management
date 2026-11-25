import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  IndianRupee,
  Receipt,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
  getInitials,
  getTodayDateString,
} from '../services/storageService';
import { AppointmentStatusText, AvailabilityStatusText } from '../components/ui/StatusText';
import { EmptyState } from '../components/ui/EmptyState';

export function DashboardPage() {
  const {
    doctors,
    patients,
    appointments,
    medicalRecords,
    settings,
    setActivePage,
    navigateWithIntent,
    toggleDoctorAvailability,
  } = useHospital();

  const [hoveredStatus, setHoveredStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled' | null>(
    null
  );

  const today = getTodayDateString();

  const stats = useMemo(() => {
    const availableDoctors = doctors.filter((d) => d.availability === 'Available').length;
    const todayAppointments = appointments.filter((a) => a.date === today);
    const scheduledCount = appointments.filter((a) => a.status === 'Scheduled').length;
    const completedCount = appointments.filter((a) => a.status === 'Completed').length;
    const cancelledCount = appointments.filter((a) => a.status === 'Cancelled').length;
    const todayRevenue = todayAppointments
      .filter((a) => a.status !== 'Cancelled')
      .reduce((sum, a) => sum + a.consultationFee, 0);

    return {
      totalDoctors: doctors.length,
      availableDoctors,
      unavailableDoctors: doctors.length - availableDoctors,
      totalPatients: patients.length,
      totalAppointments: appointments.length,
      todayAppointmentsCount: todayAppointments.length,
      todayRevenue,
      scheduledCount,
      completedCount,
      cancelledCount,
    };
  }, [appointments, doctors, patients, today]);

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const keyA = `${a.date} ${a.time}`;
        const keyB = `${b.date} ${b.time}`;
        return keyB.localeCompare(keyA);
      })
      .slice(0, 5);
  }, [appointments]);

  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .slice(0, 5);
  }, [patients]);

  // SVG Donut chart geometry
  const chartSegments = useMemo(() => {
    const total = stats.totalAppointments;
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const items: {
      status: 'Scheduled' | 'Completed' | 'Cancelled';
      count: number;
      color: string;
      percent: number;
    }[] = [
      {
        status: 'Scheduled',
        count: stats.scheduledCount,
        color: '#2563EB',
        percent: total ? Math.round((stats.scheduledCount / total) * 100) : 0,
      },
      {
        status: 'Completed',
        count: stats.completedCount,
        color: '#16A34A',
        percent: total ? Math.round((stats.completedCount / total) * 100) : 0,
      },
      {
        status: 'Cancelled',
        count: stats.cancelledCount,
        color: '#E11D48',
        percent: total ? Math.round((stats.cancelledCount / total) * 100) : 0,
      },
    ];

    let accumulatedOffset = 0;
    return {
      radius,
      circumference,
      total,
      segments: items.map((item) => {
        const fraction = total > 0 ? item.count / total : 0;
        const dashLength = fraction * circumference;
        const dashOffset = -accumulatedOffset;
        accumulatedOffset += dashLength;
        return { ...item, dashLength, dashOffset };
      }),
    };
  }, [stats.cancelledCount, stats.completedCount, stats.scheduledCount, stats.totalAppointments]);

  const activeHoverItem = chartSegments.segments.find((s) => s.status === hoveredStatus);

  return (
    <div className="space-y-6">
      {/* Page Greeting & Quick Action Buttons */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
            {settings.hospitalName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Clinical overview for <span className="font-mono text-slate-700 tabular-nums">{formatReadableDate(today)}</span> · {medicalRecords.length} medical records archived
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              navigateWithIntent('appointments', { action: 'open-book-appointment' })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="h-4 w-4" />
            Book Appointment
          </button>
          <button
            type="button"
            onClick={() => navigateWithIntent('patients', { action: 'open-add-patient' })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F2544] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4 text-[#2563EB]" />
            Register Patient
          </button>
          <button
            type="button"
            onClick={() => navigateWithIntent('doctors', { action: 'open-add-doctor' })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F2544] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Stethoscope className="h-4 w-4 text-[#0284C7]" />
            Add Doctor
          </button>
          <button
            type="button"
            onClick={() => setActivePage('consultation-fees')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[#0F2544] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Receipt className="h-4 w-4 text-slate-600" />
            Generate Bill
          </button>
        </div>
      </div>

      {/* 4 Main Statistic Cards */}
      <section aria-label="Hospital key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setActivePage('doctors')}
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-[#2563EB]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Doctors</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1E4478]">
              <Stethoscope className="h-[18px] w-[18px]" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-[#0F2544] tabular-nums">
            {stats.totalDoctors}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {stats.availableDoctors} available · {stats.unavailableDoctors} unavailable
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('patients')}
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-[#2563EB]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Patients</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#0284C7]">
              <Users className="h-[18px] w-[18px]" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-[#0F2544] tabular-nums">
            {stats.totalPatients}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {medicalRecords.length} clinical records stored
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('appointments')}
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-[#2563EB]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Appointments</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <CalendarClock className="h-[18px] w-[18px]" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-[#0F2544] tabular-nums">
            {stats.totalAppointments}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {stats.scheduledCount} scheduled · {stats.completedCount} completed
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActivePage('appointments')}
          className="group rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-[#2563EB]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Today&apos;s Appointments</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2544] text-white">
              <IndianRupee className="h-[18px] w-[18px]" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-[#0F2544] tabular-nums">
            {stats.todayAppointmentsCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            {formatINR(stats.todayRevenue)} consultation fees today
          </p>
        </button>
      </section>

      {/* Main Content Row: Recent Appointments + Appointment Status Chart */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-stretch">
        {/* Recent Appointments Table */}
        <section className="xl:col-span-8 flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2544]">
                Recent Appointments
              </h2>
              <p className="text-xs text-slate-500">
                Latest scheduled and completed consultations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('appointments')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CalendarClock}
                title="No appointments scheduled"
                description="Book your first outpatient consultation to populate the hospital schedule."
                actionLabel="Book Appointment"
                onAction={() =>
                  navigateWithIntent('appointments', { action: 'open-book-appointment' })
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="py-3 pl-6 pr-3 whitespace-nowrap">ID</th>
                    <th className="py-3 px-3 whitespace-nowrap">Patient</th>
                    <th className="py-3 px-3 whitespace-nowrap">Doctor</th>
                    <th className="py-3 px-3 whitespace-nowrap">Date &amp; Time</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Fee</th>
                    <th className="py-3 pl-3 pr-6 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentAppointments.map((apt) => (
                    <tr
                      key={apt.appointmentId}
                      onClick={() =>
                        navigateWithIntent('appointments', {
                          action: 'view-appointment',
                          payload: { id: apt.appointmentId },
                        })
                      }
                      className="cursor-pointer hover:bg-[#EFF6FF]/45 transition-colors"
                    >
                      <td className="py-3.5 pl-6 pr-3 font-mono text-xs font-medium text-[#0F2544] tabular-nums whitespace-nowrap">
                        {apt.appointmentId}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-[#0F2544] whitespace-nowrap">
                          {apt.patientName}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {apt.patientId}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-slate-800 whitespace-nowrap">
                          {apt.doctorName}
                        </p>
                        <p className="text-xs text-slate-500 whitespace-nowrap">
                          {apt.doctorSpecialization}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <p className="font-mono text-xs text-slate-700 tabular-nums">
                          {formatReadableDate(apt.date)}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {formatTime12h(apt.time)}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                        {formatINR(apt.consultationFee)}
                      </td>
                      <td className="py-3.5 pl-3 pr-6 whitespace-nowrap">
                        <AppointmentStatusText status={apt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Appointment Status Chart */}
        <section className="xl:col-span-4 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="font-display text-base font-bold text-[#0F2544]">
              Appointment Status
            </h2>
            <p className="text-xs text-slate-500">
              Live distribution across all booked consultations
            </p>
          </div>

          <div className="my-5 flex items-center justify-center">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 144 144" className="h-full w-full -rotate-90" role="img" aria-label="Appointment status distribution chart">
                <circle
                  cx="72"
                  cy="72"
                  r={chartSegments.radius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="16"
                />
                {chartSegments.total > 0 &&
                  chartSegments.segments.map((seg) =>
                    seg.count > 0 ? (
                      <circle
                        key={seg.status}
                        cx="72"
                        cy="72"
                        r={chartSegments.radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={hoveredStatus === seg.status ? '19' : '16'}
                        strokeDasharray={`${seg.dashLength} ${chartSegments.circumference}`}
                        strokeDashoffset={seg.dashOffset}
                        strokeLinecap="butt"
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredStatus(seg.status)}
                        onMouseLeave={() => setHoveredStatus(null)}
                      />
                    ) : null
                  )}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-2xl font-bold text-[#0F2544] tabular-nums">
                  {activeHoverItem ? activeHoverItem.count : stats.totalAppointments}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {activeHoverItem ? activeHoverItem.status : 'Total'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 pt-4">
            {chartSegments.segments.map((seg) => (
              <div
                key={seg.status}
                onMouseEnter={() => setHoveredStatus(seg.status)}
                onMouseLeave={() => setHoveredStatus(null)}
                className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: seg.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-700">{seg.status}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                  <span className="font-semibold text-[#0F2544]">{seg.count}</span>
                  <span className="w-9 text-right text-slate-400">{seg.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Row: Doctor Availability & Recently Registered Patients */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Doctor Availability Section */}
        <section className="lg:col-span-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2544]">
                Doctor Availability
              </h2>
              <p className="text-xs text-slate-500">
                Toggle availability directly to control booking eligibility
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('doctors')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap"
            >
              Manage Roster
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {doctors.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Stethoscope}
                title="No doctors registered"
                description="Add doctors to manage clinical availability and consultation fees."
                actionLabel="Add Doctor"
                onAction={() => navigateWithIntent('doctors', { action: 'open-add-doctor' })}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {doctors.slice(0, 6).map((doc) => (
                <div
                  key={doc.doctorId}
                  className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigateWithIntent('doctors', {
                        action: 'view-doctor',
                        payload: { id: doc.doctorId },
                      })
                    }
                    className="flex items-center gap-3 min-w-0 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] font-display text-xs font-bold text-[#0F2544]">
                      {getInitials(doc.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F2544] truncate hover:text-[#2563EB] transition-colors">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {doc.specialization} · <span className="font-mono tabular-nums">{formatINR(doc.consultationFee)}</span>
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3 shrink-0">
                    <AvailabilityStatusText status={doc.availability} />
                    <button
                      type="button"
                      onClick={() => toggleDoctorAvailability(doc.doctorId)}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      {doc.availability === 'Available' ? 'Set Away' : 'Set Active'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently Registered Patients */}
        <section className="lg:col-span-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2544]">
                Recently Registered Patients
              </h2>
              <p className="text-xs text-slate-500">
                Newest patient records added to MediCare
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('patients')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] whitespace-nowrap"
            >
              All Patients
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No patients registered"
                description="Register a patient to book appointments and store clinical records."
                actionLabel="Register Patient"
                onAction={() => navigateWithIntent('patients', { action: 'open-add-patient' })}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPatients.map((pat) => (
                <div
                  key={pat.patientId}
                  className="flex items-center justify-between gap-3 px-6 py-3.5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-display text-xs font-bold text-[#0F2544]">
                      {getInitials(pat.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F2544] truncate">{pat.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        <span className="font-mono tabular-nums">{pat.patientId}</span> · {pat.age}y {pat.gender} · Blood {pat.bloodGroup}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline font-mono text-xs text-slate-400 tabular-nums">
                      {formatReadableDate(pat.registeredAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigateWithIntent('patients', {
                          action: 'view-patient',
                          payload: { id: pat.patientId },
                        })
                      }
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F2544] hover:bg-[#EFF6FF] hover:border-[#2563EB]/30 transition-colors whitespace-nowrap"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
