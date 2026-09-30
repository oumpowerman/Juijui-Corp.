import React from 'react';
import { Platform } from '../../../../../types';

export type PlatformTierLevel = 1 | 2 | 3 | 4;

export interface PlatformTierAuraConfig {
  platform: Platform;
  tier: PlatformTierLevel;
  tierName: string;
  thaiLabel: string;
  badgeTitle: string;
  // Card Chassis Styles
  cardBorder: string;
  cardBevel: string;
  cardShadow: string;
  cardHoverShadow: string;
  cardRing: string;
  // Ambient Aura Behind Card
  ambientGlow: string;
  ambientOpacity: string;
  ambientBlur: string;
  // Header Banner & Overlay
  bannerMesh: string;
  bannerBorder: string;
  // Floating Badge Pill
  badgeGradient: string;
  badgeBorder: string;
  badgeTextColor: string;
  badgeShadow: string;
  badgeGlowDot: string;
  // Avatar Halo
  avatarHaloRing: string;
  avatarGlow: string;
  // Follower Pill
  followerPillClass: string;
  // Individual Platform Button Micro-Aura Styles
  buttonBg: string;
  buttonBorder: string;
  buttonRing: string;
  buttonShadow: string;
  buttonIconColor: string;
  buttonGlowBadge: string;
  accentColorHex: string;
}

export type PlatformConfigMap = Record<PlatformTierLevel, PlatformTierAuraConfig>;

