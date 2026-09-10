import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, FolderKanban, Sparkles, ChevronDown } from 'lucide-react';
import { Channel, Task, User } from '../types';
import MentorTip from './MentorTip';
import NotificationBellBtn from './NotificationBellBtn';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import ChannelFormModal from './ChannelFormModal';
import { ChannelGroupModal } from './channel/ChannelGroupModal';
import { ChannelStatsCards } from './channel/ChannelStatsCards';
import { ChannelFilterTabs } from './channel/ChannelFilterTabs';
import { ChannelSectionList } from './channel/ChannelSectionList';
import { useChannelGroups } from '../hooks/useChannelGroups';
import { supabase } from '../lib/supabase';
import { SocialChannelBackground, SocialTheme, THEME_OPTIONS } from './channel/SocialChannelBackground';
import { 
  getChannelTotalFollowers, 
  formatFollowersCompact, 
  getGlowStyles 
} from './channel/channelHelpers';

// Re-export helpers for backward compatibility
export { formatFollowersCompact, getChannelTotalFollowers, getGlowStyles };

interface ChannelManagerProps {
  tasks: Task[];
  channels: Channel[];
  currentUser?: User;
  onAdd: (channel: Channel, file?: File) => Promise<boolean>;
  onEdit: (channel: Channel, file?: File) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onOpenSettings: () => void;
}

