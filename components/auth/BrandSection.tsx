import React from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type Transition,
} from 'framer-motion';
import {
  Sparkles,
  Lock,
  Lightbulb,
  Camera,
  Users,
  Crown,
  Layers,
  Zap,
  CalendarCheck,
  Trophy,
} from 'lucide-react';
import { BRAND_CONFIG } from '../../config/brand.ts';

interface BrandSectionProps {
  authMode: 'LOGIN' | 'REGISTER' | 'FORGOT' | 'UPDATE';
  onboardingMode?: 'JOIN_TEAM' | 'CREATE_TRIAL';
}

type PanelThemeKey = 'LOGIN' | 'REGISTER_JOIN' | 'REGISTER_TRIAL' | 'SECURITY';

interface FloatingIdeaCardItem {
  slotId: string;
  icon: React.ElementType;
  title: string;
  meta: string;
  accentGradient: string;
  borderColor: string;
  xOffset: number;
  baseRotate: number;
  floatDelay: number;
  dotColor: string;
  dotShadow: string;
  metaColorClass: string;
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

interface PanelMorphConfig {
  baseGradient: string;
  radialOverlay: string;
  svg: {
    stroke1: string;
    stroke2: string;
    waveTopPath: string;
    waveBottomPath: string;
    waveCenterPath: string;
    waveDash: string;
  };
  orbit1: {
    x: number;
    y: number;
    scale: number;
    borderColor: string;
  };
  orbit2: {
    x: number;
    y: number;
    scale: number;
    borderColor: string;
    dotBg: string;
    dotShadow: string;
  };
  emblem: {
    auraGradient: string;
    boxBg: string;
    boxBorder: string;
    borderRadius: number;
    baseRotate: number;
    badgeBg: string;
    badgeTextClass: string;
  };
  titleGradientClass: string;
  subtitleColorClass: string;
  subtitleText: string;
  cards: FloatingIdeaCardItem[];
}

/**
 * All SVG wave paths inside BrandSection share the exact same Cubic Bezier structure:
 * M x0 y0 C x1 y1, x2 y2, x3 y3 C x4 y4, x5 y5, x6 y6
 * so Framer Motion bends the silk curves smoothly when switching Login <-> Register.
 */
const PANEL_THEMES: Record<PanelThemeKey, PanelMorphConfig> = {
  LOGIN: {
    baseGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 52%, #3b0764 100%)',
    radialOverlay:
      'radial-gradient(circle at 18% 18%, rgba(56, 189, 248, 0.38) 0%, transparent 52%), radial-gradient(circle at 85% 82%, rgba(139, 92, 246, 0.45) 0%, transparent 58%)',
    svg: {
      stroke1: 'rgba(125, 211, 252, 0.34)',
      stroke2: 'rgba(167, 139, 250, 0.30)',
      waveTopPath: 'M -60 110 C 90 20, 240 210, 390 95 C 470 40, 530 140, 600 80',
      waveCenterPath: 'M -60 320 C 110 410, 270 210, 420 330 C 490 385, 540 270, 600 310',
      waveBottomPath: 'M -60 520 C 120 420, 290 610, 440 490 C 500 440, 550 530, 600 480',
      waveDash: '8 8',
    },
    orbit1: {
      x: 0,
      y: 0,
      scale: 1,
      borderColor: 'rgba(125, 211, 252, 0.25)',
    },
    orbit2: {
      x: 0,
      y: 0,
      scale: 1,
      borderColor: 'rgba(165, 180, 252, 0.25)',
      dotBg: '#7dd3fc',
      dotShadow: '0 0 14px rgba(56, 189, 248, 0.95)',
    },
    emblem: {
      auraGradient:
        'linear-gradient(45deg, rgba(56, 189, 248, 0.48), rgba(99, 102, 241, 0.38), rgba(168, 85, 247, 0.48))',
      boxBg:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.30), rgba(186, 230, 253, 0.16), rgba(165, 180, 252, 0.10))',
      boxBorder: 'rgba(186, 230, 253, 0.48)',
      borderRadius: 24,
      baseRotate: 0,
      badgeBg: 'linear-gradient(135deg, #bae6fd, #a5b4fc)',
      badgeTextClass: 'text-indigo-950',
    },
    titleGradientClass: 'from-white via-sky-100 to-indigo-200',
    subtitleColorClass: 'text-sky-100/90',
    subtitleText:
      'ศูนย์บัญชาการบริหารงานคอนเทนต์ คิวกองถ่าย และระบบเกมมิฟิเคชันสำหรับทีมครีเอเตอร์ยุคใหม่',
    cards: [
      {
        slotId: 'slot-1',
        icon: Layers,
        title: 'All-in-One Content Pipeline',
        meta: 'Kanban · Calendar · Script Studio',
        accentGradient: 'linear-gradient(135deg, rgba(125, 211, 252, 0.38), rgba(129, 140, 248, 0.28))',
        borderColor: 'rgba(186, 230, 253, 0.45)',
        xOffset: -8,
        baseRotate: -1,
        floatDelay: 0,
        dotColor: '#7dd3fc',
        dotShadow: '0 0 8px rgba(56, 189, 248, 0.85)',
        metaColorClass: 'text-sky-100/85',
      },
      {
        slotId: 'slot-2',
        icon: CalendarCheck,
        title: 'Real-Time Shoot & Task Sync',
        meta: 'Live Queue · Duty Roster · LINE Alerts',
        accentGradient: 'linear-gradient(135deg, rgba(165, 180, 252, 0.38), rgba(192, 132, 252, 0.28))',
        borderColor: 'rgba(199, 210, 254, 0.45)',
        xOffset: 8,
        baseRotate: 1,
        floatDelay: 0.55,
        dotColor: '#a5b4fc',
        dotShadow: '0 0 8px rgba(129, 140, 248, 0.85)',
        metaColorClass: 'text-indigo-100/85',
      },
      {
        slotId: 'slot-3',
        icon: Trophy,
        title: 'Gamified KPI & Team Synergy',
        meta: 'XP Rewards · HP Shield · Leaderboards',
        accentGradient: 'linear-gradient(135deg, rgba(216, 180, 254, 0.38), rgba(103, 232, 249, 0.28))',
        borderColor: 'rgba(233, 213, 255, 0.45)',
        xOffset: -8,
        baseRotate: -1,
        floatDelay: 1.1,
        dotColor: '#d8b4fe',
        dotShadow: '0 0 8px rgba(192, 132, 252, 0.85)',
        metaColorClass: 'text-purple-100/85',
      },
    ],
  },
  REGISTER_JOIN: {
    baseGradient: 'linear-gradient(135deg, #881337 0%, #be185d 52%, #6b21a8 100%)',
    radialOverlay:
      'radial-gradient(circle at 18% 18%, rgba(253, 230, 138, 0.35) 0%, transparent 50%), radial-gradient(circle at 85% 82%, rgba(244, 114, 182, 0.42) 0%, transparent 55%)',
    svg: {
      stroke1: 'rgba(253, 230, 138, 0.34)',
      stroke2: 'rgba(253, 164, 175, 0.32)',
      // Inverted crest & trough for smooth silk bending
      waveTopPath: 'M -60 150 C 110 230, 250 30, 400 145 C 480 205, 535 70, 600 125',
      waveCenterPath: 'M -60 290 C 100 190, 280 390, 430 270 C 495 215, 545 335, 600 285',
      waveBottomPath: 'M -60 480 C 130 580, 280 390, 430 520 C 495 570, 545 450, 600 510',
      waveDash: '5 9',
    },
    orbit1: {
      x: -18,
      y: 22,
      scale: 0.93,
      borderColor: 'rgba(253, 230, 138, 0.24)',
    },
    orbit2: {
      x: 20,
      y: -18,
      scale: 1.07,
      borderColor: 'rgba(253, 164, 175, 0.24)',
      dotBg: '#fde68a',
      dotShadow: '0 0 14px rgba(253, 230, 138, 0.95)',
    },
    emblem: {
      auraGradient:
        'linear-gradient(45deg, rgba(252, 211, 77, 0.45), rgba(251, 113, 133, 0.38), rgba(192, 132, 252, 0.45))',
      boxBg:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.30), rgba(255, 228, 230, 0.16), rgba(254, 243, 199, 0.12))',
      boxBorder: 'rgba(254, 243, 199, 0.46)',
      borderRadius: 28,
      baseRotate: 0,
      badgeBg: 'linear-gradient(135deg, #fde68a, #fda4af)',
      badgeTextClass: 'text-rose-950',
    },
    titleGradientClass: 'from-white via-amber-100 to-rose-100',
    subtitleColorClass: 'text-rose-100/90',
    subtitleText: 'จุดประกายไอเดียและเชื่อมต่อเวิร์กโฟลว์การผลิตคอนเทนต์ร่วมกับทีมครีเอเตอร์ของคุณ',
    cards: [
      {
        slotId: 'slot-1',
        icon: Lightbulb,
        title: 'Creative Script & Idea Lab',
        meta: 'Storyboard · Content Brief · Brainstorm',
        accentGradient: 'linear-gradient(135deg, rgba(253, 230, 138, 0.38), rgba(253, 164, 175, 0.28))',
        borderColor: 'rgba(253, 230, 138, 0.42)',
        xOffset: 8,
        baseRotate: 1,
        floatDelay: 0,
        dotColor: '#fde68a',
        dotShadow: '0 0 8px rgba(253, 230, 138, 0.85)',
        metaColorClass: 'text-amber-100/85',
      },
      {
        slotId: 'slot-2',
        icon: Camera,
        title: 'Production & Shoot Sync',
        meta: 'Call Sheet · Studio Queue · Equipment',
        accentGradient: 'linear-gradient(135deg, rgba(253, 164, 175, 0.38), rgba(216, 180, 254, 0.28))',
        borderColor: 'rgba(253, 164, 175, 0.42)',
        xOffset: -8,
        baseRotate: -1,
        floatDelay: 0.55,
        dotColor: '#fda4af',
        dotShadow: '0 0 8px rgba(253, 164, 175, 0.85)',
        metaColorClass: 'text-rose-100/85',
      },
      {
        slotId: 'slot-3',
        icon: Users,
        title: 'Real-Time Team Synergy',
        meta: 'Workload · Multi-Role · Live Feedback',
        accentGradient: 'linear-gradient(135deg, rgba(216, 180, 254, 0.38), rgba(253, 230, 138, 0.28))',
        borderColor: 'rgba(233, 213, 255, 0.42)',
        xOffset: 8,
        baseRotate: 1,
        floatDelay: 1.1,
        dotColor: '#fde68a',
        dotShadow: '0 0 8px rgba(253, 230, 138, 0.85)',
        metaColorClass: 'text-amber-100/85',
      },
    ],
  },
  REGISTER_TRIAL: {
    baseGradient: 'linear-gradient(135deg, #78350f 0%, #9d174d 52%, #581c87 100%)',
    radialOverlay:
      'radial-gradient(circle at 80% 18%, rgba(251, 191, 36, 0.44) 0%, transparent 52%), radial-gradient(circle at 15% 85%, rgba(251, 113, 133, 0.38) 0%, transparent 55%)',
    svg: {
      stroke1: 'rgba(251, 191, 36, 0.40)',
      stroke2: 'rgba(244, 114, 182, 0.34)',
      // Royal Executive Arch curves
      waveTopPath: 'M -60 135 C 100 45, 290 45, 430 135 C 495 175, 545 85, 600 110',
      waveCenterPath: 'M -60 315 C 120 225, 290 225, 435 315 C 500 355, 545 265, 600 295',
      waveBottomPath: 'M -60 505 C 120 415, 300 415, 445 505 C 505 545, 550 465, 600 490',
      waveDash: '3 8',
    },
    orbit1: {
      x: 12,
      y: -14,
      scale: 1.09,
      borderColor: 'rgba(252, 211, 77, 0.30)',
    },
    orbit2: {
      x: -14,
      y: 14,
      scale: 1.12,
      borderColor: 'rgba(251, 113, 133, 0.28)',
      dotBg: '#fbbf24',
      dotShadow: '0 0 16px rgba(251, 191, 36, 0.98)',
    },
    emblem: {
      auraGradient:
        'linear-gradient(45deg, rgba(251, 191, 36, 0.55), rgba(244, 63, 94, 0.42), rgba(168, 85, 247, 0.48))',
      boxBg:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.34), rgba(254, 243, 199, 0.22), rgba(253, 164, 175, 0.14))',
      boxBorder: 'rgba(253, 230, 138, 0.60)',
      borderRadius: 30,
      baseRotate: 0,
      badgeBg: 'linear-gradient(135deg, #fde68a, #f59e0b)',
      badgeTextClass: 'text-amber-950',
    },
    titleGradientClass: 'from-white via-amber-100 to-rose-100',
    subtitleColorClass: 'text-amber-100/90',
    subtitleText:
      'เปิดตัวสตูดิโอและอาณาจักรธุรกิจสร้างสรรค์ของคุณ พร้อมปลดล็อกฟีเจอร์ระดับ PRO ครบชุด',
    cards: [
      {
        slotId: 'slot-1',
        icon: Crown,
        title: 'Executive Creative HQ',
        meta: 'Isolated Workspace · Owner Access · Custom',
        accentGradient: 'linear-gradient(135deg, rgba(252, 211, 77, 0.45), rgba(254, 240, 138, 0.30))',
        borderColor: 'rgba(253, 230, 138, 0.52)',
        xOffset: -8,
        baseRotate: -1,
        floatDelay: 0,
        dotColor: '#fde68a',
        dotShadow: '0 0 10px rgba(253, 230, 138, 0.95)',
        metaColorClass: 'text-amber-100/85',
      },
      {
        slotId: 'slot-2',
        icon: Layers,
        title: 'Multi-Brand & Finance Studio',
        meta: 'Sub-Brands · Quotation · Payroll & KPI',
        accentGradient: 'linear-gradient(135deg, rgba(253, 164, 175, 0.42), rgba(253, 230, 138, 0.30))',
        borderColor: 'rgba(253, 164, 175, 0.46)',
        xOffset: 8,
        baseRotate: 1,
        floatDelay: 0.55,
        dotColor: '#fde68a',
        dotShadow: '0 0 10px rgba(253, 230, 138, 0.95)',
        metaColorClass: 'text-amber-100/85',
      },
      {
        slotId: 'slot-3',
        icon: Zap,
        title: 'PRO Experience · 7 Days Free',
        meta: 'Up to 5 Members · All Modules · Instant Ready',
        accentGradient: 'linear-gradient(135deg, rgba(216, 180, 254, 0.42), rgba(253, 230, 138, 0.30))',
        borderColor: 'rgba(253, 230, 138, 0.46)',
        xOffset: -8,
        baseRotate: -1,
        floatDelay: 1.1,
        dotColor: '#fde68a',
        dotShadow: '0 0 10px rgba(253, 230, 138, 0.95)',
        metaColorClass: 'text-amber-100/85',
      },
    ],
  },
  SECURITY: {
    baseGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 52%, #334155 100%)',
    radialOverlay:
      'radial-gradient(circle at 20% 20%, rgba(129, 140, 248, 0.30) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.30) 0%, transparent 55%)',
    svg: {
      stroke1: 'rgba(148, 163, 184, 0.25)',
      stroke2: 'rgba(165, 180, 252, 0.25)',
      waveTopPath: 'M -60 130 C 100 90, 260 170, 410 120 C 480 95, 540 135, 600 110',
      waveCenterPath: 'M -60 310 C 110 280, 270 340, 420 300 C 490 285, 540 320, 600 305',
      waveBottomPath: 'M -60 500 C 120 460, 280 540, 430 490 C 495 470, 545 510, 600 495',
      waveDash: '6 10',
    },
    orbit1: {
      x: 0,
      y: 0,
      scale: 0.9,
      borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    orbit2: {
      x: 0,
      y: 0,
      scale: 0.9,
      borderColor: 'rgba(165, 180, 252, 0.2)',
      dotBg: '#cbd5e1',
      dotShadow: '0 0 10px rgba(203, 213, 225, 0.8)',
    },
    emblem: {
      auraGradient:
        'linear-gradient(45deg, rgba(99, 102, 241, 0.35), rgba(168, 85, 247, 0.35), rgba(56, 189, 248, 0.35))',
      boxBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.10))',
      boxBorder: 'rgba(255, 255, 255, 0.35)',
      borderRadius: 28,
      baseRotate: 2,
      badgeBg: 'linear-gradient(135deg, #c7d2fe, #e9d5ff)',
      badgeTextClass: 'text-slate-900',
    },
    titleGradientClass: 'from-white via-slate-100 to-indigo-100',
    subtitleColorClass: 'text-white/90',
    subtitleText: 'ระบบรักษาความปลอดภัยและยืนยันตัวตนมาตรฐานองค์กร',
    cards: [],
  },
};

