import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export function BrandLogo({ variant = 'light', compact = false }: BrandLogoProps) {
  const isLightText = variant === 'light';

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isLightText
            ? 'bg-[#2563EB] text-white'
            : 'bg-[#0F2544] text-white'
        }`}
        aria-hidden="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.5 3.5H14.5V9.5H20.5V14.5H14.5V20.5H9.5V14.5H3.5V9.5H9.5V3.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <span
            className={`block font-display text-[17px] font-bold tracking-tight leading-tight whitespace-nowrap ${
              isLightText ? 'text-white' : 'text-[#0F2544]'
            }`}
          >
            MediCare
          </span>
          <span
            className={`block text-[11px] font-medium leading-tight whitespace-nowrap ${
              isLightText ? 'text-slate-300/80' : 'text-slate-500'
            }`}
          >
            Hospital Management
          </span>
        </div>
      )}
    </div>
  );
}
