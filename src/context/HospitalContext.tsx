import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEMO_CREDENTIALS,
  generateUniqueId,
  getFeeForCategory,
  getTodayDateString,
  loadAuthSession,
  loadHospitalData,
  resetHospitalData,
  saveAppointments,
  saveAuthSession,
  saveConsultationFees,
  saveDoctors,
  saveMedicalRecords,
  savePatients,
  saveSettings,
  validateAppointmentData,
} from '../services/storageService';
import type {
  Appointment,
  AppointmentStatus,
  AuthSession,
  AvailabilityStatus,
  ConsultationFeeConfig,
  Doctor,
  DoctorCategory,
  HospitalSettings,
  MedicalRecord,
  NavPage,
  PageActionIntent,
  Patient,
  ToastMessage,
  ToastType,
} from '../types/hospital';

export interface DoctorInput {
  name: string;
  age: number;
  gender: Doctor['gender'];
  phoneNumber: string;
  email: string;
  specialization: string;
  category: DoctorCategory;
  consultationFee: number;
  availability: AvailabilityStatus;
}

export interface PatientInput {
  name: string;
  age: number;
  gender: Patient['gender'];
  phoneNumber: string;
  email: string;
  address: string;
  bloodGroup: Patient['bloodGroup'];
  medicalHistory: string;
}

export interface AppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  status?: AppointmentStatus;
}

export interface MedicalRecordInput {
  patientId: string;
  doctorId: string;
  consultationDate: string;
  diagnosis: string;
  symptoms: string;
  treatmentNotes: string;
  prescriptionNotes: string;
}

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

interface HospitalContextValue {
  // Navigation & intents
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  navigateWithIntent: (page: NavPage, intent: PageActionIntent) => void;
  pendingIntent: PageActionIntent | null;
  clearPendingIntent: () => void;

  // Auth
  authSession: AuthSession | null;
  login: (email: string, password: string) => ActionResult;
  logout: () => void;

  // Core collections
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  consultationFees: ConsultationFeeConfig[];
  settings: HospitalSettings;

  // Print target
  printingAppointment: Appointment | null;
  printBillForAppointment: (appointment: Appointment) => void;

  // Doctors CRUD
  addDoctor: (input: DoctorInput) => ActionResult<Doctor>;
  updateDoctor: (doctorId: string, input: DoctorInput) => ActionResult<Doctor>;
  toggleDoctorAvailability: (doctorId: string) => void;
  deleteDoctor: (doctorId: string) => void;

  // Patients CRUD
  addPatient: (input: PatientInput) => ActionResult<Patient>;
  updatePatient: (patientId: string, input: PatientInput) => ActionResult<Patient>;
  deletePatient: (patientId: string) => void;

  // Appointments CRUD (implements Bookable semantics)
  bookAppointment: (input: AppointmentInput) => ActionResult<Appointment>;
  updateAppointment: (appointmentId: string, input: AppointmentInput) => ActionResult<Appointment>;
  cancelAppointment: (appointmentId: string) => void;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;

  // Medical Records CRUD
  addMedicalRecord: (input: MedicalRecordInput) => ActionResult<MedicalRecord>;
  updateMedicalRecord: (recordId: string, input: MedicalRecordInput) => ActionResult<MedicalRecord>;
  deleteMedicalRecord: (recordId: string) => void;

  // Consultation Fees & Settings
  updateConsultationFee: (category: DoctorCategory, newFee: number) => ActionResult;
  updateSettings: (nextSettings: HospitalSettings) => void;
  resetDemoData: () => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastType, title: string, description?: string) => void;
  dismissToast: (id: string) => void;
}

