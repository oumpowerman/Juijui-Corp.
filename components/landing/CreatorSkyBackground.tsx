import React from 'react';
import { useScroll, useSpring } from 'framer-motion';
import { CreatorBgStage, CreatorSkyBackgroundProps } from './sky-background/types';
import { STAGE_RIBBON_CONFIG, STAGE_FLOATING_ITEMS } from './sky-background/stageConfig';
import { RainbowAuraLayer } from './sky-background/RainbowAuraLayer';
import { VolumetricCloudLayer } from './sky-background/VolumetricCloudLayer';
import { StageFloatingCardsLayer } from './sky-background/StageFloatingCardsLayer';
import { StageMicroCharmsLayer } from './sky-background/StageMicroCharmsLayer';

export type { CreatorBgStage, CreatorSkyBackgroundProps };

export const CreatorSkyBackground: React.FC<CreatorSkyBackgroundProps> = ({
  activeStage = 'HERO',
}) => {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 85,
    damping: 24,
    mass: 0.35,
  });

  const stageConfig = STAGE_RIBBON_CONFIG[activeStage] || STAGE_RIBBON_CONFIG.HERO;
  const floatingItems = STAGE_FLOATING_ITEMS[activeStage] || STAGE_FLOATING_ITEMS.HERO;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none select-none z-0"
    >
      {/* Layer 1–3: Sky Wash, Shifting Pastel Aura Orbs & Continuous Morphing Rainbow Ribbons */}
      <RainbowAuraLayer
        activeStage={activeStage}
        stageConfig={stageConfig}
        smoothScrollY={smoothScrollY}
      />

      {/* Layer 4: 3D Volumetric Fluffy Clouds (Stage Pose Morph + Multi-Depth Scroll Parallax) */}
      <VolumetricCloudLayer
        activeStage={activeStage}
        smoothScrollY={smoothScrollY}
      />

      {/* Layer 5: Stage-Specific Floating 3D Pastel Glass Icons & Cards */}
      <StageFloatingCardsLayer
        activeStage={activeStage}
        floatingItems={floatingItems}
        smoothScrollY={smoothScrollY}
      />

      {/* Layer 6: Ambient Floating Micro-Charms */}
      <StageMicroCharmsLayer
        activeStage={activeStage}
        smoothScrollY={smoothScrollY}
      />
    </div>
  );
};

export default CreatorSkyBackground;
