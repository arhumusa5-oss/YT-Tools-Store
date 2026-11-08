'use client';

import React from 'react';

interface EasyPaisaLogoProps {
  customLogoUrl?: string;
  className?: string;
}

export default function EasyPaisaLogo({
  customLogoUrl,
  className = 'w-9 h-9',
}: EasyPaisaLogoProps) {
  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="EasyPaisa"
        className={`${className} object-contain rounded-xl`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-xl bg-[#009E49] flex items-center justify-center p-1.5 shadow-xs shrink-0 select-none`}
      title="EasyPaisa"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-white"
      >
        <rect
          x="12"
          y="4"
          width="24"
          height="40"
          rx="6"
          stroke="currentColor"
          strokeWidth="3.5"
          fill="none"
        />
        <line
          x1="20"
          y1="9"
          x2="28"
          y2="9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="24" cy="38" r="2" fill="currentColor" />
        <path
          d="M17 18C17 15.8 18.8 14 21.5 14H26C28.5 14 30.5 15.8 30.5 18C30.5 20.2 28.5 22 26 22H20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 22V29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
