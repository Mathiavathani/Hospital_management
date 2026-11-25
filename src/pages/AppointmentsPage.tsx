import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FilePlus2,
  Plus,
  Receipt,
  Search,
  Table as TableIcon,
  XCircle,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import type { AppointmentInput } from '../context/HospitalContext';
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
  getFeeForCategory,
  getTodayDateString,
  validateAppointmentData,
} from '../services/storageService';
import {
  TIME_SLOTS,
  type Appointment,
  type AppointmentStatus,
} from '../types/hospital';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { AppointmentStatusText, AvailabilityStatusText } from '../components/ui/StatusText';

interface AppointmentFormState {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AppointmentsPage() {
  const {
    appointments,
    doctors,
    patients,
    consultationFees,
    bookAppointment,
    updateAppointment,
    cancelAppointment,
    updateAppointmentStatus,
    navigateWithIntent,
    pendingIntent,
    clearPendingIntent,
  } = useHospital();

  const today = getTodayDateString();

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [doctorFilter, setDoctorFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(today);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);

  const [form, setForm] = useState<AppointmentFormState>({
    patientId: '',
    doctorId: '',
    date: today,
    time: '10:00',
    reason: '',
    status: 'Scheduled',
  });
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (!pendingIntent) return;
    if (pendingIntent.action === 'open-book-appointment') {
      openBookModal({
        patientId: pendingIntent.payload?.patientId,
        doctorId: pendingIntent.payload?.doctorId,
        date: pendingIntent.payload?.date,
      });
      clearPendingIntent();
    } else if (pendingIntent.action === 'view-appointment' && pendingIntent.payload?.id) {
      const target = appointments.find((a) => a.appointmentId === pendingIntent.payload?.id);
      if (target) setViewingAppointment(target);
      clearPendingIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent]);

  const liveViewingAppointment = useMemo(() => {
    if (!viewingAppointment) return null;
    return appointments.find((a) => a.appointmentId === viewingAppointment.appointmentId) || null;
  }, [appointments, viewingAppointment]);

  const selectedDoctorObj = useMemo(
    () => doctors.find((d) => d.doctorId === form.doctorId),
    [doctors, form.doctorId]
  );

  // Compute slots already booked for the chosen doctor + date (for instant inline feedback)
  const occupiedSlotsForDoctorDate = useMemo(() => {
    if (!form.doctorId || !form.date) return new Set<string>();
    return new Set(
      appointments
        .filter(
          (a) =>
            a.appointmentId !== editingAppointment?.appointmentId &&
            a.status !== 'Cancelled' &&
            a.doctorId === form.doctorId &&
            a.date === form.date
        )
        .map((a) => a.time)
    );
  }, [appointments, editingAppointment?.appointmentId, form.date, form.doctorId]);

  const previewFee = useMemo(() => {
    if (
      editingAppointment &&
      selectedDoctorObj &&
      editingAppointment.doctorId === selectedDoctorObj.doctorId
    ) {
      return editingAppointment.consultationFee;
    }
    if (!selectedDoctorObj) return null;
    return (
      selectedDoctorObj.consultationFee ||
      getFeeForCategory(selectedDoctorObj.category, consultationFees)
    );
  }, [consultationFees, editingAppointment, selectedDoctorObj]);

  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return appointments
      .filter((apt) => {
        const matchesQuery =
          !q ||
          apt.appointmentId.toLowerCase().includes(q) ||
          apt.patientName.toLowerCase().includes(q) ||
          apt.doctorName.toLowerCase().includes(q) ||
          apt.doctorSpecialization.toLowerCase().includes(q) ||
          apt.reason.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
        const matchesDoctor = doctorFilter === 'ALL' || apt.doctorId === doctorFilter;
        const matchesDate = !dateFilter || apt.date === dateFilter;
        return matchesQuery && matchesStatus && matchesDoctor && matchesDate;
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, dateFilter, doctorFilter, searchQuery, statusFilter]);

