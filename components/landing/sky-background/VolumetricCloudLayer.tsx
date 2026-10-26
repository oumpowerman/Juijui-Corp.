import React from 'react';
import { motion, useTransform } from 'framer-motion';
import { CreatorBgStage, FloatingCloudConfig, SmoothScrollMotionValue } from './types';
import { VOLUMETRIC_CLOUDS, MORPH_TRANSITION } from './stageConfig';
import { FluffyCloud3D } from './Sky3DIllustrations';

interface VolumetricCloudLayerProps {
  activeStage: CreatorBgStage;
  smoothScrollY: SmoothScrollMotionValue;
}

const ParallaxCloudItem: React.FC<{
  cloud: FloatingCloudConfig;
  index: number;
  activeStage: CreatorBgStage;
  smoothScrollY: SmoothScrollMotionValue;
}> = ({ cloud, index, activeStage, smoothScrollY }) => {
  const pose = cloud.poses[activeStage] || cloud.poses.HERO;
  const direction = index % 2 === 0 ? 1 : -1;

  // Bounded wave parallax: clouds visibly glide on scroll while staying inside the viewport
  const scrollParallaxY = useTransform(
    smoothScrollY,
    (v) => Math.sin(v * 0.0038 + index * 1.35) * (28 + index * 4)
  );
  const scrollParallaxX = useTransform(
    smoothScrollY,
    (v) => Math.cos(v * 0.0029 + index * 1.1) * 20 * direction
  );

  return (
    <motion.div
      style={{
        x: scrollParallaxX,
        y: scrollParallaxY,
        willChange: 'transform',
      }}
      className={`absolute ${cloud.positionClass}`}
    >
      <motion.div
        initial={false}
        animate={{
          x: pose.x,
          y: pose.y,
          scale: pose.scale,
          opacity: pose.opacity,
        }}
        transition={MORPH_TRANSITION}
        style={{ willChange: 'transform, opacity' }}
      >
        <motion.div
          animate={{
            x: [0, cloud.driftX, 0],
            y: [0, cloud.driftY, 0],
          }}
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            delay: cloud.delay,
            ease: 'easeInOut',
          }}
          style={{ willChange: 'transform' }}
        >
          <FluffyCloud3D idPrefix={cloud.id} flip={cloud.flip} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const VolumetricCloudLayer: React.FC<VolumetricCloudLayerProps> = ({
  activeStage,
  smoothScrollY,
}) => {
  return (
    <>
      {VOLUMETRIC_CLOUDS.map((cloud, index) => (
        <ParallaxCloudItem
          key={cloud.id}
          cloud={cloud}
          index={index}
          activeStage={activeStage}
          smoothScrollY={smoothScrollY}
        />
      ))}
    </>
  );
};
