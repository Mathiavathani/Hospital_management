import type {
  Appointment,
  ConsultationFeeConfig,
  Doctor,
  HospitalSettings,
  MedicalRecord,
  Patient,
} from '../types/hospital';

/** Formats a Date object as local YYYY-MM-DD */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns local YYYY-MM-DD offset by N days from today */
export function getRelativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatLocalDate(d);
}

export const INITIAL_CONSULTATION_FEES: ConsultationFeeConfig[] = [
  {
    category: 'General Physician',
    javaSubclass: 'GeneralDoctor',
    fee: 300,
    defaultSpecializations: ['General Medicine', 'Family Medicine', 'Internal Medicine'],
    description: 'Primary outpatient care, routine checkups, acute illness evaluation, and preventive screening.',
  },
  {
    category: 'Specialist Doctor',
    javaSubclass: 'SpecialistDoctor',
    fee: 700,
    defaultSpecializations: ['Cardiology', 'Orthopedics', 'Dermatology', 'ENT', 'Gynecology'],
    description: 'Focused organ-system diagnostics and specialist outpatient management.',
  },
  {
    category: 'Super Specialist',
    javaSubclass: 'SuperSpecialistDoctor',
    fee: 1200,
    defaultSpecializations: ['Neurology & Neurosurgery', 'Interventional Cardiology', 'Oncology', 'Nephrology'],
    description: 'Sub-specialty tertiary consultations for complex neurological, cardiac, and surgical cases.',
  },
  {
    category: 'Dentist',
    javaSubclass: 'Dentist',
    fee: 400,
    defaultSpecializations: ['Dental & Oral Surgery', 'Orthodontics', 'Endodontics', 'Periodontics'],
    description: 'Comprehensive oral examinations, restorative care, preventive scaling, and dental surgery.',
  },
  {
    category: 'Pediatrician',
    javaSubclass: 'Pediatrician',
    fee: 500,
    defaultSpecializations: ['Pediatrics & Neonatology', 'Child Development', 'Pediatric Pulmonology'],
    description: 'Dedicated care for infants, children, and adolescents including growth monitoring and immunizations.',
  },
];

export const INITIAL_HOSPITAL_SETTINGS: HospitalSettings = {
  hospitalName: 'MediCare Multi-Specialty Hospital',
  hospitalTagline: 'Outpatient Clinical Operations & Patient Care Registry',
  hospitalAddress: '42 Residency Road, Ashok Nagar, Bengaluru, Karnataka 560025',
  contactNumber: '+91 80 4128 7900',
  emergencyContact: '+91 80 4128 7911',
  adminProfile: {
    name: 'Dr. Rajesh Kulkarni',
    email: 'admin@medicare.org',
    role: 'Chief Medical Administrator',
    department: 'Hospital Operations & Records',
    phone: '+91 98450 11204',
  },
};

