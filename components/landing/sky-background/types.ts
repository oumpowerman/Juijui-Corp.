import React from 'react';
import { type MotionValue } from 'framer-motion';

export type CreatorBgStage = 'HERO' | 'FEATURES' | 'PRICING' | 'FAQS' | 'UPDATES' | 'LEGAL';

export interface CreatorSkyBackgroundProps {
  activeStage?: CreatorBgStage;
  isZoomingOut?: boolean;
}

export type SmoothScrollMotionValue = MotionValue<number>;

export interface CloudPose {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export interface FloatingCloudConfig {
  id: string;
  positionClass: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  flip?: boolean;
  poses: Record<CreatorBgStage, CloudPose>;
}

export interface StageRibbonPaths {
  wideAura: string;
  secondaryBand: string;
  crispLine: string;
  dashedCurve: string;
  orbLeftClass: string;
  orbRightClass: string;
  orbCenterClass: string;
}

export interface FloatingStageCardItem {
  id: string;
  label: string;
  subLabel: string;
  countText: string;
  icon?: React.ElementType;
  customSvg?: React.ReactNode;
  positionClass: string;
  baseRotate: number;
  floatY: number;
  floatDuration: number;
  floatDelay: number;
  iconBgGradient: string;
  iconGlowShadow: string;
  badgeAccentClass: string;
  pillBorderClass: string;
}
