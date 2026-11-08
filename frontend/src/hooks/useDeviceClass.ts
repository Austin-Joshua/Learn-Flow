/**
 * Device Model & Responsive Class Hook for Learnflow LMS
 * 
 * Breakpoints (aligned directly with Tailwind md & lg):
 * - mobile:  width < 768px
 * - tablet:  768px <= width <= 1023px
 * - desktop: width >= 1024px
 * 
 * Pointer & Interaction:
 * - isTouch: pointer is coarse (touch screen)
 * - isHoverCapable: supports hover without stickiness
 * 
 * Rules:
 * - Prefer CSS (Tailwind breakpoints / container styles) over JS where possible.
 * - This hook is used strictly where DOM structural presentation differs (e.g. sidebar vs bottom tab bar).
 * - No user agent sniffing. No external dependencies.
 */

import { useState, useEffect } from 'react';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  deviceClass: DeviceClass;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isHoverCapable: boolean;
}

export function useDeviceClass(): DeviceInfo {
  const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        deviceClass: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        isHoverCapable: true,
      };
    }

    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    const deviceClass: DeviceClass = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    const isTouch = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)').matches : false;
    const isHoverCapable = typeof window.matchMedia === 'function' ? window.matchMedia('(hover: hover)').matches : true;

    return {
      deviceClass,
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      isHoverCapable,
    };
  };

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}