export function createInitialDoctors(): Doctor[] {
  return [
    {
      doctorId: 'DOC-1001',
      name: 'Dr. Aarav Mehta',
      age: 44,
      gender: 'Male',
      phoneNumber: '+91 98201 44110',
      email: 'aarav.mehta@medicare.org',
      specialization: 'General Medicine',
      category: 'General Physician',
      consultationFee: 300,
      availability: 'Available',
      createdAt: getRelativeDate(-90),
    },
    {
      doctorId: 'DOC-1002',
      name: 'Dr. Priya Nair',
      age: 39,
      gender: 'Female',
      phoneNumber: '+91 98452 77321',
      email: 'priya.nair@medicare.org',
      specialization: 'Cardiology',
      category: 'Specialist Doctor',
      consultationFee: 700,
      availability: 'Available',
      createdAt: getRelativeDate(-82),
    },
    {
      doctorId: 'DOC-1003',
      name: 'Dr. Vikramaditya Rao',
      age: 51,
      gender: 'Male',
      phoneNumber: '+91 99001 58214',
      email: 'vikramaditya.rao@medicare.org',
      specialization: 'Neurology & Neurosurgery',
      category: 'Super Specialist',
      consultationFee: 1200,
      availability: 'Available',
      createdAt: getRelativeDate(-75),
    },
    {
      doctorId: 'DOC-1004',
      name: 'Dr. Ananya Kulkarni',
      age: 35,
      gender: 'Female',
      phoneNumber: '+91 97310 64982',
      email: 'ananya.kulkarni@medicare.org',
      specialization: 'Dental & Oral Surgery',
      category: 'Dentist',
      consultationFee: 400,
      availability: 'Available',
      createdAt: getRelativeDate(-60),
    },
    {
      doctorId: 'DOC-1005',
      name: 'Dr. Rohan Deshmukh',
      age: 41,
      gender: 'Male',
      phoneNumber: '+91 98863 29104',
      email: 'rohan.deshmukh@medicare.org',
      specialization: 'Pediatrics & Neonatology',
      category: 'Pediatrician',
      consultationFee: 500,
      availability: 'Available',
      createdAt: getRelativeDate(-48),
    },
    {
      doctorId: 'DOC-1006',
      name: 'Dr. Kavita Sharma',
      age: 47,
      gender: 'Female',
      phoneNumber: '+91 98114 52079',
      email: 'kavita.sharma@medicare.org',
      specialization: 'Orthopedics',
      category: 'Specialist Doctor',
      consultationFee: 700,
      availability: 'Unavailable',
      createdAt: getRelativeDate(-30),
    },
  ];
}

export function createInitialPatients(): Patient[] {
  return [
    {
      patientId: 'PAT-2001',
      name: 'Siddharth Verma',
      age: 34,
      gender: 'Male',
      phoneNumber: '+91 98451 30192',
      email: 'siddharth.verma@example.com',
      address: '18 Indiranagar 2nd Stage, Bengaluru 560038',
      bloodGroup: 'O+',
      medicalHistory: 'Seasonal allergic rhinitis; no known drug allergies.',
      registeredAt: getRelativeDate(-42),
    },
    {
      patientId: 'PAT-2002',
      name: 'Meera Krishnan',
      age: 58,
      gender: 'Female',
      phoneNumber: '+91 99804 71285',
      email: 'meera.krishnan@example.com',
      address: '74 Jayanagar 4th Block, Bengaluru 560011',
      bloodGroup: 'A+',
      medicalHistory: 'Type 2 Diabetes Mellitus (managed with oral therapy), Essential Hypertension (controlled).',
      registeredAt: getRelativeDate(-38),
    },
    {
      patientId: 'PAT-2003',
      name: 'Arjun Patel',
      age: 29,
      gender: 'Male',
      phoneNumber: '+91 97412 88304',
      email: 'arjun.patel@example.com',
      address: '204 Koramangala 6th Block, Bengaluru 560095',
      bloodGroup: 'B+',
      medicalHistory: 'Prior right ankle ligament sprain (2024); otherwise healthy.',
      registeredAt: getRelativeDate(-29),
    },
    {
      patientId: 'PAT-2004',
      name: 'Sneha Joshi',
      age: 42,
      gender: 'Female',
      phoneNumber: '+91 98802 65491',
      email: 'sneha.joshi@example.com',
      address: '11 Malleswaram 8th Cross, Bengaluru 560003',
      bloodGroup: 'AB+',
      medicalHistory: 'Recurrent migraine without aura; mild iron deficiency anemia.',
      registeredAt: getRelativeDate(-24),
    },
    {
      patientId: 'PAT-2005',
      name: 'Kabir Malhotra',
      age: 8,
      gender: 'Male',
      phoneNumber: '+91 99018 44219',
      email: 'parent.malhotra@example.com',
      address: '59 HSR Layout Sector 2, Bengaluru 560102',
      bloodGroup: 'O+',
      medicalHistory: 'Mild intermittent childhood asthma; all routine pediatric immunizations up to date.',
      registeredAt: getRelativeDate(-19),
    },
    {
      patientId: 'PAT-2006',
      name: 'Lakshmi Subramanian',
      age: 64,
      gender: 'Female',
      phoneNumber: '+91 98457 21908',
      email: 'lakshmi.subramanian@example.com',
      address: '9 Basavanagudi Bull Temple Rd, Bengaluru 560004',
      bloodGroup: 'B-',
      medicalHistory: 'Osteoarthritis of right knee, subclinical hypothyroidism.',
      registeredAt: getRelativeDate(-12),
    },
    {
      patientId: 'PAT-2007',
      name: 'Aditya Chatterjee',
      age: 37,
      gender: 'Male',
      phoneNumber: '+91 96115 39024',
      email: 'aditya.chatterjee@example.com',
      address: '302 Whitefield Main Road, Bengaluru 560066',
      bloodGroup: 'A-',
      medicalHistory: 'Periodic molar sensitivity; routine preventive dental care.',
      registeredAt: getRelativeDate(-6),
    },
    {
      patientId: 'PAT-2008',
      name: 'Fatima Siddiqui',
      age: 31,
      gender: 'Female',
      phoneNumber: '+91 97390 81453',
      email: 'fatima.siddiqui@example.com',
      address: '45 Frazer Town Mosque Road, Bengaluru 560005',
      bloodGroup: 'O-',
      medicalHistory: 'History of mild vitamin D insufficiency; no chronic conditions.',
      registeredAt: getRelativeDate(-2),
    },
  ];
}

