import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollChevronButtonsProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

export const ScrollChevronButtons: React.FC<ScrollChevronButtonsProps> = ({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
}) => {
  return (
    <>
      {/* Left Chevron & Fade */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -6 }}
            transition={{ duration: 0.15 }}
            onClick={onScrollLeft}
            title="เลื่อนซ้าย"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 w-7 h-9 flex items-center justify-center rounded-r-xl bg-white/95 hover:bg-white text-slate-600 hover:text-indigo-600 shadow-md backdrop-blur-md border-y border-r border-slate-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/90 via-white/40 to-transparent pointer-events-none z-20" />
      )}

      {/* Right Chevron & Fade */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 via-white/40 to-transparent pointer-events-none z-20" />
      )}

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, x: 6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 6 }}
            transition={{ duration: 0.15 }}
            onClick={onScrollRight}
            title="เลื่อนขวา"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-40 w-7 h-9 flex items-center justify-center rounded-l-xl bg-white/95 hover:bg-white text-slate-600 hover:text-indigo-600 shadow-md backdrop-blur-md border-y border-l border-slate-200/80 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
