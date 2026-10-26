import React from 'react';
import { motion, type Transition } from 'framer-motion';

interface AuthDynamicBackgroundProps {
  authMode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE';
  onboardingMode?: 'JOIN_TEAM' | 'CREATE_TRIAL';
}

type VisualThemeKey = 'LOGIN' | 'REGISTER_JOIN' | 'REGISTER_TRIAL' | 'SECURITY';

interface ThemeMorphConfig {
  bgGradient: string;
  orbs: {
    orb1: { from: string; to: string; x: string; y: string; scale: number };
    orb2: { from: string; to: string; x: string; y: string; scale: number };
    orb3: { from: string; to: string; x: string; y: string; scale: number };
  };
  svg: {
    grad1Start: string;
    grad1Mid: string;
    grad1End: string;
    grad2Start: string;
    grad2Mid: string;
    grad2End: string;
    wave1Path: string;
    wave1RibbonPath: string;
    wave2Path: string;
    wave3Path: string;
    wave2Dash: string;
    ring1: { cx: number; cy: number; r: number; dash: string };
    ring2: { cx: number; cy: number; r: number; dash: string };
  };
  artifactStyle: {
    background: string;
    borderColor: string;
    shadow: string;
    hudOpacity: number;
    prismOpacity: number;
    accentBarGradient: string;
    orbGlowColor: string;
  };
  sparkle: {
    background: string;
    boxShadow: string;
  };
}

const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const;

const CINEMATIC_MORPH_TRANSITION: Transition = {
  duration: 1.35,
  ease: CINEMATIC_EASE,
};

const CINEMATIC_SPRING_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 52,
  damping: 19,
  mass: 1.15,
};

/**
 * Every SVG path across all 4 modes shares the exact same command structure:
 * M x0 y0 C x1 y1, x2 y2, x3 y3 C x4 y4, x5 y5, x6 y6
 * This guarantees 100% smooth real-time path bending (morphing) in Framer Motion.
 */