export const PLATFORM_AURA_REGISTRY: Record<string, PlatformConfigMap> = {
  TIKTOK: {
    1: {
      platform: 'TIKTOK',
      tier: 1,
      tierName: 'TikTok Scout',
      thaiLabel: 'TikTok ระดับ 1: เรดาห์เริ่มต้น',
      badgeTitle: 'TIKTOK LV.1',
      cardBorder: 'border-slate-300/80',
      cardBevel: 'border-b-cyan-300',
      cardShadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.04)]',
      cardHoverShadow: 'hover:shadow-[0_16px_32px_rgba(37,244,238,0.12)]',
      cardRing: 'ring-1 ring-cyan-400/20',
      ambientGlow: 'from-cyan-400/15 via-rose-400/10 to-transparent',
      ambientOpacity: 'opacity-30 group-hover:opacity-60',
      ambientBlur: 'blur-lg',
      bannerMesh: 'bg-gradient-to-r from-cyan-400/10 via-transparent to-rose-400/10',
      bannerBorder: 'border-b-cyan-100/60',
      badgeGradient: 'bg-gradient-to-r from-zinc-800 to-zinc-900',
      badgeBorder: 'border-cyan-300/60',
      badgeTextColor: 'text-cyan-300',
      badgeShadow: 'shadow-xs',
      badgeGlowDot: 'bg-cyan-400',
      avatarHaloRing: 'ring-2 ring-cyan-400/40',
      avatarGlow: 'bg-cyan-400/10',
      followerPillClass: 'bg-gradient-to-r from-cyan-50/70 to-zinc-50 text-zinc-800 border-cyan-200/60',
      buttonBg: 'bg-gradient-to-b from-white to-cyan-50/30',
      buttonBorder: 'border-cyan-200/80 border-b-[2px] border-b-cyan-300/80',
      buttonRing: 'hover:ring-2 hover:ring-cyan-300 hover:ring-offset-1',
      buttonShadow: 'shadow-2xs',
      buttonIconColor: 'text-zinc-800',
      buttonGlowBadge: 'bg-cyan-400',
      accentColorHex: '#25f4ee'
    },
    2: {
      platform: 'TIKTOK',
      tier: 2,
      tierName: 'TikTok Cyber Wave',
      thaiLabel: 'TikTok ระดับ 2: คลื่นไซเบอร์คู่',
      badgeTitle: 'TIKTOK LV.2',
      cardBorder: 'border-cyan-300/80',
      cardBevel: 'border-b-[#fe2c55]/80',
      cardShadow: 'shadow-[0_8px_25px_rgba(37,244,238,0.12),0_4px_10px_rgba(254,44,85,0.08)]',
      cardHoverShadow: 'hover:shadow-[0_20px_40px_rgba(37,244,238,0.22),0_8px_20px_rgba(254,44,85,0.18)]',
      cardRing: 'ring-1.5 ring-cyan-400/40',
      ambientGlow: 'from-cyan-400/25 via-[#fe2c55]/20 to-transparent',
      ambientOpacity: 'opacity-40 group-hover:opacity-75',
      ambientBlur: 'blur-xl',
      bannerMesh: 'bg-gradient-to-r from-cyan-500/20 via-zinc-900/10 to-[#fe2c55]/20',
      bannerBorder: 'border-b-cyan-200/80',
      badgeGradient: 'bg-gradient-to-r from-cyan-600 via-zinc-900 to-[#fe2c55]',
      badgeBorder: 'border-cyan-200/80',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_2px_8px_rgba(37,244,238,0.3)]',
      badgeGlowDot: 'bg-cyan-300 animate-pulse',
      avatarHaloRing: 'ring-3 ring-cyan-400/60 shadow-[0_0_12px_rgba(37,244,238,0.35)]',
      avatarGlow: 'bg-cyan-400/20',
      followerPillClass: 'bg-gradient-to-r from-cyan-50 via-white to-rose-50 text-zinc-900 border-cyan-300/80 shadow-2xs',
      buttonBg: 'bg-gradient-to-b from-white via-cyan-50/40 to-rose-50/30',
      buttonBorder: 'border-cyan-300 border-b-[2.5px] border-b-[#fe2c55]',
      buttonRing: 'hover:ring-2 hover:ring-cyan-400 hover:ring-offset-1',
      buttonShadow: 'shadow-sm',
      buttonIconColor: 'text-zinc-900',
      buttonGlowBadge: 'bg-cyan-400',
      accentColorHex: '#25f4ee'
    },
    3: {
      platform: 'TIKTOK',
      tier: 3,
      tierName: 'TikTok Overdrive Matrix',
      thaiLabel: 'TikTok ระดับ 3: โอเวอร์ไดรฟ์นีออน',
      badgeTitle: 'TIKTOK MASTER LV.3',
      cardBorder: 'border-cyan-400/90',
      cardBevel: 'border-b-[#fe2c55]',
      cardShadow: 'shadow-[0_12px_35px_rgba(37,244,238,0.22),0_6px_18px_rgba(254,44,85,0.2)]',
      cardHoverShadow: 'hover:shadow-[0_24px_50px_rgba(37,244,238,0.35),0_12px_24px_rgba(254,44,85,0.28)]',
      cardRing: 'ring-2 ring-cyan-400/60',
      ambientGlow: 'from-cyan-400/40 via-purple-500/25 to-[#fe2c55]/35',
      ambientOpacity: 'opacity-55 group-hover:opacity-90',
      ambientBlur: 'blur-2xl',
      bannerMesh: 'bg-gradient-to-r from-cyan-400/30 via-zinc-900/30 to-[#fe2c55]/30',
      bannerBorder: 'border-b-cyan-300',
      badgeGradient: 'bg-gradient-to-r from-cyan-500 via-zinc-900 to-[#fe2c55]',
      badgeBorder: 'border-cyan-200',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_4px_12px_rgba(37,244,238,0.4),0_0_12px_rgba(254,44,85,0.35)]',
      badgeGlowDot: 'bg-cyan-300 animate-ping',
      avatarHaloRing: 'ring-4 ring-cyan-400/80 shadow-[0_0_18px_rgba(37,244,238,0.5),0_0_10px_rgba(254,44,85,0.4)]',
      avatarGlow: 'bg-gradient-to-tr from-cyan-400/30 to-[#fe2c55]/30',
      followerPillClass: 'bg-gradient-to-r from-cyan-100/90 via-white to-rose-100/90 text-zinc-950 border-cyan-400 font-extrabold shadow-xs',
      buttonBg: 'bg-gradient-to-br from-cyan-50 via-white to-rose-100',
      buttonBorder: 'border-cyan-400 border-b-[3px] border-b-[#fe2c55]',
      buttonRing: 'hover:ring-2 hover:ring-cyan-400 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_2px_10px_rgba(37,244,238,0.35)]',
      buttonIconColor: 'text-zinc-950 font-black',
      buttonGlowBadge: 'bg-[#fe2c55]',
      accentColorHex: '#25f4ee'
    },
    4: {
      platform: 'TIKTOK',
      tier: 4,
      tierName: 'TikTok Cyber God (Apex)',
      thaiLabel: 'TikTok ระดับ 4: เทวะนีออนไซเบอร์กลิตช์ (ระดับโหดสุด)',
      badgeTitle: 'TIKTOK APEX LV.4',
      cardBorder: 'border-cyan-400',
      cardBevel: 'border-b-[#fe2c55]',
      cardShadow: 'shadow-[0_14px_45px_rgba(37,244,238,0.35),0_8px_25px_rgba(254,44,85,0.32),inset_0_1px_2px_rgba(255,255,255,0.8)]',
      cardHoverShadow: 'hover:shadow-[0_28px_60px_rgba(37,244,238,0.5),0_16px_35px_rgba(254,44,85,0.45)]',
      cardRing: 'ring-2.5 ring-cyan-400/80 ring-offset-2 ring-offset-zinc-950/20',
      ambientGlow: 'from-cyan-400/50 via-fuchsia-500/35 to-[#fe2c55]/50',
      ambientOpacity: 'opacity-70 group-hover:opacity-100',
      ambientBlur: 'blur-3xl',
      bannerMesh: 'bg-gradient-to-r from-cyan-400/40 via-zinc-900/40 to-[#fe2c55]/40 animate-pulse',
      bannerBorder: 'border-b-cyan-300',
      badgeGradient: 'bg-gradient-to-r from-cyan-400 via-zinc-950 to-[#fe2c55]',
      badgeBorder: 'border-white/90',
      badgeTextColor: 'text-white font-black',
      badgeShadow: 'shadow-[0_4px_16px_rgba(37,244,238,0.6),0_0_20px_rgba(254,44,85,0.5)]',
      badgeGlowDot: 'bg-cyan-200 animate-ping',
      avatarHaloRing: 'ring-4 ring-cyan-300 shadow-[0_0_24px_rgba(37,244,238,0.7),0_0_16px_rgba(254,44,85,0.6)] animate-pulse',
      avatarGlow: 'bg-gradient-to-tr from-cyan-400/40 via-fuchsia-400/30 to-[#fe2c55]/40',
      followerPillClass: 'bg-gradient-to-r from-cyan-200 via-white to-rose-200 text-zinc-950 border-cyan-400 border-b-[2.5px] border-b-[#fe2c55] font-black shadow-md',
      buttonBg: 'bg-gradient-to-br from-cyan-100 via-white to-rose-100',
      buttonBorder: 'border-cyan-400 border-b-[3.5px] border-b-[#fe2c55]',
      buttonRing: 'ring-2 ring-cyan-400/70 hover:ring-3 hover:ring-[#fe2c55] hover:ring-offset-2',
      buttonShadow: 'shadow-[0_4px_14px_rgba(37,244,238,0.45),0_2px_8px_rgba(254,44,85,0.4)]',
      buttonIconColor: 'text-black',
      buttonGlowBadge: 'bg-cyan-300 animate-ping',
      accentColorHex: '#25f4ee'
    }
  },
  FACEBOOK: {
    1: {
      platform: 'FACEBOOK',
      tier: 1,
      tierName: 'Facebook Stream',
      thaiLabel: 'Facebook ระดับ 1: สายธารเริ่มต้น',
      badgeTitle: 'FB LV.1',
      cardBorder: 'border-slate-300/80',
      cardBevel: 'border-b-blue-300',
      cardShadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.04)]',
      cardHoverShadow: 'hover:shadow-[0_16px_32px_rgba(24,119,242,0.12)]',
      cardRing: 'ring-1 ring-blue-400/20',
      ambientGlow: 'from-blue-400/15 via-sky-400/10 to-transparent',
      ambientOpacity: 'opacity-30 group-hover:opacity-60',
      ambientBlur: 'blur-lg',
      bannerMesh: 'bg-gradient-to-r from-blue-500/10 via-transparent to-sky-400/10',
      bannerBorder: 'border-b-blue-100/60',
      badgeGradient: 'bg-gradient-to-r from-blue-600 to-blue-700',
      badgeBorder: 'border-blue-300/60',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-xs',
      badgeGlowDot: 'bg-blue-300',
      avatarHaloRing: 'ring-2 ring-blue-400/40',
      avatarGlow: 'bg-blue-400/10',
      followerPillClass: 'bg-gradient-to-r from-blue-50/70 to-sky-50 text-blue-900 border-blue-200/60',
      buttonBg: 'bg-gradient-to-b from-white to-blue-50/30',
      buttonBorder: 'border-blue-200/80 border-b-[2px] border-b-blue-300/80',
      buttonRing: 'hover:ring-2 hover:ring-blue-300 hover:ring-offset-1',
      buttonShadow: 'shadow-2xs',
      buttonIconColor: 'text-blue-600',
      buttonGlowBadge: 'bg-blue-400',
      accentColorHex: '#1877f2'
    },
    2: {
      platform: 'FACEBOOK',
      tier: 2,
      tierName: 'Facebook Royal Azure',
      thaiLabel: 'Facebook ระดับ 2: น้ำเงินราชันย์',
      badgeTitle: 'FB LV.2',
      cardBorder: 'border-blue-300/80',
      cardBevel: 'border-b-blue-500',
      cardShadow: 'shadow-[0_8px_25px_rgba(24,119,242,0.15)]',
      cardHoverShadow: 'hover:shadow-[0_20px_40px_rgba(24,119,242,0.25)]',
      cardRing: 'ring-1.5 ring-blue-400/40',
      ambientGlow: 'from-blue-500/25 via-sky-400/20 to-transparent',
      ambientOpacity: 'opacity-40 group-hover:opacity-75',
      ambientBlur: 'blur-xl',
      bannerMesh: 'bg-gradient-to-r from-blue-600/20 via-sky-500/15 to-blue-700/20',
      bannerBorder: 'border-b-blue-200/80',
      badgeGradient: 'bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700',
      badgeBorder: 'border-blue-200/80',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_2px_8px_rgba(24,119,242,0.3)]',
      badgeGlowDot: 'bg-blue-200 animate-pulse',
      avatarHaloRing: 'ring-3 ring-blue-400/60 shadow-[0_0_12px_rgba(24,119,242,0.35)]',
      avatarGlow: 'bg-blue-500/20',
      followerPillClass: 'bg-gradient-to-r from-blue-50 to-sky-50 text-blue-900 border-blue-300 shadow-2xs',
      buttonBg: 'bg-gradient-to-b from-white to-blue-100/60',
      buttonBorder: 'border-blue-300 border-b-[2.5px] border-b-blue-500',
      buttonRing: 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-1',
      buttonShadow: 'shadow-sm',
      buttonIconColor: 'text-blue-700 font-bold',
      buttonGlowBadge: 'bg-blue-400',
      accentColorHex: '#1877f2'
    },
    3: {
      platform: 'FACEBOOK',
      tier: 3,
      tierName: 'Facebook Cobalt Sovereign',
      thaiLabel: 'Facebook ระดับ 3: โคบอลต์อำนาจฟ้า',
      badgeTitle: 'FB MASTER LV.3',
      cardBorder: 'border-blue-400/90',
      cardBevel: 'border-b-blue-600',
      cardShadow: 'shadow-[0_12px_35px_rgba(24,119,242,0.22),0_6px_18px_rgba(37,99,235,0.2)]',
      cardHoverShadow: 'hover:shadow-[0_24px_50px_rgba(24,119,242,0.35),0_12px_24px_rgba(37,99,235,0.28)]',
      cardRing: 'ring-2 ring-blue-400/60',
      ambientGlow: 'from-blue-600/40 via-sky-400/30 to-indigo-600/30',
      ambientOpacity: 'opacity-55 group-hover:opacity-90',
      ambientBlur: 'blur-2xl',
      bannerMesh: 'bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-sky-400/30',
      bannerBorder: 'border-b-blue-300',
      badgeGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800',
      badgeBorder: 'border-blue-200',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_4px_12px_rgba(24,119,242,0.4)]',
      badgeGlowDot: 'bg-sky-200 animate-ping',
      avatarHaloRing: 'ring-4 ring-blue-400/80 shadow-[0_0_18px_rgba(24,119,242,0.5)]',
      avatarGlow: 'bg-blue-600/30',
      followerPillClass: 'bg-gradient-to-r from-blue-100 via-sky-50 to-indigo-100 text-blue-950 border-blue-400 font-extrabold shadow-xs',
      buttonBg: 'bg-gradient-to-br from-blue-50 via-white to-sky-100',
      buttonBorder: 'border-blue-400 border-b-[3px] border-b-blue-600',
      buttonRing: 'hover:ring-2 hover:ring-blue-500 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_2px_10px_rgba(24,119,242,0.35)]',
      buttonIconColor: 'text-blue-800 font-black',
      buttonGlowBadge: 'bg-blue-500',
      accentColorHex: '#1877f2'
    },
    4: {
      platform: 'FACEBOOK',
      tier: 4,
      tierName: 'Facebook Celestial Sapphire (Apex)',
      thaiLabel: 'Facebook ระดับ 4: แซฟไฟร์จักรพรรดิเทวะ (ระดับโหดสุด)',
      badgeTitle: 'FB APEX LV.4',
      cardBorder: 'border-blue-500',
      cardBevel: 'border-b-blue-700',
      cardShadow: 'shadow-[0_14px_45px_rgba(24,119,242,0.35),0_8px_25px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.8)]',
      cardHoverShadow: 'hover:shadow-[0_28px_60px_rgba(24,119,242,0.5),0_16px_35px_rgba(59,130,246,0.45)]',
      cardRing: 'ring-2.5 ring-blue-500/80 ring-offset-2 ring-offset-blue-900/20',
      ambientGlow: 'from-blue-600/50 via-sky-400/40 to-indigo-600/40',
      ambientOpacity: 'opacity-70 group-hover:opacity-100',
      ambientBlur: 'blur-3xl',
      bannerMesh: 'bg-gradient-to-r from-blue-600/40 via-sky-400/35 to-indigo-700/40 animate-pulse',
      bannerBorder: 'border-b-blue-300',
      badgeGradient: 'bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-700',
      badgeBorder: 'border-blue-100',
      badgeTextColor: 'text-white font-black',
      badgeShadow: 'shadow-[0_4px_16px_rgba(24,119,242,0.6),0_0_20px_rgba(59,130,246,0.5)]',
      badgeGlowDot: 'bg-white animate-ping',
      avatarHaloRing: 'ring-4 ring-blue-400 shadow-[0_0_24px_rgba(24,119,242,0.7),0_0_16px_rgba(59,130,246,0.5)] animate-pulse',
      avatarGlow: 'bg-gradient-to-tr from-blue-500/40 via-sky-400/30 to-indigo-500/40',
      followerPillClass: 'bg-gradient-to-r from-blue-200 via-sky-100 to-indigo-200 text-blue-950 border-blue-500 border-b-[2.5px] border-b-blue-700 font-black shadow-md',
      buttonBg: 'bg-gradient-to-br from-blue-100 via-white to-sky-200',
      buttonBorder: 'border-blue-500 border-b-[3.5px] border-b-blue-700',
      buttonRing: 'ring-2 ring-blue-500/70 hover:ring-3 hover:ring-blue-600 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_4px_14px_rgba(24,119,242,0.45),0_2px_8px_rgba(59,130,246,0.4)]',
      buttonIconColor: 'text-blue-900',
      buttonGlowBadge: 'bg-sky-300 animate-ping',
      accentColorHex: '#1877f2'
    }
  },
  YOUTUBE: {
    1: {
      platform: 'YOUTUBE',
      tier: 1,
      tierName: 'YouTube Spark',
      thaiLabel: 'YouTube ระดับ 1: ประกายแสงแดง',
      badgeTitle: 'YT LV.1',
      cardBorder: 'border-slate-300/80',
      cardBevel: 'border-b-red-300',
      cardShadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.04)]',
      cardHoverShadow: 'hover:shadow-[0_16px_32px_rgba(239,68,68,0.12)]',
      cardRing: 'ring-1 ring-red-400/20',
      ambientGlow: 'from-red-500/15 via-orange-400/10 to-transparent',
      ambientOpacity: 'opacity-30 group-hover:opacity-60',
      ambientBlur: 'blur-lg',
      bannerMesh: 'bg-gradient-to-r from-red-500/10 via-transparent to-rose-400/10',
      bannerBorder: 'border-b-red-100/60',
      badgeGradient: 'bg-gradient-to-r from-red-600 to-red-700',
      badgeBorder: 'border-red-300/60',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-xs',
      badgeGlowDot: 'bg-red-300',
      avatarHaloRing: 'ring-2 ring-red-400/40',
      avatarGlow: 'bg-red-400/10',
      followerPillClass: 'bg-gradient-to-r from-red-50/70 to-rose-50 text-red-900 border-red-200/60',
      buttonBg: 'bg-gradient-to-b from-white to-red-50/30',
      buttonBorder: 'border-red-200/80 border-b-[2px] border-b-red-300/80',
      buttonRing: 'hover:ring-2 hover:ring-red-300 hover:ring-offset-1',
      buttonShadow: 'shadow-2xs',
      buttonIconColor: 'text-red-600',
      buttonGlowBadge: 'bg-red-400',
      accentColorHex: '#ff0000'
    },
    2: {
      platform: 'YOUTUBE',
      tier: 2,
      tierName: 'YouTube Scarlet Blaze',
      thaiLabel: 'YouTube ระดับ 2: เพลิงสการ์เล็ต',
      badgeTitle: 'YT LV.2',
      cardBorder: 'border-red-300/80',
      cardBevel: 'border-b-red-500',
      cardShadow: 'shadow-[0_8px_25px_rgba(239,68,68,0.15)]',
      cardHoverShadow: 'hover:shadow-[0_20px_40px_rgba(239,68,68,0.25)]',
      cardRing: 'ring-1.5 ring-red-400/40',
      ambientGlow: 'from-red-500/25 via-rose-400/20 to-transparent',
      ambientOpacity: 'opacity-40 group-hover:opacity-75',
      ambientBlur: 'blur-xl',
      bannerMesh: 'bg-gradient-to-r from-red-600/20 via-rose-500/15 to-red-700/20',
      bannerBorder: 'border-b-red-200/80',
      badgeGradient: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700',
      badgeBorder: 'border-red-200/80',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_2px_8px_rgba(239,68,68,0.3)]',
      badgeGlowDot: 'bg-red-200 animate-pulse',
      avatarHaloRing: 'ring-3 ring-red-400/60 shadow-[0_0_12px_rgba(239,68,68,0.35)]',
      avatarGlow: 'bg-red-500/20',
      followerPillClass: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-900 border-red-300 shadow-2xs',
      buttonBg: 'bg-gradient-to-b from-white to-red-100/60',
      buttonBorder: 'border-red-300 border-b-[2.5px] border-b-red-500',
      buttonRing: 'hover:ring-2 hover:ring-red-400 hover:ring-offset-1',
      buttonShadow: 'shadow-sm',
      buttonIconColor: 'text-red-700 font-bold',
      buttonGlowBadge: 'bg-red-400',
      accentColorHex: '#ff0000'
    },
    3: {
      platform: 'YOUTUBE',
      tier: 3,
      tierName: 'YouTube Golden Creator',
      thaiLabel: 'YouTube ระดับ 3: ปุ่มทองผู้สร้างสรรค์',
      badgeTitle: 'YT GOLD LV.3',
      cardBorder: 'border-red-400/90',
      cardBevel: 'border-b-red-600',
      cardShadow: 'shadow-[0_12px_35px_rgba(239,68,68,0.22),0_6px_18px_rgba(245,158,11,0.2)]',
      cardHoverShadow: 'hover:shadow-[0_24px_50px_rgba(239,68,68,0.35),0_12px_24px_rgba(245,158,11,0.28)]',
      cardRing: 'ring-2 ring-red-400/60',
      ambientGlow: 'from-red-600/40 via-amber-400/30 to-rose-600/30',
      ambientOpacity: 'opacity-55 group-hover:opacity-90',
      ambientBlur: 'blur-2xl',
      bannerMesh: 'bg-gradient-to-r from-red-600/30 via-amber-500/25 to-rose-600/30',
      bannerBorder: 'border-b-red-300',
      badgeGradient: 'bg-gradient-to-r from-red-600 via-amber-500 to-red-700',
      badgeBorder: 'border-amber-200',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_4px_12px_rgba(239,68,68,0.4)]',
      badgeGlowDot: 'bg-amber-200 animate-ping',
      avatarHaloRing: 'ring-4 ring-red-400/80 shadow-[0_0_18px_rgba(239,68,68,0.5),0_0_10px_rgba(245,158,11,0.4)]',
      avatarGlow: 'bg-red-600/30',
      followerPillClass: 'bg-gradient-to-r from-red-100 via-amber-50 to-rose-100 text-red-950 border-red-400 font-extrabold shadow-xs',
      buttonBg: 'bg-gradient-to-br from-red-50 via-white to-amber-100',
      buttonBorder: 'border-red-400 border-b-[3px] border-b-red-600',
      buttonRing: 'hover:ring-2 hover:ring-red-500 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_2px_10px_rgba(239,68,68,0.35)]',
      buttonIconColor: 'text-red-800 font-black',
      buttonGlowBadge: 'bg-red-500',
      accentColorHex: '#ff0000'
    },
    4: {
      platform: 'YOUTUBE',
      tier: 4,
      tierName: 'YouTube Red Diamond Creator (Apex)',
      thaiLabel: 'YouTube ระดับ 4: เรดไดมอนด์เพลิงเทวะ (ระดับโหดสุด)',
      badgeTitle: 'YT APEX LV.4',
      cardBorder: 'border-red-500',
      cardBevel: 'border-b-rose-700',
      cardShadow: 'shadow-[0_14px_45px_rgba(239,68,68,0.35),0_8px_25px_rgba(225,29,72,0.3),inset_0_1px_2px_rgba(255,255,255,0.8)]',
      cardHoverShadow: 'hover:shadow-[0_28px_60px_rgba(239,68,68,0.5),0_16px_35px_rgba(225,29,72,0.45)]',
      cardRing: 'ring-2.5 ring-red-500/80 ring-offset-2 ring-offset-red-900/20',
      ambientGlow: 'from-red-600/50 via-rose-500/40 to-amber-500/35',
      ambientOpacity: 'opacity-70 group-hover:opacity-100',
      ambientBlur: 'blur-3xl',
      bannerMesh: 'bg-gradient-to-r from-red-600/40 via-rose-500/35 to-amber-500/35 animate-pulse',
      bannerBorder: 'border-b-red-300',
      badgeGradient: 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500',
      badgeBorder: 'border-red-100',
      badgeTextColor: 'text-white font-black',
      badgeShadow: 'shadow-[0_4px_16px_rgba(239,68,68,0.6),0_0_20px_rgba(225,29,72,0.5)]',
      badgeGlowDot: 'bg-white animate-ping',
      avatarHaloRing: 'ring-4 ring-red-400 shadow-[0_0_24px_rgba(239,68,68,0.7),0_0_16px_rgba(225,29,72,0.5)] animate-pulse',
      avatarGlow: 'bg-gradient-to-tr from-red-500/40 via-rose-400/30 to-amber-500/35',
      followerPillClass: 'bg-gradient-to-r from-red-200 via-rose-100 to-amber-200 text-red-950 border-red-500 border-b-[2.5px] border-b-rose-700 font-black shadow-md',
      buttonBg: 'bg-gradient-to-br from-red-100 via-white to-rose-200',
      buttonBorder: 'border-red-500 border-b-[3.5px] border-b-rose-700',
      buttonRing: 'ring-2 ring-red-500/70 hover:ring-3 hover:ring-red-600 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_4px_14px_rgba(239,68,68,0.45),0_2px_8px_rgba(225,29,72,0.4)]',
      buttonIconColor: 'text-red-950',
      buttonGlowBadge: 'bg-rose-300 animate-ping',
      accentColorHex: '#ff0000'
    }
  },
  INSTAGRAM: {
    1: {
      platform: 'INSTAGRAM',
      tier: 1,
      tierName: 'Instagram Sunset',
      thaiLabel: 'Instagram ระดับ 1: ซันเซ็ทเริ่มต้น',
      badgeTitle: 'IG LV.1',
      cardBorder: 'border-slate-300/80',
      cardBevel: 'border-b-pink-300',
      cardShadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.04)]',
      cardHoverShadow: 'hover:shadow-[0_16px_32px_rgba(236,72,153,0.12)]',
      cardRing: 'ring-1 ring-pink-400/20',
      ambientGlow: 'from-pink-500/15 via-amber-400/10 to-transparent',
      ambientOpacity: 'opacity-30 group-hover:opacity-60',
      ambientBlur: 'blur-lg',
      bannerMesh: 'bg-gradient-to-r from-pink-500/10 via-transparent to-amber-400/10',
      bannerBorder: 'border-b-pink-100/60',
      badgeGradient: 'bg-gradient-to-r from-pink-500 to-rose-600',
      badgeBorder: 'border-pink-300/60',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-xs',
      badgeGlowDot: 'bg-pink-300',
      avatarHaloRing: 'ring-2 ring-pink-400/40',
      avatarGlow: 'bg-pink-400/10',
      followerPillClass: 'bg-gradient-to-r from-pink-50/70 to-rose-50 text-pink-900 border-pink-200/60',
      buttonBg: 'bg-gradient-to-b from-white to-pink-50/30',
      buttonBorder: 'border-pink-200/80 border-b-[2px] border-b-pink-300/80',
      buttonRing: 'hover:ring-2 hover:ring-pink-300 hover:ring-offset-1',
      buttonShadow: 'shadow-2xs',
      buttonIconColor: 'text-pink-600',
      buttonGlowBadge: 'bg-pink-400',
      accentColorHex: '#e1306c'
    },
    2: {
      platform: 'INSTAGRAM',
      tier: 2,
      tierName: 'Instagram Radiant Sunset',
      thaiLabel: 'Instagram ระดับ 2: ท้องฟ้ายามเย็นสว่างไสว',
      badgeTitle: 'IG LV.2',
      cardBorder: 'border-pink-300/80',
      cardBevel: 'border-b-pink-500',
      cardShadow: 'shadow-[0_8px_25px_rgba(236,72,153,0.15)]',
      cardHoverShadow: 'hover:shadow-[0_20px_40px_rgba(236,72,153,0.25)]',
      cardRing: 'ring-1.5 ring-pink-400/40',
      ambientGlow: 'from-pink-500/25 via-amber-400/20 to-transparent',
      ambientOpacity: 'opacity-40 group-hover:opacity-75',
      ambientBlur: 'blur-xl',
      bannerMesh: 'bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-amber-500/20',
      bannerBorder: 'border-b-pink-200/80',
      badgeGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500',
      badgeBorder: 'border-pink-200/80',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_2px_8px_rgba(236,72,153,0.3)]',
      badgeGlowDot: 'bg-pink-200 animate-pulse',
      avatarHaloRing: 'ring-3 ring-pink-400/60 shadow-[0_0_12px_rgba(236,72,153,0.35)]',
      avatarGlow: 'bg-pink-500/20',
      followerPillClass: 'bg-gradient-to-r from-pink-50 via-purple-50 to-amber-50 text-pink-900 border-pink-300 shadow-2xs',
      buttonBg: 'bg-gradient-to-b from-white to-pink-100/60',
      buttonBorder: 'border-pink-300 border-b-[2.5px] border-b-pink-500',
      buttonRing: 'hover:ring-2 hover:ring-pink-400 hover:ring-offset-1',
      buttonShadow: 'shadow-sm',
      buttonIconColor: 'text-pink-700 font-bold',
      buttonGlowBadge: 'bg-pink-400',
      accentColorHex: '#e1306c'
    },
    3: {
      platform: 'INSTAGRAM',
      tier: 3,
      tierName: 'Instagram Cosmic Prism',
      thaiLabel: 'Instagram ระดับ 3: ปริซึมสีสันคอสมิก',
      badgeTitle: 'IG MASTER LV.3',
      cardBorder: 'border-pink-400/90',
      cardBevel: 'border-b-purple-600',
      cardShadow: 'shadow-[0_12px_35px_rgba(236,72,153,0.22),0_6px_18px_rgba(168,85,247,0.2)]',
      cardHoverShadow: 'hover:shadow-[0_24px_50px_rgba(236,72,153,0.35),0_12px_24px_rgba(168,85,247,0.28)]',
      cardRing: 'ring-2 ring-pink-400/60',
      ambientGlow: 'from-pink-600/40 via-purple-500/30 to-amber-400/30',
      ambientOpacity: 'opacity-55 group-hover:opacity-90',
      ambientBlur: 'blur-2xl',
      bannerMesh: 'bg-gradient-to-r from-purple-600/30 via-pink-500/30 to-amber-400/30',
      bannerBorder: 'border-b-pink-300',
      badgeGradient: 'bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400',
      badgeBorder: 'border-pink-200',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_4px_12px_rgba(236,72,153,0.4)]',
      badgeGlowDot: 'bg-amber-200 animate-ping',
      avatarHaloRing: 'ring-4 ring-pink-400/80 shadow-[0_0_18px_rgba(236,72,153,0.5),0_0_10px_rgba(168,85,247,0.4)]',
      avatarGlow: 'bg-pink-600/30',
      followerPillClass: 'bg-gradient-to-r from-pink-100 via-purple-50 to-amber-100 text-pink-950 border-pink-400 font-extrabold shadow-xs',
      buttonBg: 'bg-gradient-to-br from-pink-50 via-white to-amber-100',
      buttonBorder: 'border-pink-400 border-b-[3px] border-b-purple-600',
      buttonRing: 'hover:ring-2 hover:ring-pink-500 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_2px_10px_rgba(236,72,153,0.35)]',
      buttonIconColor: 'text-pink-800 font-black',
      buttonGlowBadge: 'bg-pink-500',
      accentColorHex: '#e1306c'
    },
    4: {
      platform: 'INSTAGRAM',
      tier: 4,
      tierName: 'Instagram Royal Apex Prism (Apex)',
      thaiLabel: 'Instagram ระดับ 4: ปริซึมสีสันเทวะไฮเปอร์ (ระดับโหดสุด)',
      badgeTitle: 'IG APEX LV.4',
      cardBorder: 'border-pink-500',
      cardBevel: 'border-b-purple-700',
      cardShadow: 'shadow-[0_14px_45px_rgba(236,72,153,0.35),0_8px_25px_rgba(168,85,247,0.3),inset_0_1px_2px_rgba(255,255,255,0.8)]',
      cardHoverShadow: 'hover:shadow-[0_28px_60px_rgba(236,72,153,0.5),0_16px_35px_rgba(168,85,247,0.45)]',
      cardRing: 'ring-2.5 ring-pink-500/80 ring-offset-2 ring-offset-purple-900/20',
      ambientGlow: 'from-pink-600/50 via-purple-600/40 to-amber-400/40',
      ambientOpacity: 'opacity-70 group-hover:opacity-100',
      ambientBlur: 'blur-3xl',
      bannerMesh: 'bg-gradient-to-r from-purple-600/40 via-pink-500/40 to-amber-400/40 animate-pulse',
      bannerBorder: 'border-b-pink-300',
      badgeGradient: 'bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-500 to-amber-400',
      badgeBorder: 'border-pink-100',
      badgeTextColor: 'text-white font-black',
      badgeShadow: 'shadow-[0_4px_16px_rgba(236,72,153,0.6),0_0_20px_rgba(168,85,247,0.5)]',
      badgeGlowDot: 'bg-white animate-ping',
      avatarHaloRing: 'ring-4 ring-pink-400 shadow-[0_0_24px_rgba(236,72,153,0.7),0_0_16px_rgba(168,85,247,0.5)] animate-pulse',
      avatarGlow: 'bg-gradient-to-tr from-pink-500/40 via-purple-400/30 to-amber-400/40',
      followerPillClass: 'bg-gradient-to-r from-pink-200 via-purple-100 to-amber-200 text-purple-950 border-pink-500 border-b-[2.5px] border-b-purple-700 font-black shadow-md',
      buttonBg: 'bg-gradient-to-br from-pink-100 via-white to-purple-200',
      buttonBorder: 'border-pink-500 border-b-[3.5px] border-b-purple-700',
      buttonRing: 'ring-2 ring-pink-500/70 hover:ring-3 hover:ring-purple-600 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_4px_14px_rgba(236,72,153,0.45),0_2px_8px_rgba(168,85,247,0.4)]',
      buttonIconColor: 'text-purple-950',
      buttonGlowBadge: 'bg-pink-300 animate-ping',
      accentColorHex: '#e1306c'
    }
  },
  OTHER: {
    1: {
      platform: 'OTHER',
      tier: 1,
      tierName: 'Universal Beacon',
      thaiLabel: 'สัญญาณระดับ 1: ทั่วไป',
      badgeTitle: 'WEB LV.1',
      cardBorder: 'border-slate-300/80',
      cardBevel: 'border-b-emerald-300',
      cardShadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.04)]',
      cardHoverShadow: 'hover:shadow-[0_16px_32px_rgba(16,185,129,0.12)]',
      cardRing: 'ring-1 ring-emerald-400/20',
      ambientGlow: 'from-emerald-400/15 via-teal-400/10 to-transparent',
      ambientOpacity: 'opacity-30 group-hover:opacity-60',
      ambientBlur: 'blur-lg',
      bannerMesh: 'bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-400/10',
      bannerBorder: 'border-b-emerald-100/60',
      badgeGradient: 'bg-gradient-to-r from-emerald-600 to-teal-700',
      badgeBorder: 'border-emerald-300/60',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-xs',
      badgeGlowDot: 'bg-emerald-300',
      avatarHaloRing: 'ring-2 ring-emerald-400/40',
      avatarGlow: 'bg-emerald-400/10',
      followerPillClass: 'bg-gradient-to-r from-emerald-50/70 to-teal-50 text-emerald-900 border-emerald-200/60',
      buttonBg: 'bg-gradient-to-b from-white to-emerald-50/30',
      buttonBorder: 'border-emerald-200/80 border-b-[2px] border-b-emerald-300/80',
      buttonRing: 'hover:ring-2 hover:ring-emerald-300 hover:ring-offset-1',
      buttonShadow: 'shadow-2xs',
      buttonIconColor: 'text-emerald-600',
      buttonGlowBadge: 'bg-emerald-400',
      accentColorHex: '#10b981'
    },
    2: {
      platform: 'OTHER',
      tier: 2,
      tierName: 'Emerald Matrix',
      thaiLabel: 'สัญญาณระดับ 2: มรกตคลื่นส่ง',
      badgeTitle: 'WEB LV.2',
      cardBorder: 'border-emerald-300/80',
      cardBevel: 'border-b-emerald-500',
      cardShadow: 'shadow-[0_8px_25px_rgba(16,185,129,0.15)]',
      cardHoverShadow: 'hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)]',
      cardRing: 'ring-1.5 ring-emerald-400/40',
      ambientGlow: 'from-emerald-500/25 via-teal-400/20 to-transparent',
      ambientOpacity: 'opacity-40 group-hover:opacity-75',
      ambientBlur: 'blur-xl',
      bannerMesh: 'bg-gradient-to-r from-emerald-600/20 via-teal-500/15 to-emerald-700/20',
      bannerBorder: 'border-b-emerald-200/80',
      badgeGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700',
      badgeBorder: 'border-emerald-200/80',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_2px_8px_rgba(16,185,129,0.3)]',
      badgeGlowDot: 'bg-emerald-200 animate-pulse',
      avatarHaloRing: 'ring-3 ring-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      avatarGlow: 'bg-emerald-500/20',
      followerPillClass: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border-emerald-300 shadow-2xs',
      buttonBg: 'bg-gradient-to-b from-white to-emerald-100/60',
      buttonBorder: 'border-emerald-300 border-b-[2.5px] border-b-emerald-500',
      buttonRing: 'hover:ring-2 hover:ring-emerald-400 hover:ring-offset-1',
      buttonShadow: 'shadow-sm',
      buttonIconColor: 'text-emerald-700 font-bold',
      buttonGlowBadge: 'bg-emerald-400',
      accentColorHex: '#10b981'
    },
    3: {
      platform: 'OTHER',
      tier: 3,
      tierName: 'Jade Sovereign',
      thaiLabel: 'สัญญาณระดับ 3: หยกเอกราชันย์',
      badgeTitle: 'WEB MASTER LV.3',
      cardBorder: 'border-emerald-400/90',
      cardBevel: 'border-b-emerald-600',
      cardShadow: 'shadow-[0_12px_35px_rgba(16,185,129,0.22),0_6px_18px_rgba(13,148,136,0.2)]',
      cardHoverShadow: 'hover:shadow-[0_24px_50px_rgba(16,185,129,0.35),0_12px_24px_rgba(13,148,136,0.28)]',
      cardRing: 'ring-2 ring-emerald-400/60',
      ambientGlow: 'from-emerald-600/40 via-teal-400/30 to-cyan-600/30',
      ambientOpacity: 'opacity-55 group-hover:opacity-90',
      ambientBlur: 'blur-2xl',
      bannerMesh: 'bg-gradient-to-r from-emerald-600/30 via-teal-500/25 to-cyan-500/30',
      bannerBorder: 'border-b-emerald-300',
      badgeGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700',
      badgeBorder: 'border-emerald-200',
      badgeTextColor: 'text-white',
      badgeShadow: 'shadow-[0_4px_12px_rgba(16,185,129,0.4)]',
      badgeGlowDot: 'bg-emerald-200 animate-ping',
      avatarHaloRing: 'ring-4 ring-emerald-400/80 shadow-[0_0_18px_rgba(16,185,129,0.5)]',
      avatarGlow: 'bg-emerald-600/30',
      followerPillClass: 'bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-100 text-emerald-950 border-emerald-400 font-extrabold shadow-xs',
      buttonBg: 'bg-gradient-to-br from-emerald-50 via-white to-teal-100',
      buttonBorder: 'border-emerald-400 border-b-[3px] border-b-emerald-600',
      buttonRing: 'hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_2px_10px_rgba(16,185,129,0.35)]',
      buttonIconColor: 'text-emerald-800 font-black',
      buttonGlowBadge: 'bg-emerald-500',
      accentColorHex: '#10b981'
    },
    4: {
      platform: 'OTHER',
      tier: 4,
      tierName: 'Titanium Godly Beacon (Apex)',
      thaiLabel: 'สัญญาณระดับ 4: ไทเทเนียมมรกตเทวะ (ระดับโหดสุด)',
      badgeTitle: 'WEB APEX LV.4',
      cardBorder: 'border-emerald-500',
      cardBevel: 'border-b-teal-700',
      cardShadow: 'shadow-[0_14px_45px_rgba(16,185,129,0.35),0_8px_25px_rgba(13,148,136,0.3),inset_0_1px_2px_rgba(255,255,255,0.8)]',
      cardHoverShadow: 'hover:shadow-[0_28px_60px_rgba(16,185,129,0.5),0_16px_35px_rgba(13,148,136,0.45)]',
      cardRing: 'ring-2.5 ring-emerald-500/80 ring-offset-2 ring-offset-emerald-900/20',
      ambientGlow: 'from-emerald-600/50 via-teal-400/40 to-cyan-500/35',
      ambientOpacity: 'opacity-70 group-hover:opacity-100',
      ambientBlur: 'blur-3xl',
      bannerMesh: 'bg-gradient-to-r from-emerald-600/40 via-teal-400/35 to-cyan-500/35 animate-pulse',
      bannerBorder: 'border-b-emerald-300',
      badgeGradient: 'bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600',
      badgeBorder: 'border-emerald-100',
      badgeTextColor: 'text-white font-black',
      badgeShadow: 'shadow-[0_4px_16px_rgba(16,185,129,0.6),0_0_20px_rgba(13,148,136,0.5)]',
      badgeGlowDot: 'bg-white animate-ping',
      avatarHaloRing: 'ring-4 ring-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.7),0_0_16px_rgba(13,148,136,0.5)] animate-pulse',
      avatarGlow: 'bg-gradient-to-tr from-emerald-500/40 via-teal-400/30 to-cyan-500/35',
      followerPillClass: 'bg-gradient-to-r from-emerald-200 via-teal-100 to-cyan-200 text-emerald-950 border-emerald-500 border-b-[2.5px] border-b-teal-700 font-black shadow-md',
      buttonBg: 'bg-gradient-to-br from-emerald-100 via-white to-teal-200',
      buttonBorder: 'border-emerald-500 border-b-[3.5px] border-b-teal-700',
      buttonRing: 'ring-2 ring-emerald-500/70 hover:ring-3 hover:ring-teal-600 hover:ring-offset-2',
      buttonShadow: 'shadow-[0_4px_14px_rgba(16,185,129,0.45),0_2px_8px_rgba(13,148,136,0.4)]',
      buttonIconColor: 'text-emerald-950',
      buttonGlowBadge: 'bg-teal-300 animate-ping',
      accentColorHex: '#10b981'
    }
  }
};

