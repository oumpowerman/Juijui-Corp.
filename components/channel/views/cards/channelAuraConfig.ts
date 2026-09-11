import React from 'react';
import { 
  Crown, 
  Flame, 
  Trophy, 
  Sparkles, 
  Gem, 
  ShieldCheck, 
  Waves, 
  Heart, 
  Medal, 
  Compass 
} from 'lucide-react';

export interface RankAuraConfig {
  rank: number;
  tierName: string;
  thaiLabel: string;
  icon: React.ElementType;
  // Outer card chassis & shadow styling
  cardBorder: string;
  cardBevel: string;
  cardShadow: string;
  cardHoverShadow: string;
  cardRing: string;
  // Ambient radial glow behind card
  ambientGlow: string;
  ambientOpacity: string;
  // Header banner mesh/gradient
  bannerMesh: string;
  bannerBorder: string;
  // Rank badge pill styling
  badgeGradient: string;
  badgeBorder: string;
  badgeTextColor: string;
  badgeShadow: string;
  badgeGlowDot: string;
  // Logo avatar halo ring
  avatarHaloRing: string;
  avatarGlow: string;
  // Follower pill on card
  followerPillClass: string;
}

export const RANK_AURA_TIERS: Record<number, RankAuraConfig> = {
  1: {
    rank: 1,
    tierName: 'Godly Sovereign Gold',
    thaiLabel: 'อันดับ 1 ทองคำเทวะ',
    icon: Crown,
    cardBorder: 'border-amber-300/80',
    cardBevel: 'border-b-amber-400',
    cardShadow: 'shadow-[0_10px_30px_-4px_rgba(245,158,11,0.22),0_4px_12px_-2px_rgba(245,158,11,0.12)]',
    cardHoverShadow: 'hover:shadow-[0_20px_45px_-6px_rgba(245,158,11,0.32),0_8px_20px_-4px_rgba(245,158,11,0.2)]',
    cardRing: 'ring-1 ring-amber-400/40',
    ambientGlow: 'from-amber-400/35 via-yellow-300/20 to-transparent',
    ambientOpacity: 'opacity-40 group-hover:opacity-75',
    bannerMesh: 'bg-gradient-to-r from-amber-500/25 via-yellow-400/20 to-amber-600/15',
    bannerBorder: 'border-b-amber-200/80',
    badgeGradient: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500',
    badgeBorder: 'border-amber-200/90',
    badgeTextColor: 'text-amber-950',
    badgeShadow: 'shadow-[0_3px_10px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.8)]',
    badgeGlowDot: 'bg-amber-300 animate-ping',
    avatarHaloRing: 'ring-4 ring-amber-400/60 shadow-[0_0_16px_rgba(245,158,11,0.45)]',
    avatarGlow: 'bg-amber-400/25',
    followerPillClass: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border-amber-200 shadow-xs'
  },
  2: {
    rank: 2,
    tierName: 'Solar Radiant Flame',
    thaiLabel: 'อันดับ 2 เปลวสุริยะเพลิง',
    icon: Flame,
    cardBorder: 'border-orange-300/80',
    cardBevel: 'border-b-orange-400',
    cardShadow: 'shadow-[0_10px_28px_-4px_rgba(249,115,22,0.2),0_4px_10px_-2px_rgba(249,115,22,0.1)]',
    cardHoverShadow: 'hover:shadow-[0_20px_40px_-6px_rgba(249,115,22,0.28),0_8px_18px_-4px_rgba(249,115,22,0.18)]',
    cardRing: 'ring-1 ring-orange-400/35',
    ambientGlow: 'from-orange-500/30 via-amber-400/15 to-transparent',
    ambientOpacity: 'opacity-35 group-hover:opacity-70',
    bannerMesh: 'bg-gradient-to-r from-orange-500/25 via-amber-400/20 to-rose-500/15',
    bannerBorder: 'border-b-orange-200/80',
    badgeGradient: 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600',
    badgeBorder: 'border-orange-200/90',
    badgeTextColor: 'text-orange-950',
    badgeShadow: 'shadow-[0_3px_10px_rgba(249,115,22,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)]',
    badgeGlowDot: 'bg-orange-300 animate-ping',
    avatarHaloRing: 'ring-4 ring-orange-400/60 shadow-[0_0_14px_rgba(249,115,22,0.4)]',
    avatarGlow: 'bg-orange-400/25',
    followerPillClass: 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-900 border-orange-200 shadow-xs'
  },
  3: {
    rank: 3,
    tierName: 'Molten Amber Bronze',
    thaiLabel: 'อันดับ 3 บรอนซ์หลอมเหลว',
    icon: Trophy,
    cardBorder: 'border-amber-600/50',
    cardBevel: 'border-b-amber-600',
    cardShadow: 'shadow-[0_10px_28px_-4px_rgba(217,119,6,0.18),0_4px_10px_-2px_rgba(217,119,6,0.08)]',
    cardHoverShadow: 'hover:shadow-[0_18px_36px_-6px_rgba(217,119,6,0.25),0_8px_16px_-4px_rgba(217,119,6,0.15)]',
    cardRing: 'ring-1 ring-amber-500/30',
    ambientGlow: 'from-amber-600/25 via-orange-400/15 to-transparent',
    ambientOpacity: 'opacity-30 group-hover:opacity-65',
    bannerMesh: 'bg-gradient-to-r from-amber-600/25 via-yellow-500/15 to-amber-700/15',
    bannerBorder: 'border-b-amber-300/70',
    badgeGradient: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700',
    badgeBorder: 'border-amber-300/80',
    badgeTextColor: 'text-amber-950',
    badgeShadow: 'shadow-[0_3px_9px_rgba(217,119,6,0.25),inset_0_1px_1px_rgba(255,255,255,0.7)]',
    badgeGlowDot: 'bg-amber-400',
    avatarHaloRing: 'ring-4 ring-amber-600/50 shadow-[0_0_12px_rgba(217,119,6,0.35)]',
    avatarGlow: 'bg-amber-600/20',
    followerPillClass: 'bg-gradient-to-r from-amber-100/70 to-orange-50 text-amber-950 border-amber-300 shadow-xs'
  },
  4: {
    rank: 4,
    tierName: 'Cosmic Amethyst',
    thaiLabel: 'อันดับ 4 อเมทิสต์คอสมิก',
    icon: Sparkles,
    cardBorder: 'border-purple-300/80',
    cardBevel: 'border-b-purple-400',
    cardShadow: 'shadow-[0_10px_26px_-4px_rgba(168,85,247,0.18),0_4px_10px_-2px_rgba(168,85,247,0.08)]',
    cardHoverShadow: 'hover:shadow-[0_18px_36px_-6px_rgba(168,85,247,0.26),0_8px_16px_-4px_rgba(168,85,247,0.15)]',
    cardRing: 'ring-1 ring-purple-400/30',
    ambientGlow: 'from-purple-500/25 via-fuchsia-400/15 to-transparent',
    ambientOpacity: 'opacity-30 group-hover:opacity-60',
    bannerMesh: 'bg-gradient-to-r from-purple-500/20 via-violet-400/15 to-fuchsia-500/15',
    bannerBorder: 'border-b-purple-200/70',
    badgeGradient: 'bg-gradient-to-r from-purple-500 via-violet-400 to-fuchsia-500',
    badgeBorder: 'border-purple-200/80',
    badgeTextColor: 'text-white',
    badgeShadow: 'shadow-[0_3px_9px_rgba(168,85,247,0.28),inset_0_1px_1px_rgba(255,255,255,0.5)]',
    badgeGlowDot: 'bg-purple-200',
    avatarHaloRing: 'ring-3 ring-purple-400/60 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    avatarGlow: 'bg-purple-500/20',
    followerPillClass: 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-900 border-purple-200 shadow-xs'
  },
  5: {
    rank: 5,
    tierName: 'Cyber Diamond Cyan',
    thaiLabel: 'อันดับ 5 เพชรไซอัน',
    icon: Gem,
    cardBorder: 'border-cyan-300/80',
    cardBevel: 'border-b-cyan-400',
    cardShadow: 'shadow-[0_10px_26px_-4px_rgba(6,182,212,0.18),0_4px_10px_-2px_rgba(6,182,212,0.08)]',
    cardHoverShadow: 'hover:shadow-[0_18px_36px_-6px_rgba(6,182,212,0.26),0_8px_16px_-4px_rgba(6,182,212,0.15)]',
    cardRing: 'ring-1 ring-cyan-400/30',
    ambientGlow: 'from-cyan-500/25 via-sky-400/15 to-transparent',
    ambientOpacity: 'opacity-30 group-hover:opacity-60',
    bannerMesh: 'bg-gradient-to-r from-cyan-500/20 via-sky-400/15 to-teal-500/15',
    bannerBorder: 'border-b-cyan-200/70',
    badgeGradient: 'bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400',
    badgeBorder: 'border-cyan-200/80',
    badgeTextColor: 'text-cyan-950',
    badgeShadow: 'shadow-[0_3px_9px_rgba(6,182,212,0.28),inset_0_1px_1px_rgba(255,255,255,0.7)]',
    badgeGlowDot: 'bg-cyan-200',
    avatarHaloRing: 'ring-3 ring-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    avatarGlow: 'bg-cyan-500/20',
    followerPillClass: 'bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-900 border-cyan-200 shadow-xs'
  },
  6: {
    rank: 6,
    tierName: 'Emerald Prism',
    thaiLabel: 'อันดับ 6 ปริซึมมรกต',
    icon: ShieldCheck,
    cardBorder: 'border-emerald-300/80',
    cardBevel: 'border-b-emerald-400',
    cardShadow: 'shadow-[0_10px_24px_-4px_rgba(16,185,129,0.16),0_4px_8px_-2px_rgba(16,185,129,0.06)]',
    cardHoverShadow: 'hover:shadow-[0_16px_32px_-6px_rgba(16,185,129,0.22),0_6px_14px_-4px_rgba(16,185,129,0.12)]',
    cardRing: 'ring-1 ring-emerald-400/25',
    ambientGlow: 'from-emerald-500/20 via-teal-400/15 to-transparent',
    ambientOpacity: 'opacity-25 group-hover:opacity-55',
    bannerMesh: 'bg-gradient-to-r from-emerald-500/20 via-teal-400/15 to-green-500/15',
    bannerBorder: 'border-b-emerald-200/70',
    badgeGradient: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500',
    badgeBorder: 'border-emerald-200/80',
    badgeTextColor: 'text-white',
    badgeShadow: 'shadow-[0_3px_8px_rgba(16,185,129,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]',
    badgeGlowDot: 'bg-emerald-200',
    avatarHaloRing: 'ring-3 ring-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    avatarGlow: 'bg-emerald-500/20',
    followerPillClass: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border-emerald-200 shadow-xs'
  },
  7: {
    rank: 7,
    tierName: 'Deep Ocean Sapphire',
    thaiLabel: 'อันดับ 7 ซัฟไฟร์สมุทร',
    icon: Waves,
    cardBorder: 'border-blue-300/80',
    cardBevel: 'border-b-blue-400',
    cardShadow: 'shadow-[0_10px_24px_-4px_rgba(59,130,246,0.16),0_4px_8px_-2px_rgba(59,130,246,0.06)]',
    cardHoverShadow: 'hover:shadow-[0_16px_32px_-6px_rgba(59,130,246,0.22),0_6px_14px_-4px_rgba(59,130,246,0.12)]',
    cardRing: 'ring-1 ring-blue-400/25',
    ambientGlow: 'from-blue-500/20 via-indigo-400/15 to-transparent',
    ambientOpacity: 'opacity-25 group-hover:opacity-55',
    bannerMesh: 'bg-gradient-to-r from-blue-500/20 via-indigo-400/15 to-sky-500/15',
    bannerBorder: 'border-b-blue-200/70',
    badgeGradient: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500',
    badgeBorder: 'border-blue-200/80',
    badgeTextColor: 'text-white',
    badgeShadow: 'shadow-[0_3px_8px_rgba(59,130,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.5)]',
    badgeGlowDot: 'bg-blue-200',
    avatarHaloRing: 'ring-3 ring-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    avatarGlow: 'bg-blue-500/20',
    followerPillClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 border-blue-200 shadow-xs'
  },
  8: {
    rank: 8,
    tierName: 'Rose Quartz Ruby',
    thaiLabel: 'อันดับ 8 รูบี้กุหลาบ',
    icon: Heart,
    cardBorder: 'border-rose-300/80',
    cardBevel: 'border-b-rose-400',
    cardShadow: 'shadow-[0_10px_24px_-4px_rgba(244,63,94,0.16),0_4px_8px_-2px_rgba(244,63,94,0.06)]',
    cardHoverShadow: 'hover:shadow-[0_16px_32px_-6px_rgba(244,63,94,0.22),0_6px_14px_-4px_rgba(244,63,94,0.12)]',
    cardRing: 'ring-1 ring-rose-400/25',
    ambientGlow: 'from-rose-500/20 via-pink-400/15 to-transparent',
    ambientOpacity: 'opacity-25 group-hover:opacity-55',
    bannerMesh: 'bg-gradient-to-r from-rose-500/20 via-pink-400/15 to-red-500/15',
    bannerBorder: 'border-b-rose-200/70',
    badgeGradient: 'bg-gradient-to-r from-rose-500 via-pink-400 to-red-400',
    badgeBorder: 'border-rose-200/80',
    badgeTextColor: 'text-white',
    badgeShadow: 'shadow-[0_3px_8px_rgba(244,63,94,0.25),inset_0_1px_1px_rgba(255,255,255,0.6)]',
    badgeGlowDot: 'bg-rose-200',
    avatarHaloRing: 'ring-3 ring-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
    avatarGlow: 'bg-rose-500/20',
    followerPillClass: 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-900 border-rose-200 shadow-xs'
  },
  9: {
    rank: 9,
    tierName: 'Sterling Platinum',
    thaiLabel: 'อันดับ 9 แพลทินัมเงิน',
    icon: Medal,
    cardBorder: 'border-slate-300/90',
    cardBevel: 'border-b-slate-400',
    cardShadow: 'shadow-[0_8px_22px_-4px_rgba(100,116,139,0.15),0_3px_8px_-2px_rgba(100,116,139,0.06)]',
    cardHoverShadow: 'hover:shadow-[0_16px_30px_-6px_rgba(100,116,139,0.2),0_6px_12px_-4px_rgba(100,116,139,0.1)]',
    cardRing: 'ring-1 ring-slate-400/25',
    ambientGlow: 'from-slate-400/20 via-zinc-300/15 to-transparent',
    ambientOpacity: 'opacity-20 group-hover:opacity-50',
    bannerMesh: 'bg-gradient-to-r from-slate-400/20 via-zinc-300/15 to-slate-500/15',
    bannerBorder: 'border-b-slate-200/80',
    badgeGradient: 'bg-gradient-to-r from-slate-600 via-zinc-500 to-slate-700',
    badgeBorder: 'border-slate-300/80',
    badgeTextColor: 'text-white',
    badgeShadow: 'shadow-[0_3px_8px_rgba(100,116,139,0.22),inset_0_1px_1px_rgba(255,255,255,0.6)]',
    badgeGlowDot: 'bg-slate-300',
    avatarHaloRing: 'ring-3 ring-slate-400/50 shadow-[0_0_10px_rgba(100,116,139,0.25)]',
    avatarGlow: 'bg-slate-400/15',
    followerPillClass: 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-800 border-slate-300 shadow-xs'
  },
  10: {
    rank: 10,
    tierName: 'Titanium Aurora',
    thaiLabel: 'อันดับ 10 ไทเทเนียมออโรรา',
    icon: Compass,
    cardBorder: 'border-teal-300/80',
    cardBevel: 'border-b-teal-400',
    cardShadow: 'shadow-[0_8px_22px_-4px_rgba(20,184,166,0.15),0_3px_8px_-2px_rgba(20,184,166,0.06)]',
    cardHoverShadow: 'hover:shadow-[0_16px_30px_-6px_rgba(20,184,166,0.2),0_6px_12px_-4px_rgba(20,184,166,0.1)]',
    cardRing: 'ring-1 ring-teal-400/25',
    ambientGlow: 'from-teal-500/20 via-indigo-400/15 to-transparent',
    ambientOpacity: 'opacity-20 group-hover:opacity-50',
    bannerMesh: 'bg-gradient-to-r from-teal-500/15 via-indigo-400/15 to-cyan-500/15',
    bannerBorder: 'border-b-teal-200/70',
    badgeGradient: 'bg-gradient-to-r from-teal-600 via-indigo-500 to-cyan-600',
    badgeBorder: 'border-teal-200/80',
    badgeTextColor: 'text-white',
    badgeShadow: 'shadow-[0_3px_8px_rgba(20,184,166,0.22),inset_0_1px_1px_rgba(255,255,255,0.5)]',
    badgeGlowDot: 'bg-teal-200',
    avatarHaloRing: 'ring-3 ring-teal-400/50 shadow-[0_0_10px_rgba(20,184,166,0.25)]',
    avatarGlow: 'bg-teal-500/15',
    followerPillClass: 'bg-gradient-to-r from-teal-50 to-indigo-50 text-teal-900 border-teal-200 shadow-xs'
  }
};

export const getRankAuraConfig = (rank?: number): RankAuraConfig | null => {
  if (!rank || rank < 1 || rank > 10) return null;
  return RANK_AURA_TIERS[rank] || null;
};
