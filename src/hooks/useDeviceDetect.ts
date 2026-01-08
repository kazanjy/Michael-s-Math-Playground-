import { useState, useEffect } from 'react';

interface DeviceInfo {
  isTouchDevice: boolean;
  isTablet: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isPWA: boolean;
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isTouchDevice: false,
    isTablet: false,
    isAndroid: false,
    isIOS: false,
    isPWA: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();

    // Detect touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Detect OS
    const isAndroid = /android/.test(ua);
    const isIOS = /ipad|iphone|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+

    // Detect tablet (larger touch screen)
    // Android tablets often have "android" but not "mobile"
    // iPads detected above
    const isAndroidTablet = isAndroid && !/mobile/.test(ua);
    const isTablet = isIOS || isAndroidTablet ||
      (isTouchDevice && window.innerWidth >= 768);

    // Detect PWA/standalone mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setDeviceInfo({
      isTouchDevice,
      isTablet,
      isAndroid,
      isIOS,
      isPWA,
    });
  }, []);

  return deviceInfo;
}
