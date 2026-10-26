import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { CreatorBgStage, StageRibbonPaths, SmoothScrollMotionValue } from './types';
import { MORPH_TRANSITION } from './stageConfig';

interface RainbowAuraLayerProps {
  activeStage: CreatorBgStage;
  stageConfig: StageRibbonPaths;
  smoothScrollY: SmoothScrollMotionValue;
}

export const RainbowAuraLayer: React.FC<RainbowAuraLayerProps> = ({
  activeStage,
  stageConfig,
  smoothScrollY,
}) => {
  // Bounded wave parallax so orbs and rainbow ribbons glide smoothly on scroll without leaving the viewport
  const orbLeftScrollY = useTransform(smoothScrollY, (v) => Math.sin(v * 0.0032) * 32);
  const orbLeftScrollX = useTransform(smoothScrollY, (v) => Math.cos(v * 0.0024) * 24);

  const orbRightScrollY = useTransform(smoothScrollY, (v) => Math.cos(v * 0.003) * 34);
  const orbRightScrollX = useTransform(smoothScrollY, (v) => Math.sin(v * 0.0026) * -26);

  const orbCenterScrollY = useTransform(smoothScrollY, (v) => Math.sin(v * 0.0038 + 1.2) * 28);

  const svgParallaxY = useTransform(smoothScrollY, (v) => Math.sin(v * 0.0028) * 24);
  const svgParallaxRotate = useTransform(smoothScrollY, (v) => Math.sin(v * 0.0022) * 1.6);
  const svgParallaxScale = useTransform(
    smoothScrollY,
    (v) => 1.02 + Math.sin(v * 0.0025) * 0.025
  );

  return (
    <>
      {/* 1. Soft Pastel Sky Gradient Wash covering the full screen viewport */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #F6F8FF 0%, #FDF7FF 36%, #FFF9F5 70%, #F7FAFF 100%)',
        }}
      />

      {/* 2. Dreamy Ambient Pastel Aura Orbs that shift softly per Stage + Scroll Parallax */}
      <motion.div
        style={{ x: orbLeftScrollX, y: orbLeftScrollY }}
        className="absolute inset-0 pointer-events-none"
      >
        <motion.div
          animate={{
            x: activeStage === 'PRICING' ? 40 : activeStage === 'FEATURES' ? -30 : 0,
            y: activeStage === 'PRICING' ? 25 : activeStage === 'FEATURES' ? 45 : 0,
            scale: activeStage === 'PRICING' ? 1.08 : 1,
          }}
          transition={MORPH_TRANSITION}
          className={`absolute top-[-6%] left-[-6%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br ${stageConfig.orbLeftClass} blur-[100px] transition-colors duration-1000`}
        />
      </motion.div>

      <motion.div
        style={{ x: orbRightScrollX, y: orbRightScrollY }}
        className="absolute inset-0 pointer-events-none"
      >
        <motion.div
          animate={{
            x: activeStage === 'PRICING' ? -45 : activeStage === 'FEATURES' ? 35 : 0,
            y: activeStage === 'PRICING' ? 35 : activeStage === 'FEATURES' ? -25 : 0,
            scale: activeStage === 'FEATURES' ? 1.06 : 1,
          }}
          transition={MORPH_TRANSITION}
          className={`absolute top-[-4%] right-[-6%] w-[48vw] h-[48vw] max-w-[630px] max-h-[630px] rounded-full bg-gradient-to-bl ${stageConfig.orbRightClass} blur-[100px] transition-colors duration-1000`}
        />
      </motion.div>

      <motion.div
        style={{ y: orbCenterScrollY }}
        className="absolute inset-0 pointer-events-none"
      >
        <motion.div
          animate={{
            x: activeStage === 'PRICING' ? 0 : activeStage === 'FEATURES' ? -40 : 20,
            y: activeStage === 'PRICING' ? -30 : activeStage === 'FEATURES' ? 30 : 0,
          }}
          transition={MORPH_TRANSITION}
          className={`absolute bottom-[4%] left-[22%] w-[54vw] h-[38vw] max-w-[680px] max-h-[460px] rounded-full bg-gradient-to-r ${stageConfig.orbCenterClass} blur-[95px] transition-colors duration-1000`}
        />
      </motion.div>

      {/* 3. Continuous Morphing Pastel Rainbow Arcs & Silk Ribbons (SVG) */}
      <motion.svg
        viewBox="0 0 1440 860"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover opacity-90"
        preserveAspectRatio="xMidYMid slice"
        style={{
          y: svgParallaxY,
          rotate: svgParallaxRotate,
          scale: svgParallaxScale,
        }}
      >
        <defs>
          {/* Multi-Stop Pastel Rainbow Gradient */}
          <linearGradient id="creatorPastelRainbow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FB7185" stopOpacity="0.42" />
            <stop offset="22%" stopColor="#FBBF24" stopOpacity="0.38" />
            <stop offset="46%" stopColor="#34D399" stopOpacity="0.36" />
            <stop offset="72%" stopColor="#38BDF8" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.44" />
          </linearGradient>

          <linearGradient id="creatorRainbowRibbonSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.28" />
            <stop offset="25%" stopColor="#FDE68A" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#A7F3D0" stopOpacity="0.26" />
            <stop offset="75%" stopColor="#BAE6FD" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {/* Wide Blurred Pastel Rainbow Aura Arch (Morphs continuously across stages) */}
        <motion.path
          initial={false}
          animate={{ d: stageConfig.wideAura }}
          transition={MORPH_TRANSITION}
          stroke="url(#creatorPastelRainbow)"
          strokeWidth="62"
          strokeLinecap="round"
          style={{ filter: 'blur(26px)' }}
        />

        {/* Secondary Parallel Rainbow Pastel Band */}
        <motion.path
          initial={false}
          animate={{ d: stageConfig.secondaryBand }}
          transition={MORPH_TRANSITION}
          stroke="url(#creatorRainbowRibbonSoft)"
          strokeWidth="36"
          strokeLinecap="round"
          style={{ filter: 'blur(16px)' }}
        />

        {/* Crisp Prismatic Rainbow Hairline Curve 1 */}
        <motion.path
          initial={false}
          animate={{ d: stageConfig.crispLine }}
          transition={MORPH_TRANSITION}
          stroke="url(#creatorPastelRainbow)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Crisp Dashed Creator Flow Curve 2 */}
        <motion.path
          initial={false}
          animate={{ d: stageConfig.dashedCurve }}
          transition={MORPH_TRANSITION}
          stroke="url(#creatorPastelRainbow)"
          strokeWidth="1.75"
          strokeDasharray="8 10"
          strokeLinecap="round"
        />
      </motion.svg>
    </>
  );
};
