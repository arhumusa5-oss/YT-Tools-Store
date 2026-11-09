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
        {/* Ambient Soft Red Glow */}
        <div className="absolute w-32 h-32 rounded-full bg-[#660000]/25 dark:bg-[#ff4d4d]/25 blur-3xl animate-pulse pointer-events-none" />

        {/* Circular Buffering Roller */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Static Outer Track */}
          <div className="w-16 h-16 rounded-full border-[3.5px] border-[#e8e1e1] dark:border-white/15" />

          {/* High-speed Rotating Segment (Store Crimson) */}
          <div className="absolute inset-0 rounded-full border-[3.5px] border-transparent border-t-[#660000] border-r-[#990000] dark:border-t-[#ff4d4d] dark:border-r-[#ff8080] animate-spin" />

          {/* Center Play Icon Badge */}
          <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-[#660000] via-[#800000] to-[#990000] flex items-center justify-center shadow-md shadow-[#660000]/30 animate-pulse">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Text Details */}
        {message && (
          <h4 className="mt-4 text-sm sm:text-base font-extrabold tracking-tight text-[#0a0a0a] dark:text-white text-center">
            {message}
          </h4>
        )}
        {displaySubtitle && (
          <p className="mt-1 text-xs text-[#6b7280] dark:text-zinc-400 text-center font-medium max-w-xs">
            {displaySubtitle}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
