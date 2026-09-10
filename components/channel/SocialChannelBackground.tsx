import React, { ReactNode, useState, useEffect } from 'react';
import { 
  Heart, 
  Radio, 
  Sparkles, 
  Play, 
  Share2, 
  Video, 
  TrendingUp, 
  Users, 
  Flame,
  MessageCircle,
  Eye,
  Zap,
  Moon,
  Sun,
  Palette
} from 'lucide-react';

export type SocialTheme = 'creator-vibrant' | 'midnight-studio' | 'pastel-engagement';

interface SocialChannelBackgroundProps {
  children: ReactNode;
  theme?: SocialTheme;
  onThemeChange?: (theme: SocialTheme) => void;
  showThemeSelector?: boolean;
  className?: string;
}

export const THEME_OPTIONS: { id: SocialTheme; name: string; icon: any; desc: string; badgeColor: string }[] = [
  {
    id: 'creator-vibrant',
    name: 'Creator Vibrant',
    icon: Flame,
    desc: 'โทนสีสันสดใส สไตล์ IG Sunset & TikTok Glow',
    badgeColor: 'from-pink-500 to-rose-600',
  },
  {
    id: 'midnight-studio',
    name: 'Midnight Studio',
    icon: Moon,
    desc: 'สตูดิโอออนแอร์กลางคืน คอนทราสต์ชัด สไตล์โปรดักชัน',
    badgeColor: 'from-slate-800 to-indigo-950',
  },
  {
    id: 'pastel-engagement',
    name: 'Pastel Engagement',
    icon: Sparkles,
    desc: 'โทนพาสเทลคลีน สบายตา ฟีลคอมมูนิตี้และผู้ชม',
    badgeColor: 'from-sky-400 to-teal-400',
  },
];

