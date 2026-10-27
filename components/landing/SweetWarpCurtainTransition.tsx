import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cake, Sparkles } from 'lucide-react';

export type SweetCurtainPhase = 'IDLE' | 'COVERING' | 'PARTING';
export type SweetCurtainDirection = 'TO_SWEET_LAND' | 'TO_MAIN_LAND';

interface SweetWarpCurtainTransitionProps {
  phase: SweetCurtainPhase;
  direction: SweetCurtainDirection;
}

type CloudTint = 'pink' | 'vanilla' | 'mint' | 'lavender';
type DessertType = 'cupcake' | 'macaron-pink' | 'macaron-mint' | 'donut' | 'softserve' | 'candy';

interface SweetCloudBankItem {
  id: string;
  side: 'left' | 'right';
  layer: 'back' | 'mid' | 'front';
  tint: CloudTint;
  topClass: string;
  sideOffsetClass: string;
  widthClass: string;
  baseScale: number;
  rotate: number;
  flip?: boolean;
  coverDelay: number;
  partDelay: number;
  partDistanceVw: number;
}

interface FallingDessertItem {
  id: string;
  type: DessertType;
  leftClass: string;
  targetTopVh: number;
  sizeClass: string;
  fallDelay: number;
  partDelay: number;
  initialRotate: number;
  targetRotate: number;
  partOffsetX: string;
  partOffsetY: string;
}

/**
 * 3D Volumetric Cotton Candy Cloud with Multi-Stop Pastel Shading & Sugar Sprinkles
 */
const CottonCandyCurtainCloud3D: React.FC<{
  idPrefix: string;
  tint: CloudTint;
  flip?: boolean;
}> = ({ idPrefix, tint, flip }) => {
  const palette = {
    pink: {
      baseTop: '#FFFFFF',
      baseMid: '#FFF0F6',
      baseBot: '#FBCFE8',
      puffMid: '#FCE7F3',
      puffBot: '#F472B6',
      shadow: 'rgba(244, 114, 182, 0.25)',
    },
    vanilla: {
      baseTop: '#FFFFFF',
      baseMid: '#FFFBEB',
      baseBot: '#FDE68A',
      puffMid: '#FEF3C7',
      puffBot: '#FBBF24',
      shadow: 'rgba(251, 191, 36, 0.22)',
    },
    mint: {
      baseTop: '#FFFFFF',
      baseMid: '#F0FDFA',
      baseBot: '#99F6E4',
      puffMid: '#CCFBF1',
      puffBot: '#34D399',
      shadow: 'rgba(52, 211, 153, 0.22)',
    },
    lavender: {
      baseTop: '#FFFFFF',
      baseMid: '#FAF5FF',
      baseBot: '#E9D5FF',
      puffMid: '#F3E8FF',
      puffBot: '#C084FC',
      shadow: 'rgba(192, 132, 252, 0.24)',
    },
  }[tint];

  return (
    <svg
      viewBox="0 0 420 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto drop-shadow-[0_24px_38px_rgba(244,114,182,0.18)] ${
        flip ? '-scale-x-100' : ''
      }`}
    >
      <defs>
        <linearGradient id={`${idPrefix}-ccBase`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={palette.baseTop} stopOpacity="0.98" />
          <stop offset="65%" stopColor={palette.baseMid} stopOpacity="0.95" />
          <stop offset="100%" stopColor={palette.baseBot} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${idPrefix}-ccPuff`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.99" />
          <stop offset="72%" stopColor={palette.puffMid} stopOpacity="0.94" />
          <stop offset="100%" stopColor={palette.puffBot} stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-ccGlow`} cx="50%" cy="25%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft Pastel Shadow Cushion */}
      <ellipse cx="210" cy="172" rx="158" ry="22" fill={palette.shadow} />

      {/* Back Fluffy Cotton Candy Volume */}
      <path
        d="M78 158H342C369.614 158 392 135.614 392 108C392 83.249 374.011 62.7007 350.391 58.6989C342.441 26.1536 313.105 2 278 2C246.308 2 219.124 21.8056 208.352 49.7082C197.702 41.1325 184.165 36 169.4 36C138.983 36 113.896 57.8266 108.458 86.6524C104.769 85.5761 100.867 85 96.8 85C73.7145 85 55 103.714 55 126.8C55 144.031 65.4426 158 78 158Z"
        fill={`url(#${idPrefix}-ccBase)`}
        stroke="rgba(255, 255, 255, 0.96)"
        strokeWidth="2.5"
      />

      {/* Front 3D Sculpted Puffs */}
      <circle cx="152" cy="112" r="46" fill={`url(#${idPrefix}-ccPuff)`} />
      <circle cx="238" cy="96" r="58" fill={`url(#${idPrefix}-ccPuff)`} />
      <circle cx="312" cy="118" r="40" fill={`url(#${idPrefix}-ccPuff)`} />
      <circle cx="104" cy="126" r="32" fill={`url(#${idPrefix}-ccPuff)`} />

      {/* Top Specular Highlight Rim */}
      <ellipse cx="234" cy="74" rx="46" ry="26" fill={`url(#${idPrefix}-ccGlow)`} />
      <ellipse cx="148" cy="96" rx="34" ry="18" fill={`url(#${idPrefix}-ccGlow)`} />

      {/* Colorful Sugar Sprinkles on Cotton Candy Cloud */}
      <rect x="135" y="92" width="14" height="5.5" rx="2.75" transform="rotate(-18 135 92)" fill="#F43F5E" opacity="0.75" />
      <rect x="218" y="68" width="14" height="5.5" rx="2.75" transform="rotate(24 218 68)" fill="#10B981" opacity="0.75" />
      <rect x="275" y="98" width="14" height="5.5" rx="2.75" transform="rotate(-14 275 98)" fill="#F59E0B" opacity="0.8" />
      <rect x="182" y="118" width="14" height="5.5" rx="2.75" transform="rotate(15 182 118)" fill="#8B5CF6" opacity="0.75" />
      <circle cx="252" cy="112" r="4" fill="#EC4899" opacity="0.75" />
      <circle cx="116" cy="118" r="3.5" fill="#FBBF24" opacity="0.8" />
    </svg>
  );
};

