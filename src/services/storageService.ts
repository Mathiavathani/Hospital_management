import {
  createInitialAppointments,
  createInitialDoctors,
  createInitialMedicalRecords,
  createInitialPatients,
  formatLocalDate,
  INITIAL_CONSULTATION_FEES,
  INITIAL_HOSPITAL_SETTINGS,
} from '../data/seedData';
import type {
  Appointment,
  AuthSession,
  ConsultationBill,
  ConsultationFeeConfig,
  Doctor,
  DoctorCategory,
  HospitalSettings,
  MedicalRecord,
  Patient,
} from '../types/hospital';

export const STORAGE_KEYS = {
  INITIALIZED: 'medicare_initialized_v1',
  DOCTORS: 'medicare_doctors',
  PATIENTS: 'medicare_patients',
  APPOINTMENTS: 'medicare_appointments',
  MEDICAL_RECORDS: 'medicare_medical_records',
  CONSULTATION_FEES: 'medicare_consultation_fees',
  SETTINGS: 'medicare_settings',
  AUTH: 'medicare_auth',
} as const;

export const DEMO_CREDENTIALS = {
  email: 'admin@medicare.org',
  password: 'MediCare@2026',
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in constrained environments
  }
}

export interface HospitalDataSnapshot {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  consultationFees: ConsultationFeeConfig[];
  settings: HospitalSettings;
}

/** Seeds demo data once on first launch; preserves user edits and intentionally empty states across refreshes */
export function loadHospitalData(): HospitalDataSnapshot {
  const isInitialized = window.localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  if (!isInitialized) {
    return resetHospitalData();
  }

  return {
    doctors: readJson<Doctor[]>(STORAGE_KEYS.DOCTORS, []),
    patients: readJson<Patient[]>(STORAGE_KEYS.PATIENTS, []),
    appointments: readJson<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []),
    medicalRecords: readJson<MedicalRecord[]>(STORAGE_KEYS.MEDICAL_RECORDS, []),
    consultationFees: readJson<ConsultationFeeConfig[]>(
      STORAGE_KEYS.CONSULTATION_FEES,
      INITIAL_CONSULTATION_FEES
    ),
    settings: readJson<HospitalSettings>(STORAGE_KEYS.SETTINGS, INITIAL_HOSPITAL_SETTINGS),
  };
}

export function resetHospitalData(): HospitalDataSnapshot {
  const snapshot: HospitalDataSnapshot = {
    doctors: createInitialDoctors(),
    patients: createInitialPatients(),
    appointments: createInitialAppointments(),
    medicalRecords: createInitialMedicalRecords(),
    consultationFees: INITIAL_CONSULTATION_FEES.map((item) => ({
      ...item,
      defaultSpecializations: [...item.defaultSpecializations],
    })),
    settings: {
      ...INITIAL_HOSPITAL_SETTINGS,
      adminProfile: { ...INITIAL_HOSPITAL_SETTINGS.adminProfile },
    },
  };

  saveDoctors(snapshot.doctors);
  savePatients(snapshot.patients);
  saveAppointments(snapshot.appointments);
  saveMedicalRecords(snapshot.medicalRecords);
  saveConsultationFees(snapshot.consultationFees);
  saveSettings(snapshot.settings);
  window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

  return snapshot;
}

export function saveDoctors(doctors: Doctor[]): void {
  writeJson(STORAGE_KEYS.DOCTORS, doctors);
}

export function savePatients(patients: Patient[]): void {
  writeJson(STORAGE_KEYS.PATIENTS, patients);
}

export function saveAppointments(appointments: Appointment[]): void {
  writeJson(STORAGE_KEYS.APPOINTMENTS, appointments);
}

export function saveMedicalRecords(records: MedicalRecord[]): void {
  writeJson(STORAGE_KEYS.MEDICAL_RECORDS, records);
}

export function saveConsultationFees(fees: ConsultationFeeConfig[]): void {
  writeJson(STORAGE_KEYS.CONSULTATION_FEES, fees);
}

export function saveSettings(settings: HospitalSettings): void {
  writeJson(STORAGE_KEYS.SETTINGS, settings);
}

