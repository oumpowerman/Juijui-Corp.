import React from 'react';
import { motion, AnimatePresence, useTransform } from 'framer-motion';
import { Heart, Flame, Sparkles, Zap, CalendarCheck2, HelpCircle } from 'lucide-react';
import { CreatorBgStage, SmoothScrollMotionValue } from './types';

interface StageMicroCharmsLayerProps {
  activeStage: CreatorBgStage;
  smoothScrollY: SmoothScrollMotionValue;
}

export const StageMicroCharmsLayer: React.FC<StageMicroCharmsLayerProps> = ({
  activeStage,
  smoothScrollY,
}) => {
  // Bounded counter-drift parallax on scroll for background micro-charms
  const charmLeftY = useTransform(
    smoothScrollY,
    (v) => Math.cos(v * 0.0052) * 18
  );
  const charmRightY = useTransform(
    smoothScrollY,
    (v) => Math.sin(v * 0.0048) * 20
  );
  const charmMidY = useTransform(
    smoothScrollY,
    (v) => Math.sin(v * 0.0056 + 1.4) * 16
  );

  return (
    <AnimatePresence mode="wait">
      {activeStage === 'PRICING' ? (
        <motion.div
          key="pricing-micro-charms"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.72, scale: 0.94 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.45 }}
          className="hidden xl:block"
        >
          {/* Cute Floating 3D Pastel Baht Coin Bubble */}
          <motion.div
            style={{ y: charmLeftY }}
            className="absolute left-[11%] top-[13%]"
          >
            <motion.div
              animate={{ y: [0, -11, 0], rotate: [-8, 6, -8] }}
              transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200/80 via-yellow-100/80 to-white/90 backdrop-blur-md border border-amber-300/60 shadow-sm flex items-center justify-center font-bold text-amber-700 text-sm"
            >
              ฿
            </motion.div>
          </motion.div>

          {/* Cute Floating 3D Pastel Percentage Discount Charm */}
          <motion.div
            style={{ y: charmRightY }}
            className="absolute right-[11%] top-[14%]"
          >
            <motion.div
              animate={{ y: [0, 11, 0], rotate: [6, -6, 6] }}
              transition={{ duration: 5.2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
              className="px-3 h-9 rounded-2xl bg-gradient-to-br from-emerald-200/80 via-teal-100/80 to-white/90 backdrop-blur-md border border-emerald-300/60 shadow-sm flex items-center justify-center font-bold text-emerald-700 text-xs"
            >
              -17%
            </motion.div>
          </motion.div>

          {/* Cute Floating 3D Pastel Number "x10" Studio Charm (Moved away from center heading) */}
          <motion.div
            style={{ y: charmMidY }}
            className="absolute left-[7%] top-[42%]"
          >
            <motion.div
              animate={{ scale: [0.94, 1.06, 0.94], y: [0, -8, 0] }}
              transition={{ duration: 4.4, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
              className="px-2.5 h-8 rounded-xl bg-gradient-to-br from-pink-200/80 via-rose-100/80 to-white/90 backdrop-blur-md border border-pink-300/60 shadow-sm flex items-center justify-center font-bold text-rose-600 text-xs"
            >
              x10
            </motion.div>
          </motion.div>
        </motion.div>
      ) : activeStage === 'FEATURES' ? (
        <motion.div
          key="features-micro-charms"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.7, scale: 0.94 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.45 }}
          className="hidden xl:block"
        >
          {/* Fast Workflow Zap Charm */}
          <motion.div
            style={{ y: charmLeftY }}
            className="absolute left-[10%] top-[13%]"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-6, 6, -6] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="px-3 h-9 rounded-2xl bg-gradient-to-br from-indigo-100/80 via-sky-100/80 to-white/90 backdrop-blur-md border border-indigo-200/60 shadow-sm flex items-center gap-1.5 font-bold text-indigo-600 text-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>ไวขึ้น 3x</span>
            </motion.div>
          </motion.div>

          {/* Content Calendar Pill */}
          <motion.div
            style={{ y: charmRightY }}
            className="absolute right-[10%] top-[14%]"
          >
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [5, -5, 5] }}
              transition={{ duration: 5.0, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
              className="w-9 h-9 rounded-2xl bg-white/80 backdrop-blur-md border border-violet-200/60 shadow-sm flex items-center justify-center text-violet-500"
            >
              <CalendarCheck2 className="w-4 h-4" />
            </motion.div>
          </motion.div>

          {/* Studio Tag Charm (Moved to outer margin so it never overlaps central section titles) */}
          <motion.div
            style={{ y: charmMidY }}
            className="absolute left-[6.5%] top-[43%]"
          >
            <motion.div
              animate={{ scale: [0.92, 1.06, 0.92], y: [0, -7, 0] }}
              transition={{ duration: 4.3, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
              className="px-2.5 h-8 rounded-xl bg-white/75 backdrop-blur-md border border-sky-200/60 shadow-sm flex items-center justify-center font-bold text-sky-600 text-[11px]"
            >
              #CreatorOS
            </motion.div>
          </motion.div>
        </motion.div>
      ) : activeStage === 'FAQS' ? (
        <motion.div
          key="faqs-micro-charms"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.72, scale: 0.94 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.45 }}
          className="hidden xl:block"
        >
          {/* Cute Pastel Question Bubble */}
          <motion.div
            style={{ y: charmLeftY }}
            className="absolute left-[11%] top-[13%]"
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [-8, 8, -8] }}
              transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-200/80 via-fuchsia-100/80 to-white/90 backdrop-blur-md border border-violet-300/60 shadow-sm flex items-center justify-center font-bold text-violet-700 text-sm"
            >
              ?
            </motion.div>
          </motion.div>

          {/* 24/7 Care Badge */}
          <motion.div
            style={{ y: charmRightY }}
            className="absolute right-[11%] top-[14%]"
          >
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [6, -6, 6] }}
              transition={{ duration: 5.1, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
              className="px-3 h-8 rounded-2xl bg-gradient-to-br from-sky-200/80 via-cyan-100/80 to-white/90 backdrop-blur-md border border-sky-300/60 shadow-sm flex items-center gap-1 font-bold text-sky-700 text-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>Q&A</span>
            </motion.div>
          </motion.div>

          {/* Clear Answer Sparkle */}
          <motion.div
            style={{ y: charmMidY }}
            className="absolute left-[7.5%] top-[42%]"
          >
            <motion.div
              animate={{ scale: [0.92, 1.08, 0.92], y: [0, -8, 0] }}
              transition={{ duration: 4.4, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
              className="px-2.5 h-8 rounded-xl bg-gradient-to-br from-emerald-100/80 to-white/90 backdrop-blur-md border border-emerald-200/60 shadow-sm flex items-center justify-center font-bold text-emerald-600 text-[11px]"
            >
              เข้าใจง่าย
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="default-micro-charms"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.45 }}
          className="hidden md:block"
        >
          <motion.div
            style={{ y: charmLeftY }}
            className="absolute left-[16%] top-[12%]"
          >
            <motion.div
              animate={{ y: [0, -10, 0], opacity: [0.65, 0.95, 0.65] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-9 h-9 rounded-2xl bg-white/85 backdrop-blur-md border border-pink-200/70 shadow-sm flex items-center justify-center text-rose-500"
            >
              <Heart className="w-4 h-4 fill-rose-400" />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: charmRightY }}
            className="absolute right-[16%] top-[13%]"
          >
            <motion.div
              animate={{ y: [0, 10, 0], opacity: [0.65, 0.95, 0.65] }}
              transition={{ duration: 5.4, repeat: Infinity, delay: 0.9, ease: 'easeInOut' }}
              className="w-9 h-9 rounded-2xl bg-white/85 backdrop-blur-md border border-amber-200/70 shadow-sm flex items-center justify-center text-amber-500"
            >
              <Flame className="w-4 h-4 fill-amber-400" />
            </motion.div>
          </motion.div>

          <motion.div
            style={{ y: charmMidY }}
            className="absolute left-[19%] top-[28%]"
          >
            <motion.div
              animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.55, 0.9, 0.55] }}
              transition={{ duration: 4.2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur-md border border-sky-200/70 shadow-sm flex items-center justify-center text-sky-500"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
