import React from 'react';
import { RankAuraConfig } from './channelAuraConfig';

interface RankAuraDecorationsProps {
  aura: RankAuraConfig;
}

export const RankAmbientGlow: React.FC<RankAuraDecorationsProps> = ({ aura }) => {
  return (
    <>
      {/* Dynamic 3D Radial Aura behind card */}
      <div 
        className={`pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-br ${aura.ambientGlow} ${aura.ambientOpacity} blur-xl transition-all duration-300 z-0`} 
      />
      {/* Corner Sparkle Glow */}
      <div 
        className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/40 blur-2xl opacity-50 z-0" 
      />
    </>
  );
};

interface RankTopBadgeProps extends RankAuraDecorationsProps {
  customTitle?: string;
}

export const RankTopBadge: React.FC<RankTopBadgeProps> = ({ aura, customTitle }) => {
  const Icon = aura.icon;

  return (
    <div 
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black tracking-tight whitespace-nowrap ${aura.badgeGradient} ${aura.badgeBorder} ${aura.badgeTextColor} ${aura.badgeShadow} transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 select-none relative overflow-hidden shadow-md`}
      title={customTitle || aura.thaiLabel}
    >
      {/* Specular Inner Glare */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent" />

      {/* Rank Icon with micro glow */}
      <Icon className="w-3 h-3 shrink-0 drop-shadow-xs" />

      {/* Rank Number & Label */}
      <span className="leading-tight font-black">TOP #{aura.rank}</span>

      {/* Dynamic Status Indicator */}
      <span className="relative flex h-1.5 w-1.5 ml-0.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${aura.badgeGlowDot}`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${aura.badgeTextColor.includes('white') ? 'bg-white' : 'bg-current'}`} />
      </span>
    </div>
  );
};
