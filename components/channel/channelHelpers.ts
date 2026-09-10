import { Channel } from '../../types';

export const formatFollowersCompact = (num?: number): string => {
  if (!num || isNaN(num) || num <= 0) return '0';
  if (num >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(1);
    return formatted.endsWith('.0') ? `${num / 1_000_000}M` : `${formatted}M`;
  }
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(1);
    return formatted.endsWith('.0') ? `${num / 1_000}K` : `${formatted}K`;
  }
  return num.toLocaleString();
};

export const getChannelTotalFollowers = (channel: Channel): number => {
  if (!channel.followers) return 0;
  return Object.values(channel.followers).reduce<number>((sum, count) => {
    return sum + (typeof count === 'number' && !isNaN(count) && count > 0 ? count : 0);
  }, 0);
};

export interface GlowStyles {
  gradient: string;
  shadow: string;
  border: string;
  badgeClass: string;
  meshBg: string;
}

export const getGlowStyles = (colorClass: string): GlowStyles => {
  const raw = colorClass || '';
  if (raw.includes('red')) return { 
    gradient: 'from-rose-500/10 to-red-500/10 hover:from-rose-500/20 hover:to-red-500/20', 
    shadow: 'shadow-red-500/5 group-hover:shadow-red-500/15', 
    border: 'group-hover:border-rose-200', 
    badgeClass: 'bg-red-50 border-red-200 text-red-600',
    meshBg: 'text-red-500'
  };
  if (raw.includes('orange')) return { 
    gradient: 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20', 
    shadow: 'shadow-orange-500/5 group-hover:shadow-orange-500/15', 
    border: 'group-hover:border-orange-200', 
    badgeClass: 'bg-orange-50 border-orange-200 text-orange-600',
    meshBg: 'text-orange-500'
  };
  if (raw.includes('amber')) return { 
    gradient: 'from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20', 
    shadow: 'shadow-amber-500/5 group-hover:shadow-amber-500/15', 
    border: 'group-hover:border-amber-200', 
    badgeClass: 'bg-amber-50 border-amber-200 text-amber-600',
    meshBg: 'text-amber-500'
  };
  if (raw.includes('green')) return { 
    gradient: 'from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20', 
    shadow: 'shadow-green-500/5 group-hover:shadow-green-500/15', 
    border: 'group-hover:border-emerald-200', 
    badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    meshBg: 'text-emerald-500'
  };
  if (raw.includes('teal')) return { 
    gradient: 'from-teal-500/10 to-cyan-500/10 hover:from-teal-500/20 hover:to-cyan-500/20', 
    shadow: 'shadow-teal-500/5 group-hover:shadow-teal-500/15', 
    border: 'group-hover:border-teal-200', 
    badgeClass: 'bg-teal-50 border-teal-200 text-teal-600',
    meshBg: 'text-teal-500'
  };
  if (raw.includes('blue')) return { 
    gradient: 'from-sky-500/10 to-blue-500/10 hover:from-sky-500/20 hover:to-blue-500/20', 
    shadow: 'shadow-blue-500/5 group-hover:shadow-blue-500/15', 
    border: 'group-hover:border-blue-200', 
    badgeClass: 'bg-blue-50 border-blue-200 text-blue-600',
    meshBg: 'text-blue-500'
  };
  if (raw.includes('indigo')) return { 
    gradient: 'from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20', 
    shadow: 'shadow-indigo-500/5 group-hover:shadow-indigo-500/15', 
    border: 'group-hover:border-indigo-200', 
    badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    meshBg: 'text-indigo-500'
  };
  if (raw.includes('purple')) return { 
    gradient: 'from-purple-500/10 to-fuchsia-500/10 hover:from-purple-500/20 hover:to-fuchsia-500/20', 
    shadow: 'shadow-purple-500/5 group-hover:shadow-purple-500/15', 
    border: 'group-hover:border-purple-200', 
    badgeClass: 'bg-purple-50 border-purple-200 text-purple-600',
    meshBg: 'text-purple-500'
  };
  if (raw.includes('pink')) return { 
    gradient: 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-pink-500/20', 
    shadow: 'shadow-pink-500/5 group-hover:shadow-pink-500/15', 
    border: 'group-hover:border-pink-200', 
    badgeClass: 'bg-pink-50 border-pink-200 text-pink-500',
    meshBg: 'text-pink-500'
  };
  return { 
    gradient: 'from-slate-500/10 to-zinc-500/10 hover:from-slate-500/20 hover:to-zinc-500/20', 
    shadow: 'shadow-slate-500/5 group-hover:shadow-slate-500/15', 
    border: 'group-hover:border-slate-300', 
    badgeClass: 'bg-slate-50 border-slate-200 text-slate-500',
    meshBg: 'text-slate-500'
  };
};

export const channelContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};