export const BrandSection: React.FC<BrandSectionProps> = ({
  authMode,
  onboardingMode = 'JOIN_TEAM',
}) => {
  const isLogin = authMode === 'LOGIN';
  const isRegister = authMode === 'REGISTER';
  const isTrialMode = isRegister && onboardingMode === 'CREATE_TRIAL';
  const showFloatingShowcase = isLogin || isRegister;

  const panelKey: PanelThemeKey = isLogin
    ? 'LOGIN'
    : isRegister
    ? isTrialMode
      ? 'REGISTER_TRIAL'
      : 'REGISTER_JOIN'
    : 'SECURITY';

  const activeTheme = PANEL_THEMES[panelKey];

  // Interactive 3D Mouse Tilt (Pure Framer Motion Spring Physics)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 22 });

  const tiltRotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const tiltRotateY = useTransform(springX, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(normX);
    mouseY.set(normY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1100px' }}
      className="hidden md:flex md:w-5/12 relative flex-col items-center justify-center text-white p-8 lg:p-10 overflow-hidden select-none"
    >
      {/* 1. Persistent Continuous Morphing Base Gradient & Radial Glow */}
      <motion.div
        initial={false}
        animate={{ background: activeTheme.baseGradient }}
        transition={CINEMATIC_MORPH_TRANSITION}
        className="absolute inset-0 z-0"
      />
      <motion.div
        initial={false}
        animate={{ background: activeTheme.radialOverlay }}
        transition={CINEMATIC_MORPH_TRANSITION}
        className="absolute inset-0 opacity-75 z-0"
      />

      {/* 2. Architectural Dot Grid Overlay */}
      <div
        className="absolute inset-0 opacity-15 z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 4px 4px, white 1.5px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* 3. Persistent Inner SVG Silk Curves (Continuously Bends on Mode Switch) */}
      <motion.svg
        viewBox="0 0 540 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 opacity-85"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Top Morphing Silk Wave */}
        <motion.path
          initial={false}
          animate={{
            d: activeTheme.svg.waveTopPath,
            stroke: activeTheme.svg.stroke1,
          }}
          transition={CINEMATIC_MORPH_TRANSITION}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Center Harmonic Silk Thread */}
        <motion.path
          initial={false}
          animate={{
            d: activeTheme.svg.waveCenterPath,
            stroke: activeTheme.svg.stroke2,
          }}
          transition={{
            ...CINEMATIC_MORPH_TRANSITION,
            delay: 0.05,
          }}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Bottom Dashed Horizon Wave */}
        <motion.path
          initial={false}
          animate={{
            d: activeTheme.svg.waveBottomPath,
            stroke: activeTheme.svg.stroke1,
            strokeDasharray: activeTheme.svg.waveDash,
          }}
          transition={{
            ...CINEMATIC_MORPH_TRANSITION,
            delay: 0.08,
          }}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </motion.svg>

      {/* 4. Persistent Rotating Orbital Hairline Rings (Glides & Resizes Without Unmounting) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
        {/* Outer Orbital Wrapper (Handles Slow Cinematic Position & Scale Morph) */}
        <motion.div
          initial={false}
          animate={{
            x: activeTheme.orbit1.x,
            y: activeTheme.orbit1.y,
            scale: activeTheme.orbit1.scale,
            borderColor: activeTheme.orbit1.borderColor,
          }}
          transition={{
            x: CINEMATIC_SPRING_TRANSITION,
            y: CINEMATIC_SPRING_TRANSITION,
            scale: CINEMATIC_SPRING_TRANSITION,
            borderColor: CINEMATIC_MORPH_TRANSITION,
          }}
          className="w-[380px] h-[380px] rounded-full border border-dashed absolute -top-16 -right-16"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full"
          />
        </motion.div>

        {/* Inner Counter-Rotating Orbit Wrapper (Handles Slow Cinematic Position, Scale & Satellite Color Morph) */}
        <motion.div
          initial={false}
          animate={{
            x: activeTheme.orbit2.x,
            y: activeTheme.orbit2.y,
            scale: activeTheme.orbit2.scale,
            borderColor: activeTheme.orbit2.borderColor,
          }}
          transition={{
            x: CINEMATIC_SPRING_TRANSITION,
            y: CINEMATIC_SPRING_TRANSITION,
            scale: CINEMATIC_SPRING_TRANSITION,
            borderColor: CINEMATIC_MORPH_TRANSITION,
          }}
          className="w-[290px] h-[290px] rounded-full border absolute -bottom-14 -left-14"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
            className="w-full h-full rounded-full flex items-center justify-start"
          >
            <motion.div
              initial={false}
              animate={{
                backgroundColor: activeTheme.orbit2.dotBg,
                boxShadow: activeTheme.orbit2.dotShadow,
              }}
              transition={CINEMATIC_MORPH_TRANSITION}
              className="w-2.5 h-2.5 rounded-full -ml-1"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* 5. Main Interactive 3D Showcase Content */}
      {showFloatingShowcase ? (
        <motion.div
          style={{
            rotateX: tiltRotateX,
            rotateY: tiltRotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative z-10 w-full flex flex-col items-center text-center"
        >
          {/* Persistent Top 3D Hologram <-> Luxury Prism Emblem */}
          <div className="relative mb-5">
            {/* Morphing Glowing Aura behind Emblem */}
            <motion.div
              initial={false}
              animate={{
                background: activeTheme.emblem.auraGradient,
                scale: [1, 1.18, 1],
                opacity: [0.38, 0.68, 0.38],
              }}
              transition={{
                background: CINEMATIC_MORPH_TRANSITION,
                scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
              }}
              className="absolute -inset-3 rounded-[2rem] blur-xl"
            />

            {/* Layer 1: Morphing Emblem Geometry & Glass Surface */}
            <motion.div
              initial={false}
              animate={{
                background: activeTheme.emblem.boxBg,
                borderColor: activeTheme.emblem.boxBorder,
                borderRadius: activeTheme.emblem.borderRadius,
              }}
              transition={{
                background: CINEMATIC_MORPH_TRANSITION,
                borderColor: CINEMATIC_MORPH_TRANSITION,
                borderRadius: CINEMATIC_SPRING_TRANSITION,
              }}
              className="relative w-20 h-20 backdrop-blur-xl border shadow-[0_20px_40px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.65)]"
            >
              {/* Layer 2: Gentle Continuous Sine Float */}
              <motion.div
                animate={{
                  rotateZ: [1.5, 3.5, 1.5, -2, 1.5],
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 5.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ willChange: 'transform' }}
                className="w-full h-full flex items-center justify-center relative"
              >
                {/* Centered Icon Container with Zero-Jitter Scale/Fade */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={panelKey}
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.75 }}
                      transition={{ duration: 0.35, ease: CINEMATIC_EASE }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {isLogin ? (
                        <Sparkles className="w-10 h-10 text-sky-100 drop-shadow-[0_4px_12px_rgba(56,189,248,0.6)]" />
                      ) : isTrialMode ? (
                        <Crown className="w-10 h-10 text-amber-100 drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]" />
                      ) : (
                        <Lightbulb className="w-10 h-10 text-amber-100 drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Corner Badge Accent */}
                <motion.div
                  initial={false}
                  animate={{
                    background: activeTheme.emblem.badgeBg,
                    scale: [0.92, 1.18, 0.92],
                  }}
                  transition={{
                    background: CINEMATIC_MORPH_TRANSITION,
                    scale: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  className={`absolute -top-2 -right-2 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg border border-white/80 ${activeTheme.emblem.badgeTextClass}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Brand Title with Silky Crossfade Gradient Layers (Zero Layout Shift & Zero Font Jump) */}
          <div className="relative h-10 lg:h-12 w-full flex items-center justify-center mb-2">
            {/* Login Mode Layer */}
            <motion.h2
              id="brand-title-login"
              animate={{ opacity: isLogin ? 1 : 0 }}
              transition={{ duration: 0.4, ease: CINEMATIC_EASE }}
              className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight bg-clip-text text-transparent drop-shadow-sm bg-gradient-to-r from-white via-sky-100 to-indigo-200 absolute select-none pointer-events-none"
            >
              {BRAND_CONFIG.name}
            </motion.h2>

            {/* Register Mode Layer */}
            <motion.h2
              id="brand-title-register"
              animate={{ opacity: isLogin ? 0 : 1 }}
              transition={{ duration: 0.4, ease: CINEMATIC_EASE }}
              className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight bg-clip-text text-transparent drop-shadow-sm bg-gradient-to-r from-white via-amber-100 to-rose-100 absolute select-none pointer-events-none"
            >
              {BRAND_CONFIG.name}
            </motion.h2>
          </div>

          {/* Smoothly Morphing Subtitle with Rigid Zero-Shift Frame */}
          <div className="h-14 w-full max-w-[285px] relative flex items-center justify-center mb-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={panelKey}
                id="brand-description"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.35, ease: CINEMATIC_EASE }}
                className={`text-xs lg:text-sm leading-relaxed font-medium max-w-[285px] text-center absolute inset-0 flex items-center justify-center ${activeTheme.subtitleColorClass}`}
              >
                {activeTheme.subtitleText}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* 3 Persistent Glassmorphic Cards that Glide & Morph Position/Colors Across Modes */}
          <div className="w-full max-w-[304px] flex flex-col gap-3">
            {activeTheme.cards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                /* LAYER 1 (Outer): Persistent Card Slot — Glides Horizontally & Tilts on Mode Switch */
                <motion.div
                  key={card.slotId}
                  initial={false}
                  animate={{
                    x: card.xOffset,
                    rotate: card.baseRotate,
                  }}
                  transition={CINEMATIC_SPRING_TRANSITION}
                  className="w-[94%] self-center"
                >
                  {/* LAYER 2 (Inner): Continuous Sine Floating & Hover Lift with Fixed Rigid Height */}
                  <motion.div
                    animate={{
                      y: [0, -5, 0],
                      rotateZ: [0, index % 2 === 0 ? 0.75 : -0.75, 0],
                    }}
                    whileHover={{
                      scale: 1.03,
                      transition: { type: 'spring', stiffness: 320, damping: 24 },
                    }}
                    transition={{
                      y: {
                        duration: 3.8 + index * 0.45,
                        repeat: Infinity,
                        delay: card.floatDelay,
                        ease: 'easeInOut',
                      },
                      rotateZ: {
                        duration: 4.6 + index * 0.5,
                        repeat: Infinity,
                        delay: card.floatDelay,
                        ease: 'easeInOut',
                      },
                    }}
                    style={{ willChange: 'transform' }}
                    className="group relative rounded-2xl p-3 bg-gradient-to-r from-white/20 via-white/12 to-white/8 backdrop-blur-xl border border-white/25 shadow-[0_14px_30px_-8px_rgba(0,0,0,0.24),inset_0_1px_1px_rgba(255,255,255,0.45)] flex items-center gap-3 text-left cursor-default h-[62px]"
                  >
                    {/* Morphing Left Hologram / Prism Icon Box */}
                    <motion.div
                      initial={false}
                      animate={{
                        background: card.accentGradient,
                        borderColor: card.borderColor,
                        borderRadius: isLogin ? 12 : 15,
                      }}
                      transition={CINEMATIC_MORPH_TRANSITION}
                      className="w-10 h-10 border flex items-center justify-center shrink-0 shadow-inner text-white relative"
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${panelKey}-${card.slotId}-icon`}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.3, ease: CINEMATIC_EASE }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <IconComponent className="w-5 h-5" />
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>

                    {/* Card Text Content with Rigid Zero-Jitter Container */}
                    <div className="min-w-0 flex-1 relative h-9 flex flex-col justify-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${panelKey}-${card.slotId}-text`}
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.32, ease: CINEMATIC_EASE }}
                          className="absolute inset-0 flex flex-col justify-center"
                        >
                          <p className="text-xs font-bold text-white truncate tracking-wide">
                            {card.title}
                          </p>
                          <p className={`text-[11px] font-medium ${card.metaColorClass} truncate mt-0.5`}>
                            {card.meta}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Morphing Shimmer Dot */}
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: card.dotColor,
                        boxShadow: card.dotShadow,
                      }}
                      transition={CINEMATIC_MORPH_TRANSITION}
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        /* Forgot / Update Clean Security Showcase */
        <motion.div
          key={authMode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
          className="relative z-10 text-center flex flex-col items-center select-none"
        >
          <motion.div
            animate={{
              rotateZ: [3, 8, 3, -2, 3],
              y: [0, -4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ willChange: 'transform' }}
            className="w-28 h-28 bg-white/20 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-md shadow-xl ring-2 ring-white/30"
          >
            <Lock className="w-14 h-14 text-white drop-shadow-md" />
          </motion.div>

          <h2
            id="brand-title"
            className="text-4xl font-black mb-4 leading-tight drop-shadow-sm tracking-tight"
          >
            {BRAND_CONFIG.name}
          </h2>
          <p
            id="brand-description"
            className="text-white/90 text-lg leading-relaxed mb-10 font-medium max-w-xs"
          >
            {authMode === 'FORGOT'
              ? 'ไม่ต้องกังวล เราจะช่วยคุณกู้คืนบัญชีเอง'
              : 'ตั้งรหัสผ่านใหม่ที่จำง่ายแต่ปลอดภัยนะครับ'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

