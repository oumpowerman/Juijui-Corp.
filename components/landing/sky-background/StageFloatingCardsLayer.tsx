import React from 'react';
import { motion, AnimatePresence, useTransform } from 'framer-motion';
import { CreatorBgStage, FloatingStageCardItem, SmoothScrollMotionValue } from './types';

interface StageFloatingCardsLayerProps {
  activeStage?: CreatorBgStage;
  floatingItems: FloatingStageCardItem[];
  smoothScrollY: SmoothScrollMotionValue;
}

const ParallaxFloatingCard: React.FC<{
  item: FloatingStageCardItem;
  idx: number;
  isContentStage: boolean;
  smoothScrollY: SmoothScrollMotionValue;
}> = ({ item, idx, isContentStage, smoothScrollY }) => {
  const IconComp = item.icon;
  const phase = idx * 1.45;
  const direction = idx % 2 === 0 ? 1 : -1;

  // Bounded scroll-reactive 3D bob & tilt so cards respond immediately when scrolling without leaving the screen
  const scrollOffsetY = useTransform(
    smoothScrollY,
    (v) => Math.sin(v * 0.0046 + phase) * 22 * direction
  );
  const scrollOffsetX = useTransform(
    smoothScrollY,
    (v) => Math.cos(v * 0.0034 + phase) * 9 * direction
  );
  const scrollTiltRotate = useTransform(
    smoothScrollY,
    (v) => Math.sin(v * 0.004 + phase) * 2.8 * direction
  );

  // Soften cards slightly in content stages (FEATURES, PRICING, FAQS) so foreground headings pop clearly
  const targetOpacity = isContentStage ? 0.68 : 0.92;
  const targetScale = isContentStage ? 0.92 : 1;

  return (
    /* LAYER 1 (Outer): Handles Stage Enter/Exit & Static Tilt Angle */
    <motion.div
      initial={{ opacity: 0, scale: 0.78, y: 24, rotate: item.baseRotate - 4 }}
      animate={{
        opacity: targetOpacity,
        scale: targetScale,
        y: 0,
        rotate: item.baseRotate,
      }}
      exit={{ opacity: 0, scale: 0.8, y: -20, rotate: item.baseRotate + 4 }}
      transition={{
        duration: 0.65,
        delay: idx * 0.07,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className={`hidden lg:block absolute ${item.positionClass} ${
        isContentStage ? 'blur-[0.5px]' : ''
      }`}
    >
      {/* LAYER 2 (Middle): Interactive Scroll-Driven Parallax & Tilt */}
      <motion.div
        style={{
          x: scrollOffsetX,
          y: scrollOffsetY,
          rotate: scrollTiltRotate,
          willChange: 'transform',
        }}
      >
        {/* LAYER 3 (Inner): Continuous Gentle Sine Floating */}
        <motion.div
          animate={{
            y: [0, item.floatY, 0],
            rotateZ: [0, idx % 2 === 0 ? 2.2 : -2.2, 0],
          }}
          transition={{
            y: {
              duration: item.floatDuration,
              repeat: Infinity,
              delay: item.floatDelay,
              ease: 'easeInOut',
            },
            rotateZ: {
              duration: item.floatDuration * 1.15,
              repeat: Infinity,
              delay: item.floatDelay,
              ease: 'easeInOut',
            },
          }}
          style={{ willChange: 'transform' }}
          className={`relative rounded-[1.6rem] p-3 pr-4 bg-white/75 backdrop-blur-xl border ${item.pillBorderClass} flex items-center gap-3`}
        >
          {/* 3D Glossy Icon Sphere/Squircle or Custom 3D Pastel SVG */}
          <div
            className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${item.iconBgGradient} ${item.iconGlowShadow} flex items-center justify-center text-white shrink-0`}
          >
            {item.customSvg ? (
              item.customSvg
            ) : IconComp ? (
              <>
                <IconComp className="w-5 h-5 fill-white/25" />
                <span className="absolute top-1.5 left-1.5 w-2 h-1 rounded-full bg-white/60 rotate-[-25deg]" />
              </>
            ) : null}
          </div>

          {/* Label & Sub-meta */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 tracking-tight">
                {item.label}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${item.badgeAccentClass}`}
              >
                {item.countText}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{item.subLabel}</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const StageFloatingCardsLayer: React.FC<StageFloatingCardsLayerProps> = ({
  activeStage = 'HERO',
  floatingItems,
  smoothScrollY,
}) => {
  const isContentStage = activeStage !== 'HERO';

  return (
    <AnimatePresence mode="sync">
      {floatingItems.map((item, idx) => (
        <ParallaxFloatingCard
          key={item.id}
          item={item}
          idx={idx}
          isContentStage={isContentStage}
          smoothScrollY={smoothScrollY}
        />
      ))}
    </AnimatePresence>
  );
};
