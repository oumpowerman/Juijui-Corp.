import { useRef, useState, useEffect, useCallback } from 'react';

export const useHorizontalScrollTrack = (dependencies: unknown[] = []) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Horizontal mouse wheel scroll support (converts vertical wheel to horizontal scroll)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (container.scrollWidth > container.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Update Chevrons visibility based on scroll position
  const updateScrollChevrons = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollChevrons();
    el.addEventListener('scroll', updateScrollChevrons, { passive: true });
    window.addEventListener('resize', updateScrollChevrons);

    const timer = setTimeout(updateScrollChevrons, 250);
    return () => {
      el.removeEventListener('scroll', updateScrollChevrons);
      window.removeEventListener('resize', updateScrollChevrons);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateScrollChevrons, ...dependencies]);

  const handleScrollChevron = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.65, 200);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    handleScrollChevron,
    updateScrollChevrons,
  };
};