/**
 * Standardize platform key to known platforms
 */
export const normalizePlatformKey = (p: string): 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM' | 'OTHER' => {
  const upper = (p || '').toUpperCase();
  if (upper === 'TIKTOK') return 'TIKTOK';
  if (upper === 'FACEBOOK') return 'FACEBOOK';
  if (upper === 'YOUTUBE') return 'YOUTUBE';
  if (upper === 'INSTAGRAM') return 'INSTAGRAM';
  return 'OTHER';
};

/**
 * Get the specific Aura Config for a platform at a given tier (1-4)
 */
export const getPlatformTierAura = (platform: string, tier: PlatformTierLevel): PlatformTierAuraConfig => {
  const normKey = normalizePlatformKey(platform);
  const platformGroup = PLATFORM_AURA_REGISTRY[normKey] || PLATFORM_AURA_REGISTRY.OTHER;
  return platformGroup[tier] || platformGroup[1];
};

export interface SortedPlatformItem {
  platform: Platform;
  followers: number;
  tier: PlatformTierLevel;
  aura: PlatformTierAuraConfig;
  isDominant: boolean;
}

/**
 * Calculate Relative Platform Tiers for a Channel
 * 
 * Rules:
 * 1. Platforms are sorted descending by follower count.
 * 2. The #1 platform (highest follower count) ALWAYS receives Tier 4 (ระดับโหดสุด).
 * 3. #2 platform receives Tier 3.
 * 4. #3 platform receives Tier 2.
 * 5. #4 (or lowest) receives Tier 1.
 */
