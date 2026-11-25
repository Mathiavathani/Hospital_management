import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarPlus,
  Edit3,
  Eye,
  LayoutGrid,
  Mail,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import type { DoctorInput } from '../context/HospitalContext';
import {
  formatINR,
  formatReadableDate,
  formatTime12h,
  getFeeForCategory,
  getInitials,
} from '../services/storageService';
import {
  CATEGORY_TO_JAVA_CLASS,
  DOCTOR_CATEGORIES,
  GENDERS,
  type AvailabilityStatus,
  type Doctor,
  type DoctorCategory,
} from '../types/hospital';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { AppointmentStatusText, AvailabilityStatusText } from '../components/ui/StatusText';

interface DoctorFormState {
  name: string;
  age: string;
  gender: Doctor['gender'];
  phoneNumber: string;
  email: string;
  specialization: string;
  category: DoctorCategory;
  consultationFee: string;
  availability: AvailabilityStatus;
}

type FormErrors = Partial<Record<keyof DoctorFormState, string>>;

export function DoctorsPage() {
  const {
    doctors,
    appointments,
    consultationFees,
    addDoctor,
    updateDoctor,
    toggleDoctorAvailability,
    deleteDoctor,
    navigateWithIntent,
    pendingIntent,
    clearPendingIntent,
  } = useHospital();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [specializationFilter, setSpecializationFilter] = useState<string>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

  const defaultCategory: DoctorCategory = 'General Physician';
  const [form, setForm] = useState<DoctorFormState>({
    name: '',
    age: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    specialization: '',
    category: defaultCategory,
    consultationFee: String(getFeeForCategory(defaultCategory, consultationFees)),
    availability: 'Available',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Consume navigation intents (e.g., from Dashboard Quick Actions or Global Search)
  useEffect(() => {
    if (!pendingIntent) return;
    if (pendingIntent.action === 'open-add-doctor') {
      openAddModal();
      clearPendingIntent();
    } else if (pendingIntent.action === 'view-doctor' && pendingIntent.payload?.id) {
      const target = doctors.find((d) => d.doctorId === pendingIntent.payload?.id);
      if (target) setViewingDoctor(target);
      clearPendingIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent]);

  // Keep viewed doctor synced if availability or details change
  const liveViewingDoctor = useMemo(() => {
    if (!viewingDoctor) return null;
    return doctors.find((d) => d.doctorId === viewingDoctor.doctorId) || null;
  }, [doctors, viewingDoctor]);

  const specializations = useMemo(() => {
    return Array.from(new Set(doctors.map((d) => d.specialization))).sort();
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doctors.filter((doc) => {
      const matchesQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.doctorId.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
      const matchesSpec =
        specializationFilter === 'ALL' || doc.specialization === specializationFilter;
      return matchesQuery && matchesCategory && matchesSpec;
    });
  }, [categoryFilter, doctors, searchQuery, specializationFilter]);

  const openAddModal = () => {
    setEditingDoctor(null);
    const fee = getFeeForCategory('General Physician', consultationFees);
    setForm({
      name: '',
      age: '',
      gender: 'Male',
      phoneNumber: '',
      email: '',
      specialization: '',
      category: 'General Physician',
      consultationFee: String(fee),
      availability: 'Available',
    });
    setErrors({});
    setFormOpen(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    setForm({
      name: doc.name,
      age: String(doc.age),
      gender: doc.gender,
      phoneNumber: doc.phoneNumber,
      email: doc.email,
      specialization: doc.specialization,
      category: doc.category,
      consultationFee: String(doc.consultationFee),
      availability: doc.availability,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleCategoryChange = (nextCategory: DoctorCategory) => {
    const recommendedFee = getFeeForCategory(nextCategory, consultationFees);
    setForm((prev) => ({
      ...prev,
      category: nextCategory,
      consultationFee: String(recommendedFee),
    }));
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Doctor name is required.';

    const ageNum = Number(form.age);
    if (!form.age || Number.isNaN(ageNum) || ageNum < 24 || ageNum > 85) {
      nextErrors.age = 'Enter a valid age between 24 and 85.';
    }

    if (!form.phoneNumber.trim() || form.phoneNumber.replace(/\D/g, '').length < 10) {
      nextErrors.phoneNumber = 'Enter a valid phone number (at least 10 digits).';
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!form.specialization.trim()) {
      nextErrors.specialization = 'Specialization is required.';
    }

    const feeNum = Number(form.consultationFee);
    if (!form.consultationFee || Number.isNaN(feeNum) || feeNum <= 0) {
      nextErrors.consultationFee = 'Consultation fee must be greater than ₹0.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: DoctorInput = {
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      specialization: form.specialization.trim(),
      category: form.category,
      consultationFee: Math.round(Number(form.consultationFee)),
      availability: form.availability,
    };

    if (editingDoctor) {
      updateDoctor(editingDoctor.doctorId, payload);
    } else {
      addDoctor(payload);
    }
    setFormOpen(false);
  };

  const doctorAppointments = useMemo(() => {
    if (!liveViewingDoctor) return [];
    return appointments
      .filter((a) => a.doctorId === liveViewingDoctor.doctorId)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, liveViewingDoctor]);

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
            Doctor Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
            {doctors.length} registered doctors · {doctors.filter((d) => d.availability === 'Available').length} available for consultations
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Doctor
        </button>
      </div>

      {/* Filter & View Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, ID, or specialization..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by doctor category"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {DOCTOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            aria-label="Filter by specialization"
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none"
          >
            <option value="ALL">All Specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Table vs Cards segmented switch */}
        <div className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-1 lg:self-auto shrink-0">
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
            Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              viewMode === 'cards'
                ? 'bg-white text-[#0F2544] shadow-sm'
                : 'text-slate-600 hover:text-[#0F2544]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
        </div>
      </div>

      {/* Content View */}
      {filteredDoctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={doctors.length === 0 ? 'No doctors registered yet' : 'No doctors match your filters'}
          description={
            doctors.length === 0
              ? 'Add your first physician to start scheduling appointments and managing consultation fees.'
              : 'Try adjusting your search query, category filter, or specialization filter.'
          }
          actionLabel={doctors.length === 0 ? 'Add First Doctor' : 'Reset Filters'}
          onAction={() => {
            if (doctors.length === 0) {
              openAddModal();
            } else {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setSpecializationFilter('ALL');
            }
          }}
        />
      ) : viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 pl-6 pr-3 whitespace-nowrap">Doctor ID</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Doctor</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Category &amp; Specialization</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Contact</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Fee</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Availability</th>
                  <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-[#EFF6FF]/40 transition-colors">
                    <td className="py-3.5 pl-6 pr-3 font-mono text-xs font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                      {doc.doctorId}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] font-display text-xs font-bold text-[#0F2544]">
                          {getInitials(doc.name)}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setViewingDoctor(doc)}
                            className="font-semibold text-[#0F2544] hover:text-[#2563EB] transition-colors text-left whitespace-nowrap"
                          >
                            {doc.name}
                          </button>
                          <p className="text-xs text-slate-500 whitespace-nowrap">
                            {doc.age} yrs · {doc.gender}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-slate-800 whitespace-nowrap">
                        {doc.specialization}
                      </p>
                      <p className="text-xs text-slate-500 whitespace-nowrap">{doc.category}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {doc.phoneNumber}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{doc.email}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-sm font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                      {formatINR(doc.consultationFee)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <AvailabilityStatusText status={doc.availability} />
                        <button
                          type="button"
                          onClick={() => toggleDoctorAvailability(doc.doctorId)}
                          className="text-xs font-medium text-[#2563EB] hover:underline whitespace-nowrap"
                        >
                          Toggle
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingDoctor(doc)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0F2544] transition-colors"
                          aria-label={`View profile for ${doc.name}`}
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#2563EB] transition-colors"
                          aria-label={`Edit ${doc.name}`}
                          title="Edit Doctor"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDoctor(doc)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          aria-label={`Delete ${doc.name}`}
                          title="Delete Doctor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.doctorId}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0F2544] font-display text-sm font-bold text-white">
                      {getInitials(doc.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold text-[#0F2544] truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        <span className="font-mono tabular-nums">{doc.doctorId}</span> · {doc.age}y {doc.gender}
                      </p>
                    </div>
                  </div>
                  <AvailabilityStatusText status={doc.availability} />
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Specialization</span>
                    <span className="font-medium text-[#0F2544] text-right">
                      {doc.specialization}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Category</span>
                    <span className="text-slate-700 text-right">{doc.category}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Consultation Fee</span>
                    <span className="font-mono font-semibold text-[#0F2544] tabular-nums">
                      {formatINR(doc.consultationFee)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-mono tabular-nums">{doc.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                <button
                  type="button"
                  onClick={() => toggleDoctorAvailability(doc.doctorId)}
                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  {doc.availability === 'Available' ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewingDoctor(doc)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#EFF6FF] transition-colors whitespace-nowrap"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(doc)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0F2544]"
                    aria-label={`Edit ${doc.name}`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingDoctor(doc)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingDoctor ? `Edit Doctor · ${editingDoctor.doctorId}` : 'Add New Doctor'}
        subtitle={
          editingDoctor
            ? 'Update physician details, category, fee, or availability status.'
            : 'A unique Doctor ID will be generated automatically upon saving.'
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
              form="doctor-form"
              className="rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
            >
              {editingDoctor ? 'Save Changes' : 'Register Doctor'}
            </button>
          </>
        }
      >
        <form id="doctor-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="doc-name" className="block text-sm font-medium text-[#0F2544]">
                Doctor Full Name *
              </label>
              <input
                id="doc-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Dr. Sanjay Menon"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="doc-age" className="block text-sm font-medium text-[#0F2544]">
                Age *
              </label>
              <input
                id="doc-age"
                type="number"
                min={24}
                max={85}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="38"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {errors.age && <p className="mt-1 text-xs text-rose-600">{errors.age}</p>}
            </div>

            <div>
              <label htmlFor="doc-gender" className="block text-sm font-medium text-[#0F2544]">
                Gender *
              </label>
              <select
                id="doc-gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as Doctor['gender'] })}
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
              <label htmlFor="doc-phone" className="block text-sm font-medium text-[#0F2544]">
                Phone Number *
              </label>
              <input
                id="doc-phone"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="+91 98450 12345"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-rose-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="doc-email" className="block text-sm font-medium text-[#0F2544]">
                Email Address *
              </label>
              <input
                id="doc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="doctor@medicare.org"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="doc-category" className="block text-sm font-medium text-[#0F2544]">
                Doctor Category *
              </label>
              <select
                id="doc-category"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value as DoctorCategory)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                {DOCTOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({formatINR(getFeeForCategory(cat, consultationFees))})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                OOP Subclass: <span className="font-mono">{CATEGORY_TO_JAVA_CLASS[form.category]}</span>
              </p>
            </div>

            <div>
              <label htmlFor="doc-spec" className="block text-sm font-medium text-[#0F2544]">
                Specialization *
              </label>
              <input
                id="doc-spec"
                type="text"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g., Cardiology, Dermatology"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.specialization && (
                <p className="mt-1 text-xs text-rose-600">{errors.specialization}</p>
              )}
            </div>

            <div>
              <label htmlFor="doc-fee" className="block text-sm font-medium text-[#0F2544]">
                Consultation Fee (₹) *
              </label>
              <input
                id="doc-fee"
                type="number"
                min={50}
                step={50}
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {errors.consultationFee && (
                <p className="mt-1 text-xs text-rose-600">{errors.consultationFee}</p>
              )}
            </div>

            <div>
              <label htmlFor="doc-avail" className="block text-sm font-medium text-[#0F2544]">
                Availability Status *
              </label>
              <select
                id="doc-avail"
                value={form.availability}
                onChange={(e) =>
                  setForm({ ...form, availability: e.target.value as AvailabilityStatus })
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Doctor Profile Modal */}
      <Modal
        isOpen={Boolean(liveViewingDoctor)}
        onClose={() => setViewingDoctor(null)}
        title={liveViewingDoctor?.name || 'Doctor Profile'}
        subtitle={
          liveViewingDoctor
            ? `${liveViewingDoctor.doctorId} · ${liveViewingDoctor.specialization} · ${liveViewingDoctor.category}`
            : undefined
        }
        maxWidth="lg"
        footer={
          liveViewingDoctor && (
            <>
              <button
                type="button"
                onClick={() => toggleDoctorAvailability(liveViewingDoctor.doctorId)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                {liveViewingDoctor.availability === 'Available'
                  ? 'Mark Unavailable'
                  : 'Mark Available'}
              </button>
              <button
                type="button"
                disabled={liveViewingDoctor.availability !== 'Available'}
                onClick={() => {
                  const id = liveViewingDoctor.doctorId;
                  setViewingDoctor(null);
                  navigateWithIntent('appointments', {
                    action: 'open-book-appointment',
                    payload: { doctorId: id },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <CalendarPlus className="h-4 w-4" />
                Book Appointment
              </button>
            </>
          )
        }
      >
        {liveViewingDoctor && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-5 text-sm">
              <div>
                <p className="text-xs text-slate-400">Doctor ID</p>
                <p className="mt-1 font-mono font-semibold text-[#0F2544] tabular-nums">
                  {liveViewingDoctor.doctorId}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Consultation Fee</p>
                <p className="mt-1 font-mono font-semibold text-[#0F2544] tabular-nums">
                  {formatINR(liveViewingDoctor.consultationFee)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Availability</p>
                <div className="mt-1">
                  <AvailabilityStatusText status={liveViewingDoctor.availability} />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">Age &amp; Gender</p>
                <p className="mt-1 font-medium text-slate-800">
                  {liveViewingDoctor.age} years · {liveViewingDoctor.gender}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="mt-1 font-mono text-xs text-slate-700 tabular-nums">
                  {liveViewingDoctor.phoneNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="mt-1 text-xs text-slate-700 break-all">{liveViewingDoctor.email}</p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <p className="text-xs text-slate-400">Java OOP Entity Hierarchy</p>
                <p className="mt-1 font-mono text-xs text-slate-600">
                  {CATEGORY_TO_JAVA_CLASS[liveViewingDoctor.category]} extends Doctor extends Person
                </p>
              </div>
            </div>

            {/* Associated Appointments */}
            <div>
              <h3 className="font-display text-sm font-bold text-[#0F2544]">
                Assigned Appointments ({doctorAppointments.length})
              </h3>
              {doctorAppointments.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No appointments are currently associated with this physician.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                  {doctorAppointments.map((apt) => (
                    <div
                      key={apt.appointmentId}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[#0F2544] truncate">
                          {apt.patientName}{' '}
                          <span className="font-mono text-xs text-slate-400">
                            ({apt.appointmentId})
                          </span>
                        </p>
                        <p className="font-mono text-xs text-slate-500 tabular-nums">
                          {formatReadableDate(apt.date)} at {formatTime12h(apt.time)} ·{' '}
                          {formatINR(apt.consultationFee)}
                        </p>
                      </div>
                      <AppointmentStatusText status={apt.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingDoctor)}
        onClose={() => setDeletingDoctor(null)}
        onConfirm={() => {
          if (deletingDoctor) deleteDoctor(deletingDoctor.doctorId);
        }}
        title="Delete Doctor Record"
        message={
          deletingDoctor
            ? `Are you sure you want to remove ${deletingDoctor.name} (${deletingDoctor.doctorId})? Existing past appointments and medical records will retain their archived physician name.`
            : ''
        }
        confirmLabel="Delete Doctor"
      />
    </div>
  );
}