export function createInitialAppointments(): Appointment[] {
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const dayAfter = getRelativeDate(2);

  return [
    {
      appointmentId: 'APT-3001',
      billId: 'BILL-5001',
      patientId: 'PAT-2002',
      doctorId: 'DOC-1002',
      patientName: 'Meera Krishnan',
      doctorName: 'Dr. Priya Nair',
      doctorSpecialization: 'Cardiology',
      doctorCategory: 'Specialist Doctor',
      date: today,
      time: '10:00',
      reason: 'Quarterly cardiac review, blood pressure trend evaluation, and routine ECG.',
      consultationFee: 700,
      status: 'Scheduled',
      createdAt: getRelativeDate(-3),
    },
    {
      appointmentId: 'APT-3002',
      billId: 'BILL-5002',
      patientId: 'PAT-2005',
      doctorId: 'DOC-1005',
      patientName: 'Kabir Malhotra',
      doctorName: 'Dr. Rohan Deshmukh',
      doctorSpecialization: 'Pediatrics & Neonatology',
      doctorCategory: 'Pediatrician',
      date: today,
      time: '11:30',
      reason: 'Pediatric respiratory follow-up and spacer inhaler technique review.',
      consultationFee: 500,
      status: 'Scheduled',
      createdAt: getRelativeDate(-2),
    },
    {
      appointmentId: 'APT-3003',
      billId: 'BILL-5003',
      patientId: 'PAT-2001',
      doctorId: 'DOC-1001',
      patientName: 'Siddharth Verma',
      doctorName: 'Dr. Aarav Mehta',
      doctorSpecialization: 'General Medicine',
      doctorCategory: 'General Physician',
      date: today,
      time: '09:30',
      reason: 'Three-day low-grade fever, sore throat, and fatigue assessment.',
      consultationFee: 300,
      status: 'Completed',
      createdAt: getRelativeDate(-1),
    },
    {
      appointmentId: 'APT-3004',
      billId: 'BILL-5004',
      patientId: 'PAT-2004',
      doctorId: 'DOC-1003',
      patientName: 'Sneha Joshi',
      doctorName: 'Dr. Vikramaditya Rao',
      doctorSpecialization: 'Neurology & Neurosurgery',
      doctorCategory: 'Super Specialist',
      date: tomorrow,
      time: '14:00',
      reason: 'Neurological review for recurrent occipital headaches and preventive regimen.',
      consultationFee: 1200,
      status: 'Scheduled',
      createdAt: getRelativeDate(-1),
    },
    {
      appointmentId: 'APT-3005',
      billId: 'BILL-5005',
      patientId: 'PAT-2007',
      doctorId: 'DOC-1004',
      patientName: 'Aditya Chatterjee',
      doctorName: 'Dr. Ananya Kulkarni',
      doctorSpecialization: 'Dental & Oral Surgery',
      doctorCategory: 'Dentist',
      date: dayAfter,
      time: '16:00',
      reason: 'Annual oral scaling and lower molar thermal sensitivity check.',
      consultationFee: 400,
      status: 'Cancelled',
      createdAt: getRelativeDate(-2),
    },
  ];
}

