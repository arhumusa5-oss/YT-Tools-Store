'use client';

import { useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

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
  const {
    isCheckoutOpen,
    checkoutItems,
    activeProductModal,
    isCartOpen,
    cart,
    orderSuccess,
  } = useCart();

  const lastActivitySignatureRef = useRef<string>('');

  // Compute live activity and details in real-time
  const { currentActivity, activityDetails } = useMemo(() => {
    if (isCheckoutOpen) {
      const details =
        checkoutItems.length === 1
          ? checkoutItems[0].title
          : checkoutItems.length > 1
          ? `${checkoutItems[0].title} (+${checkoutItems.length - 1} more)`
          : 'Checkout Modal';
      return {
        currentActivity: 'checkout',
        activityDetails: details,
      };
    }

    if (activeProductModal) {
      return {
        currentActivity: 'product_modal',
        activityDetails: activeProductModal.title,
      };
    }

    if (isCartOpen) {
      const details =
        cart.length > 0
          ? `${cart.length} item${cart.length === 1 ? '' : 's'} in cart`
          : 'Cart Drawer (Empty)';
      return {
        currentActivity: 'cart_drawer',
        activityDetails: details,
      };
    }

    if (orderSuccess) {
      return {
        currentActivity: 'order_success',
        activityDetails: `Order #${orderSuccess.id}`,
      };
    }

    if (pathname?.startsWith('/pay/')) {
      const payId = pathname.split('/')[2] || '';
      return {
        currentActivity: 'invoice_pay',
        activityDetails: payId ? `Invoice #${payId}` : 'Invoice Payment',
      };
    }

    if (pathname === '/track-order') {
      return {
        currentActivity: 'track_order',
        activityDetails: 'Order Tracker',
      };
    }

    if (pathname === '/profile') {
      return {
        currentActivity: 'profile',
        activityDetails: 'User Profile',
      };
    }

    if (pathname === '/login') {
      return {
        currentActivity: 'login',
        activityDetails: 'Sign In Page',
      };
    }

    if (pathname === '/') {
      return {
        currentActivity: 'browsing',
        activityDetails: 'Catalog / Home',
      };
    }

    return {
      currentActivity: 'viewing_page',
      activityDetails: pathname || '/',
    };
  }, [
    pathname,
    isCheckoutOpen,
    checkoutItems,
    activeProductModal,
    isCartOpen,
    cart,
    orderSuccess,
  ]);

  // Track pageviews & live activity state changes
  useEffect(() => {
    // Never track admin panel pages or admin users ("hamain hata kr")
    if (!pathname || pathname.startsWith('/admin') || isUserAdmin()) {
      return;
    }

    const activitySignature = `${pathname}::${currentActivity}::${activityDetails}`;
    const visitorId = getOrSetVisitorId();
    const sessionId = getOrSetSessionId();
    const deviceType = getDeviceType();

    // Check if activity changed
    const activityChanged = lastActivitySignatureRef.current !== activitySignature;
    lastActivitySignatureRef.current = activitySignature;

    const sendTrack = async (isPageView: boolean) => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            type: isPageView ? 'pageview' : 'heartbeat',
            visitorId,
            sessionId,
            path: pathname,
            title: typeof document !== 'undefined' ? document.title : '',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            deviceType,
            currentActivity,
            activityDetails,
            isAdmin: false,
          }),
        });
      } catch {
        // Silent catch: Analytics failure must never disrupt user experience
      }
    };

    if (activityChanged) {
      sendTrack(true);
    }

    // Heartbeat every 20 seconds for continuous active radar
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isUserAdmin()) {
        sendTrack(false);
      }
    }, 20000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isUserAdmin()) {
        sendTrack(false);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname, currentActivity, activityDetails]);

  return null;
}
