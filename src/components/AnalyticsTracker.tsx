'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getOrSetVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let vid = localStorage.getItem('yt_vid');
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('yt_vid', vid);
    }
    return vid;
  } catch {
    return `v_anon_${Date.now()}`;
  }
}

function getOrSetSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem('yt_sid');
    let lastActive = parseInt(sessionStorage.getItem('yt_sid_time') || '0', 10);
    const now = Date.now();

    // Expire session after 30 minutes of inactivity
    if (!sid || !lastActive || now - lastActive > 30 * 60 * 1000) {
      sid = `s_${now}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('yt_sid', sid);
    }
    sessionStorage.setItem('yt_sid_time', String(now));
    return sid;
  } catch {
    return `s_anon_${Date.now()}`;
  }
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // If user has admin token in localStorage or cookie, exclude from analytics
    return Boolean(localStorage.getItem('yt_admin_token'));
  } catch {
    return false;
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // Never track admin panel pages or admin users ("hamain hata kr")
    if (!pathname || pathname.startsWith('/admin') || isUserAdmin()) {
      return;
    }

    // Prevent duplicate pageview triggers on identical path
    if (lastPathRef.current === pathname) {
      return;
    }
    lastPathRef.current = pathname;

    const visitorId = getOrSetVisitorId();
    const sessionId = getOrSetSessionId();
    const deviceType = getDeviceType();

    const trackPageview = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            type: 'pageview',
            visitorId,
            sessionId,
            path: pathname,
            title: typeof document !== 'undefined' ? document.title : '',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            deviceType,
            isAdmin: false,
          }),
        });
      } catch {
        // Silent catch: Analytics failure must never disrupt user experience
      }
    };

    // Small delay to ensure document title is set
    const timer = setTimeout(trackPageview, 250);

    // Heartbeat every 30 seconds for live active visitors
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isUserAdmin()) {
        try {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              type: 'heartbeat',
              visitorId,
              sessionId,
              path: pathname,
              deviceType,
              isAdmin: false,
            }),
          });
        } catch {
          // ignore
        }
      }
    }, 30000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isUserAdmin()) {
        try {
          fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              type: 'heartbeat',
              visitorId,
              sessionId,
              path: pathname,
              deviceType,
              isAdmin: false,
            }),
          });
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(timer);
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);

  return null;
}
