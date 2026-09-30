import React from 'react';
import { motion } from 'framer-motion';
import { 
  Youtube, 
  Facebook, 
  Instagram, 
  Globe, 
  Crown,
  Star
} from 'lucide-react';
import { Platform } from '../../../../../types';
import { SocialLinkPreviewCard } from '../SocialLinkPreviewCard';
import { PlatformTierAuraConfig } from './platformAuraConfig';
import { formatFollowersCompact } from '../../../helpers/channelHelpers';

// Authentic high-fidelity TikTok SVG icon with RGB Split Chromatic Aberration for Liquid Neon
const TikTokNeonIcon: React.FC<{ className?: string; isTier4?: boolean }> = ({ 
  className = 'w-3.5 h-3.5',
  isTier4 = false
}) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    style={
      isTier4 
        ? { filter: 'drop-shadow(-0.8px -0.5px 0px #25f4ee) drop-shadow(0.8px 0.5px 0px #fe2c55)' }
        : { filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }
    }
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.31 6.31 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.42V8.9a8.28 8.28 0 0 0 4.84 1.56V7.01a4.84 4.84 0 0 1-1.06-.32z" />
  </svg>
);

const getPlatformConicGradient = (platform: Platform, fallbackHex: string): string => {
  switch (platform) {
    case 'TIKTOK':
      return 'conic-gradient(from 0deg, #25f4ee 0%, #fe2c55 45%, #25f4ee 90%, #fe2c55 100%)';
    case 'FACEBOOK':
      return 'conic-gradient(from 0deg, #1877f2 0%, #38bdf8 50%, #1877f2 100%)';
    case 'YOUTUBE':
      return 'conic-gradient(from 0deg, #ff0000 0%, #f59e0b 50%, #ff0000 100%)';
    case 'INSTAGRAM':
      return 'conic-gradient(from 0deg, #833ab4 0%, #fd1d1d 35%, #fcb045 70%, #833ab4 100%)';
    default:
      return `conic-gradient(from 0deg, ${fallbackHex} 0%, #ffffff 50%, ${fallbackHex} 100%)`;
  }
};

const getPlatformIconComponent = (platform: Platform) => {
  switch (platform) {
    case 'TIKTOK':
      return TikTokNeonIcon;
    case 'FACEBOOK':
      return Facebook;
    case 'YOUTUBE':
      return Youtube;
    case 'INSTAGRAM':
      return Instagram;
    default:
      return Globe;
  }
};

interface PlatformAuraButtonProps {
  platform: Platform;
  followers: number;
  tier: 1 | 2 | 3 | 4;
  aura: PlatformTierAuraConfig;
  url?: string;
  channelName: string;
  channelLogoUrl?: string;
  channelColor: string;
  isDominant?: boolean;
  orderIndex: number;
}

