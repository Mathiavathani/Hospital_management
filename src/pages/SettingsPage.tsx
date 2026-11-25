import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Code2,
  Database,
  RotateCcw,
  Save,
  UserCog,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { JAVA_OOP_CONCEPTS } from '../data/seedData';
import { formatINR } from '../services/storageService';
import type { HospitalSettings } from '../types/hospital';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const HOSPITAL_WING_IMAGE = '/src/assets/images/medicare_hospital_wing_1795194287455.jpg';

export function SettingsPage() {
  const {
    settings,
    consultationFees,
    doctors,
    patients,
    appointments,
    medicalRecords,
    updateSettings,
    resetDemoData,
    setActivePage,
  } = useHospital();

  const [draft, setDraft] = useState<HospitalSettings>(settings);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [activeOopIndex, setActiveOopIndex] = useState<number>(0);
  const [bannerError, setBannerError] = useState(false);

  // Sync draft when demo data is reset
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!draft.hospitalName.trim()) errs.hospitalName = 'Hospital name is required.';
    if (!draft.hospitalAddress.trim()) errs.hospitalAddress = 'Hospital address is required.';
    if (!draft.contactNumber.trim()) errs.contactNumber = 'Contact number is required.';
    if (!draft.adminProfile.name.trim()) errs.adminName = 'Admin name is required.';
    if (
      !draft.adminProfile.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.adminProfile.email.trim())
    ) {
      errs.adminEmail = 'Enter a valid admin email address.';
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    updateSettings({
      ...draft,
      hospitalName: draft.hospitalName.trim(),
      hospitalTagline: draft.hospitalTagline.trim(),
      hospitalAddress: draft.hospitalAddress.trim(),
      contactNumber: draft.contactNumber.trim(),
      emergencyContact: draft.emergencyContact.trim(),
      adminProfile: {
        ...draft.adminProfile,
        name: draft.adminProfile.name.trim(),
        email: draft.adminProfile.email.trim(),
        role: draft.adminProfile.role.trim(),
        department: draft.adminProfile.department.trim(),
        phone: draft.adminProfile.phone.trim(),
      },
    });
  };

  const activeConcept = JAVA_OOP_CONCEPTS[activeOopIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F2544]">
          Hospital &amp; Application Settings
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Configure institution details, administrator profile, localStorage data, and Java OOP architecture reference
        </p>
      </div>

      {/* Institutional Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-[#0F2544] h-40 sm:h-44">
        {!bannerError ? (
          <img
            src={HOSPITAL_WING_IMAGE}
            alt="MediCare outpatient reception wing"
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-[#09172B] via-[#0F2544] to-[#1E4478]" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#09172B]/90 via-[#0F2544]/70 to-[#09172B]/25"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <p className="font-display text-xl font-bold tracking-tight">{settings.hospitalName}</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 max-w-2xl">
            {settings.hospitalAddress} · {settings.contactNumber}
          </p>
        </div>
      </div>

      {/* Hospital Information & Admin Profile Form */}
      <form onSubmit={handleSave} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Hospital Details */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <Building2 className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2544]">
                Hospital Information
              </h2>
              <p className="text-xs text-slate-500">
                Displayed across the sidebar and printed consultation bills
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="set-hosp-name" className="block text-sm font-medium text-[#0F2544]">
                Hospital Name *
              </label>
              <input
                id="set-hosp-name"
                type="text"
                value={draft.hospitalName}
                onChange={(e) => setDraft({ ...draft, hospitalName: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {formErrors.hospitalName && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.hospitalName}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="set-hosp-addr" className="block text-sm font-medium text-[#0F2544]">
                Hospital Address *
              </label>
              <textarea
                id="set-hosp-addr"
                rows={2}
                value={draft.hospitalAddress}
                onChange={(e) => setDraft({ ...draft, hospitalAddress: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-[#2563EB] focus:outline-none"
              />
              {formErrors.hospitalAddress && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.hospitalAddress}</p>
              )}
            </div>

            <div>
              <label htmlFor="set-hosp-phone" className="block text-sm font-medium text-[#0F2544]">
                Contact Number *
              </label>
              <input
                id="set-hosp-phone"
                type="tel"
                value={draft.contactNumber}
                onChange={(e) => setDraft({ ...draft, contactNumber: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
              {formErrors.contactNumber && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.contactNumber}</p>
              )}
            </div>

            <div>
              <label htmlFor="set-hosp-emerg" className="block text-sm font-medium text-[#0F2544]">
                Emergency Helpline
              </label>
              <input
                id="set-hosp-emerg"
                type="tel"
                value={draft.emergencyContact}
                onChange={(e) => setDraft({ ...draft, emergencyContact: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Admin Profile */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <UserCog className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-bold text-[#0F2544]">Admin Profile</h2>
                <p className="text-xs text-slate-500">Administrator details shown in the header</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label htmlFor="set-admin-name" className="block text-sm font-medium text-[#0F2544]">
                  Administrator Name *
                </label>
                <input
                  id="set-admin-name"
                  type="text"
                  value={draft.adminProfile.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      adminProfile: { ...draft.adminProfile, name: e.target.value },
                    })
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
                />
                {formErrors.adminName && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.adminName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="set-admin-email"
                  className="block text-sm font-medium text-[#0F2544]"
                >
                  Admin Email *
                </label>
                <input
                  id="set-admin-email"
                  type="email"
                  value={draft.adminProfile.email}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      adminProfile: { ...draft.adminProfile, email: e.target.value },
                    })
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
                />
                {formErrors.adminEmail && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.adminEmail}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="set-admin-role"
                    className="block text-sm font-medium text-[#0F2544]"
                  >
                    Role Title
                  </label>
                  <input
                    id="set-admin-role"
                    type="text"
                    value={draft.adminProfile.role}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        adminProfile: { ...draft.adminProfile, role: e.target.value },
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-admin-phone"
                    className="block text-sm font-medium text-[#0F2544]"
                  >
                    Direct Phone
                  </label>
                  <input
                    id="set-admin-phone"
                    type="tel"
                    value={draft.adminProfile.phone}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        adminProfile: { ...draft.adminProfile, phone: e.target.value },
                      })
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F2544] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16335B] transition-colors whitespace-nowrap"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </section>
      </form>

      {/* Consultation Fee Summary & LocalStorage Data Management */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Consultation Fee Settings Quick View */}
        <section className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2544]">
                Consultation Fee Settings
              </h2>
              <p className="text-xs text-slate-500">Current default fees by doctor category</p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('consultation-fees')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
            >
              Edit Fees
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {consultationFees.map((item) => (
              <div key={item.category} className="flex items-center justify-between py-2.5">
                <div>
                  <span className="font-medium text-[#0F2544]">{item.category}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-400">
                    ({item.javaSubclass})
                  </span>
                </div>
                <span className="font-mono font-semibold text-[#0F2544] tabular-nums">
                  {formatINR(item.fee)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Browser LocalStorage Data Management */}
        <section className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <Database className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-base font-bold text-[#0F2544]">
                  LocalStorage Data Management
                </h2>
                <p className="text-xs text-slate-500">
                  All records are persisted client-side across browser refreshes
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-2.5">
                <p className="text-xs text-slate-500">medicare_doctors</p>
                <p className="mt-0.5 font-mono font-bold text-[#0F2544] tabular-nums">
                  {doctors.length} records
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-2.5">
                <p className="text-xs text-slate-500">medicare_patients</p>
                <p className="mt-0.5 font-mono font-bold text-[#0F2544] tabular-nums">
                  {patients.length} records
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-2.5">
                <p className="text-xs text-slate-500">medicare_appointments</p>
                <p className="mt-0.5 font-mono font-bold text-[#0F2544] tabular-nums">
                  {appointments.length} records
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] border border-slate-200/70 px-3.5 py-2.5">
                <p className="text-xs text-slate-500">medicare_medical_records</p>
                <p className="mt-0.5 font-mono font-bold text-[#0F2544] tabular-nums">
                  {medicalRecords.length} records
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Restore the initial 6 doctors, 8 patients, 5 appointments, 4 medical records, and
              default consultation fees.
            </p>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Demo Data
            </button>
          </div>
        </section>
      </div>

      {/* Application Information & Java OOP Architecture Reference */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Code2 className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-[#0F2544]">
                Application Information &amp; Java OOP Entity Blueprint
              </h2>
              <p className="text-xs text-slate-500">
                React frontend SPA with browser localStorage · entities structured for direct parity with the separate Java OOP project
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs text-slate-400">Application</p>
              <p className="mt-1 font-semibold text-[#0F2544]">
                MediCare – Hospital Appointment &amp; Patient Management System
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Frontend Runtime &amp; Storage</p>
              <p className="mt-1 text-slate-700">
                React + TypeScript SPA · Browser <span className="font-mono text-xs">localStorage</span> (No external DB or backend)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Java OOP Compatibility</p>
              <p className="mt-1 text-slate-700">
                Mirrors <span className="font-mono text-xs">Person</span>, <span className="font-mono text-xs">Doctor</span> (5 subclasses), <span className="font-mono text-xs">Patient</span>, <span className="font-mono text-xs">Bookable</span>, and <span className="font-mono text-xs">HospitalManagementSystem</span>. Java is implemented separately and not executed inside React.
              </p>
            </div>
          </div>

          {/* Interactive Java OOP Concept Selector */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-1">
              {JAVA_OOP_CONCEPTS.map((item, idx) => (
                <button
                  key={item.concept}
                  type="button"
                  onClick={() => setActiveOopIndex(idx)}
                  className={`flex w-full flex-col rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                    activeOopIndex === idx
                      ? 'bg-[#0F2544] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-display text-xs font-semibold">{item.concept}</span>
                  <span
                    className={`mt-0.5 text-[11px] truncate ${
                      activeOopIndex === idx ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.javaClassOrMember}
                  </span>
                </button>
              ))}
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 space-y-4">
              <div>
                <p className="font-display text-sm font-bold text-[#0F2544]">
                  {activeConcept.concept}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {activeConcept.hospitalApplication}
                </p>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-[#0F2544] p-4 font-mono text-xs leading-relaxed text-slate-100 whitespace-pre-wrap break-words">
                <code>{activeConcept.snippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Reset Demo Data Confirmation */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={resetDemoData}
        title="Reset Demo Data"
        message="This will replace all current doctors, patients, appointments, medical records, fees, and hospital settings in localStorage with the original demo dataset (6 doctors, 8 patients, 5 appointments, 4 medical records). Continue?"
        confirmLabel="Reset Demo Data"
      />
    </div>
  );
}
