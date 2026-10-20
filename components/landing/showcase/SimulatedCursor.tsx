import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulatedCursorProps {
  /** Percentage coordinates within the scene canvas (0-100) */
  x: string;
  y: string;
  isClicking?: boolean;
  isDragging?: boolean;
  label?: string;
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'purple';
}

const ACCENT_STYLES: Record<NonNullable<SimulatedCursorProps['accentColor']>, string> = {
  indigo: 'bg-indigo-600 border-indigo-400 shadow-indigo-500/30',
  emerald: 'bg-emerald-600 border-emerald-400 shadow-emerald-500/30',
  amber: 'bg-amber-600 border-amber-400 shadow-amber-500/30',
  purple: 'bg-purple-600 border-purple-400 shadow-purple-500/30',
};

export const SimulatedCursor: React.FC<SimulatedCursorProps> = ({
  x,
  y,
  isClicking = false,
  isDragging = false,
  label = 'พี่จุ้ย (Creative Director)',
  accentColor = 'indigo',
}) => {
  return (
    <motion.div
      className="pointer-events-none absolute z-40 top-0 left-0"
      initial={false}
      animate={{
        left: x,
        top: y,
        scale: isClicking ? 0.9 : isDragging ? 1.06 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 170,
        damping: 24,
        mass: 0.8,
      }}
    >
      {/* Click Ripple Effect */}
      <AnimatePresence>
        {isClicking && (
          <motion.div
            key="cursor-ripple"
            initial={{ scale: 0.4, opacity: 0.85 }}
            animate={{ scale: 2.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-indigo-500 bg-indigo-400/25"
          />
        )}
      </AnimatePresence>

      {/* SVG Pointer Arrow */}
      <div className="relative flex items-start">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_4px_8px_rgba(15,23,42,0.35)] -mt-1 -ml-1"
        >
          <path
            d="M4.5 3.5L11.2 20.2C11.5 20.9 12.5 20.9 12.8 20.2L15.2 14.5L20.9 12.1C21.6 11.8 21.6 10.8 20.9 10.5L4.2 3.8C3.6 3.5 4.2 2.8 4.5 3.5Z"
            fill="#0F172A"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        {/* User Collaboration Tag */}
        <div
          className={`ml-1 mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold text-white border shadow-lg whitespace-nowrap flex items-center gap-1.5 ${ACCENT_STYLES[accentColor]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{label}</span>
          {isDragging && (
            <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded">
              กำลังย้ายการ์ด...
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
