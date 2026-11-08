'use client';

import React from 'react';
import { Play } from 'lucide-react';

interface BufferingLoaderProps {
  message?: string;
  subtitle?: string;
  show?: boolean;
}

export default function BufferingLoader({
  message = 'Loading...',
  subtitle = 'Please wait a moment',
  show = true,
}: BufferingLoaderProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[99999] bg-white/80 dark:bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col items-center">
        {/* Ambient Soft Red Glow */}
        <div className="absolute w-24 h-24 rounded-full bg-[#660000]/20 dark:bg-[#ff4d4d]/25 blur-2xl animate-pulse pointer-events-none" />

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
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#6b7280] dark:text-zinc-400 text-center font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