export function createInitialMedicalRecords(): MedicalRecord[] {
  return [
    {
      recordId: 'REC-4001',
      patientId: 'PAT-2001',
      patientName: 'Siddharth Verma',
      doctorId: 'DOC-1001',
      doctorName: 'Dr. Aarav Mehta',
      consultationDate: getRelativeDate(0),
      diagnosis: 'Acute Viral Upper Respiratory Tract Infection',
      symptoms: 'Low-grade fever (100.4°F), mild pharyngeal irritation, nasal congestion, general malaise.',
      treatmentNotes: 'Advise 48 hours rest, warm saline gargles twice daily, adequate oral fluids. Review if fever exceeds 102°F.',
      prescriptionNotes: 'Paracetamol 500mg PO SOS (max 3 tablets/24h); Cetirizine 10mg PO HS for 5 days.',
      createdAt: getRelativeDate(0),
    },
    {
      recordId: 'REC-4002',
      patientId: 'PAT-2002',
      patientName: 'Meera Krishnan',
      doctorId: 'DOC-1002',
      doctorName: 'Dr. Priya Nair',
      consultationDate: getRelativeDate(-14),
      diagnosis: 'Essential Hypertension (Well Controlled)',
      symptoms: 'Routine outpatient checkup; occasional mild lightheadedness upon rapid standing. BP 126/80 mmHg.',
      treatmentNotes: 'Continue DASH low-sodium diet, 30-minute daily brisk walk, maintain home BP diary for quarterly review.',
      prescriptionNotes: 'Amlodipine 5mg OD morning; Metformin SR 500mg BD after meals.',
      createdAt: getRelativeDate(-14),
    },
    {
      recordId: 'REC-4003',
      patientId: 'PAT-2004',
      patientName: 'Sneha Joshi',
      doctorId: 'DOC-1003',
      doctorName: 'Dr. Vikramaditya Rao',
      consultationDate: getRelativeDate(-28),
      diagnosis: 'Migraine Without Aura',
      symptoms: 'Unilateral throbbing temporal headache lasting 6–8 hours, mild photophobia, no visual aura.',
      treatmentNotes: 'Maintain headache trigger log, consistent sleep schedule, hydrate regularly, reduce continuous screen strain.',
      prescriptionNotes: 'Sumatriptan 50mg PO at headache onset (max 100mg/day); Magnesium Glycinate 400mg nightly.',
      createdAt: getRelativeDate(-28),
    },
    {
      recordId: 'REC-4004',
      patientId: 'PAT-2005',
      patientName: 'Kabir Malhotra',
      doctorId: 'DOC-1005',
      doctorName: 'Dr. Rohan Deshmukh',
      consultationDate: getRelativeDate(-21),
      diagnosis: 'Mild Intermittent Pediatric Asthma',
      symptoms: 'Occasional nocturnal dry cough during seasonal shifts; mild expiratory wheeze on exertion.',
      treatmentNotes: 'Reviewed metered-dose inhaler + spacer technique with parent. Minimize bedroom dust allergens.',
      prescriptionNotes: 'Budesonide 100mcg MDI 1 puff BD via spacer; Salbutamol 100mcg PRN rescue inhaler.',
      createdAt: getRelativeDate(-21),
    },
  ];
}

export interface JavaOopConceptSpec {
  concept: string;
  javaClassOrMember: string;
  hospitalApplication: string;
  snippet: string;
}

