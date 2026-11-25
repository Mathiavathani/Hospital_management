import React from 'react';
import {
  CalendarClock,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Settings,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import type { NavPage } from '../../types/hospital';
import { BrandLogo } from '../ui/BrandLogo';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'doctors', label: 'Doctor Management', icon: Stethoscope },
  { id: 'patients', label: 'Patient Management', icon: Users },
  { id: 'appointments', label: 'Appointment Management', icon: CalendarClock },
  { id: 'medical-records', label: 'Medical Records', icon: FileText },
  { id: 'consultation-fees', label: 'Consultation Fees', icon: IndianRupee },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activePage, setActivePage, settings } = useHospital();

  const handleSelect = (page: NavPage) => {
    setActivePage(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0F2544] text-white">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5 shrink-0">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="text-left focus-visible:outline-white rounded-md"
        >
          <BrandLogo variant="light" />
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1D3E6E] text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive ? 'text-[#60A5FA]' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quiet hospital footer */}
      <div className="border-t border-white/10 px-5 py-4 shrink-0">
        <p className="text-xs font-semibold text-white/90 truncate">
          {settings.hospitalName}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-300/80 tabular-nums truncate">
          {settings.contactNumber}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed left sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-[272px] no-print">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-[#09172B]/55 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full w-72 max-w-[82vw] shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
