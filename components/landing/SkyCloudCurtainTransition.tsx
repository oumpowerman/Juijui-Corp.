import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FluffyCloud3D } from './sky-background/Sky3DIllustrations';

export type CloudCurtainPhase = 'IDLE' | 'COVERING' | 'PARTING';
export type CloudCurtainDirection = 'TO_AUTH' | 'TO_LANDING';

interface SkyCloudCurtainTransitionProps {
  phase: CloudCurtainPhase;
  direction: CloudCurtainDirection;
}

interface CloudBankItem {
  id: string;
  side: 'left' | 'right';
  layer: 'back' | 'mid' | 'front';
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

const CLOUD_BANKS: CloudBankItem[] = [
  // --- LEFT BANK CLOUDS ---
  {
    id: 'curtain-l-back-top',
    side: 'left',
    layer: 'back',
    topClass: '-top-[12%]',
    sideOffsetClass: '-left-[18%]',
    widthClass: 'w-[75vw] sm:w-[62vw] max-w-[820px]',
    baseScale: 1.25,
    rotate: -4,
    flip: false,
    coverDelay: 0,
    partDelay: 0.04,
    partDistanceVw: -115,
  },
  {
    id: 'curtain-l-back-bottom',
    side: 'left',
    layer: 'back',
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
    id: 'curtain-l-mid-center',
    side: 'left',
    layer: 'mid',
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
    id: 'curtain-l-front-bridge',
    side: 'left',
    layer: 'front',
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
    id: 'curtain-l-front-low',
    side: 'left',
    layer: 'front',
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

  // --- RIGHT BANK CLOUDS ---
  {
    id: 'curtain-r-back-top',
    side: 'right',
    layer: 'back',
    topClass: '-top-[10%]',
    sideOffsetClass: '-right-[18%]',
    widthClass: 'w-[75vw] sm:w-[62vw] max-w-[820px]',
    baseScale: 1.26,
    rotate: 4,
    flip: true,
    coverDelay: 0.01,
    partDelay: 0.04,
    partDistanceVw: 115,
  },
  {
    id: 'curtain-r-back-bottom',
    side: 'right',
    layer: 'back',
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
    id: 'curtain-r-mid-center',
    side: 'right',
    layer: 'mid',
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
    id: 'curtain-r-front-bridge',
    side: 'right',
    layer: 'front',
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
    id: 'curtain-r-front-low',
    side: 'right',
    layer: 'front',
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

export const SkyCloudCurtainTransition: React.FC<SkyCloudCurtainTransitionProps> = ({
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
          className="fixed inset-0 z-[120] pointer-events-none overflow-hidden select-none"
        >
          {/* Layer 1: Iridescent Pastel Rainbow Sky Mist Veil (Bridges Center Seam during Scene Swap) */}
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
                ? { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.56, delay: 0.04, ease: [0.16, 1, 0.3, 1] as const }
            }
            className="absolute inset-0 backdrop-blur-xl"
            style={{
              background:
                direction === 'TO_AUTH'
                  ? 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.98) 0%, rgba(243,232,255,0.96) 38%, rgba(224,242,254,0.95) 72%, rgba(254,243,199,0.92) 100%)'
                  : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.98) 0%, rgba(224,242,254,0.96) 40%, rgba(252,231,243,0.95) 75%, rgba(237,233,254,0.92) 100%)',
              willChange: 'opacity, transform',
            }}
          />

          {/* Layer 2: Left & Right Pastel Rainbow Aura Cushion Blooms (Slide Apart with Clouds) */}
          <motion.div
            initial={{ x: '-95%', opacity: 0, scale: 0.9 }}
            animate={
              isCovering
                ? { x: '0%', opacity: 1, scale: 1.05 }
                : { x: '-115%', opacity: 0, scale: 1.15 }
            }
            transition={
              isCovering
                ? { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.6, ease: [0.32, 0, 0.2, 1] as const }
            }
            className="absolute inset-y-0 left-0 w-[68vw] rounded-r-full blur-3xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(196,181,253,0.65) 0%, rgba(244,114,182,0.5) 48%, rgba(255,255,255,0.95) 100%)',
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
                ? { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.6, ease: [0.32, 0, 0.2, 1] as const }
            }
            className="absolute inset-y-0 right-0 w-[68vw] rounded-l-full blur-3xl"
            style={{
              background:
                'linear-gradient(225deg, rgba(125,211,252,0.65) 0%, rgba(253,224,71,0.45) 48%, rgba(255,255,255,0.95) 100%)',
              willChange: 'transform, opacity',
            }}
          />

          {/* Layer 3: Multi-Depth 3D Volumetric Fluffy Cloud Curtain (Converge -> Slide Apart) */}
          {CLOUD_BANKS.map((cloud) => {
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
                        duration: 0.46,
                        delay: cloud.coverDelay,
                        ease: [0.22, 1, 0.36, 1] as const,
                      }
                    : {
                        duration: 0.58,
                        delay: cloud.partDelay,
                        ease: [0.32, 0.04, 0.24, 1] as const,
                      }
                }
                className={`absolute ${cloud.topClass} ${cloud.sideOffsetClass} ${cloud.widthClass} ${zIndexClass}`}
                style={{ willChange: 'transform, opacity' }}
              >
                <FluffyCloud3D idPrefix={cloud.id} flip={cloud.flip} />
              </motion.div>
            );
          })}

          {/* Layer 4: Center Soft Pearlescent Cloud Seam Crest */}
          <motion.div
            initial={{ scale: 0.72, opacity: 0 }}
            animate={
              isCovering
                ? { scale: 1.05, opacity: 0.95 }
                : { scale: 1.35, opacity: 0 }
            }
            transition={
              isCovering
                ? { duration: 0.44, delay: 0.04, ease: [0.22, 1, 0.36, 1] as const }
                : { duration: 0.48, ease: [0.16, 1, 0.3, 1] as const }
            }
            className="absolute inset-0 z-40 flex items-center justify-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="w-[75vw] h-[75vh] rounded-full bg-gradient-to-tr from-white/90 via-purple-50/85 to-sky-50/90 blur-2xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SkyCloudCurtainTransition;
