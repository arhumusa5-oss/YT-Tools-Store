'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play } from 'lucide-react';

interface BufferingLoaderProps {
  message?: string;
  subtitle?: string;
  submessage?: string;
  show?: boolean;
}

export default function BufferingLoader({
  message = 'Loading...',
  subtitle,
  submessage,
  show = true,
}: BufferingLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (show && mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [show, mounted]);

  if (!show || !mounted) return null;

  const displaySubtitle = subtitle || submessage || 'Please wait a moment';

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[999999] w-screen h-screen bg-white/98 dark:bg-[#060608]/98 backdrop-blur-2xl flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Ambient Soft Orange Glow */}
        <div className="absolute w-32 h-32 rounded-full bg-orange-500/20 blur-3xl animate-pulse pointer-events-none" />

        {/* Circular Buffering Roller */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Static Outer Track */}
          <div className="w-16 h-16 rounded-full border-[3.5px] border-[#222228]" />

          {/* High-speed Rotating Segment (Brand Orange) */}
          <div className="absolute inset-0 rounded-full border-[3.5px] border-transparent border-t-[#FF5500] border-r-[#FFAA66] animate-spin" />

          {/* Center Play Icon Badge */}
          <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5500] to-[#E64A00] flex items-center justify-center shadow-md shadow-orange-950/40 animate-pulse">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Text Details */}
        {message && (
          <h4 className="mt-4 text-sm sm:text-base font-extrabold tracking-tight text-white text-center">
            {message}
          </h4>
        )}
        {displaySubtitle && (
          <p className="mt-1 text-xs text-zinc-400 text-center font-medium max-w-xs">
            {displaySubtitle}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
