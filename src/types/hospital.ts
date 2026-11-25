/**
 * Domain models for MediCare – Hospital Appointment & Patient Management System.
 *
 * Entities are deliberately structured to mirror the separate Java OOP class hierarchy:
 *   - abstract class Person { name, age, gender, phoneNumber, displayDetails() }
 *   - class Doctor extends Person (with subclasses GeneralDoctor, SpecialistDoctor,
 *     SuperSpecialistDoctor, Dentist, Pediatrician)
 *   - class Patient extends Person
 *   - interface Bookable { bookAppointment(), cancelAppointment() }
 *   - class Appointment, MedicalRecord, Consultation, HospitalManagementSystem
 */

export type Gender = 'Male' | 'Female' | 'Other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type DoctorCategory =
  | 'General Physician'
  | 'Specialist Doctor'
  | 'Super Specialist'
  | 'Dentist'
  | 'Pediatrician';

export type AvailabilityStatus = 'Available' | 'Unavailable';

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export type NavPage =
  | 'dashboard'
  | 'doctors'
  | 'patients'
  | 'appointments'
  | 'medical-records'
  | 'consultation-fees'
  | 'settings';

/** Mirrors Java abstract class Person */
export interface Person {
  name: string;
  age: number;
  gender: Gender;
  phoneNumber: string;
}

/** Mirrors Java Doctor extends Person (+ 5 polymorphic subclasses) */
export interface Doctor extends Person {
  doctorId: string;
  email: string;
  specialization: string;
  category: DoctorCategory;
  consultationFee: number;
  availability: AvailabilityStatus;
  createdAt: string;
}

/** Mirrors Java Patient extends Person */
export interface Patient extends Person {
  patientId: string;
  email: string;
  address: string;
  bloodGroup: BloodGroup;
  medicalHistory: string;
  registeredAt: string;
}

/** Mirrors Java Appointment (managed via Bookable interface) */
export interface Appointment {
  appointmentId: string;
  billId: string;
  patientId: string;
  doctorId: string;
  /** Snapshot fields preserved so historical records & bills remain accurate */
  patientName: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorCategory: DoctorCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  /** Immutable fee recorded at booking time; future fee changes never overwrite past bills */
  consultationFee: number;
  status: AppointmentStatus;
  createdAt: string;
}

/** Mirrors Java MedicalRecord */
export interface MedicalRecord {
  recordId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  consultationDate: string; // YYYY-MM-DD
  diagnosis: string;
  symptoms: string;
  treatmentNotes: string;
  prescriptionNotes: string;
  createdAt: string;
}

/** Mirrors Java Consultation Fee polymorphism mapping per Doctor subclass */
export interface ConsultationFeeConfig {
  category: DoctorCategory;
  javaSubclass: string;
  fee: number;
  defaultSpecializations: string[];
  description: string;
}

export interface ConsultationBill {
  billId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorCategory: DoctorCategory;
  specialization: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentStatus: AppointmentStatus;
  consultationFee: number;
  totalAmount: number;
  issuedDate: string;
}

export interface AdminProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
}

export interface HospitalSettings {
  hospitalName: string;
  hospitalTagline: string;
  hospitalAddress: string;
  contactNumber: string;
  emergencyContact: string;
  adminProfile: AdminProfile;
}

export interface AuthSession {
  isAuthenticated: boolean;
  email: string;
  loggedInAt: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export interface PageActionIntent {
  action: 'open-add-doctor' | 'open-add-patient' | 'open-book-appointment' | 'open-add-record' | 'select-bill' | 'view-doctor' | 'view-patient' | 'view-appointment' | 'view-record';
  payload?: {
    id?: string;
    patientId?: string;
    doctorId?: string;
    date?: string;
  };
}

export const DOCTOR_CATEGORIES: DoctorCategory[] = [
  'General Physician',
  'Specialist Doctor',
  'Super Specialist',
  'Dentist',
  'Pediatrician',
];

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

export const TIME_SLOTS: string[] = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
];

export const CATEGORY_TO_JAVA_CLASS: Record<DoctorCategory, string> = {
  'General Physician': 'GeneralDoctor',
  'Specialist Doctor': 'SpecialistDoctor',
  'Super Specialist': 'SuperSpecialistDoctor',
  'Dentist': 'Dentist',
  'Pediatrician': 'Pediatrician',
};