const THEME_CONFIGS: Record<VisualThemeKey, ThemeMorphConfig> = {
  LOGIN: {
    bgGradient: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 50%, #f3e8ff 100%)',
    orbs: {
      orb1: { from: 'rgba(37, 99, 235, 0.28)', to: 'rgba(124, 58, 237, 0.26)', x: '18%', y: '-22%', scale: 1.28 },
      orb2: { from: 'rgba(14, 165, 233, 0.26)', to: 'rgba(99, 102, 241, 0.24)', x: '-26%', y: '26%', scale: 1.32 },
      orb3: { from: 'rgba(139, 92, 246, 0.22)', to: 'rgba(56, 189, 248, 0.20)', x: '-12%', y: '-12%', scale: 1.05 },
    },
    svg: {
      grad1Start: '#1d4ed8',
      grad1Mid: '#38bdf8',
      grad1End: '#8b5cf6',
      grad2Start: '#7c3aed',
      grad2Mid: '#4f46e5',
      grad2End: '#06b6d4',
      wave1Path: 'M -140 210 C 260 40, 660 420, 1080 150 C 1280 30, 1460 250, 1620 120',
      wave1RibbonPath: 'M -120 240 C 280 70, 680 450, 1100 180 C 1300 60, 1480 270, 1640 150',
      wave2Path: 'M -120 710 C 340 520, 800 870, 1220 620 C 1380 540, 1490 710, 1620 600',
      wave3Path: 'M -100 460 C 380 610, 760 290, 1160 490 C 1340 570, 1480 410, 1620 470',
      wave2Dash: '12 10',
      ring1: { cx: 1250, cy: 190, r: 195, dash: '6 12' },
      ring2: { cx: 190, cy: 730, r: 170, dash: '4 10' },
    },
    artifactStyle: {
      background:
        'linear-gradient(135deg, rgba(224, 242, 254, 0.48) 0%, rgba(224, 231, 255, 0.30) 50%, rgba(243, 232, 255, 0.40) 100%)',
      borderColor: 'rgba(186, 230, 253, 0.65)',
      shadow: '0 22px 50px rgba(37, 99, 235, 0.13), inset 0 1px 2px rgba(255, 255, 255, 0.88)',
      hudOpacity: 1,
      prismOpacity: 0,
      accentBarGradient: 'linear-gradient(90deg, rgba(56, 189, 248, 0.8), rgba(99, 102, 241, 0.8))',
      orbGlowColor: 'rgba(56, 189, 248, 0.85)',
    },
    sparkle: {
      background: 'radial-gradient(circle, #38bdf8 0%, #6366f1 100%)',
      boxShadow: '0 0 16px 3px rgba(56, 189, 248, 0.48)',
    },
  },
  REGISTER_JOIN: {
    bgGradient: 'linear-gradient(135deg, #fff1f2 0%, #fdf4ff 50%, #fef3c7 100%)',
    orbs: {
      orb1: { from: 'rgba(244, 63, 94, 0.26)', to: 'rgba(192, 132, 252, 0.24)', x: '10%', y: '-26%', scale: 1.34 },
      orb2: { from: 'rgba(251, 191, 36, 0.22)', to: 'rgba(251, 113, 133, 0.26)', x: '-20%', y: '20%', scale: 1.2 },
      orb3: { from: 'rgba(168, 85, 247, 0.19)', to: 'rgba(253, 186, 116, 0.22)', x: '22%', y: '14%', scale: 1.08 },
    },
    svg: {
      grad1Start: '#fb7185',
      grad1Mid: '#fcd34d',
      grad1End: '#c084fc',
      grad2Start: '#a855f7',
      grad2Mid: '#fb7185',
      grad2End: '#fbbf24',
      // Inverted crest & trough so the silk wave visibly bends & sweeps across the canvas
      wave1Path: 'M -140 310 C 300 430, 690 60, 1120 290 C 1320 390, 1480 140, 1620 240',
      wave1RibbonPath: 'M -120 340 C 320 460, 710 90, 1140 320 C 1340 420, 1500 170, 1640 270',
      wave2Path: 'M -120 630 C 360 820, 780 470, 1200 710 C 1360 790, 1490 590, 1620 680',
      wave3Path: 'M -100 390 C 340 230, 790 560, 1180 350 C 1350 270, 1480 470, 1620 380',
      wave2Dash: '8 8',
      ring1: { cx: 1180, cy: 250, r: 170, dash: '4 10' },
      ring2: { cx: 250, cy: 670, r: 150, dash: '6 12' },
    },
    artifactStyle: {
      background:
        'linear-gradient(135deg, rgba(255, 228, 230, 0.45) 0%, rgba(253, 244, 255, 0.28) 50%, rgba(254, 243, 199, 0.38) 100%)',
      borderColor: 'rgba(253, 164, 175, 0.62)',
      shadow: '0 22px 50px rgba(244, 63, 94, 0.11), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
      hudOpacity: 0,
      prismOpacity: 1,
      accentBarGradient: 'linear-gradient(90deg, rgba(251, 113, 133, 0.8), rgba(251, 191, 36, 0.8))',
      orbGlowColor: 'rgba(244, 114, 182, 0.85)',
    },
    sparkle: {
      background: 'radial-gradient(circle, #fb7185 0%, #c084fc 100%)',
      boxShadow: '0 0 16px 3px rgba(244, 63, 94, 0.42)',
    },
  },
  REGISTER_TRIAL: {
    bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fff1f2 50%, #f3e8ff 100%)',
    orbs: {
      orb1: { from: 'rgba(245, 158, 11, 0.27)', to: 'rgba(244, 63, 94, 0.24)', x: '-12%', y: '-22%', scale: 1.36 },
      orb2: { from: 'rgba(168, 85, 247, 0.24)', to: 'rgba(251, 191, 36, 0.23)', x: '18%', y: '24%', scale: 1.26 },
      orb3: { from: 'rgba(251, 113, 133, 0.21)', to: 'rgba(217, 119, 6, 0.21)', x: '-18%', y: '12%', scale: 1.12 },
    },
    svg: {
      grad1Start: '#f59e0b',
      grad1Mid: '#fb7185',
      grad1End: '#a855f7',
      grad2Start: '#fbbf24',
      grad2Mid: '#f43f5e',
      grad2End: '#8b5cf6',
      // Royal Executive Arch curves
      wave1Path: 'M -140 260 C 280 90, 720 90, 1140 260 C 1330 340, 1470 120, 1620 190',
      wave1RibbonPath: 'M -120 290 C 300 120, 740 120, 1160 290 C 1350 370, 1490 150, 1640 220',
      wave2Path: 'M -120 680 C 320 510, 840 510, 1240 680 C 1390 740, 1500 580, 1620 630',
      wave3Path: 'M -100 440 C 390 310, 750 310, 1170 440 C 1350 510, 1490 360, 1620 410',
      wave2Dash: '4 10',
      ring1: { cx: 1280, cy: 170, r: 220, dash: '8 10' },
      ring2: { cx: 170, cy: 740, r: 195, dash: '5 12' },
    },
    artifactStyle: {
      background:
        'linear-gradient(135deg, rgba(254, 243, 199, 0.48) 0%, rgba(255, 228, 230, 0.28) 50%, rgba(243, 232, 255, 0.38) 100%)',
      borderColor: 'rgba(252, 211, 77, 0.70)',
      shadow: '0 24px 55px rgba(245, 158, 11, 0.14), inset 0 1px 2px rgba(255, 255, 255, 0.90)',
      hudOpacity: 0,
      prismOpacity: 1,
      accentBarGradient: 'linear-gradient(90deg, rgba(251, 191, 36, 0.85), rgba(244, 63, 94, 0.8))',
      orbGlowColor: 'rgba(251, 191, 36, 0.90)',
    },
    sparkle: {
      background: 'radial-gradient(circle, #fbbf24 0%, #f43f5e 100%)',
      boxShadow: '0 0 16px 3px rgba(251, 191, 36, 0.48)',
    },
  },
  SECURITY: {
    bgGradient: 'linear-gradient(135deg, #faf5ff 0%, #f8fafc 50%, #f3e8ff 100%)',
    orbs: {
      orb1: { from: 'rgba(168, 85, 247, 0.22)', to: 'rgba(99, 102, 241, 0.18)', x: '-10%', y: '-25%', scale: 1.18 },
      orb2: { from: 'rgba(99, 102, 241, 0.22)', to: 'rgba(168, 85, 247, 0.18)', x: '25%', y: '15%', scale: 1.18 },
      orb3: { from: 'rgba(139, 92, 246, 0.18)', to: 'rgba(232, 121, 249, 0.14)', x: '-25%', y: '10%', scale: 1.0 },
    },
    svg: {
      grad1Start: '#6366f1',
      grad1Mid: '#a855f7',
      grad1End: '#ec4899',
      grad2Start: '#4f46e5',
      grad2Mid: '#8b5cf6',
      grad2End: '#06b6d4',
      wave1Path: 'M -140 250 C 290 180, 680 320, 1100 230 C 1300 180, 1470 260, 1620 210',
      wave1RibbonPath: 'M -120 280 C 310 210, 700 350, 1120 260 C 1320 210, 1490 290, 1640 240',
      wave2Path: 'M -120 670 C 350 600, 790 740, 1210 650 C 1370 610, 1490 680, 1620 640',
      wave3Path: 'M -100 450 C 360 410, 770 490, 1170 440 C 1340 420, 1480 460, 1620 440',
      wave2Dash: '6 12',
      ring1: { cx: 1220, cy: 210, r: 160, dash: '4 12' },
      ring2: { cx: 210, cy: 710, r: 145, dash: '4 12' },
    },
    artifactStyle: {
      background:
        'linear-gradient(135deg, rgba(238, 242, 255, 0.42) 0%, rgba(243, 232, 255, 0.28) 100%)',
      borderColor: 'rgba(199, 210, 254, 0.55)',
      shadow: '0 18px 40px rgba(99, 102, 241, 0.10), inset 0 1px 2px rgba(255, 255, 255, 0.8)',
      hudOpacity: 0.5,
      prismOpacity: 0.5,
      accentBarGradient: 'linear-gradient(90deg, rgba(99, 102, 241, 0.7), rgba(168, 85, 247, 0.7))',
      orbGlowColor: 'rgba(139, 92, 246, 0.75)',
    },
    sparkle: {
      background: 'radial-gradient(circle, #818cf8 0%, #c084fc 100%)',
      boxShadow: '0 0 14px 2px rgba(129, 140, 248, 0.4)',
    },
  },
};

