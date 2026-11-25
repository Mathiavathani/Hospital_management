import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Edit3,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import type { MedicalRecordInput } from '../context/HospitalContext';
import {
  formatReadableDate,
  getTodayDateString,
} from '../services/storageService';
import type { MedicalRecord } from '../types/hospital';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';

interface RecordFormState {
  patientId: string;
  doctorId: string;
  consultationDate: string;
  diagnosis: string;
  symptoms: string;
  treatmentNotes: string;
  prescriptionNotes: string;
}

type FormErrors = Partial<Record<keyof RecordFormState, string>>;

export function MedicalRecordsPage() {
  const {
    medicalRecords,
    patients,
    doctors,
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    pendingIntent,
    clearPendingIntent,
  } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<MedicalRecord | null>(null);

  const [form, setForm] = useState<RecordFormState>({
    patientId: '',
    doctorId: '',
    consultationDate: getTodayDateString(),
    diagnosis: '',
    symptoms: '',
    treatmentNotes: '',
    prescriptionNotes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!pendingIntent) return;
    if (pendingIntent.action === 'open-add-record') {
      openAddModal({
        patientId: pendingIntent.payload?.patientId,
        doctorId: pendingIntent.payload?.doctorId,
      });
      clearPendingIntent();
    } else if (pendingIntent.action === 'view-record' && pendingIntent.payload?.id) {
      const target = medicalRecords.find((r) => r.recordId === pendingIntent.payload?.id);
      if (target) setViewingRecord(target);
      clearPendingIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent]);

  const liveViewingRecord = useMemo(() => {
    if (!viewingRecord) return null;
    return medicalRecords.find((r) => r.recordId === viewingRecord.recordId) || null;
  }, [medicalRecords, viewingRecord]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return medicalRecords
      .filter((rec) => {
        const matchesQuery =
          !q ||
          rec.recordId.toLowerCase().includes(q) ||
          rec.patientId.toLowerCase().includes(q) ||
          rec.patientName.toLowerCase().includes(q) ||
          rec.doctorName.toLowerCase().includes(q) ||
          rec.diagnosis.toLowerCase().includes(q);
        const matchesPatient = patientFilter === 'ALL' || rec.patientId === patientFilter;
        return matchesQuery && matchesPatient;
      })
      .sort((a, b) =>
        sortOrder === 'desc'
          ? b.consultationDate.localeCompare(a.consultationDate)
          : a.consultationDate.localeCompare(b.consultationDate)
      );
  }, [medicalRecords, patientFilter, searchQuery, sortOrder]);

  const patientPriorRecords = useMemo(() => {
    if (!liveViewingRecord) return [];
    return medicalRecords
      .filter(
        (r) =>
          r.patientId === liveViewingRecord.patientId &&
          r.recordId !== liveViewingRecord.recordId
      )
      .sort((a, b) => b.consultationDate.localeCompare(a.consultationDate));
  }, [liveViewingRecord, medicalRecords]);

  const linkedPatientObj = useMemo(() => {
    if (!liveViewingRecord) return null;
    return patients.find((p) => p.patientId === liveViewingRecord.patientId) || null;
  }, [liveViewingRecord, patients]);

  const openAddModal = (prefill?: { patientId?: string; doctorId?: string }) => {
    setEditingRecord(null);
    setForm({
      patientId: prefill?.patientId || patients[0]?.patientId || '',
      doctorId: prefill?.doctorId || doctors[0]?.doctorId || '',
      consultationDate: getTodayDateString(),
      diagnosis: '',
      symptoms: '',
      treatmentNotes: '',
      prescriptionNotes: '',
    });
    setErrors({});
    setFormOpen(true);
  };

  const openEditModal = (rec: MedicalRecord) => {
    setEditingRecord(rec);
    setForm({
      patientId: rec.patientId,
      doctorId: rec.doctorId,
      consultationDate: rec.consultationDate,
      diagnosis: rec.diagnosis,
      symptoms: rec.symptoms,
      treatmentNotes: rec.treatmentNotes,
      prescriptionNotes: rec.prescriptionNotes,
    });
    setErrors({});
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.patientId) nextErrors.patientId = 'Please select a patient.';
    if (!form.doctorId) nextErrors.doctorId = 'Please select the consulting doctor.';
    if (!form.consultationDate) nextErrors.consultationDate = 'Consultation date is required.';
    if (!form.diagnosis.trim()) nextErrors.diagnosis = 'Diagnosis is required.';
    if (!form.symptoms.trim()) nextErrors.symptoms = 'Symptoms summary is required.';
    if (!form.treatmentNotes.trim()) nextErrors.treatmentNotes = 'Treatment notes are required.';
    if (!form.prescriptionNotes.trim())
      nextErrors.prescriptionNotes = 'Prescription notes are required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: MedicalRecordInput = {
      patientId: form.patientId,
      doctorId: form.doctorId,
      consultationDate: form.consultationDate,
      diagnosis: form.diagnosis,
      symptoms: form.symptoms,
      treatmentNotes: form.treatmentNotes,
      prescriptionNotes: form.prescriptionNotes,
    };

    const res = editingRecord
      ? updateMedicalRecord(editingRecord.recordId, payload)
      : addMedicalRecord(payload);

    if (res.success) {
      setFormOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
            Medical Records
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 tabular-nums">
            {medicalRecords.length} clinical consultation records · fictional demo dataset
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Medical Record
        </button>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient ID, patient name, doctor, or diagnosis..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={patientFilter}
          onChange={(e) => setPatientFilter(e.target.value)}
          aria-label="Filter by patient"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-[#2563EB] focus:outline-none"
        >
          <option value="ALL">All Patients</option>
          {patients.map((pat) => (
            <option key={pat.patientId} value={pat.patientId}>
              {pat.name} ({pat.patientId})
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-[#0F2544] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowDownUp className="h-4 w-4 text-[#2563EB]" />
          Date: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>

      {/* Medical Records Table */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            medicalRecords.length === 0
              ? 'No medical records archived'
              : 'No medical records match your search'
          }
          description={
            medicalRecords.length === 0
              ? 'Create a consultation record to document diagnosis, symptoms, treatment, and prescriptions.'
              : 'Clear your search query or patient filter to view all records.'
          }
          actionLabel={medicalRecords.length === 0 ? 'Add First Record' : 'Reset Filters'}
          onAction={() => {
            if (medicalRecords.length === 0) {
              openAddModal();
            } else {
              setSearchQuery('');
              setPatientFilter('ALL');
            }
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                  <th className="py-3.5 pl-6 pr-3 whitespace-nowrap">Record ID</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Patient</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Consulting Doctor</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Consultation Date</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Diagnosis &amp; Prescription</th>
                  <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={rec.recordId} className="hover:bg-[#EFF6FF]/40 transition-colors">
                    <td className="py-3.5 pl-6 pr-3 font-mono text-xs font-semibold text-[#0F2544] tabular-nums whitespace-nowrap">
                      {rec.recordId}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-[#0F2544] whitespace-nowrap">
                        {rec.patientName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {rec.patientId}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {rec.doctorName}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                      {formatReadableDate(rec.consultationDate)}
                    </td>
                    <td className="py-3.5 px-3 max-w-sm">
                      <button
                        type="button"
                        onClick={() => setViewingRecord(rec)}
                        className="font-semibold text-[#0F2544] hover:text-[#2563EB] text-left line-clamp-1"
                      >
                        {rec.diagnosis}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        Rx: {rec.prescriptionNotes}
                      </p>
                    </td>
                    <td className="py-3.5 pl-3 pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingRecord(rec)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#0F2544]"
                          aria-label={`View record ${rec.recordId}`}
                          title="View Record & History"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(rec)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#2563EB]"
                          aria-label={`Edit record ${rec.recordId}`}
                          title="Edit Record"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(rec)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Delete record ${rec.recordId}`}
                          title="Delete Record"
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
      )}

      {/* Add / Edit Medical Record Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editingRecord ? `Edit Medical Record · ${editingRecord.recordId}` : 'Add Medical Record'
        }
        subtitle="Clinical findings are linked directly to the selected patient's medical history."
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
              form="medical-record-form"
              className="rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
            >
              {editingRecord ? 'Save Changes' : 'Save Medical Record'}
            </button>
          </>
        }
      >
        <form id="medical-record-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rec-patient" className="block text-sm font-medium text-[#0F2544]">
                Patient *
              </label>
              <select
                id="rec-patient"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                <option value="">-- Select patient --</option>
                {patients.map((pat) => (
                  <option key={pat.patientId} value={pat.patientId}>
                    {pat.name} ({pat.patientId})
                  </option>
                ))}
              </select>
              {errors.patientId && <p className="mt-1 text-xs text-rose-600">{errors.patientId}</p>}
            </div>

            <div>
              <label htmlFor="rec-doctor" className="block text-sm font-medium text-[#0F2544]">
                Consulting Doctor *
              </label>
              <select
                id="rec-doctor"
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              >
                <option value="">-- Select doctor --</option>
                {doctors.map((doc) => (
                  <option key={doc.doctorId} value={doc.doctorId}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>
              {errors.doctorId && <p className="mt-1 text-xs text-rose-600">{errors.doctorId}</p>}
            </div>

            <div>
              <label htmlFor="rec-date" className="block text-sm font-medium text-[#0F2544]">
                Consultation Date *
              </label>
              <input
                id="rec-date"
                type="date"
                value={form.consultationDate}
                onChange={(e) => setForm({ ...form, consultationDate: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.consultationDate && (
                <p className="mt-1 text-xs text-rose-600">{errors.consultationDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="rec-diagnosis" className="block text-sm font-medium text-[#0F2544]">
                Primary Diagnosis *
              </label>
              <input
                id="rec-diagnosis"
                type="text"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                placeholder="e.g., Seasonal Allergic Rhinitis"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.diagnosis && <p className="mt-1 text-xs text-rose-600">{errors.diagnosis}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="rec-symptoms" className="block text-sm font-medium text-[#0F2544]">
                Presenting Symptoms *
              </label>
              <textarea
                id="rec-symptoms"
                rows={2}
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                placeholder="Document patient symptoms, vitals, and onset duration..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.symptoms && <p className="mt-1 text-xs text-rose-600">{errors.symptoms}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="rec-treatment" className="block text-sm font-medium text-[#0F2544]">
                Treatment Notes *
              </label>
              <textarea
                id="rec-treatment"
                rows={2}
                value={form.treatmentNotes}
                onChange={(e) => setForm({ ...form, treatmentNotes: e.target.value })}
                placeholder="Clinical plan, lifestyle instructions, and follow-up guidance..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.treatmentNotes && (
                <p className="mt-1 text-xs text-rose-600">{errors.treatmentNotes}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="rec-prescription"
                className="block text-sm font-medium text-[#0F2544]"
              >
                Prescription Notes *
              </label>
              <textarea
                id="rec-prescription"
                rows={2}
                value={form.prescriptionNotes}
                onChange={(e) => setForm({ ...form, prescriptionNotes: e.target.value })}
                placeholder="Medications, dosage, frequency, and duration..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {errors.prescriptionNotes && (
                <p className="mt-1 text-xs text-rose-600">{errors.prescriptionNotes}</p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* View Medical Record + Patient Previous History Modal */}
      <Modal
        isOpen={Boolean(liveViewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={liveViewingRecord?.diagnosis || 'Medical Record'}
        subtitle={
          liveViewingRecord
            ? `${liveViewingRecord.recordId} · ${liveViewingRecord.patientName} (${liveViewingRecord.patientId}) · ${formatReadableDate(liveViewingRecord.consultationDate)}`
            : undefined
        }
        maxWidth="xl"
        footer={
          liveViewingRecord && (
            <>
              <button
                type="button"
                onClick={() => {
                  const rec = liveViewingRecord;
                  setViewingRecord(null);
                  openEditModal(rec);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[#0F2544] hover:bg-slate-50 whitespace-nowrap"
              >
                Edit Record
              </button>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="rounded-lg bg-[#0F2544] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16335B] whitespace-nowrap"
              >
                Close
              </button>
            </>
          )
        }
      >
        {liveViewingRecord && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs text-slate-400">Patient</p>
                <p className="mt-1 font-semibold text-[#0F2544]">
                  {liveViewingRecord.patientName}
                </p>
                <p className="font-mono text-xs text-slate-500">
                  {liveViewingRecord.patientId}
                  {linkedPatientObj ? ` · Blood ${linkedPatientObj.bloodGroup}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Consulting Doctor</p>
                <p className="mt-1 font-semibold text-[#0F2544]">{liveViewingRecord.doctorName}</p>
                <p className="font-mono text-xs text-slate-500">{liveViewingRecord.doctorId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Consultation Date</p>
                <p className="mt-1 font-mono font-semibold text-[#0F2544] tabular-nums">
                  {formatReadableDate(liveViewingRecord.consultationDate)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400">Symptoms</p>
                <p className="mt-1 leading-relaxed text-slate-700">{liveViewingRecord.symptoms}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Treatment Notes</p>
                <p className="mt-1 leading-relaxed text-slate-700">
                  {liveViewingRecord.treatmentNotes}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
                <p className="text-xs font-semibold text-[#0F2544]">Prescription Notes (Rx)</p>
                <p className="mt-1.5 leading-relaxed text-slate-800">
                  {liveViewingRecord.prescriptionNotes}
                </p>
              </div>
            </div>

            {/* Patient Background & Prior Records */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="font-display text-sm font-bold text-[#0F2544]">
                Patient Medical History Context
              </h3>
              {linkedPatientObj && (
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-slate-800">Baseline History: </span>
                  {linkedPatientObj.medicalHistory}
                </p>
              )}

              {patientPriorRecords.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No additional prior consultation records on file for {liveViewingRecord.patientName}.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {patientPriorRecords.map((prior) => (
                    <button
                      key={prior.recordId}
                      type="button"
                      onClick={() => setViewingRecord(prior)}
                      className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0F2544] truncate">
                          {prior.diagnosis}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          <span className="font-mono">{prior.recordId}</span> · {prior.doctorName}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                        {formatReadableDate(prior.consultationDate)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={() => {
          if (deletingRecord) deleteMedicalRecord(deletingRecord.recordId);
        }}
        title="Delete Medical Record"
        message={
          deletingRecord
            ? `Permanently delete medical record ${deletingRecord.recordId} (${deletingRecord.diagnosis}) for ${deletingRecord.patientName}?`
            : ''
        }
        confirmLabel="Delete Record"
      />
    </div>
  );
}
