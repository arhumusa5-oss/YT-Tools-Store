'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BufferingLoader from './BufferingLoader';

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMessage, setNavMessage] = useState('Loading Store Catalog...');
  const [navSubtitle, setNavSubtitle] = useState('Please wait a moment...');
  const navStartTimeRef = useRef<number>(0);

  // When pathname changes (destination page has mounted), ensure smooth minimum duration (~1.3s)
  // so that even pages that load instantly play the smooth buffering roller instead of opening raw!
  useEffect(() => {
    if (!isNavigating) return;

    const elapsed = Date.now() - navStartTimeRef.current;
    const minDisplayTime = 1300; // ~1.3s for smooth buffering experience
    const remaining = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [pathname, isNavigating]);

  useEffect(() => {
    const triggerNavigation = (cleanHref: string) => {
      let msg = 'Loading...';
      let sub = 'Please wait a moment...';

      if (cleanHref === '/cart') {
        msg = 'Loading Shopping Cart...';
        sub = 'Reviewing your selected creator tools...';
      } else if (cleanHref === '/checkout') {
        msg = 'Preparing Checkout...';
        sub = 'Setting up secure checkout & payment...';
      } else if (cleanHref.startsWith('/track-order') || cleanHref.startsWith('/track')) {
        msg = 'Loading Order Tracker...';
        sub = 'Connecting to real-time order tracking...';
      } else if (cleanHref === '/') {
        msg = 'Loading Store Catalog...';
        sub = 'Returning to creator subscriptions & tools...';
      } else if (cleanHref.startsWith('/bundle')) {
        msg = 'Loading Creator Bundles...';
        sub = 'Preparing custom software bundles...';
      } else if (cleanHref.startsWith('/order-success')) {
        msg = 'Loading Order Receipt...';
        sub = 'Verifying confirmed order details...';
      } else if (cleanHref.startsWith('/pay/')) {
        msg = 'Loading Official Invoice...';
        sub = 'Retrieving secure payment details...';
      }

      setNavMessage(msg);
      setNavSubtitle(sub);
      navStartTimeRef.current = Date.now();
      setIsNavigating(true);

      // Safety timeout so it never hangs indefinitely
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 3500);

      return timer;
    };

    const handleLinkClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');

      // Only handle internal routes (not anchors like #products, not mailto/tel/wa.me, not new tab)
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank'
      ) {
        // Normalize URLs for comparison
        const cleanHref = href.split('?')[0].split('#')[0];
        const cleanPathname = pathname.split('?')[0].split('#')[0];

        if (cleanHref === cleanPathname) {
          return;
        }

        triggerNavigation(cleanHref);
      }
    };

    // Also support browser back/forward buttons
    const handlePopState = () => {
      triggerNavigation(window.location.pathname);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return (
    <BufferingLoader
      show={isNavigating}
      message={navMessage}
      subtitle={navSubtitle}
    />
  );
}