const HospitalContext = createContext<HospitalContextValue | undefined>(undefined);

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const initialData = useMemo(() => loadHospitalData(), []);

  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [pendingIntent, setPendingIntent] = useState<PageActionIntent | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());

  const [doctors, setDoctors] = useState<Doctor[]>(initialData.doctors);
  const [patients, setPatients] = useState<Patient[]>(initialData.patients);
  const [appointments, setAppointments] = useState<Appointment[]>(initialData.appointments);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(initialData.medicalRecords);
  const [consultationFees, setConsultationFees] = useState<ConsultationFeeConfig[]>(
    initialData.consultationFees
  );
  const [settings, setSettings] = useState<HospitalSettings>(initialData.settings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [printingAppointment, setPrintingAppointment] = useState<Appointment | null>(null);

  // Sync each collection independently to localStorage
  useEffect(() => {
    saveDoctors(doctors);
  }, [doctors]);

  useEffect(() => {
    savePatients(patients);
  }, [patients]);

  useEffect(() => {
    saveAppointments(appointments);
  }, [appointments]);

  useEffect(() => {
    saveMedicalRecords(medicalRecords);
  }, [medicalRecords]);

  useEffect(() => {
    saveConsultationFees(consultationFees);
  }, [consultationFees]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const navigateWithIntent = useCallback((page: NavPage, intent: PageActionIntent) => {
    setPendingIntent(intent);
    setActivePage(page);
  }, []);

  const clearPendingIntent = useCallback(() => {
    setPendingIntent(null);
  }, []);

  const printBillForAppointment = useCallback((appointment: Appointment) => {
    setPrintingAppointment(appointment);
    window.setTimeout(() => {
      window.print();
    }, 120);
  }, []);

  // Auth handlers
  const login = useCallback(
    (email: string, password: string): ActionResult => {
      const normalizedEmail = email.trim().toLowerCase();
      const allowedEmails = [
        DEMO_CREDENTIALS.email.toLowerCase(),
        settings.adminProfile.email.trim().toLowerCase(),
      ];

      if (!allowedEmails.includes(normalizedEmail) || password !== DEMO_CREDENTIALS.password) {
        return {
          success: false,
          error: 'Invalid email or password. Use the demo credentials displayed below.',
        };
      }

      const session: AuthSession = {
        isAuthenticated: true,
        email: normalizedEmail,
        loggedInAt: new Date().toISOString(),
      };
      setAuthSession(session);
      saveAuthSession(session);
      setActivePage('dashboard');
      addToast('success', 'Signed in to MediCare', `Welcome back, ${settings.adminProfile.name}.`);
      return { success: true };
    },
    [addToast, settings.adminProfile.email, settings.adminProfile.name]
  );

  const logout = useCallback(() => {
    setAuthSession(null);
    saveAuthSession(null);
    addToast('info', 'Signed out', 'Your session has ended safely.');
  }, [addToast]);

  // Doctor CRUD
  const addDoctor = useCallback(
    (input: DoctorInput): ActionResult<Doctor> => {
      const doctorId = generateUniqueId(
        doctors.map((d) => d.doctorId),
        'DOC',
        1001
      );
      const created: Doctor = {
        doctorId,
        name: input.name.trim(),
        age: input.age,
        gender: input.gender,
        phoneNumber: input.phoneNumber.trim(),
        email: input.email.trim(),
        specialization: input.specialization.trim(),
        category: input.category,
        consultationFee: input.consultationFee,
        availability: input.availability,
        createdAt: getTodayDateString(),
      };
      setDoctors((prev) => [created, ...prev]);
      addToast('success', 'Doctor added', `${created.name} (${created.doctorId}) registered.`);
      return { success: true, data: created };
    },
    [addToast, doctors]
  );

  const updateDoctor = useCallback(
    (doctorId: string, input: DoctorInput): ActionResult<Doctor> => {
      let updatedDoctor: Doctor | undefined;
      setDoctors((prev) =>
        prev.map((doc) => {
          if (doc.doctorId !== doctorId) return doc;
          updatedDoctor = {
            ...doc,
            name: input.name.trim(),
            age: input.age,
            gender: input.gender,
            phoneNumber: input.phoneNumber.trim(),
            email: input.email.trim(),
            specialization: input.specialization.trim(),
            category: input.category,
            consultationFee: input.consultationFee,
            availability: input.availability,
          };
          return updatedDoctor;
        })
      );

      if (!updatedDoctor) {
        return { success: false, error: 'Doctor record not found.' };
      }

      const nextDocName = updatedDoctor.name;
      const nextSpec = updatedDoctor.specialization;
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.doctorId === doctorId
            ? { ...apt, doctorName: nextDocName, doctorSpecialization: nextSpec }
            : apt
        )
      );
      setMedicalRecords((prev) =>
        prev.map((rec) =>
          rec.doctorId === doctorId ? { ...rec, doctorName: nextDocName } : rec
        )
      );

      addToast('success', 'Doctor updated', `${updatedDoctor.name} (${doctorId}) saved.`);
      return { success: true, data: updatedDoctor };
    },
    [addToast]
  );

  const toggleDoctorAvailability = useCallback(
    (doctorId: string) => {
      const target = doctors.find((d) => d.doctorId === doctorId);
      if (!target) return;
      const nextStatus: AvailabilityStatus =
        target.availability === 'Available' ? 'Unavailable' : 'Available';

      setDoctors((prev) =>
        prev.map((doc) =>
          doc.doctorId === doctorId ? { ...doc, availability: nextStatus } : doc
        )
      );
      addToast(
        'info',
        'Availability updated',
        `${target.name} is now marked ${nextStatus}.`
      );
    },
    [addToast, doctors]
  );

  const deleteDoctor = useCallback(
    (doctorId: string) => {
      const target = doctors.find((d) => d.doctorId === doctorId);
      setDoctors((prev) => prev.filter((doc) => doc.doctorId !== doctorId));
      addToast(
        'info',
        'Doctor removed',
        target ? `${target.name} (${doctorId}) has been deleted.` : `Doctor ${doctorId} deleted.`
      );
    },
    [addToast, doctors]
  );

  // Patient CRUD
  const addPatient = useCallback(
    (input: PatientInput): ActionResult<Patient> => {
      const patientId = generateUniqueId(
        patients.map((p) => p.patientId),
        'PAT',
        2001
      );
      const created: Patient = {
        patientId,
        name: input.name.trim(),
        age: input.age,
        gender: input.gender,
        phoneNumber: input.phoneNumber.trim(),
        email: input.email.trim(),
        address: input.address.trim(),
        bloodGroup: input.bloodGroup,
        medicalHistory: input.medicalHistory.trim() || 'No known chronic conditions.',
        registeredAt: getTodayDateString(),
      };
      setPatients((prev) => [created, ...prev]);
      addToast('success', 'Patient registered', `${created.name} (${created.patientId}) added.`);
      return { success: true, data: created };
    },
    [addToast, patients]
  );

  const updatePatient = useCallback(
    (patientId: string, input: PatientInput): ActionResult<Patient> => {
      let updatedPatient: Patient | undefined;
      setPatients((prev) =>
        prev.map((pat) => {
          if (pat.patientId !== patientId) return pat;
          updatedPatient = {
            ...pat,
            name: input.name.trim(),
            age: input.age,
            gender: input.gender,
            phoneNumber: input.phoneNumber.trim(),
            email: input.email.trim(),
            address: input.address.trim(),
            bloodGroup: input.bloodGroup,
            medicalHistory: input.medicalHistory.trim() || 'No known chronic conditions.',
          };
          return updatedPatient;
        })
      );

      if (!updatedPatient) {
        return { success: false, error: 'Patient record not found.' };
      }

      // Sync patient name on medical records and appointments for readability
      const nextName = updatedPatient.name;
      setMedicalRecords((prev) =>
        prev.map((rec) => (rec.patientId === patientId ? { ...rec, patientName: nextName } : rec))
      );
      setAppointments((prev) =>
        prev.map((apt) => (apt.patientId === patientId ? { ...apt, patientName: nextName } : apt))
      );

      addToast('success', 'Patient updated', `${updatedPatient.name} (${patientId}) saved.`);
      return { success: true, data: updatedPatient };
    },
    [addToast]
  );

  const deletePatient = useCallback(
    (patientId: string) => {
      const target = patients.find((p) => p.patientId === patientId);
      setPatients((prev) => prev.filter((pat) => pat.patientId !== patientId));
      addToast(
        'info',
        'Patient deleted',
        target ? `${target.name} (${patientId}) removed.` : `Patient ${patientId} removed.`
      );
    },
    [addToast, patients]
  );

  // Appointment CRUD
  const bookAppointment = useCallback(
    (input: AppointmentInput): ActionResult<Appointment> => {
      const patient = patients.find((p) => p.patientId === input.patientId);
      const doctor = doctors.find((d) => d.doctorId === input.doctorId);

      const validation = validateAppointmentData({
        patient,
        doctor,
        date: input.date,
        time: input.time,
        reason: input.reason,
        existingAppointments: appointments,
      });

      if (!validation.valid || !patient || !doctor) {
        addToast('error', 'Booking blocked', validation.error || 'Please review the form details.');
        return { success: false, error: validation.error };
      }

      const appointmentId = generateUniqueId(
        appointments.map((a) => a.appointmentId),
        'APT',
        3001
      );
      const billId = generateUniqueId(
        appointments.map((a) => a.billId),
        'BILL',
        5001
      );

      // Calculate fee dynamically from current doctor / category fee schedule
      const fee = doctor.consultationFee || getFeeForCategory(doctor.category, consultationFees);

      const created: Appointment = {
        appointmentId,
        billId,
        patientId: patient.patientId,
        doctorId: doctor.doctorId,
        patientName: patient.name,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorCategory: doctor.category,
        date: input.date,
        time: input.time,
        reason: input.reason.trim(),
        consultationFee: fee,
        status: input.status || 'Scheduled',
        createdAt: getTodayDateString(),
      };

      setAppointments((prev) => [created, ...prev]);
      addToast(
        'success',
        'Appointment booked',
        `${appointmentId} scheduled for ${patient.name} with ${doctor.name}.`
      );
      return { success: true, data: created };
    },
    [addToast, appointments, consultationFees, doctors, patients]
  );

  const updateAppointment = useCallback(
    (appointmentId: string, input: AppointmentInput): ActionResult<Appointment> => {
      const existing = appointments.find((a) => a.appointmentId === appointmentId);
      if (!existing) {
        return { success: false, error: 'Appointment not found.' };
      }

      const patient = patients.find((p) => p.patientId === input.patientId);
      const doctor = doctors.find((d) => d.doctorId === input.doctorId);

      const validation = validateAppointmentData({
        patient,
        doctor,
        date: input.date,
        time: input.time,
        reason: input.reason,
        existingAppointments: appointments,
        editingAppointment: existing,
      });

      if (!validation.valid || !patient || !doctor) {
        addToast('error', 'Update blocked', validation.error || 'Invalid appointment details.');
        return { success: false, error: validation.error };
      }

      // Preserve original recorded fee unless the user switches to a different doctor
      const consultationFee =
        doctor.doctorId === existing.doctorId
          ? existing.consultationFee
          : doctor.consultationFee || getFeeForCategory(doctor.category, consultationFees);

      const updated: Appointment = {
        ...existing,
        patientId: patient.patientId,
        doctorId: doctor.doctorId,
        patientName: patient.name,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorCategory: doctor.category,
        date: input.date,
        time: input.time,
        reason: input.reason.trim(),
        consultationFee,
        status: input.status || existing.status,
      };

      setAppointments((prev) =>
        prev.map((apt) => (apt.appointmentId === appointmentId ? updated : apt))
      );
      addToast('success', 'Appointment updated', `${appointmentId} has been updated.`);
      return { success: true, data: updated };
    },
    [addToast, appointments, consultationFees, doctors, patients]
  );

  const cancelAppointment = useCallback(
    (appointmentId: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.appointmentId === appointmentId ? { ...apt, status: 'Cancelled' } : apt
        )
      );
      addToast('info', 'Appointment cancelled', `${appointmentId} status changed to Cancelled.`);
    },
    [addToast]
  );

  const updateAppointmentStatus = useCallback(
    (appointmentId: string, status: AppointmentStatus) => {
      setAppointments((prev) =>
        prev.map((apt) => (apt.appointmentId === appointmentId ? { ...apt, status } : apt))
      );
      addToast('success', 'Status updated', `${appointmentId} marked as ${status}.`);
    },
    [addToast]
  );

  // Medical Records CRUD
  const addMedicalRecord = useCallback(
    (input: MedicalRecordInput): ActionResult<MedicalRecord> => {
      const patient = patients.find((p) => p.patientId === input.patientId);
      const doctor = doctors.find((d) => d.doctorId === input.doctorId);

      if (!patient) {
        return { success: false, error: 'Please select a valid patient.' };
      }
      if (!doctor) {
        return { success: false, error: 'Please select a valid attending doctor.' };
      }

      const recordId = generateUniqueId(
        medicalRecords.map((r) => r.recordId),
        'REC',
        4001
      );

      const created: MedicalRecord = {
        recordId,
        patientId: patient.patientId,
        patientName: patient.name,
        doctorId: doctor.doctorId,
        doctorName: doctor.name,
        consultationDate: input.consultationDate,
        diagnosis: input.diagnosis.trim(),
        symptoms: input.symptoms.trim(),
        treatmentNotes: input.treatmentNotes.trim(),
        prescriptionNotes: input.prescriptionNotes.trim(),
        createdAt: getTodayDateString(),
      };

      setMedicalRecords((prev) => [created, ...prev]);
      addToast('success', 'Medical record saved', `${recordId} linked to ${patient.name}.`);
      return { success: true, data: created };
    },
    [addToast, doctors, medicalRecords, patients]
  );

  const updateMedicalRecord = useCallback(
    (recordId: string, input: MedicalRecordInput): ActionResult<MedicalRecord> => {
      const patient = patients.find((p) => p.patientId === input.patientId);
      const doctor = doctors.find((d) => d.doctorId === input.doctorId);

      if (!patient || !doctor) {
        return { success: false, error: 'Selected patient or doctor no longer exists.' };
      }

      let updatedRecord: MedicalRecord | undefined;
      setMedicalRecords((prev) =>
        prev.map((rec) => {
          if (rec.recordId !== recordId) return rec;
          updatedRecord = {
            ...rec,
            patientId: patient.patientId,
            patientName: patient.name,
            doctorId: doctor.doctorId,
            doctorName: doctor.name,
            consultationDate: input.consultationDate,
            diagnosis: input.diagnosis.trim(),
            symptoms: input.symptoms.trim(),
            treatmentNotes: input.treatmentNotes.trim(),
            prescriptionNotes: input.prescriptionNotes.trim(),
          };
          return updatedRecord;
        })
      );

      if (!updatedRecord) {
        return { success: false, error: 'Medical record not found.' };
      }

      addToast('success', 'Medical record updated', `${recordId} changes saved.`);
      return { success: true, data: updatedRecord };
    },
    [addToast, doctors, patients]
  );

  const deleteMedicalRecord = useCallback(
    (recordId: string) => {
      setMedicalRecords((prev) => prev.filter((rec) => rec.recordId !== recordId));
      addToast('info', 'Medical record deleted', `${recordId} removed from registry.`);
    },
    [addToast]
  );

  // Consultation Fee update: updates category rate & doctor rates for FUTURE bookings while preserving EXISTING appointment bills
  const updateConsultationFee = useCallback(
    (category: DoctorCategory, newFee: number): ActionResult => {
      if (!Number.isFinite(newFee) || newFee <= 0 || newFee > 100000) {
        return { success: false, error: 'Consultation fee must be a positive amount up to ₹1,00,000.' };
      }

      const rounded = Math.round(newFee);

      setConsultationFees((prev) =>
        prev.map((item) => (item.category === category ? { ...item, fee: rounded } : item))
      );

      // Update active doctors of this category so new appointments inherit the updated fee
      setDoctors((prev) =>
        prev.map((doc) =>
          doc.category === category ? { ...doc, consultationFee: rounded } : doc
        )
      );

      addToast(
        'success',
        'Consultation fee updated',
        `${category} fee set to ₹${rounded.toLocaleString('en-IN')}. Existing appointment bills retain their original fee.`
      );
      return { success: true };
    },
    [addToast]
  );

  const updateSettings = useCallback(
    (nextSettings: HospitalSettings) => {
      setSettings(nextSettings);
      addToast('success', 'Settings saved', 'Hospital configuration updated in localStorage.');
    },
    [addToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = resetHospitalData();
    setDoctors(fresh.doctors);
    setPatients(fresh.patients);
    setAppointments(fresh.appointments);
    setMedicalRecords(fresh.medicalRecords);
    setConsultationFees(fresh.consultationFees);
    setSettings(fresh.settings);
    addToast(
      'success',
      'Demo data restored',
      'Loaded 6 doctors, 8 patients, 5 appointments, and 4 medical records.'
    );
  }, [addToast]);

  const value = useMemo<HospitalContextValue>(
    () => ({
      activePage,
      setActivePage,
      navigateWithIntent,
      pendingIntent,
      clearPendingIntent,
      authSession,
      login,
      logout,
      doctors,
      patients,
      appointments,
      medicalRecords,
      consultationFees,
      settings,
      printingAppointment,
      printBillForAppointment,
      addDoctor,
      updateDoctor,
      toggleDoctorAvailability,
      deleteDoctor,
      addPatient,
      updatePatient,
      deletePatient,
      bookAppointment,
      updateAppointment,
      cancelAppointment,
      updateAppointmentStatus,
      addMedicalRecord,
      updateMedicalRecord,
      deleteMedicalRecord,
      updateConsultationFee,
      updateSettings,
      resetDemoData,
      toasts,
      addToast,
      dismissToast,
    }),
    [
      activePage,
      navigateWithIntent,
      pendingIntent,
      clearPendingIntent,
      authSession,
      login,
      logout,
      doctors,
      patients,
      appointments,
      medicalRecords,
      consultationFees,
      settings,
      printingAppointment,
      printBillForAppointment,
      addDoctor,
      updateDoctor,
      toggleDoctorAvailability,
      deleteDoctor,
      addPatient,
      updatePatient,
      deletePatient,
      bookAppointment,
      updateAppointment,
      cancelAppointment,
      updateAppointmentStatus,
      addMedicalRecord,
      updateMedicalRecord,
      deleteMedicalRecord,
      updateConsultationFee,
      updateSettings,
      resetDemoData,
      toasts,
      addToast,
      dismissToast,
    ]
  );

  return <HospitalContext.Provider value={value}>{children}</HospitalContext.Provider>;
}

export function useHospital(): HospitalContextValue {
  const ctx = useContext(HospitalContext);
  if (!ctx) {
    throw new Error('useHospital must be used inside HospitalProvider');
  }
  return ctx;
}
