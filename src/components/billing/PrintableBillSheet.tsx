import React from 'react';
import {
  buildConsultationBill,
  formatINR,
  formatReadableDate,
  formatTime12h,
} from '../../services/storageService';
import type { Appointment, HospitalSettings } from '../../types/hospital';
import { BrandLogo } from '../ui/BrandLogo';

interface PrintableBillSheetProps {
  appointment: Appointment;
  settings: HospitalSettings;
}

/**
 * Clean formal hospital consultation receipt rendered both on-screen in Consultation Fees
 * and in the dedicated @media print container when printing.
 */
export function PrintableBillSheet({ appointment, settings }: PrintableBillSheetProps) {
  const bill = buildConsultationBill(appointment);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-[#0F1E36]">
      {/* Letterhead */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <BrandLogo variant="dark" />
          <p className="mt-3 text-sm font-semibold text-[#0F2544]">{settings.hospitalName}</p>
          <p className="mt-0.5 text-xs text-slate-500 max-w-sm leading-relaxed">
            {settings.hospitalAddress}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
            Tel: {settings.contactNumber}
          </p>
        </div>

        <div className="sm:text-right">
          <p className="font-display text-lg font-bold text-[#0F2544]">
            Consultation Bill
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-[#2563EB] tabular-nums">
            {bill.billId}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Issued: <span className="font-mono tabular-nums text-slate-700">{formatReadableDate(bill.issuedDate)}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Appointment Ref: <span className="font-mono tabular-nums text-slate-700">{bill.appointmentId}</span>
          </p>
        </div>
      </div>

      {/* Patient & Doctor Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200 py-5">
        <div>
          <p className="text-xs font-semibold text-slate-400">Patient Details</p>
          <p className="mt-1.5 font-display text-base font-bold text-[#0F2544]">
            {bill.patientName}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
            Patient ID: {bill.patientId}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400">Consulting Physician</p>
          <p className="mt-1.5 font-display text-base font-bold text-[#0F2544]">
            {bill.doctorName}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {bill.specialization} · {bill.doctorCategory}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
            Visit Date: {formatReadableDate(bill.appointmentDate)} at {formatTime12h(bill.appointmentTime)}
          </p>
        </div>
      </div>

      {/* Line Item Table */}
      <div className="py-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
              <th className="py-2.5 pr-4">Description</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 pl-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr>
              <td className="py-3.5 pr-4">
                <p className="font-medium text-[#0F2544]">
                  Outpatient Medical Consultation ({bill.specialization})
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Recorded rate at booking time ({bill.appointmentStatus})
                </p>
              </td>
              <td className="py-3.5 px-4 text-slate-600">{bill.doctorCategory}</td>
              <td className="py-3.5 pl-4 text-right font-mono font-medium text-[#0F2544] tabular-nums">
                {formatINR(bill.consultationFee)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Summary totals */}
        <div className="mt-4 flex justify-end border-t border-slate-200 pt-4">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Consultation Fee</span>
              <span className="font-mono tabular-nums">{formatINR(bill.consultationFee)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Hospital Service Tax</span>
              <span className="font-mono tabular-nums">₹0</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 font-display text-base font-bold text-[#0F2544]">
              <span>Total Amount</span>
              <span className="font-mono tabular-nums text-[#0F2544]">
                {formatINR(bill.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Footer */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <p>Demo Consultation Receipt · Computer-generated invoice requires no physical signature.</p>
        <p className="font-mono tabular-nums">Status: {bill.appointmentStatus}</p>
      </div>
    </div>
  );
}
