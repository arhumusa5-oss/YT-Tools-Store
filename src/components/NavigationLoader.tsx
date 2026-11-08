'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BufferingLoader from './BufferingLoader';

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMessage, setNavMessage] = useState('Loading...');

  // Reset buffering loader immediately whenever pathname changes (destination page has mounted)
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
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

        let msg = 'Loading...';
        if (cleanHref === '/cart') msg = 'Loading Shopping Cart...';
        else if (cleanHref === '/checkout') msg = 'Loading Checkout...';
        else if (cleanHref.startsWith('/track-order') || cleanHref.startsWith('/track')) msg = 'Loading Order Tracker...';
        else if (cleanHref === '/') msg = 'Loading Store Catalog...';
        else if (cleanHref.startsWith('/bundle')) msg = 'Loading Creator Bundles...';
        else if (cleanHref.startsWith('/order-success')) msg = 'Loading Order Receipt...';

        setNavMessage(msg);
        setIsNavigating(true);

        // Safety timeout so it never hangs indefinitely
        const timer = setTimeout(() => {
          setIsNavigating(false);
        }, 2500);

        return () => clearTimeout(timer);
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, [pathname]);

  return (
    <BufferingLoader
      show={isNavigating}
      message={navMessage}
      subtitle="Please wait a moment..."
    />
  );
}