interface MorphingArtifactConfig {
  id: string;
  anchorClass: string;
  floatDuration: number;
  floatAmplitude: number;
  states: Record<
    VisualThemeKey,
    {
      width: number;
      height: number;
      borderRadius: number;
      rotate: number;
      x: number;
      y: number;
      scale: number;
    }
  >;
}

/**
 * 4 persistent corner artifacts that physically reshape between:
 * - LOGIN: Wide rectangular Holographic HUD Glass Plates
 * - REGISTER_JOIN: Square rotated Luxury Rose-Gold Crystal Prisms
 * - REGISTER_TRIAL: Diamond-tilted Executive Champagne Crystal Prisms
 */
const MORPHING_ARTIFACTS: MorphingArtifactConfig[] = [
  {
    id: 'artifact-top-left',
    anchorClass: 'left-[3.5%] top-[7.5%]',
    floatDuration: 13,
    floatAmplitude: -14,
    states: {
      LOGIN: { width: 172, height: 110, borderRadius: 28, rotate: -14, x: 0, y: 0, scale: 1 },
      REGISTER_JOIN: { width: 138, height: 138, borderRadius: 36, rotate: 22, x: 14, y: 12, scale: 1 },
      REGISTER_TRIAL: { width: 148, height: 148, borderRadius: 42, rotate: 42, x: 22, y: 18, scale: 1.05 },
      SECURITY: { width: 130, height: 130, borderRadius: 32, rotate: 8, x: 6, y: 6, scale: 0.92 },
    },
  },
  {
    id: 'artifact-top-right',
    anchorClass: 'right-[4.5%] top-[9%]',
    floatDuration: 16,
    floatAmplitude: 16,
    states: {
      LOGIN: { width: 168, height: 168, borderRadius: 32, rotate: 20, x: 0, y: 0, scale: 1 },
      REGISTER_JOIN: { width: 178, height: 124, borderRadius: 30, rotate: -24, x: -16, y: 14, scale: 1 },
      REGISTER_TRIAL: { width: 164, height: 164, borderRadius: 44, rotate: -45, x: -10, y: -12, scale: 1.06 },
      SECURITY: { width: 144, height: 144, borderRadius: 36, rotate: -12, x: -8, y: 4, scale: 0.92 },
    },
  },
  {
    id: 'artifact-bottom-left',
    anchorClass: 'left-[5%] bottom-[8.5%]',
    floatDuration: 15,
    floatAmplitude: 13,
    states: {
      LOGIN: { width: 142, height: 142, borderRadius: 30, rotate: 16, x: 0, y: 0, scale: 1 },
      REGISTER_JOIN: { width: 166, height: 112, borderRadius: 28, rotate: 34, x: 18, y: -14, scale: 1 },
      REGISTER_TRIAL: { width: 136, height: 136, borderRadius: 40, rotate: -18, x: 10, y: -20, scale: 1.04 },
      SECURITY: { width: 128, height: 128, borderRadius: 32, rotate: 12, x: 8, y: -8, scale: 0.9 },
    },
  },
  {
    id: 'artifact-bottom-right',
    anchorClass: 'right-[5%] bottom-[7.5%]',
    floatDuration: 18,
    floatAmplitude: -15,
    states: {
      LOGIN: { width: 186, height: 122, borderRadius: 28, rotate: -18, x: 0, y: 0, scale: 1 },
      REGISTER_JOIN: { width: 152, height: 152, borderRadius: 38, rotate: -14, x: -14, y: -12, scale: 1 },
      REGISTER_TRIAL: { width: 160, height: 160, borderRadius: 44, rotate: 28, x: -20, y: 10, scale: 1.06 },
      SECURITY: { width: 140, height: 140, borderRadius: 34, rotate: -8, x: -10, y: -6, scale: 0.92 },
    },
  },
];