export const JAVA_OOP_CONCEPTS: JavaOopConceptSpec[] = [
  {
    concept: '1. Encapsulation',
    javaClassOrMember: 'private fields + getters/setters in Person, Doctor, Patient, Appointment',
    hospitalApplication: 'Protects clinical state such as consultationFee, medicalHistory, and appointment status from invalid direct mutation.',
    snippet: `public class Patient extends Person {
    private final String patientId;
    private String bloodGroup;
    private String medicalHistory;

    public String getPatientId() { return patientId; }
    public void setMedicalHistory(String history) {
        if (history == null) throw new IllegalArgumentException("History required");
        this.medicalHistory = history;
    }
}`,
  },
  {
    concept: '2. Abstraction',
    javaClassOrMember: 'public abstract class Person { abstract String displayDetails(); }',
    hospitalApplication: 'Captures shared attributes (name, age, gender, phoneNumber) while requiring Doctor and Patient subclasses to define displayDetails().',
    snippet: `public abstract class Person {
    private String name;
    private int age;
    private String gender;
    private String phoneNumber;

    public abstract String displayDetails();
}`,
  },
  {
    concept: '3. Inheritance',
    javaClassOrMember: 'Doctor extends Person · Patient extends Person · 5 Doctor Subclasses',
    hospitalApplication: 'GeneralDoctor, SpecialistDoctor, SuperSpecialistDoctor, Dentist, and Pediatrician inherit shared doctor behavior from Doctor.',
    snippet: `public class Doctor extends Person {
    private String doctorId;
    private String specialization;
    private String category;
    private double consultationFee;
    private boolean available;

    public double calculateFee() { return consultationFee; }
}`,
  },
  {
    concept: '4. Polymorphism & 5. Method Overriding',
    javaClassOrMember: '@Override calculateFee() across GeneralDoctor, SpecialistDoctor, SuperSpecialistDoctor, Dentist, Pediatrician',
    hospitalApplication: 'Each doctor category dynamically determines its own consultation fee (₹300, ₹700, ₹1200, ₹400, ₹500) at runtime.',
    snippet: `public class SuperSpecialistDoctor extends Doctor {
    @Override
    public double calculateFee() {
        return 1200.0; // Overridden fee policy
    }

    @Override
    public String displayDetails() {
        return getName() + " (Super Specialist · ₹" + calculateFee() + ")";
    }
}`,
  },
  {
    concept: '6. Interface Implementation',
    javaClassOrMember: 'public interface Bookable { Appointment bookAppointment(...); void cancelAppointment(String id); }',
    hospitalApplication: 'HospitalManagementSystem implements Bookable to guarantee a clean scheduling contract.',
    snippet: `public interface Bookable {
    Appointment bookAppointment(Patient patient, Doctor doctor, String date, String time, String reason);
    void cancelAppointment(String appointmentId);
}`,
  },
  {
    concept: '7. Method Overloading',
    javaClassOrMember: 'Multiple bookAppointment(...) signatures in HospitalManagementSystem',
    hospitalApplication: 'Supports booking by entity objects or by string IDs (patientId, doctorId) with optional default reason.',
    snippet: `public Appointment bookAppointment(Patient p, Doctor d, String date, String time, String reason) { ... }

public Appointment bookAppointment(String patientId, String doctorId, String date, String time) {
    return bookAppointment(findPatient(patientId), findDoctor(doctorId), date, time, "General Consultation");
}`,
  },
  {
    concept: '8. Exception Handling',
    javaClassOrMember: 'InvalidPatientException · DoctorUnavailableException · DuplicateAppointmentException',
    hospitalApplication: 'Mirrored in MediCare validation rules: blocks invalid inputs, past dates, unavailable doctors, and duplicate doctor time slots.',
    snippet: `if (!doctor.isAvailable()) {
    throw new DoctorUnavailableException(doctor.getName() + " is currently unavailable.");
}
if (hasConflict(doctor.getDoctorId(), date, time)) {
    throw new DuplicateAppointmentException("Slot already booked for " + doctor.getName());
}`,
  },
];
