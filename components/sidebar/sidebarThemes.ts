import { ViewMode } from '../../types';
import { SidebarThemeStyles } from './types';

export function getSidebarThemeStyles(
  activeBgTheme: string,
  isDarkTheme: boolean,
  currentView: ViewMode
): SidebarThemeStyles {
  // 1. Social Channel Themes (when in CHANNELS or when activeBgTheme is a social theme)
  if (
    currentView === 'CHANNELS' || 
    activeBgTheme === 'midnight-studio' || 
    activeBgTheme === 'creator-vibrant' || 
    activeBgTheme === 'pastel-engagement'
  ) {
    if (activeBgTheme === 'midnight-studio') {
      return {
        aside: 'bg-slate-950/80 backdrop-blur-3xl border-r border-slate-800/90 shadow-[4px_0_30px_rgba(0,0,0,0.5)]',
        logoArea: 'from-red-500/15 via-indigo-950/40 to-transparent',
        footer: 'border-t border-slate-800/80 bg-transparent',
        userCard: 'hover:bg-slate-800/60 hover:border-slate-700/80 hover:shadow-[0_4px_20px_-4px_rgba(239,68,68,0.2)]',
        text: 'text-white font-bold',
        subtext: 'text-slate-400 font-medium',
        itemIdle: 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium',
        itemActive: 'text-white font-bold',
        itemActiveColor: 'text-red-400',
        activeIcon: 'text-red-400',
        idleIcon: 'text-slate-400 group-hover/btn:text-red-400',
        activePill: 'bg-gradient-to-r from-red-500/20 via-indigo-950/40 to-slate-900/60 border border-red-500/40 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)] backdrop-blur-md',
        activeBar: 'bg-gradient-to-b from-red-500 to-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.8)]',
        hoverBg: 'bg-slate-800/50',
        groupHeader: 'text-slate-400 hover:text-red-400',
        brandAccentBg: 'bg-red-500',
        brandAccentText: 'text-red-400',
        brandAccentGradient: 'from-red-500/50',
        iconBg: 'bg-slate-800/90 border border-slate-700 text-slate-200 backdrop-blur-md shadow-sm hover:bg-slate-700'
      };
    }

    if (activeBgTheme === 'pastel-engagement') {
      return {
        aside: 'bg-white/70 backdrop-blur-3xl border-r border-teal-200/60 shadow-[4px_0_24px_rgba(20,184,166,0.06)]',
        logoArea: 'from-teal-400/10 via-sky-400/5 to-transparent',
        footer: 'border-t border-teal-100/80 bg-transparent',
        userCard: 'hover:bg-teal-500/10 hover:border-teal-500/20 hover:shadow-[0_4px_20px_-4px_rgba(20,184,166,0.12)]',
        text: 'text-slate-800 font-bold',
        subtext: 'text-teal-900/70 font-medium',
        itemIdle: 'text-slate-600 hover:text-teal-700 hover:bg-teal-50/60 font-medium',
        itemActive: 'text-teal-700 font-bold',
        itemActiveColor: 'text-teal-600',
        activeIcon: 'text-teal-600',
        idleIcon: 'text-slate-400 group-hover/btn:text-teal-600',
        activePill: 'bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-200/80 text-teal-800 shadow-2xs',
        activeBar: 'bg-gradient-to-b from-teal-500 to-sky-500',
        hoverBg: 'bg-teal-50/50',
        groupHeader: 'text-slate-500 hover:text-teal-700',
        brandAccentBg: 'bg-gradient-to-tr from-teal-400 to-sky-500',
        brandAccentText: 'text-teal-600',
        brandAccentGradient: 'from-teal-400/50',
        iconBg: 'bg-teal-500/10 border border-teal-500/20 text-teal-600 backdrop-blur-md shadow-sm hover:bg-teal-500/15'
      };
    }

    // Default for Social: Creator Vibrant (IG Sunset & TikTok Glow)
    return {
      aside: 'bg-white/65 backdrop-blur-3xl border-r border-pink-200/60 shadow-[4px_0_24px_rgba(244,63,94,0.08)]',
      logoArea: 'from-pink-500/15 via-rose-500/5 to-transparent',
      footer: 'border-t border-pink-100/80 bg-transparent',
      userCard: 'hover:bg-pink-500/10 hover:border-pink-500/20 hover:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.15)]',
      text: 'text-slate-900 font-bold',
      subtext: 'text-pink-950/70 font-medium',
      itemIdle: 'text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 font-medium',
      itemActive: 'text-pink-600 font-bold',
      itemActiveColor: 'text-pink-600',
      activeIcon: 'text-pink-600',
      idleIcon: 'text-slate-400 group-hover/btn:text-pink-500',
      activePill: 'bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-200/80 text-pink-700 shadow-2xs',
      activeBar: 'bg-gradient-to-b from-pink-500 via-rose-500 to-purple-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
      hoverBg: 'bg-pink-50/50',
      groupHeader: 'text-slate-500 hover:text-pink-600',
      brandAccentBg: 'bg-gradient-to-tr from-pink-500 to-rose-600',
      brandAccentText: 'text-pink-600',
      brandAccentGradient: 'from-pink-500/50',
      iconBg: 'bg-pink-500/10 border border-pink-500/20 text-pink-600 backdrop-blur-md shadow-sm hover:bg-pink-500/15'
    };
  }

  // 2. Views other than Dashboard & Calendar
  if (currentView !== 'DASHBOARD' && currentView !== 'CALENDAR') {
    return {
      aside: isDarkTheme
        ? 'bg-slate-950/20 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
        : 'bg-white/20 backdrop-blur-2xl border-r border-white/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
      logoArea: isDarkTheme ? 'from-white/3 via-white/1 to-transparent' : 'from-indigo-500/4 via-indigo-500/1 to-transparent',
      footer: isDarkTheme ? 'border-t border-white/5 bg-transparent' : 'border-t border-slate-200/50 bg-transparent',
      userCard: isDarkTheme 
        ? 'hover:bg-white/5 hover:border-white/10 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.05)]' 
        : 'hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]',
      text: isDarkTheme ? 'text-slate-200/90' : 'text-slate-800/90',
      subtext: isDarkTheme ? 'text-slate-400/80' : 'text-slate-500/80',
      itemIdle: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-600 hover:text-indigo-700',
      itemActive: isDarkTheme ? 'text-indigo-300' : 'text-indigo-700',
      itemActiveColor: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
      activeIcon: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
      idleIcon: isDarkTheme ? 'text-slate-400 group-hover/btn:text-indigo-300' : 'text-slate-400 group-hover/btn:text-indigo-600',
      activePill: isDarkTheme ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-indigo-50 border border-indigo-100',
      activeBar: isDarkTheme ? 'bg-indigo-400' : 'bg-indigo-500',
      hoverBg: isDarkTheme ? 'bg-white/5' : 'bg-slate-100',
      groupHeader: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-500 hover:text-indigo-600',
      brandAccentBg: 'bg-indigo-500',
      brandAccentText: 'text-indigo-500',
      brandAccentGradient: 'from-indigo-500/50',
      iconBg: isDarkTheme 
        ? 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-md shadow-sm hover:bg-white/10' 
        : 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 backdrop-blur-md shadow-sm hover:bg-indigo-500/10'
    };
  }

  // 3. Seasonal Themes
  switch (activeBgTheme) {
    case 'season-summer':
    case 'bg-season-summer':
      return {
        aside: 'bg-sky-50/15 backdrop-blur-3xl border-r border-sky-500/20 shadow-[4px_0_24px_rgba(14,165,233,0.05)]',
        logoArea: 'from-sky-400/5 via-sky-400/2 to-transparent',
        footer: 'border-t border-sky-500/10 bg-transparent',
        userCard: 'hover:bg-sky-500/10 hover:border-sky-500/20 hover:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15)]',
        text: 'text-sky-950 font-bold',
        subtext: 'text-sky-900/80 font-medium',
        iconBg: 'bg-sky-500/10 border border-sky-500/20 text-sky-600 backdrop-blur-md shadow-sm hover:bg-sky-500/15',
        itemIdle: 'text-sky-800/80 hover:text-sky-950 hover:bg-sky-500/5 font-semibold',
        itemActive: 'text-sky-950 font-bold',
        itemActiveColor: 'text-sky-600',
        activeIcon: 'text-sky-600',
        idleIcon: 'text-sky-700/60 group-hover/btn:text-sky-600',
        activePill: 'bg-sky-500/10 border border-sky-500/20',
        activeBar: 'bg-sky-500',
        hoverBg: 'bg-sky-500/5',
        groupHeader: 'text-sky-800/70 hover:text-sky-950',
        brandAccentBg: 'bg-sky-500',
        brandAccentText: 'text-sky-600',
        brandAccentGradient: 'from-sky-500/50'
      };
    case 'season-snow':
    case 'bg-season-snow':
      return {
        aside: 'bg-white/10 backdrop-blur-3xl border-r border-white/20 shadow-[4px_0_24px_rgba(255,255,255,0.05)]',
        logoArea: 'from-white/15 via-sky-300/5 to-transparent',
        footer: 'border-t border-white/10 bg-transparent',
        userCard: 'hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.15)]',
        text: 'text-white font-bold',
        subtext: 'text-sky-200/80 font-medium',
        iconBg: 'bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/20',
        itemIdle: 'text-sky-100/80 hover:text-white hover:bg-white/10 font-semibold',
        itemActive: 'text-white font-bold',
        itemActiveColor: 'text-white',
        activeIcon: 'text-white',
        idleIcon: 'text-sky-200/50 group-hover/btn:text-white',
        activePill: 'bg-white/15 border border-white/25 shadow-[0_0_15px_rgba(255,255,255,0.1)] backdrop-blur-md',
        activeBar: 'bg-white',
        hoverBg: 'bg-white/5',
        groupHeader: 'text-sky-200/50 hover:text-white',
        brandAccentBg: 'bg-sky-300',
        brandAccentText: 'text-sky-300',
        brandAccentGradient: 'from-sky-300/50'
      };
    case 'season-rain':
    case 'bg-season-rain':
      return {
        aside: 'bg-slate-950/15 backdrop-blur-3xl border-r border-slate-500/40 shadow-[4px_0_24px_rgba(0,0,0,0.25)]',
        logoArea: 'from-slate-500/15 via-slate-500/5 to-transparent',
        footer: 'border-t border-slate-600/40 bg-transparent',
        userCard: 'hover:bg-slate-800/40 hover:border-slate-700/50 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]',
        text: 'text-white font-bold',
        subtext: 'text-slate-300/80 font-medium',
        iconBg: 'bg-white/10 border border-white/15 text-white backdrop-blur-md hover:bg-white/15',
        itemIdle: 'text-slate-300/80 hover:text-white hover:bg-white/5 font-semibold',
        itemActive: 'text-white font-bold',
        itemActiveColor: 'text-white',
        activeIcon: 'text-white',
        idleIcon: 'text-slate-350 group-hover/btn:text-white',
        activePill: 'bg-white/10 border border-white/10 shadow-md backdrop-blur-md',
        activeBar: 'bg-white',
        hoverBg: 'bg-white/5',
        groupHeader: 'text-slate-100/70 hover:text-white',
        brandAccentBg: 'bg-slate-300',
        brandAccentText: 'text-slate-300',
        brandAccentGradient: 'from-slate-300/30'
      };
    case 'season-autumn':
    case 'bg-season-autumn':
      return {
        aside: 'bg-orange-50/15 backdrop-blur-3xl border-r border-orange-500/20 shadow-[4px_0_24px_rgba(249,115,22,0.05)]',
        logoArea: 'from-orange-400/5 via-orange-400/2 to-transparent',
        footer: 'border-t border-orange-500/10 bg-transparent',
        userCard: 'hover:bg-orange-500/10 hover:border-orange-500/20 hover:shadow-[0_4px_20px_-4px_rgba(249,115,22,0.15)]',
        text: 'text-orange-950 font-bold',
        subtext: 'text-orange-900/80 font-medium',
        iconBg: 'bg-orange-500/10 border border-orange-500/20 text-orange-600 backdrop-blur-md shadow-sm hover:bg-orange-500/15',
        itemIdle: 'text-orange-800/80 hover:text-orange-950 hover:bg-orange-500/5 font-semibold',
        itemActive: 'text-orange-950 font-bold',
        itemActiveColor: 'text-orange-600',
        activeIcon: 'text-orange-600',
        idleIcon: 'text-orange-700/60 group-hover/btn:text-orange-600',
        activePill: 'bg-orange-500/10 border border-orange-500/20',
        activeBar: 'bg-orange-500',
        hoverBg: 'bg-orange-500/5',
        groupHeader: 'text-orange-800/70 hover:text-orange-950',
        brandAccentBg: 'bg-orange-500',
        brandAccentText: 'text-orange-600',
        brandAccentGradient: 'from-orange-500/50'
      };
    default:
      return {
        aside: isDarkTheme
          ? 'bg-slate-950/20 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
          : 'bg-white/20 backdrop-blur-2xl border-r border-white/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
        logoArea: isDarkTheme ? 'from-white/3 via-white/1 to-transparent' : 'from-indigo-500/4 via-indigo-500/1 to-transparent',
        footer: isDarkTheme ? 'border-t border-white/5 bg-transparent' : 'border-t border-slate-200/50 bg-transparent',
        userCard: isDarkTheme 
          ? 'hover:bg-white/5 hover:border-white/10 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.05)]' 
          : 'hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]',
        text: isDarkTheme ? 'text-slate-200/90' : 'text-slate-800/90',
        subtext: isDarkTheme ? 'text-slate-400/80' : 'text-slate-500/80',
        itemIdle: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-600 hover:text-indigo-700',
        itemActive: isDarkTheme ? 'text-indigo-300' : 'text-indigo-700',
        itemActiveColor: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
        activeIcon: isDarkTheme ? 'text-indigo-300' : 'text-indigo-600',
        idleIcon: isDarkTheme ? 'text-slate-400 group-hover/btn:text-indigo-300' : 'text-slate-400 group-hover/btn:text-indigo-600',
        activePill: isDarkTheme ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-indigo-50 border border-indigo-100',
        activeBar: isDarkTheme ? 'bg-indigo-400' : 'bg-indigo-500',
        hoverBg: isDarkTheme ? 'bg-white/5' : 'bg-slate-100',
        groupHeader: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-500 hover:text-indigo-600',
        brandAccentBg: 'bg-indigo-500',
        brandAccentText: 'text-indigo-500',
        brandAccentGradient: 'from-indigo-500/50',
        iconBg: isDarkTheme 
          ? 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-md shadow-sm hover:bg-white/10' 
          : 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 backdrop-blur-md shadow-sm hover:bg-indigo-500/10'
      };
  }
}
