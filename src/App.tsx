/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ToastContainer } from './components/ui/ToastContainer';
import { PrintableBillSheet } from './components/billing/PrintableBillSheet';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { PatientsPage } from './pages/PatientsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { MedicalRecordsPage } from './pages/MedicalRecordsPage';
import { ConsultationFeesPage } from './pages/ConsultationFeesPage';
import { SettingsPage } from './pages/SettingsPage';

function MediCareShell() {
  const { authSession, activePage, printingAppointment, settings } = useHospital();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!authSession?.isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'doctors':
        return <DoctorsPage />;
      case 'patients':
        return <PatientsPage />;
      case 'appointments':
        return <AppointmentsPage />;
      case 'medical-records':
        return <MedicalRecordsPage />;
      case 'consultation-fees':
        return <ConsultationFeesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#F4F6F9] text-[#0F1E36] no-print">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <div className="flex min-h-screen flex-col lg:pl-[272px]">
          <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
            {renderActivePage()}
          </main>
        </div>
      </div>

      {/* Dedicated Print-Only Bill Layer (rendered solely during window.print()) */}
      {printingAppointment && (
        <div className="print-only-bill">
          <PrintableBillSheet appointment={printingAppointment} settings={settings} />
        </div>
      )}

      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <HospitalProvider>
      <MediCareShell />
    </HospitalProvider>
  );
}
