import React, { useState } from 'react';
import { Plus, FolderKanban, ChevronDown } from 'lucide-react';
import { ChannelGroup } from '../../../types';
import MentorTip from '../../MentorTip';
import NotificationBellBtn from '../../NotificationBellBtn';
import { RankingModeToggle } from './RankingModeToggle';
import { SocialTheme, THEME_OPTIONS } from '../helpers/SocialChannelBackground';

interface ChannelManagerHeaderProps {
  groups: ChannelGroup[];
  socialTheme: SocialTheme;
  onSelectTheme: (theme: SocialTheme) => void;
  rankingMode: 'global' | 'group';
  onToggleRankingMode: (mode: 'global' | 'group') => void;
  onOpenGroupModal: () => void;
  onCreateChannel: () => void;
  onOpenSettings: () => void;
}

export const ChannelManagerHeader: React.FC<ChannelManagerHeaderProps> = ({
  groups,
  socialTheme,
  onSelectTheme,
  rankingMode,
  onToggleRankingMode,
  onOpenGroupModal,
  onCreateChannel,
  onOpenSettings,
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const activeThemeMeta = THEME_OPTIONS.find(t => t.id === socialTheme) || THEME_OPTIONS[0];
  const ActiveIcon = activeThemeMeta.icon;

  const handleSelectTheme = (newTheme: SocialTheme) => {
    onSelectTheme(newTheme);
    setIsThemeMenuOpen(false);
  };

  return (
    <>
      <MentorTip moduleId="CHANNEL" />

      {/* Floating Glassmorphic Header Section */}
      <div className={`relative z-50 p-6 md:p-7 rounded-3xl border border-b-[3px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-colors duration-500 ${
        socialTheme === 'midnight-studio'
          ? 'bg-slate-900/80 backdrop-blur-md border-slate-800 border-b-slate-950 text-slate-100'
          : 'bg-white/85 backdrop-blur-md border-white/80 border-b-slate-200/90 text-slate-800'
      }`}>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={`text-2xl sm:text-3xl font-bold flex items-center ${
              socialTheme === 'midnight-studio' ? 'text-white' : 'text-slate-800'
            }`}>
              จัดการช่องรายการ (Brands & Shows)
            </h1>
            {groups.length > 0 && (
              <span className={`px-3 py-1 text-xs font-black rounded-full border border-b-[2px] shadow-2xs ${
                socialTheme === 'midnight-studio'
                  ? 'bg-indigo-950/80 border-indigo-700/60 border-b-indigo-600 text-indigo-300'
                  : 'bg-gradient-to-b from-indigo-50 to-indigo-100/70 border-indigo-200/80 border-b-indigo-300/70 text-indigo-700'
              }`}>
                {groups.length} ส่วน (Sections)
              </span>
            )}
          </div>

          {/* Subtitle & Ranking Mode Toggle placement directly under title */}
          <div className="flex items-center gap-3.5 flex-wrap mt-2">
            <p className={`text-sm leading-relaxed ${
              socialTheme === 'midnight-studio' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              สร้างและแบ่งกลุ่ม "รายการ" หรือ "แบรนด์" เพื่อติดตามยอดผู้ติดตามรวมและสถิติรายหมวดหมู่
            </p>

            {/* Compact iOS Ranking Toggle under title */}
            <div className="flex items-center gap-2">
              <span className={`hidden sm:inline-block w-1 h-1 rounded-full ${
                socialTheme === 'midnight-studio' ? 'bg-slate-700' : 'bg-slate-300'
              }`} />
              <RankingModeToggle
                rankingMode={rankingMode}
                onToggle={onToggleRankingMode}
                socialTheme={socialTheme}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto justify-start md:justify-end shrink-0">
          {/* Social Atmosphere Theme Switcher */}
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-b-[3px] shadow-2xs transition-all active:translate-y-[2px] active:border-b-[1px] cursor-pointer ${
                socialTheme === 'midnight-studio'
                  ? 'bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 border-b-slate-900 text-slate-200'
                  : 'bg-white/90 hover:bg-white border-slate-200/90 border-b-slate-300/90 text-slate-700'
              }`}
              title="เปลี่ยนบรรยากาศ Social Atmosphere"
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${activeThemeMeta.badgeColor} flex items-center justify-center text-white shadow-2xs`}>
                <ActiveIcon className="w-2.5 h-2.5" />
              </div>
              <span>{activeThemeMeta.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Theme Dropdown Menu */}
            {isThemeMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsThemeMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-60 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Social Atmosphere Moods
                  </div>
                  <div className="space-y-1 mt-1">
                    {THEME_OPTIONS.map((opt) => {
                      const IconComponent = opt.icon;
                      const isSelected = opt.id === socialTheme;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectTheme(opt.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/90 text-indigo-900 font-bold border border-indigo-200/70'
                              : 'hover:bg-slate-100/80 text-slate-700 hover:text-slate-900'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${opt.badgeColor} flex items-center justify-center text-white shrink-0 shadow-2xs mt-0.5`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold flex items-center justify-between">
                              <span>{opt.name}</span>
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {opt.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Manage Channel Groups Button */}
          <button
            type="button"
            onClick={onOpenGroupModal}
            className={`flex items-center px-4 py-2.5 font-bold text-sm rounded-xl border border-b-[3px] shadow-2xs hover:shadow-xs transition-all active:translate-y-[2px] active:border-b-[1px] cursor-pointer ${
              socialTheme === 'midnight-studio'
                ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 border-b-slate-900'
                : 'bg-gradient-to-b from-white to-slate-50 hover:to-slate-100 text-slate-700 border-slate-200/90 border-b-slate-300/90'
            }`}
          >
            <FolderKanban className="w-4 h-4 mr-2 text-indigo-500" />
            จัดการกลุ่ม ({groups.length})
          </button>

          {/* Create Channel Button - Aesthetic Pastel Style like CalendarHeader */}
          <button 
            type="button"
            onClick={onCreateChannel}
            className={`relative overflow-hidden group h-10 sm:h-10.5 px-4 sm:px-5 rounded-2xl active:scale-95 flex items-center justify-center shrink-0 border-2 transition-all duration-300 backdrop-blur-md cursor-pointer ${
              socialTheme === 'midnight-studio'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30 hover:border-indigo-400/60 shadow-[0_4px_20px_-2px_rgba(99,102,241,0.25)]'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 border-indigo-300/60 hover:border-indigo-400/80 shadow-[0_4px_16px_-2px_rgba(99,102,241,0.18)]'
            }`}
            title="เพิ่มและลงทะเบียนช่องรายการใหม่"
          >
            <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
              <Plus className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[3px] transition-transform duration-500 group-hover:rotate-90 ${
                socialTheme === 'midnight-studio' ? 'text-indigo-400' : 'text-indigo-600'
              }`} />
              <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap select-none">
                สร้างรายการใหม่
              </span>
            </div>
          </button>
          
          {/* Notification Button */}
          <NotificationBellBtn 
            onClick={onOpenSettings}
            className="hidden md:flex"
          />
        </div>
      </div>
    </>
  );
};