interface MorphingSparkleConfig {
  id: string;
  size: number;
  delay: number;
  coords: Record<VisualThemeKey, { left: string; top: string }>;
}

const MORPHING_SPARKLES: MorphingSparkleConfig[] = [
  {
    id: 's1',
    size: 7,
    delay: 0,
    coords: {
      LOGIN: { left: '12%', top: '18%' },
      REGISTER_JOIN: { left: '16%', top: '24%' },
      REGISTER_TRIAL: { left: '14%', top: '15%' },
      SECURITY: { left: '15%', top: '20%' },
    },
  },
  {
    id: 's2',
    size: 8,
    delay: 0.6,
    coords: {
      LOGIN: { left: '86%', top: '16%' },
      REGISTER_JOIN: { left: '82%', top: '22%' },
      REGISTER_TRIAL: { left: '88%', top: '14%' },
      SECURITY: { left: '84%', top: '18%' },
    },
  },
  {
    id: 's3',
    size: 6,
    delay: 1.2,
    coords: {
      LOGIN: { left: '91%', top: '52%' },
      REGISTER_JOIN: { left: '87%', top: '46%' },
      REGISTER_TRIAL: { left: '92%', top: '58%' },
      SECURITY: { left: '89%', top: '50%' },
    },
  },
  {
    id: 's4',
    size: 7,
    delay: 1.8,
    coords: {
      LOGIN: { left: '8%', top: '68%' },
      REGISTER_JOIN: { left: '13%', top: '62%' },
      REGISTER_TRIAL: { left: '9%', top: '74%' },
      SECURITY: { left: '10%', top: '66%' },
    },
  },
  {
    id: 's5',
    size: 6,
    delay: 0.9,
    coords: {
      LOGIN: { left: '82%', top: '84%' },
      REGISTER_JOIN: { left: '77%', top: '79%' },
      REGISTER_TRIAL: { left: '85%', top: '86%' },
      SECURITY: { left: '80%', top: '82%' },
    },
  },
  {
    id: 's6',
    size: 5,
    delay: 1.5,
    coords: {
      LOGIN: { left: '22%', top: '88%' },
      REGISTER_JOIN: { left: '27%', top: '83%' },
      REGISTER_TRIAL: { left: '19%', top: '90%' },
      SECURITY: { left: '24%', top: '86%' },
    },
  },
];

