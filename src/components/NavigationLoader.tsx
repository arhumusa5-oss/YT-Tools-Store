'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationLoader() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  const clearAllTimers = () => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    if (trickleTimerRef.current) {
      clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const completeBar = () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearAllTimers();
    setProgress(100);
    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  };

  // Instantly finish the slim bar as soon as the destination pathname renders
  useEffect(() => {
    completeBar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const startBar = () => {
      clearAllTimers();
      activeRef.current = true;
      setVisible(true);
      setProgress(22);

      trickleTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          const step = prev < 55 ? 12 : 4;
          return Math.min(85, prev + step);
        });
      }, 140);

      // Safety cleanup if navigation cancels or exceeds 5s
      safetyTimerRef.current = setTimeout(() => {
        completeBar();
      }, 5000);
    };

    const handleLinkClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank'
      ) {
        const cleanHref = href.split('?')[0].split('#')[0];
        const cleanPathname = pathname.split('?')[0].split('#')[0];
        if (cleanHref === cleanPathname) return;
        startBar();
      }
    };

    const handleCustomNav = () => {
      startBar();
    };

    const handlePopState = () => {
      startBar();
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('yt-nav-start', handleCustomNav);

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('yt-nav-start', handleCustomNav);
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-[#660000] via-[#cc1111] to-[#ff4d4d] shadow-[0_0_12px_rgba(204,17,17,0.75)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
