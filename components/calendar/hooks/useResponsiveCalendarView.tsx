import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarViewType } from '../../CalendarView';

interface UseResponsiveCalendarViewProps {
  initialViewType?: CalendarViewType;
  isMobileLandscape: boolean;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export const useResponsiveCalendarView = ({
  initialViewType,
  isMobileLandscape,
  onPrevWeek,
  onNextWeek,
  onPrevMonth,
  onNextMonth,
}: UseResponsiveCalendarViewProps) => {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [hasUserManuallyToggled, setHasUserManuallyToggled] = useState<boolean>(false);

  // Initialize view type based on screen size:
  // Mobile (<768px): default to 'WEEK'
  // Desktop/Tablet (>=768px): default to 'MONTH'
  const [calendarViewType, setCalendarViewTypeState] = useState<CalendarViewType>(() => {
    if (initialViewType) return initialViewType;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'WEEK';
    }
    return 'MONTH';
  });

  // Setter wrapper to track manual toggles by user
  const setCalendarViewType = useCallback((newType: CalendarViewType) => {
    setHasUserManuallyToggled(true);
    setCalendarViewTypeState(newType);
  }, []);

  // Handle Resize and Orientation changes
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileDevice(isMobile);

      // If user hasn't explicitly clicked the toggle, automatically switch based on form factor
      if (!hasUserManuallyToggled) {
        if (isMobile) {
          setCalendarViewTypeState('WEEK');
        } else {
          setCalendarViewTypeState('MONTH');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasUserManuallyToggled]);

  // When entering Mobile Landscape mode, automatically prefer MONTH grid view for wide visual overview
  useEffect(() => {
    if (isMobileLandscape) {
      setCalendarViewTypeState('MONTH');
    }
  }, [isMobileLandscape]);

  // Touch / Swipe Navigation Detection for Mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Minimum swipe threshold (50px) and ensure horizontal intent (deltaX > deltaY)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        // Swiped Right -> Previous period
        if (calendarViewType === 'WEEK' && onPrevWeek) {
          onPrevWeek();
        } else if (calendarViewType === 'MONTH' && onPrevMonth) {
          onPrevMonth();
        }
      } else {
        // Swiped Left -> Next period
        if (calendarViewType === 'WEEK' && onNextWeek) {
          onNextWeek();
        } else if (calendarViewType === 'MONTH' && onNextMonth) {
          onNextMonth();
        }
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }, [calendarViewType, onPrevWeek, onNextWeek, onPrevMonth, onNextMonth]);

  return {
    isMobileDevice,
    calendarViewType,
    setCalendarViewType,
    handleTouchStart,
    handleTouchEnd,
  };
};
