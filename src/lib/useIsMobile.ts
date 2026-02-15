'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // During SSR / first render, default to desktop
  const isMobile = width !== null ? width < MOBILE_BREAKPOINT : false;
  const isTablet = width !== null ? width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT : false;
  const isCompact = width !== null ? width < TABLET_BREAKPOINT : false; // mobile OR tablet

  return { isMobile, isTablet, isCompact, width: width ?? 1280 };
}
