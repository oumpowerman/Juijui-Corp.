import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePWAShareReceiver() {
  const location = useLocation();
  const [pwaSharedData, setPwaSharedData] = useState<any>(null);

  useEffect(() => {
    const checkPwaShared = () => {
      const raw = localStorage.getItem('juijui_pwa_shared_ref');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setPwaSharedData(parsed);
        } catch (e) {
          console.warn("Error parsing PWA shared data", e);
        }
      }
    };

    // Check immediately on mount/render
    checkPwaShared();

    // Also listen to window storage event in case they share while the app is active in background!
    window.addEventListener('storage', checkPwaShared);
    return () => window.removeEventListener('storage', checkPwaShared);
  }, [location.pathname]);

  return {
    pwaSharedData,
    setPwaSharedData,
  };
}