  const openBookModal = (prefill?: { patientId?: string; doctorId?: string; date?: string }) => {
    setEditingAppointment(null);
    const defaultAvailableDoctor =
      doctors.find((d) => d.doctorId === prefill?.doctorId)?.doctorId ||
      doctors.find((d) => d.availability === 'Available')?.doctorId ||
      doctors[0]?.doctorId ||
      '';
    const defaultPatient = prefill?.patientId || patients[0]?.patientId || '';
    const targetDate = prefill?.date && prefill.date >= today ? prefill.date : today;

    setForm({
      patientId: defaultPatient,
      doctorId: defaultAvailableDoctor,
      date: targetDate,
      time: '10:30',
      reason: '',
      status: 'Scheduled',
    });
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setForm({
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      date: apt.date,
      time: apt.time,
      reason: apt.reason,
      status: apt.status,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const patient = patients.find((p) => p.patientId === form.patientId);
    const doctor = doctors.find((d) => d.doctorId === form.doctorId);

    const validation = validateAppointmentData({
      patient,
      doctor,
      date: form.date,
      time: form.time,
      reason: form.reason,
      existingAppointments: appointments,
      editingAppointment: editingAppointment || undefined,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Please verify all appointment fields.');
      return;
    }

    const input: AppointmentInput = {
      patientId: form.patientId,
      doctorId: form.doctorId,
      date: form.date,
      time: form.time,
      reason: form.reason,
      status: form.status,
    };

    const result = editingAppointment
      ? updateAppointment(editingAppointment.appointmentId, input)
      : bookAppointment(input);

    if (result.success) {
      setFormOpen(false);
    } else if (result.error) {
      setFormError(result.error);
    }
  };

  // Monthly calendar matrix calculation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { isoDate: string | null; dayNum: number | null }[] = [];
    for (let i = 0; i < firstDayWeekday; i += 1) {
      cells.push({ isoDate: null, dayNum: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ isoDate: iso, dayNum: day });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ isoDate: null, dayNum: null });
    }
    return cells;
  }, [calendarMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    filteredAppointments.forEach((apt) => {
      const existing = map.get(apt.date) || [];
      existing.push(apt);
      map.set(apt.date, existing);
    });
    return map;
  }, [filteredAppointments]);

  const selectedDayAppointments = useMemo(() => {
    return (appointmentsByDate.get(selectedCalendarDate) || []).sort((a, b) =>
      a.time.localeCompare(b.time)
    );
  }, [appointmentsByDate, selectedCalendarDate]);

  const monthHeading = calendarMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
            Appointment Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
            {appointments.filter((a) => a.status === 'Scheduled').length} scheduled ·{' '}
            {appointments.filter((a) => a.status === 'Completed').length} completed ·{' '}
            {appointments.filter((a) => a.status === 'Cancelled').length} cancelled
          </p>
        </div>

        <button
          type="button"
          onClick={() => openBookModal()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Book Appointment
        </button>
      </div>

      {/* Filters & View Mode Toolbar */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status segmented control */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
            {(['ALL', 'Scheduled', 'Completed', 'Cancelled'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-[#0F2544] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F2544]'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>

          {/* View Mode switch: Table vs Calendar */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'table'
                  ? 'bg-white text-[#0F2544] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F2544]'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-white text-[#0F2544] shadow-sm'
                  : 'text-slate-600 hover:text-[#0F2544]'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar View
            </button>
          </div>
        </div>

        {/* Search + Doctor + Date Filters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 pt-1">
          <div className="relative lg:col-span-5">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, patient, doctor, or reason..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            aria-label="Filter by doctor"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none lg:col-span-4"
          >
            <option value="ALL">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.doctorId} value={doc.doctorId}>
                {doc.name} ({doc.specialization})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 lg:col-span-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by appointment date"
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 font-mono text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="rounded-lg border border-slate-200 px-2.5 h-10 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        filteredAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={
              appointments.length === 0
                ? 'No appointments booked yet'
                : 'No appointments match your current filters'
            }
            description={
              appointments.length === 0
                ? 'Schedule your first consultation between a registered patient and an available physician.'
                : 'Try clearing the date, doctor, status, or search filter.'
            }
            actionLabel={appointments.length === 0 ? 'Book First Appointment' : 'Reset Filters'}
            onAction={() => {
              if (appointments.length === 0) {
                openBookModal();
              } else {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDoctorFilter('ALL');
                setDateFilter('');
              }
            }}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                    <th className="py-3.5 pl-6 pr-3 whitespace-nowrap">Appointment ID</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Patient</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Doctor</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Schedule</th>
                    <th className="py-3.5 px-3 text-right whitespace-nowrap">Fee</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.appointmentId} className="hover:bg-[#EFF6FF]/40 transition-colors">
                      <td className="py-3.5 pl-6 pr-3 font-mono text-xs font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                        {apt.appointmentId}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-[#0F2544] whitespace-nowrap">
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
                      <td className="py-3.5 px-3 text-right font-mono text-sm font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                        {formatINR(apt.consultationFee)}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <AppointmentStatusText status={apt.status} />
                      </td>
                      <td className="py-3.5 pl-3 pr-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingAppointment(apt)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0F2544]"
                            aria-label={`View appointment ${apt.appointmentId}`}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(apt)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#2563EB]"
                            aria-label={`Edit appointment ${apt.appointmentId}`}
                            title="Edit Appointment"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigateWithIntent('consultation-fees', {
                                action: 'select-bill',
                                payload: { id: apt.appointmentId },
                              })
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                            aria-label={`Generate bill for ${apt.appointmentId}`}
                            title="Consultation Bill"
                          >
                            <Receipt className="h-4 w-4" />
                          </button>
                          {apt.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => setCancellingAppointment(apt)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                              aria-label={`Cancel appointment ${apt.appointmentId}`}
                              title="Cancel Appointment"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Interactive Calendar-Style View */
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-[#0F2544]">{monthHeading}</h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedCalendarDate(today);
                  }}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                    )
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center text-xs font-semibold text-slate-500">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2.5">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarDays.map((cell, idx) => {
                if (!cell.isoDate || !cell.dayNum) {
                  return <div key={`empty-${idx}`} className="min-h-[86px] bg-slate-50/40" />;
                }

                const dayAppointments = appointmentsByDate.get(cell.isoDate) || [];
                const isToday = cell.isoDate === today;
                const isSelected = cell.isoDate === selectedCalendarDate;

                return (
                  <button
                    key={cell.isoDate}
                    type="button"
                    onClick={() => setSelectedCalendarDate(cell.isoDate!)}
                    className={`min-h-[86px] p-2 text-left align-top transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF]'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-semibold tabular-nums ${
                          isToday
                            ? 'bg-[#0F2544] text-white'
                            : isSelected
                              ? 'text-[#2563EB]'
                              : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                      {dayAppointments.length > 0 && (
                        <span className="font-mono text-[11px] font-semibold text-[#2563EB] tabular-nums">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <p
                          key={apt.appointmentId}
                          className={`truncate text-[11px] font-medium ${
                            apt.status === 'Cancelled'
                              ? 'text-rose-600 line-through'
                              : apt.status === 'Completed'
                                ? 'text-emerald-700'
                                : 'text-[#0F2544]'
                          }`}
                        >
                          <span className="font-mono tabular-nums">{apt.time}</span> {apt.patientName}
                        </p>
                      ))}
                      {dayAppointments.length > 2 && (
                        <p className="text-[10px] font-medium text-slate-400">
                          +{dayAppointments.length - 2} more
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Schedule Panel */}
          <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-white flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#0F2544]">
                  {formatReadableDate(selectedCalendarDate)}
                </h3>
                <p className="text-xs text-slate-500 tabular-nums">
                  {selectedDayAppointments.length} appointment(s) scheduled
                </p>
              </div>
              {selectedCalendarDate >= today && (
                <button
                  type="button"
                  onClick={() => openBookModal({ date: selectedCalendarDate })}
                  className="inline-flex items-center gap-1 rounded-md bg-[#0F2544] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Book Day
                </button>
              )}
            </div>

            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto p-5">
              {selectedDayAppointments.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No appointments scheduled for this date.
                </p>
              ) : (
                selectedDayAppointments.map((apt) => (
                  <div key={apt.appointmentId} className="py-3.5 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#2563EB] tabular-nums">
                        {formatTime12h(apt.time)} · {apt.appointmentId}
                      </span>
                      <AppointmentStatusText status={apt.status} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F2544]">{apt.patientName}</p>
                      <p className="text-xs text-slate-500">
                        {apt.doctorName} · {apt.doctorSpecialization} ·{' '}
                        <span className="font-mono tabular-nums">{formatINR(apt.consultationFee)}</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{apt.reason}</p>
                    <div className="flex items-center gap-3 pt-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setViewingAppointment(apt)}
                        className="text-[#2563EB] hover:underline"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(apt)}
                        className="text-slate-600 hover:text-[#0F2544] hover:underline"
                      >
                        Edit
                      </button>
                      {apt.status !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => setCancellingAppointment(apt)}
                          className="text-rose-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Book / Edit Appointment Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editingAppointment
            ? `Edit Appointment · ${editingAppointment.appointmentId}`
            : 'Book New Appointment'
        }
        subtitle="Real-time checks prevent past dates, unavailable physicians, and double-booked slots."
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="appointment-form"
              className="rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
            >
              {editingAppointment ? 'Save Changes' : 'Confirm Booking'}
            </button>
          </>
        }
      >
        <form id="appointment-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {formError && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="apt-patient" className="block text-sm font-medium text-[#0F2544]">
                Select Registered Patient *
              </label>
              <select
                id="apt-patient"
                value={form.patientId}
                onChange={(e) => {
                  setForm({ ...form, patientId: e.target.value });
                  setFormError('');
                }}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                <option value="">-- Choose a patient --</option>
                {patients.map((pat) => (
                  <option key={pat.patientId} value={pat.patientId}>
                    {pat.name} ({pat.patientId} · {pat.bloodGroup})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="apt-doctor" className="block text-sm font-medium text-[#0F2544]">
                Select Consulting Doctor *
              </label>
              <select
                id="apt-doctor"
                value={form.doctorId}
                onChange={(e) => {
                  setForm({ ...form, doctorId: e.target.value });
                  setFormError('');
                }}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                <option value="">-- Choose a doctor --</option>
                {doctors.map((doc) => (
                  <option key={doc.doctorId} value={doc.doctorId}>
                    {doc.name} — {doc.specialization} ({doc.category}) [
                    {doc.availability}]
                  </option>
                ))}
              </select>

              {/* Automatic Doctor Specialization, Availability & Consultation Fee Preview */}
              {selectedDoctorObj && (
                <div className="mt-2.5 rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-[#0F2544]">
                        {selectedDoctorObj.specialization}
                      </span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-600">{selectedDoctorObj.category}</span>
                    </div>
                    <AvailabilityStatusText status={selectedDoctorObj.availability} />
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/80 pt-2">
                    <span className="text-slate-500">Calculated Consultation Fee</span>
                    <span className="font-mono text-sm font-bold text-[#0F2544] tabular-nums">
                      {previewFee !== null ? formatINR(previewFee) : '—'}
                    </span>
                  </div>
                  {selectedDoctorObj.availability !== 'Available' && (
                    <p className="mt-2 font-medium text-rose-700">
                      This doctor is currently unavailable and cannot accept new bookings.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="apt-date" className="block text-sm font-medium text-[#0F2544]">
                Appointment Date *
              </label>
              <input
                id="apt-date"
                type="date"
                min={editingAppointment ? undefined : today}
                value={form.date}
                onChange={(e) => {
                  setForm({ ...form, date: e.target.value });
                  setFormError('');
                }}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="apt-time" className="block text-sm font-medium text-[#0F2544]">
                Appointment Time Slot *
              </label>
              <select
                id="apt-time"
                value={form.time}
                onChange={(e) => {
                  setForm({ ...form, time: e.target.value });
                  setFormError('');
                }}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm focus:border-[#2563EB] focus:outline-none"
              >
                {TIME_SLOTS.map((slot) => {
                  const isBooked = occupiedSlotsForDoctorDate.has(slot);
                  return (
                    <option key={slot} value={slot}>
                      {formatTime12h(slot)} {isBooked ? '(Already Booked)' : ''}
                    </option>
                  );
                })}
              </select>
              {occupiedSlotsForDoctorDate.has(form.time) && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  Selected slot is already booked for this doctor.
                </p>
              )}
            </div>

            {editingAppointment && (
              <div className="sm:col-span-2">
                <label htmlFor="apt-status" className="block text-sm font-medium text-[#0F2544]">
                  Appointment Status
                </label>
                <select
                  id="apt-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as AppointmentStatus })
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="apt-reason" className="block text-sm font-medium text-[#0F2544]">
                Reason for Visit *
              </label>
              <textarea
                id="apt-reason"
                rows={3}
                value={form.reason}
                onChange={(e) => {
                  setForm({ ...form, reason: e.target.value });
                  setFormError('');
                }}
                placeholder="Describe primary symptoms, follow-up purpose, or consultation notes..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Appointment Details Modal */}
      <Modal
        isOpen={Boolean(liveViewingAppointment)}
        onClose={() => setViewingAppointment(null)}
        title={`Appointment · ${liveViewingAppointment?.appointmentId || ''}`}
        subtitle={
          liveViewingAppointment
            ? `${formatReadableDate(liveViewingAppointment.date)} at ${formatTime12h(liveViewingAppointment.time)}`
            : undefined
        }
        maxWidth="lg"
        footer={
          liveViewingAppointment && (
            <div className="flex flex-wrap items-center justify-end gap-2 w-full">
              {liveViewingAppointment.status === 'Scheduled' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      updateAppointmentStatus(liveViewingAppointment.appointmentId, 'Completed');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingAppointment(liveViewingAppointment);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 whitespace-nowrap"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  const patId = liveViewingAppointment.patientId;
                  const docId = liveViewingAppointment.doctorId;
                  setViewingAppointment(null);
                  navigateWithIntent('medical-records', {
                    action: 'open-add-record',
                    payload: { patientId: patId, doctorId: docId },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0F2544] hover:bg-slate-50 whitespace-nowrap"
              >
                <FilePlus2 className="h-3.5 w-3.5 text-[#2563EB]" />
                Add Record
              </button>
              <button
                type="button"
                onClick={() => {
                  const aptId = liveViewingAppointment.appointmentId;
                  setViewingAppointment(null);
                  navigateWithIntent('consultation-fees', {
                    action: 'select-bill',
                    payload: { id: aptId },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2544] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
              >
                <Receipt className="h-3.5 w-3.5" />
                View / Print Bill
              </button>
            </div>
          )
        }
      >
        {liveViewingAppointment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Status</p>
              <div className="mt-1">
                <AppointmentStatusText status={liveViewingAppointment.status} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Recorded Consultation Fee</p>
              <p className="mt-1 font-mono text-base font-bold text-[#0F2544] tabular-nums">
                {formatINR(liveViewingAppointment.consultationFee)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Patient</p>
              <p className="mt-1 font-semibold text-[#0F2544]">
                {liveViewingAppointment.patientName}
              </p>
              <p className="font-mono text-xs text-slate-500">{liveViewingAppointment.patientId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Consulting Doctor</p>
              <p className="mt-1 font-semibold text-[#0F2544]">
                {liveViewingAppointment.doctorName}
              </p>
              <p className="text-xs text-slate-500">
                {liveViewingAppointment.doctorSpecialization} ·{' '}
                {liveViewingAppointment.doctorCategory}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Bill Reference</p>
              <p className="mt-1 font-mono text-xs text-slate-700 tabular-nums">
                {liveViewingAppointment.billId}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Booked On</p>
              <p className="mt-1 font-mono text-xs text-slate-700 tabular-nums">
                {formatReadableDate(liveViewingAppointment.createdAt)}
              </p>
            </div>
            <div className="sm:col-span-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400">Reason for Visit</p>
              <p className="mt-1.5 leading-relaxed text-slate-700">
                {liveViewingAppointment.reason}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Appointment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(cancellingAppointment)}
        onClose={() => setCancellingAppointment(null)}
        onConfirm={() => {
          if (cancellingAppointment) {
            cancelAppointment(cancellingAppointment.appointmentId);
          }
        }}
        title="Cancel Appointment"
        message={
          cancellingAppointment
            ? `Cancel appointment ${cancellingAppointment.appointmentId} for ${cancellingAppointment.patientName} with ${cancellingAppointment.doctorName} on ${formatReadableDate(cancellingAppointment.date)} at ${formatTime12h(cancellingAppointment.time)}? This frees the time slot for other patients.`
            : ''
        }
        confirmLabel="Cancel Appointment"
      />
    </div>
  );
}