const FLUID_BLOB_MORPHS = [
  '40% 60% 70% 30% / 40% 50% 60% 50%',
  '60% 40% 50% 50% / 50% 60% 40% 60%',
  '50% 50% 60% 40% / 40% 40% 60% 60%',
  '40% 60% 70% 30% / 40% 50% 60% 50%',
];

const FLUID_BLOB_MORPHS_ALT = [
  '50% 50% 60% 40% / 40% 40% 60% 60%',
  '40% 60% 70% 30% / 40% 50% 60% 50%',
  '60% 40% 50% 50% / 50% 60% 40% 60%',
  '50% 50% 60% 40% / 40% 40% 60% 60%',
];

export const AuthDynamicBackground: React.FC<AuthDynamicBackgroundProps> = ({
  authMode,
  onboardingMode = 'JOIN_TEAM',
}) => {
  const themeKey: VisualThemeKey =
    authMode === 'LOGIN'
      ? 'LOGIN'
      : authMode === 'REGISTER'
      ? onboardingMode === 'CREATE_TRIAL'
        ? 'REGISTER_TRIAL'
        : 'REGISTER_JOIN'
      : 'SECURITY';

  const activeTheme = THEME_CONFIGS[themeKey];

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0">
      {/* 1. Continuous Slow Cinematic Base Gradient Canvas */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ background: activeTheme.bgGradient }}
        transition={CINEMATIC_MORPH_TRANSITION}
      />

      {/* 2. Floating Ambient Liquid Orbs */}
      <div className="absolute inset-0 w-full h-full blur-[90px] md:blur-[110px] scale-105">
        {/* Orb 1 */}
        <motion.div
          className="absolute right-[-10%] top-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px]"
          initial={false}
          animate={{
            x: activeTheme.orbs.orb1.x,
            y: activeTheme.orbs.orb1.y,
            scale: activeTheme.orbs.orb1.scale,
            background: `radial-gradient(circle, ${activeTheme.orbs.orb1.from} 0%, ${activeTheme.orbs.orb1.to} 100%)`,
            borderRadius: FLUID_BLOB_MORPHS,
            rotate: 360,
          }}
          transition={{
            x: CINEMATIC_SPRING_TRANSITION,
            y: CINEMATIC_SPRING_TRANSITION,
            scale: CINEMATIC_SPRING_TRANSITION,
            background: CINEMATIC_MORPH_TRANSITION,
            borderRadius: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 38, repeat: Infinity, ease: 'linear' },
          }}
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Orb 2 */}
        <motion.div
          className="absolute left-[-15%] bottom-[-15%] w-[65vw] h-[65vw] max-w-[750px] max-h-[750px]"
          initial={false}
          animate={{
            x: activeTheme.orbs.orb2.x,
            y: activeTheme.orbs.orb2.y,
            scale: activeTheme.orbs.orb2.scale,
            background: `radial-gradient(circle, ${activeTheme.orbs.orb2.from} 0%, ${activeTheme.orbs.orb2.to} 100%)`,
            borderRadius: FLUID_BLOB_MORPHS_ALT,
            rotate: -360,
          }}
          transition={{
            x: CINEMATIC_SPRING_TRANSITION,
            y: CINEMATIC_SPRING_TRANSITION,
            scale: CINEMATIC_SPRING_TRANSITION,
            background: CINEMATIC_MORPH_TRANSITION,
            borderRadius: { duration: 30, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 46, repeat: Infinity, ease: 'linear' },
          }}
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Orb 3 */}
        <motion.div
          className="absolute left-[20%] top-[25%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px]"
          initial={false}
          animate={{
            x: activeTheme.orbs.orb3.x,
            y: activeTheme.orbs.orb3.y,
            scale: activeTheme.orbs.orb3.scale,
            background: `radial-gradient(circle, ${activeTheme.orbs.orb3.from} 0%, ${activeTheme.orbs.orb3.to} 100%)`,
            borderRadius: FLUID_BLOB_MORPHS,
            rotate: 180,
          }}
          transition={{
            x: CINEMATIC_SPRING_TRANSITION,
            y: CINEMATIC_SPRING_TRANSITION,
            scale: CINEMATIC_SPRING_TRANSITION,
            background: CINEMATIC_MORPH_TRANSITION,
            borderRadius: { duration: 28, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 42, repeat: Infinity, ease: 'linear' },
          }}
          style={{ mixBlendMode: 'screen' }}
        />
      </div>

      {/* 3. Persistent Continuous Morphing SVG Silk Waves & Orbital Rings */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.svg
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          preserveAspectRatio="xMidYMid slice"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <defs>
            <linearGradient id="morphAuroraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <motion.stop
                offset="0%"
                initial={false}
                animate={{ stopColor: activeTheme.svg.grad1Start }}
                transition={CINEMATIC_MORPH_TRANSITION}
                stopOpacity="0.46"
              />
              <motion.stop
                offset="50%"
                initial={false}
                animate={{ stopColor: activeTheme.svg.grad1Mid }}
                transition={CINEMATIC_MORPH_TRANSITION}
                stopOpacity="0.45"
              />
              <motion.stop
                offset="100%"
                initial={false}
                animate={{ stopColor: activeTheme.svg.grad1End }}
                transition={CINEMATIC_MORPH_TRANSITION}
                stopOpacity="0.46"
              />
            </linearGradient>

            <linearGradient id="morphAuroraGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <motion.stop
                offset="0%"
                initial={false}
                animate={{ stopColor: activeTheme.svg.grad2Start }}
                transition={CINEMATIC_MORPH_TRANSITION}
                stopOpacity="0.42"
              />
              <motion.stop
                offset="50%"
                initial={false}
                animate={{ stopColor: activeTheme.svg.grad2Mid }}
                transition={CINEMATIC_MORPH_TRANSITION}
                stopOpacity="0.38"
              />
              <motion.stop
                offset="100%"
                initial={false}
                animate={{ stopColor: activeTheme.svg.grad2End }}
                transition={CINEMATIC_MORPH_TRANSITION}
                stopOpacity="0.46"
              />
            </linearGradient>
          </defs>

          {/* Soft Blurred Aurora Silk Ribbon (Bends continuously with Wave 1) */}
          <motion.path
            initial={false}
            animate={{
              d: activeTheme.svg.wave1RibbonPath,
              stroke: activeTheme.svg.grad1Mid,
            }}
            transition={CINEMATIC_MORPH_TRANSITION}
            strokeWidth="16"
            strokeOpacity="0.24"
            strokeLinecap="round"
            style={{ filter: 'blur(14px)' }}
          />

          {/* Primary Aurora Silk Wave 1 (Top-to-Mid Morphing Curve) */}
          <motion.path
            initial={false}
            animate={{
              d: activeTheme.svg.wave1Path,
            }}
            transition={CINEMATIC_MORPH_TRANSITION}
            stroke="url(#morphAuroraGrad1)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Secondary Intersecting Silk Wave 3 (Mid-Canvas Harmonic Thread) */}
          <motion.path
            initial={false}
            animate={{
              d: activeTheme.svg.wave3Path,
              stroke: activeTheme.svg.grad1End,
            }}
            transition={{
              ...CINEMATIC_MORPH_TRANSITION,
              delay: 0.06,
            }}
            strokeWidth="1.6"
            strokeOpacity="0.28"
            strokeLinecap="round"
          />

          {/* Horizon Dashed Wave 2 (Bottom Morphing Curve) */}
          <motion.path
            initial={false}
            animate={{
              d: activeTheme.svg.wave2Path,
              strokeDasharray: activeTheme.svg.wave2Dash,
            }}
            transition={{
              ...CINEMATIC_MORPH_TRANSITION,
              delay: 0.04,
            }}
            stroke="url(#morphAuroraGrad2)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Morphing Geometric Orbital Ring 1 (Top-Right) */}
          <motion.circle
            initial={false}
            animate={{
              cx: activeTheme.svg.ring1.cx,
              cy: activeTheme.svg.ring1.cy,
              r: activeTheme.svg.ring1.r,
              strokeDasharray: activeTheme.svg.ring1.dash,
              rotate: 360,
            }}
            transition={{
              cx: CINEMATIC_MORPH_TRANSITION,
              cy: CINEMATIC_MORPH_TRANSITION,
              r: CINEMATIC_MORPH_TRANSITION,
              strokeDasharray: CINEMATIC_MORPH_TRANSITION,
              rotate: { duration: 58, repeat: Infinity, ease: 'linear' },
            }}
            stroke="url(#morphAuroraGrad1)"
            strokeWidth="1.35"
            style={{ transformOrigin: '1240px 200px' }}
          />

          {/* Morphing Geometric Orbital Ring 2 (Bottom-Left) */}
          <motion.circle
            initial={false}
            animate={{
              cx: activeTheme.svg.ring2.cx,
              cy: activeTheme.svg.ring2.cy,
              r: activeTheme.svg.ring2.r,
              strokeDasharray: activeTheme.svg.ring2.dash,
              rotate: -360,
            }}
            transition={{
              cx: CINEMATIC_MORPH_TRANSITION,
              cy: CINEMATIC_MORPH_TRANSITION,
              r: CINEMATIC_MORPH_TRANSITION,
              strokeDasharray: CINEMATIC_MORPH_TRANSITION,
              rotate: { duration: 48, repeat: Infinity, ease: 'linear' },
            }}
            stroke="url(#morphAuroraGrad2)"
            strokeWidth="1.35"
            style={{ transformOrigin: '200px 710px' }}
          />
        </motion.svg>

        {/* 4. Persistent 3D Artifacts: Morphing Holographic Glass Plates <-> Luxury Crystal Prisms */}
        {MORPHING_ARTIFACTS.map((artifact, idx) => {
          const targetGeom = artifact.states[themeKey];
          return (
            /* LAYER 1 (Outer): Handles Slow Cinematic Geometry, Position & Shape Morphing */
            <motion.div
              key={artifact.id}
              initial={false}
              animate={{
                width: targetGeom.width,
                height: targetGeom.height,
                borderRadius: targetGeom.borderRadius,
                rotate: targetGeom.rotate,
                x: targetGeom.x,
                y: targetGeom.y,
                scale: targetGeom.scale,
                background: activeTheme.artifactStyle.background,
                borderColor: activeTheme.artifactStyle.borderColor,
                boxShadow: activeTheme.artifactStyle.shadow,
              }}
              transition={{
                width: CINEMATIC_SPRING_TRANSITION,
                height: CINEMATIC_SPRING_TRANSITION,
                borderRadius: CINEMATIC_SPRING_TRANSITION,
                rotate: CINEMATIC_SPRING_TRANSITION,
                x: CINEMATIC_SPRING_TRANSITION,
                y: CINEMATIC_SPRING_TRANSITION,
                scale: CINEMATIC_SPRING_TRANSITION,
                background: CINEMATIC_MORPH_TRANSITION,
                borderColor: CINEMATIC_MORPH_TRANSITION,
                boxShadow: CINEMATIC_MORPH_TRANSITION,
              }}
              className={`hidden sm:block absolute ${artifact.anchorClass} backdrop-blur-md border`}
              style={{ willChange: 'transform, width, height, border-radius' }}
            >
              {/* LAYER 2 (Inner): Continuous Gentle Sine Floating (Never Interrupted by Mode Switch) */}
              <motion.div
                animate={{
                  y: [0, artifact.floatAmplitude, 0],
                  rotateZ: [0, idx % 2 === 0 ? 5 : -5, 0],
                }}
                transition={{
                  y: {
                    duration: artifact.floatDuration * 0.65,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.3,
                  },
                  rotateZ: {
                    duration: artifact.floatDuration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.2,
                  },
                }}
                className="relative w-full h-full p-3.5 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Morphing Energy Bar & Status Orb */}
                <div className="flex items-center justify-between">
                  <motion.div
                    initial={false}
                    animate={{
                      width: themeKey === 'LOGIN' ? 36 : 24,
                      background: activeTheme.artifactStyle.accentBarGradient,
                    }}
                    transition={CINEMATIC_MORPH_TRANSITION}
                    className="h-1 rounded-full"
                  />
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: activeTheme.artifactStyle.orbGlowColor,
                      boxShadow: `0 0 10px ${activeTheme.artifactStyle.orbGlowColor}`,
                      scale: themeKey === 'REGISTER_TRIAL' ? 1.25 : 1,
                    }}
                    transition={CINEMATIC_MORPH_TRANSITION}
                    className="w-2 h-2 rounded-full"
                  />
                </div>

                {/* Center Diagonal Prismatic Facet Line (Emerges as plate morphs into crystal prism) */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: activeTheme.artifactStyle.prismOpacity,
                    rotate: themeKey === 'REGISTER_TRIAL' ? 45 : -35,
                    scaleX: activeTheme.artifactStyle.prismOpacity ? 1 : 0.4,
                  }}
                  transition={CINEMATIC_MORPH_TRANSITION}
                  className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent self-center"
                />

                {/* Bottom Morphing HUD Bar / Prismatic Corner Gem */}
                <div className="flex items-center justify-between">
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: activeTheme.artifactStyle.hudOpacity,
                      width: themeKey === 'LOGIN' ? 28 : 10,
                    }}
                    transition={CINEMATIC_MORPH_TRANSITION}
                    className="h-1 rounded-full bg-sky-400/45"
                  />
                  <motion.div
                    initial={false}
                    animate={{
                      width: themeKey === 'LOGIN' ? 48 : 14,
                      height: themeKey === 'LOGIN' ? 4 : 14,
                      borderRadius: themeKey === 'LOGIN' ? 999 : 6,
                      rotate: themeKey === 'LOGIN' ? 0 : 45,
                      background: activeTheme.artifactStyle.accentBarGradient,
                    }}
                    transition={CINEMATIC_SPRING_TRANSITION}
                    className="opacity-75"
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}

        {/* 5. Gliding Starlight Energy Nodes */}
        {MORPHING_SPARKLES.map((node) => {
          const targetCoord = node.coords[themeKey];
          return (
            <motion.div
              key={node.id}
              initial={false}
              animate={{
                left: targetCoord.left,
                top: targetCoord.top,
                background: activeTheme.sparkle.background,
                boxShadow: activeTheme.sparkle.boxShadow,
              }}
              transition={{
                left: CINEMATIC_MORPH_TRANSITION,
                top: CINEMATIC_MORPH_TRANSITION,
                background: CINEMATIC_MORPH_TRANSITION,
                boxShadow: CINEMATIC_MORPH_TRANSITION,
              }}
              className="absolute rounded-full"
              style={{
                width: node.size,
                height: node.size,
              }}
            >
              <motion.div
                animate={{
                  scale: [0.85, 1.55, 0.85],
                  opacity: [0.35, 0.9, 0.35],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4.4,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: 'easeInOut',
                }}
                className="w-full h-full rounded-full bg-inherit"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Gentle vignette to ground the composition */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.015)_100%)]" />
    </div>
  );
};