export const calculateRelativePlatformTiers = (
  platforms: Platform[] = [],
  followersMap: Record<string, any> = {}
): SortedPlatformItem[] => {
  if (!platforms || platforms.length === 0) return [];

  // Filter unique platforms
  const uniquePlatforms = Array.from(new Set(platforms));

  // Sort descending by followers count
  const sorted = [...uniquePlatforms].sort((a, b) => {
    const rawA = (followersMap as any)?.[a];
    const rawB = (followersMap as any)?.[b];
    const countA = typeof rawA === 'number' && !isNaN(rawA) ? rawA : 0;
    const countB = typeof rawB === 'number' && !isNaN(rawB) ? rawB : 0;
    if (countB !== countA) return countB - countA;
    // Fallback: priority order TIKTOK > FACEBOOK > YOUTUBE > INSTAGRAM > OTHER
    const priorityOrder = ['TIKTOK', 'FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'OTHER'];
    return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
  });

  const total = sorted.length;

  return sorted.map((platform, idx) => {
    const rawCount = (followersMap as any)?.[platform];
    const followers = typeof rawCount === 'number' && !isNaN(rawCount) ? rawCount : 0;

    let tier: PlatformTierLevel = 1;
    if (idx === 0) {
      // #1 มากที่สุด ได้ระดับ 4 โหดสุดเสมอ!
      tier = 4;
    } else if (idx === 1) {
      // #2
      tier = total >= 4 ? 3 : (total === 3 ? 3 : 2);
    } else if (idx === 2) {
      // #3
      tier = total >= 4 ? 2 : 2;
    } else {
      // #4 หรืออันดับถัดๆ ไป
      tier = 1;
    }

    const aura = getPlatformTierAura(platform, tier);

    return {
      platform,
      followers,
      tier,
      aura,
      isDominant: idx === 0
    };
  });
};