/**
 * 3D Sweet Dessert SVG Illustrations for the Falling Cascade
 */
const DessertIllustration3D: React.FC<{ type: DessertType; idPrefix: string }> = ({
  type,
  idPrefix,
}) => {
  if (type === 'cupcake') {
    return (
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full drop-shadow-[0_14px_24px_rgba(244,63,94,0.28)]">
        <defs>
          <linearGradient id={`${idPrefix}-cupWrap`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id={`${idPrefix}-frosting`} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#FFF1F2" />
            <stop offset="55%" stopColor="#FDA4AF" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
        </defs>
        {/* Cupcake Wrapper */}
        <path d="M26 54 L32 82 C33 85 36 86 40 86 H56 C60 86 63 85 64 82 L70 54 Z" fill={`url(#${idPrefix}-cupWrap)`} stroke="#FFFFFF" strokeWidth="2" />
        <path d="M36 56 L39 84 M48 56 V84 M60 56 L57 84" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
        {/* Swirled Pink Frosting */}
        <path d="M20 54 C20 44 28 38 38 38 C40 28 56 28 58 38 C68 38 76 44 76 54 C76 60 70 62 62 62 H34 C26 62 20 60 20 54 Z" fill={`url(#${idPrefix}-frosting)`} stroke="#FFFFFF" strokeWidth="2" />
        {/* Cherry on Top */}
        <path d="M48 22 C52 12 60 10 64 8" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="48" cy="25" r="8.5" fill="#E11D48" stroke="#FFFFFF" strokeWidth="1.5" />
        <ellipse cx="45.5" cy="22.5" rx="2.5" ry="1.5" fill="#FFFFFF" opacity="0.85" />
        {/* Sprinkles */}
        <rect x="34" y="46" width="7" height="3" rx="1.5" transform="rotate(-20 34 46)" fill="#FEF08A" />
        <rect x="54" y="48" width="7" height="3" rx="1.5" transform="rotate(25 54 48)" fill="#A7F3D0" />
      </svg>
    );
  }

  if (type === 'macaron-pink' || type === 'macaron-mint') {
    const isMint = type === 'macaron-mint';
    const topStart = isMint ? '#CCFBF1' : '#FCE7F3';
    const topEnd = isMint ? '#10B981' : '#EC4899';
    const creamColor = isMint ? '#FEF3C7' : '#FFF1F2';

    return (
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full drop-shadow-[0_14px_24px_rgba(236,72,153,0.24)]">
        <defs>
          <linearGradient id={`${idPrefix}-macShell`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={topStart} />
            <stop offset="100%" stopColor={topEnd} />
          </linearGradient>
        </defs>
        {/* Bottom Shell */}
        <path d="M18 56 C18 68 78 68 78 56 Z" fill={`url(#${idPrefix}-macShell)`} stroke="#FFFFFF" strokeWidth="2" />
        {/* Cream Filling */}
        <rect x="15" y="44" width="66" height="13" rx="6.5" fill={creamColor} stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Top Dome Shell */}
        <path d="M18 45 C18 22 78 22 78 45 Z" fill={`url(#${idPrefix}-macShell)`} stroke="#FFFFFF" strokeWidth="2" />
        {/* Specular Highlight */}
        <ellipse cx="42" cy="32" rx="16" ry="4.5" fill="#FFFFFF" opacity="0.65" />
      </svg>
    );
  }

  if (type === 'donut') {
    return (
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full drop-shadow-[0_14px_24px_rgba(245,158,11,0.26)]">
        <defs>
          <radialGradient id={`${idPrefix}-dough`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <linearGradient id={`${idPrefix}-icing`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r="32" fill={`url(#${idPrefix}-dough)`} stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="48" cy="48" r="27" fill={`url(#${idPrefix}-icing)`} />
        <circle cx="48" cy="48" r="11" fill="#FFF5F8" stroke="#FFFFFF" strokeWidth="2" />
        {/* Sprinkles */}
        <rect x="30" y="28" width="8" height="3.2" rx="1.6" transform="rotate(-30 30 28)" fill="#FEF08A" />
        <rect x="58" y="30" width="8" height="3.2" rx="1.6" transform="rotate(35 58 30)" fill="#6EE7B7" />
        <rect x="62" y="56" width="8" height="3.2" rx="1.6" transform="rotate(-25 62 56)" fill="#FFFFFF" />
        <rect x="26" y="54" width="8" height="3.2" rx="1.6" transform="rotate(20 26 54)" fill="#C4B5FD" />
      </svg>
    );
  }

  if (type === 'softserve') {
    return (
      <svg viewBox="0 0 96 96" fill="none" className="w-full h-full drop-shadow-[0_14px_24px_rgba(244,114,182,0.25)]">
        {/* Waffle Cone */}
        <path d="M32 52 L48 88 L64 52 Z" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
        {/* Soft Serve Swirls */}
        <rect x="26" y="42" width="44" height="14" rx="7" fill="#FBCFE8" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="31" y="30" width="34" height="14" rx="7" fill="#FFF1F2" stroke="#FFFFFF" strokeWidth="2" />
        <path d="M38 30 C38 18 48 12 48 8 C52 14 58 20 58 30 Z" fill="#F472B6" stroke="#FFFFFF" strokeWidth="2" />
      </svg>
    );
  }

  // 'candy'
  return (
    <svg viewBox="0 0 96 96" fill="none" className="w-full h-full drop-shadow-[0_14px_24px_rgba(168,85,247,0.25)]">
      <circle cx="48" cy="48" r="26" fill="#FAF5FF" stroke="#FFFFFF" strokeWidth="2.5" />
      <path d="M48 48 C48 36 62 36 62 48 C62 62 34 62 34 46 C34 28 66 28 68 48" stroke="#EC4899" strokeWidth="6" strokeLinecap="round" />
      <path d="M48 48 C48 40 56 40 56 48 C56 56 40 56 40 46" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

const SWEET_CLOUD_BANKS: SweetCloudBankItem[] = [
  // --- LEFT BANK COTTON CANDY CLOUDS ---
  {
    id: 'sweet-l-back-top',
    side: 'left',
    layer: 'back',
    tint: 'pink',
    topClass: '-top-[12%]',
    sideOffsetClass: '-left-[18%]',
    widthClass: 'w-[76vw] sm:w-[62vw] max-w-[820px]',
    baseScale: 1.25,
    rotate: -4,
    flip: false,
    coverDelay: 0,
    partDelay: 0.04,
    partDistanceVw: -115,
  },
  {
    id: 'sweet-l-back-bottom',
    side: 'left',
    layer: 'back',
    tint: 'vanilla',
    topClass: 'top-[42%]',
    sideOffsetClass: '-left-[15%]',
    widthClass: 'w-[80vw] sm:w-[65vw] max-w-[860px]',
    baseScale: 1.3,
    rotate: 3,
    flip: true,
    coverDelay: 0.02,
    partDelay: 0.06,
    partDistanceVw: -118,
  },
  {
    id: 'sweet-l-mid-center',
    side: 'left',
    layer: 'mid',
    tint: 'lavender',
    topClass: 'top-[14%]',
    sideOffsetClass: '-left-[8%]',
    widthClass: 'w-[82vw] sm:w-[64vw] max-w-[840px]',
    baseScale: 1.22,
    rotate: 2,
    flip: false,
    coverDelay: 0.03,
    partDelay: 0.02,
    partDistanceVw: -122,
  },
  {
    id: 'sweet-l-front-bridge',
    side: 'left',
    layer: 'front',
    tint: 'pink',
    topClass: 'top-[26%]',
    sideOffsetClass: 'left-[2%] sm:left-[6%]',
    widthClass: 'w-[86vw] sm:w-[60vw] max-w-[780px]',
    baseScale: 1.18,
    rotate: -2,
    flip: false,
    coverDelay: 0.05,
    partDelay: 0,
    partDistanceVw: -128,
  },
  {
    id: 'sweet-l-front-low',
    side: 'left',
    layer: 'front',
    tint: 'mint',
    topClass: 'top-[58%]',
    sideOffsetClass: 'left-[0%] sm:left-[4%]',
    widthClass: 'w-[84vw] sm:w-[58vw] max-w-[760px]',
    baseScale: 1.16,
    rotate: 4,
    flip: true,
    coverDelay: 0.06,
    partDelay: 0.01,
    partDistanceVw: -125,
  },

  // --- RIGHT BANK COTTON CANDY CLOUDS ---
  {
    id: 'sweet-r-back-top',
    side: 'right',
    layer: 'back',
    tint: 'vanilla',
    topClass: '-top-[10%]',
    sideOffsetClass: '-right-[18%]',
    widthClass: 'w-[76vw] sm:w-[62vw] max-w-[820px]',
    baseScale: 1.26,
    rotate: 4,
    flip: true,
    coverDelay: 0.01,
    partDelay: 0.04,
    partDistanceVw: 115,
  },
  {
    id: 'sweet-r-back-bottom',
    side: 'right',
    layer: 'back',
    tint: 'pink',
    topClass: 'top-[44%]',
    sideOffsetClass: '-right-[15%]',
    widthClass: 'w-[80vw] sm:w-[65vw] max-w-[860px]',
    baseScale: 1.3,
    rotate: -3,
    flip: false,
    coverDelay: 0.02,
    partDelay: 0.06,
    partDistanceVw: 118,
  },
  {
    id: 'sweet-r-mid-center',
    side: 'right',
    layer: 'mid',
    tint: 'mint',
    topClass: 'top-[16%]',
    sideOffsetClass: '-right-[8%]',
    widthClass: 'w-[82vw] sm:w-[64vw] max-w-[840px]',
    baseScale: 1.22,
    rotate: -2,
    flip: true,
    coverDelay: 0.04,
    partDelay: 0.02,
    partDistanceVw: 122,
  },
  {
    id: 'sweet-r-front-bridge',
    side: 'right',
    layer: 'front',
    tint: 'pink',
    topClass: 'top-[24%]',
    sideOffsetClass: 'right-[2%] sm:right-[6%]',
    widthClass: 'w-[86vw] sm:w-[60vw] max-w-[780px]',
    baseScale: 1.18,
    rotate: 2,
    flip: true,
    coverDelay: 0.05,
    partDelay: 0,
    partDistanceVw: 128,
  },
  {
    id: 'sweet-r-front-low',
    side: 'right',
    layer: 'front',
    tint: 'lavender',
    topClass: 'top-[56%]',
    sideOffsetClass: 'right-[0%] sm:right-[4%]',
    widthClass: 'w-[84vw] sm:w-[58vw] max-w-[760px]',
    baseScale: 1.16,
    rotate: -4,
    flip: false,
    coverDelay: 0.06,
    partDelay: 0.01,
    partDistanceVw: 125,
  },
];

const FALLING_DESSERTS: FallingDessertItem[] = [
  {
    id: 'dessert-1',
    type: 'cupcake',
    leftClass: 'left-[8%]',
    targetTopVh: 16,
    sizeClass: 'w-20 h-20 sm:w-28 sm:h-28',
    fallDelay: 0,
    partDelay: 0.02,
    initialRotate: -28,
    targetRotate: -8,
    partOffsetX: '-45vw',
    partOffsetY: '-20vh',
  },
  {
    id: 'dessert-2',
    type: 'macaron-pink',
    leftClass: 'left-[22%]',
    targetTopVh: 42,
    sizeClass: 'w-24 h-24 sm:w-32 sm:h-32',
    fallDelay: 0.03,
    partDelay: 0.01,
    initialRotate: 35,
    targetRotate: 12,
    partOffsetX: '-52vw',
    partOffsetY: '18vh',
  },
  {
    id: 'dessert-3',
    type: 'donut',
    leftClass: 'left-[35%]',
    targetTopVh: 18,
    sizeClass: 'w-24 h-24 sm:w-32 sm:h-32',
    fallDelay: 0.05,
    partDelay: 0,
    initialRotate: -45,
    targetRotate: -14,
    partOffsetX: '-38vw',
    partOffsetY: '-32vh',
  },
  {
    id: 'dessert-4',
    type: 'softserve',
    leftClass: 'left-[14%]',
    targetTopVh: 66,
    sizeClass: 'w-20 h-20 sm:w-28 sm:h-28',
    fallDelay: 0.06,
    partDelay: 0.03,
    initialRotate: 22,
    targetRotate: 6,
    partOffsetX: '-48vw',
    partOffsetY: '28vh',
  },
  {
    id: 'dessert-5',
    type: 'macaron-mint',
    leftClass: 'left-[44%]',
    targetTopVh: 62,
    sizeClass: 'w-24 h-24 sm:w-30 sm:h-30',
    fallDelay: 0.02,
    partDelay: 0.01,
    initialRotate: -30,
    targetRotate: 10,
    partOffsetX: '-25vw',
    partOffsetY: '36vh',
  },
  {
    id: 'dessert-6',
    type: 'candy',
    leftClass: 'left-[54%]',
    targetTopVh: 14,
    sizeClass: 'w-20 h-20 sm:w-28 sm:h-28',
    fallDelay: 0.04,
    partDelay: 0,
    initialRotate: 50,
    targetRotate: -12,
    partOffsetX: '34vw',
    partOffsetY: '-30vh',
  },
  {
    id: 'dessert-7',
    type: 'cupcake',
    leftClass: 'left-[66%]',
    targetTopVh: 44,
    sizeClass: 'w-24 h-24 sm:w-32 sm:h-32',
    fallDelay: 0.01,
    partDelay: 0.02,
    initialRotate: -25,
    targetRotate: 9,
    partOffsetX: '48vw',
    partOffsetY: '14vh',
  },
  {
    id: 'dessert-8',
    type: 'donut',
    leftClass: 'left-[78%]',
    targetTopVh: 20,
    sizeClass: 'w-22 h-22 sm:w-30 sm:h-30',
    fallDelay: 0.05,
    partDelay: 0.03,
    initialRotate: 40,
    targetRotate: -10,
    partOffsetX: '50vw',
    partOffsetY: '-22vh',
  },
  {
    id: 'dessert-9',
    type: 'softserve',
    leftClass: 'left-[82%]',
    targetTopVh: 64,
    sizeClass: 'w-22 h-22 sm:w-28 sm:h-28',
    fallDelay: 0.07,
    partDelay: 0.04,
    initialRotate: -32,
    targetRotate: -8,
    partOffsetX: '52vw',
    partOffsetY: '26vh',
  },
  {
    id: 'dessert-10',
    type: 'macaron-pink',
    leftClass: 'left-[58%]',
    targetTopVh: 68,
    sizeClass: 'w-20 h-20 sm:w-26 sm:h-26',
    fallDelay: 0.06,
    partDelay: 0.02,
    initialRotate: 28,
    targetRotate: 15,
    partOffsetX: '38vw',
    partOffsetY: '32vh',
  },
];

export const SweetWarpCurtainTransition: React.FC<SweetWarpCurtainTransitionProps> = ({
  phase,
  direction,
}) => {
  const isVisible = phase !== 'IDLE';
  const isCovering = phase === 'COVERING';

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[130] pointer-events-none overflow-hidden select-none"
        >
          {/* Layer 1: Iridescent Pastel Sugar Mist Veil (Bridges Center Seam smoothly) */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={
              isCovering
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 1.08 }
            }
            exit={{ opacity: 0 }}
            transition={
              isCovering
                ? { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.58, delay: 0.04, ease: [0.16, 1, 0.3, 1] as const }
            }
            className="absolute inset-0 backdrop-blur-xl"
            style={{
              background:
                direction === 'TO_SWEET_LAND'
                  ? 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.98) 0%, rgba(255,240,246,0.96) 40%, rgba(254,249,231,0.95) 74%, rgba(240,253,249,0.92) 100%)'
                  : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(238,242,255,0.96) 42%, rgba(252,231,243,0.95) 75%, rgba(224,242,254,0.92) 100%)',
              willChange: 'opacity, transform',
            }}
          />

          {/* Layer 2: Left & Right Cotton Candy Aura Cushion Blooms */}
          <motion.div
            initial={{ x: '-95%', opacity: 0, scale: 0.9 }}
            animate={
              isCovering
                ? { x: '0%', opacity: 1, scale: 1.05 }
                : { x: '-115%', opacity: 0, scale: 1.15 }
            }
            transition={
              isCovering
                ? { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.62, ease: [0.32, 0, 0.2, 1] as const }
            }
            className="absolute inset-y-0 left-0 w-[68vw] rounded-r-full blur-3xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(244,114,182,0.55) 0%, rgba(251,191,36,0.4) 48%, rgba(255,255,255,0.95) 100%)',
              willChange: 'transform, opacity',
            }}
          />

          <motion.div
            initial={{ x: '95%', opacity: 0, scale: 0.9 }}
            animate={
              isCovering
                ? { x: '0%', opacity: 1, scale: 1.05 }
                : { x: '115%', opacity: 0, scale: 1.15 }
            }
            transition={
              isCovering
                ? { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.62, ease: [0.32, 0, 0.2, 1] as const }
            }
            className="absolute inset-y-0 right-0 w-[68vw] rounded-l-full blur-3xl"
            style={{
              background:
                'linear-gradient(225deg, rgba(52,211,153,0.48) 0%, rgba(192,132,252,0.48) 48%, rgba(255,255,255,0.95) 100%)',
              willChange: 'transform, opacity',
            }}
          />

          {/* Layer 3: Multi-Depth 3D Cotton Candy Cloud Curtain (Converge Left/Right -> Part Apart) */}
          {SWEET_CLOUD_BANKS.map((cloud) => {
            const initialX = cloud.side === 'left' ? '-110vw' : '110vw';
            const partX = `${cloud.partDistanceVw}vw`;
            const zIndexClass =
              cloud.layer === 'front'
                ? 'z-30'
                : cloud.layer === 'mid'
                ? 'z-20'
                : 'z-10';

            return (
              <motion.div
                key={cloud.id}
                initial={{
                  x: initialX,
                  scale: cloud.baseScale * 0.88,
                  opacity: 0,
                  rotate: cloud.rotate * 1.5,
                }}
                animate={
                  isCovering
                    ? {
                        x: '0vw',
                        scale: cloud.baseScale,
                        opacity: 1,
                        rotate: cloud.rotate,
                      }
                    : {
                        x: partX,
                        scale: cloud.baseScale * 1.1,
                        opacity: 0,
                        rotate: cloud.rotate * -0.8,
                      }
                }
                transition={
                  isCovering
                    ? {
                        duration: 0.48,
                        delay: cloud.coverDelay,
                        ease: [0.22, 1, 0.36, 1] as const,
                      }
                    : {
                        duration: 0.62,
                        delay: cloud.partDelay,
                        ease: [0.32, 0.04, 0.24, 1] as const,
                      }
                }
                className={`absolute ${cloud.topClass} ${cloud.sideOffsetClass} ${cloud.widthClass} ${zIndexClass}`}
                style={{ willChange: 'transform, opacity' }}
              >
                <CottonCandyCurtainCloud3D
                  idPrefix={cloud.id}
                  tint={cloud.tint}
                  flip={cloud.flip}
                />
              </motion.div>
            );
          })}

          {/* Layer 4: Falling 3D Sweet Dessert Cascade (Drops from Top during COVERING -> Scatters on PARTING) */}
          {FALLING_DESSERTS.map((dessert) => (
            <motion.div
              key={dessert.id}
              initial={{
                y: '-42vh',
                x: '0vw',
                scale: 0.65,
                opacity: 0,
                rotate: dessert.initialRotate,
              }}
              animate={
                isCovering
                  ? {
                      y: `${dessert.targetTopVh}vh`,
                      x: '0vw',
                      scale: 1.05,
                      opacity: 1,
                      rotate: dessert.targetRotate,
                    }
                  : {
                      y: `calc(${dessert.targetTopVh}vh + ${dessert.partOffsetY})`,
                      x: dessert.partOffsetX,
                      scale: 1.25,
                      opacity: 0,
                      rotate: dessert.targetRotate * -1.8,
                    }
              }
              transition={
                isCovering
                  ? {
                      duration: 0.48,
                      delay: dessert.fallDelay,
                      ease: [0.22, 1, 0.36, 1] as const,
                    }
                  : {
                      duration: 0.58,
                      delay: dessert.partDelay,
                      ease: [0.32, 0.04, 0.24, 1] as const,
                    }
              }
              className={`absolute top-0 ${dessert.leftClass} ${dessert.sizeClass} z-40`}
              style={{ willChange: 'transform, opacity' }}
            >
              <DessertIllustration3D type={dessert.type} idPrefix={dessert.id} />
            </motion.div>
          ))}

          {/* Layer 5: Center Patisserie Portal Crest Badge */}
          <motion.div
            initial={{ scale: 0.78, opacity: 0, y: 12 }}
            animate={
              isCovering
                ? { scale: 1, opacity: 1, y: 0 }
                : { scale: 1.18, opacity: 0, y: -14 }
            }
            transition={
              isCovering
                ? { duration: 0.42, delay: 0.05, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const }
            }
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="bg-white/90 backdrop-blur-xl px-6 py-4 rounded-3xl border-2 border-pink-200/90 shadow-2xl shadow-pink-500/15 flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                  direction === 'TO_SWEET_LAND'
                    ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-amber-400'
                    : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                }`}
              >
                {direction === 'TO_SWEET_LAND' ? (
                  <Cake className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </div>
              <div className="text-left">
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  {direction === 'TO_SWEET_LAND'
                    ? 'ดินแดนขนมหวาน · Sweet Patisserie Land'
                    : 'ดินแดนหลัก · Kontent OS Studio'}
                </div>
                <div className="text-xs font-semibold text-pink-600">
                  {direction === 'TO_SWEET_LAND'
                    ? 'กำลังจัดเตรียมแป้งเค้กและท็อปปิ้ง 26 รสชาติ...'
                    : 'กำลังพากลับสู่หน้าแพ็กเกจมาตรฐาน...'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SweetWarpCurtainTransition;
