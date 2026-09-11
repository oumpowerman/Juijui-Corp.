import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Layers } from 'lucide-react';
import { SocialTheme } from '../helpers/SocialChannelBackground';

interface RankingModeToggleProps {
  rankingMode: 'global' | 'group';
  onToggle: (mode: 'global' | 'group') => void;
  socialTheme?: SocialTheme;
}

export const RankingModeToggle: React.FC<RankingModeToggleProps> = ({
  rankingMode,
  onToggle,
  socialTheme = 'creator-vibrant',
}) => {
  const isDark = socialTheme === 'midnight-studio';

  return (
    <div className="inline-flex items-center gap-2">
      {/* iOS Minimal Segmented Icon Track (~64px width) */}
      <div
        role="group"
        aria-label="เลือกรูปแบบการจัดอันดับ"
        className={`relative inline-flex items-center p-0.5 rounded-full select-none transition-all duration-200 ${
          isDark
            ? 'bg-slate-800/90 ring-1 ring-white/10 shadow-inner'
            : 'bg-slate-200/70 ring-1 ring-black/[0.05] shadow-inner'
        }`}
      >
        {/* Option: Global */}
        <button
          type="button"
          onClick={() => onToggle('global')}
          className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${
            rankingMode === 'global'
              ? isDark
                ? 'text-blue-400'
                : 'text-blue-600'
              : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-400 hover:text-slate-700'
          }`}
          title="อันดับรวมทั้งระบบ (จัดอันดับ Top 10 จากทุกช่องรวมกัน)"
        >
          {rankingMode === 'global' && (
            <motion.div
              layoutId="ios-ranking-pill"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`absolute inset-0 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.05)] ${
                isDark
                  ? 'bg-slate-700 ring-1 ring-blue-400/30 shadow-blue-500/20'
                  : 'bg-white ring-1 ring-blue-500/20 shadow-blue-500/10'
              }`}
            />
          )}
          <Globe
            className="relative z-10 w-3.5 h-3.5 transition-transform duration-200 active:scale-90"
            strokeWidth={rankingMode === 'global' ? 2.4 : 1.9}
          />
        </button>

        {/* Option: Group */}
        <button
          type="button"
          onClick={() => onToggle('group')}
          className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer ${
            rankingMode === 'group'
              ? isDark
                ? 'text-rose-400'
                : 'text-rose-600'
              : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-400 hover:text-slate-700'
          }`}
          title="อันดับแยกตามกลุ่ม (จัดอันดับ Top 10 ในแต่ละกลุ่ม เรียงตามผู้ติดตาม)"
        >
          {rankingMode === 'group' && (
            <motion.div
              layoutId="ios-ranking-pill"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`absolute inset-0 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.05)] ${
                isDark
                  ? 'bg-slate-700 ring-1 ring-rose-400/30 shadow-rose-500/20'
                  : 'bg-white ring-1 ring-rose-500/20 shadow-rose-500/10'
              }`}
            />
          )}
          <Layers
            className="relative z-10 w-3.5 h-3.5 transition-transform duration-200 active:scale-90"
            strokeWidth={rankingMode === 'group' ? 2.4 : 1.9}
          />
        </button>
      </div>

      {/* Micro Status Badge */}
      <span className={`text-[11px] font-medium hidden sm:inline-flex items-center transition-colors duration-200 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {rankingMode === 'global' ? (
          <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>จัดอันดับรวม</span>
        ) : (
          <span className={isDark ? 'text-rose-300' : 'text-rose-600'}>จัดอันดับตามกลุ่ม</span>
        )}
      </span>
    </div>
  );
};