export const SocialChannelBackground: React.FC<SocialChannelBackgroundProps> = ({
  children,
  theme: controlledTheme,
  onThemeChange,
  showThemeSelector = false,
  className = '',
}) => {
  const [internalTheme, setInternalTheme] = useState<SocialTheme>(() => {
    if (controlledTheme) return controlledTheme;
    const saved = localStorage.getItem('channel_social_theme');
    if (saved && (saved === 'creator-vibrant' || saved === 'midnight-studio' || saved === 'pastel-engagement')) {
      return saved as SocialTheme;
    }
    return 'creator-vibrant';
  });

  const currentTheme = controlledTheme || internalTheme;

  const handleSelectTheme = (newTheme: SocialTheme) => {
    setInternalTheme(newTheme);
    localStorage.setItem('channel_social_theme', newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  useEffect(() => {
    if (controlledTheme) {
      setInternalTheme(controlledTheme);
    }
  }, [controlledTheme]);

  // Synchronize background theme with system & Sidebar
  useEffect(() => {
    (window as any).__activeBackgroundTheme = currentTheme;
    window.dispatchEvent(new CustomEvent('app-background-changed', {
      detail: { theme: currentTheme }
    }));
  }, [currentTheme]);

  // Theme-specific CSS classes and colors
  const isMidnight = currentTheme === 'midnight-studio';
  const isPastel = currentTheme === 'pastel-engagement';

  return (
    <div 
      className={`min-h-screen w-full relative overflow-x-hidden transition-colors duration-700 select-none ${
        isMidnight 
          ? 'bg-[#0B0F19] text-slate-100' 
          : isPastel
            ? 'bg-[#F8FAFC]'
            : 'bg-[#FAF9F6]'
      } ${className}`}
    >
      {/* 1. Creator Studio Grid Overlay (Digital Studio Matrix) */}
      <div 
        className="absolute inset-0 pointer-events-none -z-20 transition-opacity duration-700"
        style={{
          backgroundImage: isMidnight
            ? `radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`
            : isPastel
              ? `radial-gradient(rgba(148, 163, 184, 0.20) 1px, transparent 1px), linear-gradient(to right, rgba(203, 213, 225, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(203, 213, 225, 0.2) 1px, transparent 1px)`
              : `radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px), linear-gradient(to right, rgba(99, 102, 241, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.04) 1px, transparent 1px)`,
          backgroundSize: '24px 24px, 120px 120px, 120px 120px',
          backgroundPosition: '0 0, 0 0, 0 0',
        }}
      />

      {/* 2. Social Platform Ambient Aura (Aurora Light Fields) */}
      {currentTheme === 'creator-vibrant' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Top-Right: Instagram Sunset / Reels warm bloom */}
          <div className="absolute -top-24 -right-24 w-[36rem] h-[36rem] bg-gradient-to-bl from-pink-400/25 via-rose-400/20 to-amber-300/15 rounded-full blur-3xl mix-blend-multiply animate-pulse duration-10000" />
          
          {/* Top-Left: TikTok Cyan & Indigo glow */}
          <div className="absolute -top-20 -left-20 w-[34rem] h-[34rem] bg-gradient-to-br from-cyan-400/20 via-sky-400/15 to-indigo-500/20 rounded-full blur-3xl mix-blend-multiply" />
          
          {/* Bottom-Right: YouTube Crimson & Red ruby aura */}
          <div className="absolute bottom-10 right-0 w-[40rem] h-[40rem] bg-gradient-to-tl from-red-400/20 via-rose-500/15 to-purple-400/10 rounded-full blur-3xl mix-blend-multiply" />
          
          {/* Bottom-Left: Live Streaming Emerald Green */}
          <div className="absolute bottom-0 -left-10 w-[32rem] h-[32rem] bg-gradient-to-tr from-emerald-400/15 via-teal-300/15 to-sky-300/10 rounded-full blur-3xl mix-blend-multiply" />
          
          {/* Center Subtle Violet Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] bg-gradient-to-r from-violet-300/10 via-fuchsia-300/10 to-indigo-300/10 rounded-full blur-3xl mix-blend-multiply" />
        </div>
      )}

      {currentTheme === 'midnight-studio' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Top-Right: Live On-Air Crimson Light */}
          <div className="absolute -top-20 -right-20 w-[36rem] h-[36rem] bg-gradient-to-bl from-red-600/25 via-rose-900/20 to-transparent rounded-full blur-3xl" />
          
          {/* Top-Left: Electric Cyber Blue & Cyan Glow */}
          <div className="absolute -top-20 -left-20 w-[36rem] h-[36rem] bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-transparent rounded-full blur-3xl" />
          
          {/* Bottom-Center: Deep Studio Violet / Obsidian */}
          <div className="absolute -bottom-24 left-1/3 w-[45rem] h-[40rem] bg-gradient-to-t from-indigo-700/20 via-purple-900/15 to-transparent rounded-full blur-3xl" />
          
          {/* On-Air Studio Indicator Beam */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        </div>
      )}

      {currentTheme === 'pastel-engagement' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Top-Right: Peach & Coral Pastel */}
          <div className="absolute -top-16 -right-16 w-[32rem] h-[32rem] bg-gradient-to-bl from-rose-200/45 via-orange-100/35 to-transparent rounded-full blur-3xl mix-blend-multiply" />
          
          {/* Top-Left: Sky Blue & Mint */}
          <div className="absolute -top-16 -left-16 w-[32rem] h-[32rem] bg-gradient-to-br from-sky-200/45 via-teal-100/35 to-transparent rounded-full blur-3xl mix-blend-multiply" />
          
          {/* Center & Bottom: Lavender & Lemon */}
          <div className="absolute bottom-10 right-1/4 w-[38rem] h-[38rem] bg-gradient-to-tr from-purple-200/35 via-pink-100/30 to-amber-100/25 rounded-full blur-3xl mix-blend-multiply" />
        </div>
      )}

      {/* 3. Floating Social Engagement Badges & Particles (Micro-Glass Icons) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Particle 1: Heart & Like Bubble (Top Right) */}
        <div 
          className="absolute top-24 right-12 md:right-28 animate-bounce duration-[6000ms] ease-in-out flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm transition-all opacity-40 hover:opacity-80"
          style={{
            backgroundColor: isMidnight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.75)',
            borderColor: isMidnight ? 'rgba(244, 63, 94, 0.25)' : 'rgba(251, 113, 133, 0.3)',
          }}
        >
          <Heart className={`w-3.5 h-3.5 ${isMidnight ? 'text-rose-400 fill-rose-400/50' : 'text-rose-500 fill-rose-500/40'}`} />
          <span className={`text-[11px] font-black tracking-wider ${isMidnight ? 'text-rose-300' : 'text-rose-600'}`}>
            +1.2k Likes
          </span>
        </div>

        {/* Particle 2: Live Broadcast Pill (Top Left) */}
        <div 
          className="absolute top-32 left-8 md:left-24 animate-pulse duration-[3500ms] flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border shadow-xs opacity-40"
          style={{
            backgroundColor: isMidnight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isMidnight ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className={`text-[10px] font-extrabold tracking-widest uppercase ${isMidnight ? 'text-red-400' : 'text-red-600'}`}>
            LIVE STREAM
          </span>
        </div>

        {/* Particle 3: Subscriber Growth Badge (Mid-Right) */}
        <div 
          className="absolute top-96 right-8 md:right-36 animate-pulse duration-[5000ms] flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl backdrop-blur-md border shadow-sm opacity-35"
          style={{
            backgroundColor: isMidnight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.75)',
            borderColor: isMidnight ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)',
          }}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${isMidnight ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <span className={`text-[11px] font-bold ${isMidnight ? 'text-indigo-300' : 'text-indigo-700'}`}>
            100k Reach
          </span>
        </div>

        {/* Particle 4: Play / Reel Frame (Mid-Left) */}
        <div 
          className="absolute top-[480px] left-10 md:left-20 flex items-center gap-1.5 p-2 rounded-2xl backdrop-blur-md border shadow-sm opacity-30 animate-bounce duration-[8000ms]"
          style={{
            backgroundColor: isMidnight ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255, 255, 255, 0.7)',
            borderColor: isMidnight ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)',
          }}
        >
          <div className="w-6 h-6 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Play className="w-3 h-3 fill-white ml-0.5" />
          </div>
          <span className={`text-[10px] font-bold ${isMidnight ? 'text-cyan-300' : 'text-cyan-700'}`}>
            Viral Reel
          </span>
        </div>

        {/* Particle 5: Share & Viral Bubble (Bottom-Right) */}
        <div 
          className="absolute bottom-36 right-16 md:right-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm opacity-35"
          style={{
            backgroundColor: isMidnight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.75)',
            borderColor: isMidnight ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
          }}
        >
          <Share2 className={`w-3 h-3 ${isMidnight ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <span className={`text-[10px] font-bold ${isMidnight ? 'text-emerald-300' : 'text-emerald-700'}`}>
            2.4k Shares
          </span>
        </div>

        {/* Particle 6: Comments Buzz Bubble (Bottom-Left) */}
        <div 
          className="absolute bottom-48 left-14 md:left-32 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-sm opacity-30"
          style={{
            backgroundColor: isMidnight ? 'rgba(217, 70, 239, 0.12)' : 'rgba(255, 255, 255, 0.75)',
            borderColor: isMidnight ? 'rgba(217, 70, 239, 0.3)' : 'rgba(217, 70, 239, 0.25)',
          }}
        >
          <MessageCircle className={`w-3 h-3 ${isMidnight ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} />
          <span className={`text-[10px] font-bold ${isMidnight ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>
            580 Comments
          </span>
        </div>
      </div>

      {/* 4. Audio Soundwave Matrix at Bottom Footer (Subtle Creator Studio Audio EQ) */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-20 flex items-end justify-center gap-1.5 pb-2 -z-10">
        {[24, 42, 65, 30, 80, 55, 90, 40, 70, 100, 48, 85, 60, 35, 75, 95, 50, 68, 88, 32, 60, 85, 45, 92, 38, 70, 50, 30].map((h, i) => (
          <div 
            key={i} 
            className={`w-1 rounded-full transition-all duration-500 ${
              isMidnight 
                ? 'bg-gradient-to-t from-red-500 to-indigo-400' 
                : isPastel
                  ? 'bg-gradient-to-t from-teal-400 to-sky-400'
                  : 'bg-gradient-to-t from-pink-500 to-indigo-500'
            }`}
            style={{ 
              height: `${Math.max(8, h * 0.4)}px`,
              opacity: (i % 3 === 0 ? 0.9 : 0.5)
            }} 
          />
        ))}
      </div>

      {/* Content Injection */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default SocialChannelBackground;