export const PlatformAuraButton: React.FC<PlatformAuraButtonProps> = ({
  platform,
  followers,
  tier,
  aura,
  url,
  channelName,
  channelLogoUrl,
  channelColor,
  isDominant = false,
  orderIndex
}) => {
  const IconComponent = getPlatformIconComponent(platform);
  const hasLink = Boolean(url && url.trim());
  const isTier4 = tier === 4;
  const conicGradient = getPlatformConicGradient(platform, aura.accentColorHex);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLink) {
      let fullUrl = url!.trim();
      if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = 'https://' + fullUrl;
      }
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Dedicated Render for Prestige Rank Badges (No clipping!)
  const renderRankBadge = () => {
    // Rank 1: 👑 Gold Crown
    if (isDominant || orderIndex === 0) {
      return (
        <motion.span 
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-2 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-white shadow-[0_2px_8px_rgba(245,158,11,0.6)] ring-1.5 ring-white z-40 pointer-events-none"
          title="อันดับ 1 (Champion) ยอดผู้ติดตามสูงสุด"
        >
          <Crown className="w-2.5 h-2.5 text-amber-950 fill-amber-100 drop-shadow-xs" />
        </motion.span>
      );
    }

    // Rank 2: 🥈 Silver Crown
    if (orderIndex === 1) {
      return (
        <motion.span 
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute -top-2 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-slate-400 via-slate-200 to-white text-slate-800 shadow-[0_2px_6px_rgba(148,163,184,0.6)] ring-1.5 ring-white z-40 pointer-events-none"
          title="อันดับ 2 (รองชนะเลิศ)"
        >
          <Crown className="w-2.5 h-2.5 text-slate-700 fill-slate-200 drop-shadow-xs" />
        </motion.span>
      );
    }

    // Rank 3: 🥉 Bronze Crown
    if (orderIndex === 2) {
      return (
        <motion.span 
          animate={{ y: [0, -1, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-700 via-orange-500 to-amber-300 text-white shadow-[0_2px_5px_rgba(217,119,6,0.5)] ring-1 ring-white z-40 pointer-events-none"
          title="อันดับ 3"
        >
          <Crown className="w-2 h-2 text-white fill-orange-100 drop-shadow-xs" />
        </motion.span>
      );
    }

    // Rank 4+: ⭐️ Star Prestige Badge
    return (
      <span 
        className="absolute -top-1.5 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-[0_1px_4px_rgba(236,72,153,0.5)] ring-1 ring-white z-30 pointer-events-none"
        title={`อันดับ ${orderIndex + 1}`}
      >
        <Star className="w-1.5 h-1.5 text-white fill-white" />
      </span>
    );
  };

  return (
    <SocialLinkPreviewCard
      key={platform}
      platform={platform}
      url={url}
      channelName={channelName}
      channelLogoUrl={channelLogoUrl}
      channelColor={channelColor}
      followersCount={followers > 0 ? followers : undefined}
    >
      <motion.div
        layout
        whileHover={{ y: -5, scale: 1.18, zIndex: 45 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 450, damping: 18 }}
        className={`relative select-none group/platbtn ${
          isDominant ? 'scale-105 z-20' : 'z-10'
        }`}
      >
        {isTier4 ? (
          /* =========================================================================
             TIER 4 (APEX): LIQUID NEON BORDER + SHIMMER SWEEP
          ========================================================================= */
          <div 
            onClick={handleClick}
            className={`relative flex items-center justify-center ${
              hasLink ? 'cursor-pointer' : 'cursor-default'
            }`}
            title={`${platform}: ${followers > 0 ? formatFollowersCompact(followers) : '0'} ผู้ติดตาม (${aura.thaiLabel})${
              isDominant ? ' ★ อันดับ 1 ของช่อง (Liquid Neon Apex)' : ` #อันดับ ${orderIndex + 1}`
            }`}
          >
            {/* Spinning Neon Track (Inner with overflow-hidden) */}
            <div className="relative p-[2.5px] rounded-full overflow-hidden flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
              {/* Liquid Neon Ambient Outer Glow */}
              <motion.div
                className="absolute -inset-1 rounded-full blur-[4px] opacity-75 group-hover/platbtn:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
                style={{ background: conicGradient }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
              />

              {/* Liquid Neon Spinning Border Track */}
              <motion.div
                className="absolute -inset-[150%] rounded-full pointer-events-none"
                style={{ background: conicGradient }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
              />

              {/* Inner Core Disc with Shimmer Sweep */}
              <div
                className={`relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-all ${
                  platform === 'TIKTOK'
                    ? 'bg-slate-950 text-white shadow-[inset_0_1px_2px_rgba(255,255,255,0.22)]'
                    : 'bg-white text-slate-800 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]'
                }`}
              >
                {/* Subtle background radial reflection */}
                {platform === 'TIKTOK' ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-transparent to-rose-500/15 pointer-events-none" />
                ) : (
                  <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{ backgroundColor: aura.accentColorHex }}
                  />
                )}

                {/* Shimmer Sweep Light Beam Running Across Button */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: platform === 'TIKTOK'
                      ? 'linear-gradient(110deg, transparent 15%, rgba(37,244,238,0.3) 40%, rgba(254,44,85,0.4) 60%, transparent 85%)'
                      : 'linear-gradient(110deg, transparent 20%, rgba(255, 255, 255, 0.7) 50%, transparent 80%)'
                  }}
                  animate={{ x: ['-160%', '160%'] }}
                  transition={{ 
                    duration: 2.4, 
                    repeat: Infinity, 
                    ease: 'easeInOut', 
                    repeatDelay: 1.2 
                  }}
                />

                {/* Platform Icon with Authentic Neon Accents */}
                <div className="relative z-10">
                  <IconComponent 
                    className={`w-3.5 h-3.5 transition-transform group-hover/platbtn:scale-110 ${
                      platform === 'TIKTOK' 
                        ? 'text-white' 
                        : aura.buttonIconColor
                    }`}
                    {...(platform === 'TIKTOK' ? { isTier4: true } : {})}
                  />
                </div>
              </div>
            </div>

            {/* Rank Badge - OUTSIDE overflow-hidden (Never clipped!) */}
            {renderRankBadge()}
          </div>
        ) : (
          /* =========================================================================
             TIERS 1 - 3: STEPPED PLATFORM AURA BUTTONS
          ========================================================================= */
          <div
            onClick={handleClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative z-10 select-none group/platbtn ${
              hasLink ? 'cursor-pointer' : 'cursor-default'
            } ${aura.buttonBg} ${aura.buttonBorder} ${aura.buttonShadow} ${aura.buttonRing}`}
            title={`${platform}: ${followers > 0 ? formatFollowersCompact(followers) : '0'} ผู้ติดตาม (${aura.thaiLabel}) #อันดับ ${orderIndex + 1}`}
          >
            {/* Platform Icon */}
            <IconComponent 
              className={`w-3.5 h-3.5 transition-colors ${aura.buttonIconColor}`}
              {...(platform === 'TIKTOK' ? { isTier4: false } : {})}
            />

            {/* Rank Badge - OUTSIDE (Never clipped!) */}
            {renderRankBadge()}
          </div>
        )}
      </motion.div>
    </SocialLinkPreviewCard>
  );
};


