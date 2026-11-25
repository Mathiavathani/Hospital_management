import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import {
  formatReadableDate,
  formatTime12h,
  getInitials,
  getTodayDateString,
} from '../../services/storageService';
import type { NavPage } from '../../types/hospital';

const ADMIN_AVATAR_URL = '/src/assets/images/medicare_admin_avatar_1795194287091.jpg';

const PAGE_TITLES: Record<NavPage, string> = {
  dashboard: 'Dashboard Overview',
  doctors: 'Doctor Management',
  patients: 'Patient Management',
  appointments: 'Appointment Management',
  'medical-records': 'Medical Records',
  'consultation-fees': 'Consultation Fees & Billing',
  settings: 'Hospital Settings',
};

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const {
    activePage,
    setActivePage,
    navigateWithIntent,
    doctors,
    patients,
    appointments,
    medicalRecords,
    settings,
    logout,
  } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global search results across all four hospital collections
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedDoctors = doctors
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.doctorId.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedPatients = patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.patientId.toLowerCase().includes(q) ||
          p.phoneNumber.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedAppointments = appointments
      .filter(
        (a) =>
          a.appointmentId.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchedRecords = medicalRecords
      .filter(
        (r) =>
          r.recordId.toLowerCase().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          r.diagnosis.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const total =
      matchedDoctors.length +
      matchedPatients.length +
      matchedAppointments.length +
      matchedRecords.length;

    return {
      total,
      doctors: matchedDoctors,
      patients: matchedPatients,
      appointments: matchedAppointments,
      records: matchedRecords,
    };
  }, [appointments, doctors, medicalRecords, patients, searchQuery]);

  // Dynamic notifications derived strictly from live hospital records
  const notifications = useMemo(() => {
    const today = getTodayDateString();
    const items: {
      id: string;
      title: string;
      detail: string;
      page: NavPage;
      action?: () => void;
    }[] = [];

    const todayScheduled = appointments.filter(
      (a) => a.date === today && a.status === 'Scheduled'
    );
    todayScheduled.slice(0, 3).forEach((apt) => {
      items.push({
        id: `apt-${apt.appointmentId}`,
        title: `Upcoming Today · ${formatTime12h(apt.time)}`,
        detail: `${apt.patientName} with ${apt.doctorName} (${apt.appointmentId})`,
        page: 'appointments',
        action: () =>
          navigateWithIntent('appointments', {
            action: 'view-appointment',
            payload: { id: apt.appointmentId },
          }),
      });
    });

    const unavailableDoctors = doctors.filter((d) => d.availability === 'Unavailable');
    unavailableDoctors.slice(0, 2).forEach((doc) => {
      items.push({
        id: `doc-unavail-${doc.doctorId}`,
        title: `Doctor Unavailable`,
        detail: `${doc.name} (${doc.specialization}) is paused from new bookings.`,
        page: 'doctors',
        action: () =>
          navigateWithIntent('doctors', {
            action: 'view-doctor',
            payload: { id: doc.doctorId },
          }),
      });
    });

    if (items.length === 0 && patients.length > 0) {
      const latest = patients[0];
      items.push({
        id: `pat-${latest.patientId}`,
        title: `Latest Patient Registration`,
        detail: `${latest.name} (${latest.patientId}) registered on ${formatReadableDate(latest.registeredAt)}.`,
        page: 'patients',
        action: () =>
          navigateWithIntent('patients', {
            action: 'view-patient',
            payload: { id: latest.patientId },
          }),
      });
    }

    return items;
  }, [appointments, doctors, navigateWithIntent, patients]);

  const unreadCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;

  const markAllRead = () => {
    setReadNotifIds(notifications.map((n) => n.id));
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 no-print">
      {/* Left: Mobile Menu + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline whitespace-nowrap">MediCare</span>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <span className="font-display text-sm sm:text-base font-bold text-[#0F2544] truncate">
              {PAGE_TITLES[activePage]}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Global Search, Notifications, Admin Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Global search */}
        <div ref={searchRef} className="relative hidden md:block w-64 lg:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search doctors, patients, IDs..."
            aria-label="Search hospital records"
            className="h-9 w-full rounded-lg border border-slate-200 bg-[#F8FAFC] pl-9 pr-8 text-sm text-[#0F1E36] placeholder:text-slate-400 focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Live global search dropdown */}
          {searchFocused && searchResults && (
            <div className="absolute right-0 mt-2 w-96 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-40">
              {searchResults.total === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No records match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.doctors.length > 0 && (
                    <div className="p-2">
                      <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        Doctors
                      </p>
                      {searchResults.doctors.map((doc) => (
                        <button
                          key={doc.doctorId}
                          type="button"
                          onClick={() => {
                            navigateWithIntent('doctors', {
                              action: 'view-doctor',
                              payload: { id: doc.doctorId },
                            });
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#EFF6FF] transition-colors"
                        >
                          <Stethoscope className="h-4 w-4 text-[#2563EB] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#0F2544] truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              <span className="font-mono">{doc.doctorId}</span> · {doc.specialization}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.patients.length > 0 && (
                    <div className="p-2">
                      <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        Patients
                      </p>
                      {searchResults.patients.map((pat) => (
                        <button
                          key={pat.patientId}
                          type="button"
                          onClick={() => {
                            navigateWithIntent('patients', {
                              action: 'view-patient',
                              payload: { id: pat.patientId },
                            });
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#EFF6FF] transition-colors"
                        >
                          <Users className="h-4 w-4 text-[#0284C7] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#0F2544] truncate">
                              {pat.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              <span className="font-mono">{pat.patientId}</span> · {pat.bloodGroup} · {pat.phoneNumber}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.appointments.length > 0 && (
                    <div className="p-2">
                      <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        Appointments
                      </p>
                      {searchResults.appointments.map((apt) => (
                        <button
                          key={apt.appointmentId}
                          type="button"
                          onClick={() => {
                            navigateWithIntent('appointments', {
                              action: 'view-appointment',
                              payload: { id: apt.appointmentId },
                            });
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#EFF6FF] transition-colors"
                        >
                          <CalendarClock className="h-4 w-4 text-[#0F2544] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#0F2544] truncate">
                              {apt.patientName} → {apt.doctorName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              <span className="font-mono">{apt.appointmentId}</span> · {formatReadableDate(apt.date)} · {apt.status}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.records.length > 0 && (
                    <div className="p-2">
                      <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        Medical Records
                      </p>
                      {searchResults.records.map((rec) => (
                        <button
                          key={rec.recordId}
                          type="button"
                          onClick={() => {
                            navigateWithIntent('medical-records', {
                              action: 'view-record',
                              payload: { id: rec.recordId },
                            });
                            setSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#EFF6FF] transition-colors"
                        >
                          <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#0F2544] truncate">
                              {rec.diagnosis}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              <span className="font-mono">{rec.recordId}</span> · {rec.patientName}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#0F2544] transition-colors"
            aria-label={`Clinical alerts (${unreadCount} unread)`}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2563EB] px-1 font-mono text-[10px] font-semibold text-white tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-40 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="font-display text-sm font-bold text-[#0F2544]">
                  Clinical Alerts
                </h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-medium text-[#2563EB] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">
                    No active clinical alerts right now.
                  </p>
                ) : (
                  notifications.map((item) => {
                    const isRead = readNotifIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (!isRead) setReadNotifIds((prev) => [...prev, item.id]);
                          setNotifOpen(false);
                          if (item.action) {
                            item.action();
                          } else {
                            setActivePage(item.page);
                          }
                        }}
                        className={`block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                          isRead ? 'opacity-70' : 'bg-[#EFF6FF]/45'
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#0F2544]">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                          {item.detail}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 hover:bg-slate-50 transition-colors"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {!avatarFailed ? (
              <img
                src={ADMIN_AVATAR_URL}
                alt={settings.adminProfile.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="h-7 w-7 rounded-md object-cover shrink-0"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0F2544] text-xs font-semibold text-white shrink-0">
                {getInitials(settings.adminProfile.name)}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-semibold text-[#0F2544] whitespace-nowrap">
                {settings.adminProfile.name}
              </p>
              <p className="text-[11px] text-slate-500 whitespace-nowrap">
                {settings.adminProfile.role}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-60 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-40"
              role="menu"
            >
              <div className="border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-[#0F2544] truncate">
                  {settings.adminProfile.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{settings.adminProfile.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  setActivePage('settings');
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                Hospital &amp; Admin Settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-rose-600" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
