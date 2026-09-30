import React, { createContext, useContext } from 'react';
import { Channel } from '../../../../../types';
import { 
  PlatformTierAuraConfig, 
  SortedPlatformItem, 
  calculateRelativePlatformTiers 
} from './platformAuraConfig.ts';

interface PlatformAuraContextType {
  sortedPlatforms: SortedPlatformItem[];
  dominantPlatform: SortedPlatformItem | null;
  dominantAura: PlatformTierAuraConfig | null;
  hasPlatformFollowers: boolean;
}

const PlatformAuraContext = createContext<PlatformAuraContextType>({
  sortedPlatforms: [],
  dominantPlatform: null,
  dominantAura: null,
  hasPlatformFollowers: false
});

export const usePlatformAura = () => useContext(PlatformAuraContext);

interface PlatformAuraWrapperProps {
  channel: Channel;
  children: React.ReactNode;
  className?: string;
  isInactive?: boolean;
}

/**
 * PlatformAuraWrapper
 * 
 * Container component that wraps ChannelCard.
 * It analyzes the channel's platforms and follower counts,
 * detects the #1 dominant platform, assigns Tier 4 (Apex) to that platform,
 * and wraps the entire card chassis in that platform's Tier 4 Godly Aura!
 */
export const PlatformAuraWrapper: React.FC<PlatformAuraWrapperProps> = ({
  channel,
  children,
  className = '',
  isInactive = false
}) => {
  const sortedPlatforms = React.useMemo(() => {
    return calculateRelativePlatformTiers(channel.platforms || [], channel.followers || {});
  }, [channel.platforms, channel.followers]);

  const dominantPlatform = sortedPlatforms.length > 0 ? sortedPlatforms[0] : null;
  const dominantAura = !isInactive && dominantPlatform ? dominantPlatform.aura : null;
  const hasPlatformFollowers = sortedPlatforms.some(p => p.followers > 0);

  return (
    <PlatformAuraContext.Provider
      value={{
        sortedPlatforms,
        dominantPlatform,
        dominantAura,
        hasPlatformFollowers
      }}
    >
      <div className={`relative h-full w-full group/aura ${className}`}>
        {/* =========================================================================
            PLATFORM-SPECIFIC TIER 4 AMBIENT GLOW CHASSIS
        ========================================================================= */}
        {dominantAura && dominantPlatform && !isInactive && (
          <>
            {/* Primary Ambient Backlight */}
            <div
              className={`pointer-events-none absolute -inset-2.5 rounded-[2.2rem] bg-gradient-to-br ${dominantAura.ambientGlow} ${dominantAura.ambientOpacity} ${dominantAura.ambientBlur} transition-all duration-500 z-0`}
            />

            {/* Specular Corner Flare tailored to dominant platform */}
            <div
              className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full blur-2xl opacity-40 group-hover/aura:opacity-75 transition-opacity duration-500 z-0"
              style={{
                background: `radial-gradient(circle, ${dominantAura.accentColorHex} 0%, transparent 70%)`
              }}
            />

            {/* TikTok Cyberpunk Dual Glitch Accent (If TikTok is dominant Tier 4) */}
            {dominantPlatform.platform === 'TIKTOK' && dominantPlatform.tier === 4 && (
              <div 
                className="pointer-events-none absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-2xl opacity-35 group-hover/aura:opacity-65 transition-opacity duration-500 z-0"
                style={{
                  background: 'radial-gradient(circle, #fe2c55 0%, transparent 70%)'
                }}
              />
            )}

            {/* YouTube Red Flame Accent (If YouTube is dominant Tier 4) */}
            {dominantPlatform.platform === 'YOUTUBE' && dominantPlatform.tier === 4 && (
              <div 
                className="pointer-events-none absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-2xl opacity-35 group-hover/aura:opacity-65 transition-opacity duration-500 z-0"
                style={{
                  background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)'
                }}
              />
            )}

            {/* Instagram Sunset Prism Accent (If Instagram is dominant Tier 4) */}
            {dominantPlatform.platform === 'INSTAGRAM' && dominantPlatform.tier === 4 && (
              <div 
                className="pointer-events-none absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-2xl opacity-35 group-hover/aura:opacity-65 transition-opacity duration-500 z-0"
                style={{
                  background: 'radial-gradient(circle, #f59e0b 0%, #ec4899 50%, transparent 80%)'
                }}
              />
            )}
          </>
        )}

        {/* Card Content Pass-through */}
        <div className="relative z-10 h-full w-full">
          {children}
        </div>
      </div>
    </PlatformAuraContext.Provider>
  );
};

/**
 * Dominant Platform Badge Display for Channel Card Header
 */
export const DominantPlatformBadge: React.FC<{
  dominant: SortedPlatformItem;
}> = ({ dominant }) => {
  const { aura, platform } = dominant;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider whitespace-nowrap shadow-sm select-none ${aura.badgeGradient} ${aura.badgeBorder} ${aura.badgeTextColor} ${aura.badgeShadow}`}
      title={`${platform} อันดับ 1 ของช่องนี้ • ระดับความโหดสูงสุด (Apex LV.4)`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${aura.badgeGlowDot}`} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
      </span>
      <span>{aura.badgeTitle}</span>
    </div>
  );
};
