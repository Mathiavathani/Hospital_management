import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  Edit3,
  Eye,
  FilePlus2,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import type { PatientInput } from '../context/HospitalContext';
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
  getInitials,
} from '../services/storageService';
import {
  BLOOD_GROUPS,
  GENDERS,
  type BloodGroup,
  type Patient,
} from '../types/hospital';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { AppointmentStatusText } from '../components/ui/StatusText';

interface PatientFormState {
  name: string;
  age: string;
  gender: Patient['gender'];
  phoneNumber: string;
  email: string;
  address: string;
  bloodGroup: BloodGroup;
  medicalHistory: string;
}

type FormErrors = Partial<Record<keyof PatientFormState, string>>;

export function PatientsPage() {
  const {
    patients,
    appointments,
    medicalRecords,
    addPatient,
    updatePatient,
    deletePatient,
    navigateWithIntent,
    pendingIntent,
    clearPendingIntent,
  } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'appointments' | 'records'>('overview');
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  const [form, setForm] = useState<PatientFormState>({
    name: '',
    age: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    address: '',
    bloodGroup: 'O+',
    medicalHistory: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!pendingIntent) return;
    if (pendingIntent.action === 'open-add-patient') {
      openAddModal();
      clearPendingIntent();
    } else if (pendingIntent.action === 'view-patient' && pendingIntent.payload?.id) {
      const target = patients.find((p) => p.patientId === pendingIntent.payload?.id);
      if (target) {
        setViewingPatient(target);
        setProfileTab('overview');
      }
      clearPendingIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent]);

  const liveViewingPatient = useMemo(() => {
    if (!viewingPatient) return null;
    return patients.find((p) => p.patientId === viewingPatient.patientId) || null;
  }, [patients, viewingPatient]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((pat) => {
      const matchesQuery =
        !q ||
        pat.name.toLowerCase().includes(q) ||
        pat.patientId.toLowerCase().includes(q) ||
        pat.phoneNumber.toLowerCase().includes(q) ||
        pat.email.toLowerCase().includes(q);
      const matchesBlood = bloodGroupFilter === 'ALL' || pat.bloodGroup === bloodGroupFilter;
      return matchesQuery && matchesBlood;
    });
  }, [bloodGroupFilter, patients, searchQuery]);

  const openAddModal = () => {
    setEditingPatient(null);
    setForm({
      name: '',
      age: '',
      gender: 'Male',
      phoneNumber: '',
      email: '',
      address: '',
      bloodGroup: 'O+',
      medicalHistory: '',
    });
    setErrors({});
    setFormOpen(true);
  };

  const openEditModal = (pat: Patient) => {
    setEditingPatient(pat);
    setForm({
      name: pat.name,
      age: String(pat.age),
      gender: pat.gender,
      phoneNumber: pat.phoneNumber,
      email: pat.email,
      address: pat.address,
      bloodGroup: pat.bloodGroup,
      medicalHistory: pat.medicalHistory,
    });
    setErrors({});
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Patient full name is required.';

    const ageNum = Number(form.age);
    if (form.age === '' || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      nextErrors.age = 'Enter a valid age between 0 and 120.';
    }

    if (!form.phoneNumber.trim() || form.phoneNumber.replace(/\D/g, '').length < 10) {
      nextErrors.phoneNumber = 'Enter a valid phone number (at least 10 digits).';
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Residential address is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: PatientInput = {
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      bloodGroup: form.bloodGroup,
      medicalHistory: form.medicalHistory.trim(),
    };

    if (editingPatient) {
      updatePatient(editingPatient.patientId, payload);
    } else {
      addPatient(payload);
    }
    setFormOpen(false);
  };

  const patientAppointments = useMemo(() => {
    if (!liveViewingPatient) return [];
    return appointments
      .filter((a) => a.patientId === liveViewingPatient.patientId)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, liveViewingPatient]);

  const patientRecords = useMemo(() => {
    if (!liveViewingPatient) return [];
    return medicalRecords
      .filter((r) => r.patientId === liveViewingPatient.patientId)
      .sort((a, b) => b.consultationDate.localeCompare(a.consultationDate));
  }, [liveViewingPatient, medicalRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
            Patient Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
            {patients.length} registered patients · linked to {appointments.length} appointments &amp; {medicalRecords.length} medical records
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Register Patient
        </button>
      </div>

      {/* Search & Blood Group Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, ID, phone, or email..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={bloodGroupFilter}
          onChange={(e) => setBloodGroupFilter(e.target.value)}
          aria-label="Filter by blood group"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none"
        >
          <option value="ALL">All Blood Groups</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>
              Blood Group {bg}
            </option>
          ))}
        </select>
      </div>

      {/* Patient Directory Table */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={patients.length === 0 ? 'No patients registered yet' : 'No matching patients found'}
          description={
            patients.length === 0
              ? 'Register your first patient to schedule consultations and maintain medical history.'
              : 'Try clearing or modifying your search query or blood group filter.'
          }
          actionLabel={patients.length === 0 ? 'Register First Patient' : 'Clear Filters'}
          onAction={() => {
            if (patients.length === 0) {
              openAddModal();
            } else {
              setSearchQuery('');
              setBloodGroupFilter('ALL');
            }
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 pl-6 pr-3 whitespace-nowrap">Patient ID</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Patient</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Blood Group</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Contact</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">History Summary</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Visits / Records</th>
                  <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPatients.map((pat) => {
                  const visitCount = appointments.filter((a) => a.patientId === pat.patientId).length;
                  const recordCount = medicalRecords.filter(
                    (r) => r.patientId === pat.patientId
                  ).length;

                  return (
                    <tr key={pat.patientId} className="hover:bg-[#EFF6FF]/40 transition-colors">
                      <td className="py-3.5 pl-6 pr-3 font-mono text-xs font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                        {pat.patientId}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-display text-xs font-bold text-[#0F2544]">
                            {getInitials(pat.name)}
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingPatient(pat);
                                setProfileTab('overview');
                              }}
                              className="font-semibold text-[#0F2544] hover:text-[#2563EB] transition-colors text-left whitespace-nowrap"
                            >
                              {pat.name}
                            </button>
                            <p className="text-xs text-slate-500 whitespace-nowrap">
                              {pat.age} yrs · {pat.gender}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs font-semibold text-rose-700 whitespace-nowrap">
                        {pat.bloodGroup}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {pat.phoneNumber}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[190px]">{pat.email}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs text-slate-600 line-clamp-2 max-w-[230px]">
                          {pat.medicalHistory}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {visitCount} appt · {recordCount} rec
                      </td>
                      <td className="py-3.5 pl-3 pr-6 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingPatient(pat);
                              setProfileTab('overview');
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0F2544]"
                            aria-label={`View profile for ${pat.name}`}
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(pat)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#2563EB]"
                            aria-label={`Edit ${pat.name}`}
                            title="Edit Patient"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPatient(pat)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${pat.name}`}
                            title="Delete Patient"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register / Edit Patient Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingPatient ? `Edit Patient · ${editingPatient.patientId}` : 'Register New Patient'}
        subtitle={
          editingPatient
            ? 'Update patient demographics, contact details, and medical background.'
            : 'A unique Patient ID will be generated automatically upon registration.'
        }
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
              form="patient-form"
              className="rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
            >
              {editingPatient ? 'Save Changes' : 'Register Patient'}
            </button>
          </>
        }
      >
        <form id="patient-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="pat-name" className="block text-sm font-medium text-[#0F2544]">
                Patient Full Name *
              </label>
              <input
                id="pat-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Neha Deshpande"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="pat-age" className="block text-sm font-medium text-[#0F2544]">
                Age *
              </label>
              <input
                id="pat-age"
                type="number"
                min={0}
                max={120}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="34"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {errors.age && <p className="mt-1 text-xs text-rose-600">{errors.age}</p>}
            </div>

            <div>
              <label htmlFor="pat-gender" className="block text-sm font-medium text-[#0F2544]">
                Gender *
              </label>
              <select
                id="pat-gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Patient['gender'] })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pat-phone" className="block text-sm font-medium text-[#0F2544]">
                Phone Number *
              </label>
              <input
                id="pat-phone"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="+91 98451 12345"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-rose-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="pat-email" className="block text-sm font-medium text-[#0F2544]">
                Email Address *
              </label>
              <input
                id="pat-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="patient@example.com"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="pat-blood" className="block text-sm font-medium text-[#0F2544]">
                Blood Group *
              </label>
              <select
                id="pat-blood"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value as BloodGroup })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono focus:border-[#2563EB] focus:outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pat-address" className="block text-sm font-medium text-[#0F2544]">
                Residential Address *
              </label>
              <input
                id="pat-address"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address, area, city, PIN code"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.address && <p className="mt-1 text-xs text-rose-600">{errors.address}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pat-history" className="block text-sm font-medium text-[#0F2544]">
                Medical History &amp; Known Allergies
              </label>
              <textarea
                id="pat-history"
                rows={3}
                value={form.medicalHistory}
                onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                placeholder="Chronic conditions, prior surgeries, ongoing medications, or allergies..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Patient Profile Modal (with Appointments & Medical Records tabs) */}
      <Modal
        isOpen={Boolean(liveViewingPatient)}
        onClose={() => setViewingPatient(null)}
        title={liveViewingPatient?.name || 'Patient Profile'}
        subtitle={
          liveViewingPatient
            ? `${liveViewingPatient.patientId} · ${liveViewingPatient.age} yrs · ${liveViewingPatient.gender} · Blood Group ${liveViewingPatient.bloodGroup}`
            : undefined
        }
        maxWidth="xl"
        footer={
          liveViewingPatient && (
            <>
              <button
                type="button"
                onClick={() => {
                  const id = liveViewingPatient.patientId;
                  setViewingPatient(null);
                  navigateWithIntent('medical-records', {
                    action: 'open-add-record',
                    payload: { patientId: id },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-[#0F2544] hover:bg-slate-50 whitespace-nowrap"
              >
                <FilePlus2 className="h-4 w-4 text-[#2563EB]" />
                Add Medical Record
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = liveViewingPatient.patientId;
                  setViewingPatient(null);
                  navigateWithIntent('appointments', {
                    action: 'open-book-appointment',
                    payload: { patientId: id },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
              >
                <CalendarPlus className="h-4 w-4" />
                Book Appointment
              </button>
            </>
          )
        }
      >
        {liveViewingPatient && (
          <div className="space-y-5">
            {/* Segmented Profile Tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setProfileTab('overview')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profileTab === 'overview'
                    ? 'bg-white text-[#0F2544] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F2544]'
                }`}
              >
                Patient Details
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('appointments')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profileTab === 'appointments'
                    ? 'bg-white text-[#0F2544] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F2544]'
                }`}
              >
                Appointments ({patientAppointments.length})
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('records')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  profileTab === 'records'
                    ? 'bg-white text-[#0F2544] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F2544]'
                }`}
              >
                Medical Records ({patientRecords.length})
              </button>
            </div>

            {profileTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Patient ID</p>
                  <p className="mt-1 font-mono font-semibold text-[#0F2544] tabular-nums">
                    {liveViewingPatient.patientId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Registered Date</p>
                  <p className="mt-1 font-mono text-xs text-slate-700 tabular-nums">
                    {formatReadableDate(liveViewingPatient.registeredAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone Number</p>
                  <p className="mt-1 font-mono text-xs text-slate-700 tabular-nums">
                    {liveViewingPatient.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email Address</p>
                  <p className="mt-1 text-slate-700 break-all">{liveViewingPatient.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400">Residential Address</p>
                  <p className="mt-1 text-slate-700">{liveViewingPatient.address}</p>
                </div>
                <div className="sm:col-span-2 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-400">Medical History</p>
                  <p className="mt-1.5 leading-relaxed text-slate-700">
                    {liveViewingPatient.medicalHistory}
                  </p>
                </div>
                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400">Java OOP Entity Hierarchy</p>
                  <p className="mt-1 font-mono text-xs text-slate-600">Patient extends Person</p>
                </div>
              </div>
            )}

            {profileTab === 'appointments' && (
              <div>
                {patientAppointments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No appointments recorded for {liveViewingPatient.name}.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patientAppointments.map((apt) => (
                      <div
                        key={apt.appointmentId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-[#0F2544]">
                            {apt.doctorName}{' '}
                            <span className="font-normal text-slate-500">
                              · {apt.doctorSpecialization}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">{apt.reason}</p>
                          <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
                            {apt.appointmentId} · {formatReadableDate(apt.date)} at{' '}
                            {formatTime12h(apt.time)} · {formatINR(apt.consultationFee)}
                          </p>
                        </div>
                        <AppointmentStatusText status={apt.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {profileTab === 'records' && (
              <div>
                {patientRecords.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No medical records filed for {liveViewingPatient.name} yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {patientRecords.map((rec) => (
                      <div key={rec.recordId} className="py-4 first:pt-1 space-y-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display font-bold text-[#0F2544]">{rec.diagnosis}</p>
                            <p className="text-xs text-slate-500">
                              <span className="font-mono">{rec.recordId}</span> · {rec.doctorName} ·{' '}
                              <span className="font-mono tabular-nums">
                                {formatReadableDate(rec.consultationDate)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                          <div>
                            <span className="font-semibold text-slate-800">Symptoms: </span>
                            {rec.symptoms}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">Prescription: </span>
                            {rec.prescriptionNotes}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">Treatment Notes: </span>
                          {rec.treatmentNotes}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingPatient)}
        onClose={() => setDeletingPatient(null)}
        onConfirm={() => {
          if (deletingPatient) deletePatient(deletingPatient.patientId);
        }}
        title="Delete Patient Record"
        message={
          deletingPatient
            ? `Are you sure you want to delete ${deletingPatient.name} (${deletingPatient.patientId}) from the patient registry?`
            : ''
        }
        confirmLabel="Delete Patient"
      />
    </div>
  );
}