export function loadAuthSession(): AuthSession | null {
  return readJson<AuthSession | null>(STORAGE_KEYS.AUTH, null);
}

export function saveAuthSession(session: AuthSession | null): void {
  if (session === null) {
    window.localStorage.removeItem(STORAGE_KEYS.AUTH);
  } else {
    writeJson(STORAGE_KEYS.AUTH, session);
  }
}

/** Generates monotonically increasing unique IDs such as DOC-1007, PAT-2009, APT-3006 */
export function generateUniqueId(existingIds: string[], prefix: string, startNumber: number): string {
  const maxNum = existingIds.reduce((max, id) => {
    const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (!match) return max;
    const num = Number.parseInt(match[1], 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, startNumber - 1);

  return `${prefix}-${maxNum + 1}`;
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatReadableDate(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime12h(time24: string): string {
  if (!time24) return '—';
  const [hStr, mStr] = time24.split(':');
  const h = Number.parseInt(hStr, 10);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${mStr || '00'} ${period}`;
}

export function getInitials(fullName: string): string {
  const cleaned = fullName.replace(/^Dr\.\s*/i, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'MC';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function getFeeForCategory(
  category: DoctorCategory,
  fees: ConsultationFeeConfig[]
): number {
  const found = fees.find((item) => item.category === category);
  return found ? found.fee : 300;
}

export function buildConsultationBill(appointment: Appointment): ConsultationBill {
  return {
    billId: appointment.billId || appointment.appointmentId.replace('APT-', 'BILL-'),
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctorName,
    doctorCategory: appointment.doctorCategory,
    specialization: appointment.doctorSpecialization,
    appointmentDate: appointment.date,
    appointmentTime: appointment.time,
    appointmentStatus: appointment.status,
    consultationFee: appointment.consultationFee,
    totalAmount: appointment.consultationFee,
    issuedDate: appointment.createdAt || getTodayDateString(),
  };
}

export interface AppointmentValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Mirrors Java OOP Exception Handling rules:
 * - InvalidPatientException
 * - DoctorUnavailableException
 * - PastDateAppointmentException
 * - DuplicateAppointmentException
 */
export function validateAppointmentData(params: {
  patient?: Patient;
  doctor?: Doctor;
  date: string;
  time: string;
  reason: string;
  existingAppointments: Appointment[];
  editingAppointment?: Appointment;
}): AppointmentValidationResult {
  const { patient, doctor, date, time, reason, existingAppointments, editingAppointment } = params;

  if (!patient) {
    return { valid: false, error: 'Please select a registered patient.' };
  }

  if (!doctor) {
    return { valid: false, error: 'Please select a registered doctor.' };
  }

  if (!date) {
    return { valid: false, error: 'Please choose an appointment date.' };
  }

  if (!time) {
    return { valid: false, error: 'Please choose an appointment time slot.' };
  }

  if (!reason.trim()) {
    return { valid: false, error: 'Please enter the reason for visit.' };
  }

  const today = getTodayDateString();
  const isDateChanged = !editingAppointment || editingAppointment.date !== date;
  if (isDateChanged && date < today) {
    return {
      valid: false,
      error: 'Past-date appointments are not permitted. Please select today or an upcoming date.',
    };
  }

  const isDoctorOrSlotChanged =
    !editingAppointment ||
    editingAppointment.doctorId !== doctor.doctorId ||
    editingAppointment.date !== date ||
    editingAppointment.time !== time;

  if (isDoctorOrSlotChanged && doctor.availability !== 'Available') {
    return {
      valid: false,
      error: `${doctor.name} is currently marked Unavailable. Please select an available doctor.`,
    };
  }

  const conflict = existingAppointments.find(
    (apt) =>
      apt.appointmentId !== editingAppointment?.appointmentId &&
      apt.status !== 'Cancelled' &&
      apt.doctorId === doctor.doctorId &&
      apt.date === date &&
      apt.time === time
  );

  if (conflict) {
    return {
      valid: false,
      error: `Duplicate booking prevented: ${doctor.name} already has an appointment (${conflict.appointmentId}) on ${formatReadableDate(date)} at ${formatTime12h(time)}.`,
    };
  }

  return { valid: true };
}