const ChannelManager: React.FC<ChannelManagerProps> = ({ 
  channels, 
  currentUser,
  onAdd, 
  onEdit, 
  onDelete, 
  onOpenSettings 
}) => {
  const { showConfirm } = useGlobalDialog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Social Atmosphere Theme State
  const [socialTheme, setSocialTheme] = useState<SocialTheme>(() => {
    const saved = localStorage.getItem('channel_social_theme');
    if (saved && (saved === 'creator-vibrant' || saved === 'midnight-studio' || saved === 'pastel-engagement')) {
      return saved as SocialTheme;
    }
    return 'creator-vibrant';
  });

  const handleSelectTheme = (newTheme: SocialTheme) => {
    setSocialTheme(newTheme);
    localStorage.setItem('channel_social_theme', newTheme);
    setIsThemeMenuOpen(false);
  };

  // Channel Groups hook & state
  const {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    assignChannelToGroup,
    enrichChannelsWithGroups,
  } = useChannelGroups();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');

  // Server-Side Aggregated Content Count Map
  const [contentCountMap, setContentCountMap] = useState<Record<string, number>>({});
  const [totalContentsCount, setTotalContentsCount] = useState<number>(0);
  const [isRefreshingCounts, setIsRefreshingCounts] = useState(false);

  // Enrich channels with group assignments
  const enrichedChannels = useMemo(() => {
    return enrichChannelsWithGroups(channels);
  }, [channels, enrichChannelsWithGroups]);

  const fetchDirectContentCounts = useCallback(async (force = false) => {
    setIsRefreshingCounts(true);
    try {
      // 1. Primary: Server-Side Aggregation endpoint
      const channelIdsParam = channels.map(c => c.id).join(',');
      const res = await fetch(`/api/channels/content-counts?channelIds=${encodeURIComponent(channelIdsParam)}${force ? '&force=1' : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const counts: Record<string, number> = json.counts || {};
          const sumOfCounts = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
          const finalTotal = typeof json.total === 'number' && json.total > 0 ? json.total : sumOfCounts;
          setContentCountMap(counts);
          setTotalContentsCount(finalTotal);
          return;
        }
      }

      // 2. Resilient Fallback: Direct PostgreSQL requests per channel
      const channelPromises = channels.map(async (ch) => {
        const { count, error } = await supabase
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', ch.id);
        return { id: ch.id, count: error ? 0 : (count || 0) };
      });

      const channelResults = await Promise.all(channelPromises);

      const map: Record<string, number> = {};
      let fallbackSum = 0;
      channelResults.forEach(r => {
        map[r.id] = r.count;
        fallbackSum += r.count;
      });

      setContentCountMap(map);
      setTotalContentsCount(fallbackSum);
    } catch (err) {
      console.warn('[ChannelManager] Aggregation count error:', err);
    } finally {
      setIsRefreshingCounts(false);
    }
  }, [channels]);

  useEffect(() => {
    fetchDirectContentCounts();
  }, [fetchDirectContentCounts]);

  const handleCreateChannel = () => {
    setEditingChannel(null);
    setIsFormOpen(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsFormOpen(true);
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (await showConfirm(`ยืนยันลบรายการ "${name}" ?`)) {
      await onDelete(id);
    }
  };

  const handleSaveChannel = async (payload: Channel, logoFile?: File | null) => {
    if (editingChannel) {
      return await onEdit(payload, logoFile || undefined);
    } else {
      return await onAdd(payload, logoFile || undefined);
    }
  };

  // Ecosystem Metrics
  const grandTotalFollowers = useMemo(() => {
    return enrichedChannels.reduce((sum, ch) => sum + getChannelTotalFollowers(ch), 0);
  }, [enrichedChannels]);

  // Section Grouping Data Structure
  const sectionData = useMemo(() => {
    const groupedMap: Record<string, Channel[]> = {};
    const ungrouped: Channel[] = [];

    groups.forEach(g => {
      groupedMap[g.id] = [];
    });

    enrichedChannels.forEach(ch => {
      if (ch.group_id && groupedMap[ch.group_id]) {
        groupedMap[ch.group_id].push(ch);
      } else {
        ungrouped.push(ch);
      }
    });

    const categorizedCount = enrichedChannels.filter(c => c.group_id).length;

    return {
      groupedMap,
      ungrouped,
      categorizedCount,
      hasGroups: groups.length > 0,
    };
  }, [enrichedChannels, groups]);

  const activeThemeMeta = THEME_OPTIONS.find(t => t.id === socialTheme) || THEME_OPTIONS[0];
  const ActiveIcon = activeThemeMeta.icon;

  return (
    <SocialChannelBackground 
      theme={socialTheme}
      onThemeChange={setSocialTheme}
      className="min-h-screen"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-in fade-in duration-500 pb-28">
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
            <p className={`text-sm mt-1.5 leading-relaxed ${
              socialTheme === 'midnight-studio' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              สร้างและแบ่งกลุ่ม "รายการ" หรือ "แบรนด์" เพื่อติดตามยอดผู้ติดตามรวมและสถิติรายหมวดหมู่
            </p>
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
                  <div className="absolute right-0 mt-2 w-72 p-2 bg-white white:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-60 animate-in fade-in zoom-in-95 duration-150">
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
              onClick={() => setIsGroupModalOpen(true)}
              className={`flex items-center px-4 py-2.5 font-bold text-sm rounded-xl border border-b-[3px] shadow-2xs hover:shadow-xs transition-all active:translate-y-[2px] active:border-b-[1px] cursor-pointer ${
                socialTheme === 'midnight-studio'
                  ? 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 border-b-slate-900'
                  : 'bg-gradient-to-b from-white to-slate-50 hover:to-slate-100 text-slate-700 border-slate-200/90 border-b-slate-300/90'
              }`}
            >
              <FolderKanban className="w-4 h-4 mr-2 text-indigo-500" />
              จัดการกลุ่ม ({groups.length})
            </button>

            {/* Create Channel Button */}
            <button 
              onClick={handleCreateChannel}
              className="flex items-center px-5 py-2.5 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm rounded-xl border border-indigo-500 border-b-[3px] border-b-indigo-700/80 shadow-md shadow-indigo-200/80 hover:shadow-lg hover:shadow-indigo-300/80 transition-all active:translate-y-[2px] active:border-b-[1px] active:shadow-xs cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-1.5" />
              สร้างรายการใหม่
            </button>
            
            {/* Notification Button */}
            <NotificationBellBtn 
              onClick={() => onOpenSettings()}
              className="hidden md:flex"
            />
          </div>
        </div>

        {/* Overview Statistics Cards */}
        {channels.length > 0 && (
          <ChannelStatsCards
            groupsCount={groups.length}
            categorizedCount={sectionData.categorizedCount}
            channelsCount={channels.length}
            totalContents={totalContentsCount}
            totalReach={grandTotalFollowers}
            isRefreshingCounts={isRefreshingCounts}
            onRefreshCounts={() => fetchDirectContentCounts(true)}
            onManageGroups={() => setIsGroupModalOpen(true)}
          />
        )}

        {/* Section Filter Tabs */}
        <ChannelFilterTabs
          groups={groups}
          channelsCount={channels.length}
          selectedFilter={selectedGroupFilter}
          onSelectFilter={setSelectedGroupFilter}
          sectionData={sectionData}
          onOpenManageModal={() => setIsGroupModalOpen(true)}
        />

        {/* Section Channels Grid and Group Sections */}
        <ChannelSectionList
          channels={enrichedChannels}
          groups={groups}
          selectedGroupFilter={selectedGroupFilter}
          sectionData={sectionData}
          contentCountMap={contentCountMap}
          onEditChannel={handleEditChannel}
          onDeleteChannel={handleDeleteChannel}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
        />

        {/* Extracted Channel Form Modal */}
        <ChannelFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          channel={editingChannel}
          onSave={handleSaveChannel}
        />

        {/* Extracted Channel Group Management Modal */}
        <ChannelGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          channels={enrichedChannels}
          groups={groups}
          onCreateGroup={createGroup}
          onUpdateGroup={updateGroup}
          onDeleteGroup={deleteGroup}
          onAssignChannel={assignChannelToGroup}
        />
      </div>
    </SocialChannelBackground>
  );
};

export default ChannelManager;
