import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Channel, Task, User } from '../types';
import { useToast } from '../context/ToastContext';
import { useChannelGroups } from '../hooks/useChannelGroups';
import { supabase } from '../lib/supabase';
import { 
  SocialChannelBackground, 
  SocialTheme,
  ChannelManagerHeader,
  ChannelStatsCards,
  ChannelGroupFilterBar,
  ChannelSectionList,
  ChannelFormModal,
  ChannelGroupModal,
  DeleteChannelModal,
  FollowerSyncProgressModal,
  useFollowerSync,
  useContentCounts,
  getChannelTotalFollowers, 
  formatFollowersCompact, 
  getGlowStyles 
} from './channel';

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
  onAdd, 
  onEdit, 
  onDelete, 
  onOpenSettings 
}) => {
  const { showToast } = useToast();

  // Local Channels State (for instant UI update on sync/mutate)
  const [localChannels, setLocalChannels] = useState<Channel[]>(channels);
  useEffect(() => {
    setLocalChannels(channels);
  }, [channels]);

  const refetchChannelsFromDb = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setLocalChannels(data.map((c: any) => ({
          ...c,
          platforms: Array.isArray(c.platforms) ? c.platforms : ['OTHER'],
          logoUrl: c.logo_url,
          social_links: c.social_links || {},
          followers: c.followers || {},
          email: c.email || ''
        })));
      }
    } catch (err) {
      console.warn('[ChannelManager] Refetch channels failed:', err);
    }
  }, []);

  // Social Atmosphere Theme State
  const [socialTheme, setSocialTheme] = useState<SocialTheme>(() => {
    const saved = localStorage.getItem('channel_social_theme');
    if (saved === 'creator-vibrant' || saved === 'midnight-studio' || saved === 'pastel-engagement') {
      return saved as SocialTheme;
    }
    return 'creator-vibrant';
  });

  const handleSelectTheme = (newTheme: SocialTheme) => {
    setSocialTheme(newTheme);
    localStorage.setItem('channel_social_theme', newTheme);
  };

  // Ranking Scope Mode ('global' | 'group')
  const [rankingMode, setRankingMode] = useState<'global' | 'group'>(() => {
    const saved = localStorage.getItem('channel_ranking_mode');
    return (saved === 'global' || saved === 'group') ? saved : 'global';
  });

  const handleToggleRankingMode = (mode: 'global' | 'group') => {
    setRankingMode(mode);
    localStorage.setItem('channel_ranking_mode', mode);
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

  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const enrichedChannels = useMemo(() => enrichChannelsWithGroups(localChannels), [localChannels, enrichChannelsWithGroups]);

  // Content Counts Hook
  const { contentCountMap, totalContentsCount, isRefreshingCounts, refetchCounts } = useContentCounts(localChannels);

  // Follower Sync Hook
  const {
    isSyncingFollowers,
    isSyncModalOpen,
    setIsSyncModalOpen,
    syncModalState,
    syncSummaryResult,
    syncErrorMessage,
    syncPercentage,
    syncCurrentIndex,
    syncTotalChannels,
    syncCurrentChannelName,
    syncCurrentPlatform,
    syncStatusMessage,
    syncQueue,
    syncLogs,
    handleSyncFollowersNow,
  } = useFollowerSync({
    channels: localChannels,
    refetchChannelsFromDb,
    showToast,
  });

  // Modal Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

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

    return {
      groupedMap,
      ungrouped,
      categorizedCount: enrichedChannels.filter(c => c.group_id).length,
      hasGroups: groups.length > 0,
    };
  }, [enrichedChannels, groups]);

  const grandTotalFollowers = useMemo(() => {
    return enrichedChannels.reduce((sum, ch) => sum + getChannelTotalFollowers(ch), 0);
  }, [enrichedChannels]);

  // Form Handlers
  const handleCreateChannel = () => {
    setEditingChannel(null);
    setIsFormOpen(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setIsFormOpen(true);
  };

  const handleSaveChannel = async (payload: Channel, logoFile?: File | null) => {
    if (editingChannel) {
      return await onEdit(payload, logoFile || undefined);
    } else {
      return await onAdd(payload, logoFile || undefined);
    }
  };

  // Delete Handlers
  const handleDeleteChannelPrompt = (id: string, name: string) => {
    const target = enrichedChannels.find(c => c.id === id) || { id, name } as Channel;
    setChannelToDelete(target);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (channelId: string, deleteTaskOption: 'unlink' | 'cascade') => {
    try {
      if (deleteTaskOption === 'unlink') {
        await supabase.from('contents').update({ channel_id: null }).eq('channel_id', channelId);
        await supabase.from('tasks').update({ channelId: null }).eq('channelId', channelId);
      } else if (deleteTaskOption === 'cascade') {
        await supabase.from('contents').delete().eq('channel_id', channelId);
        await supabase.from('tasks').delete().eq('channelId', channelId);
      }
      const success = await onDelete(channelId);
      if (success) {
        showToast('ลบช่องรายการเรียบร้อยแล้ว', 'success');
        refetchCounts();
      }
    } catch (err) {
      console.error('[ChannelManager] Delete error:', err);
      showToast('เกิดข้อผิดพลาดในการลบช่องรายการ', 'error');
    }
  };

  return (
    <SocialChannelBackground 
      theme={socialTheme}
      onThemeChange={setSocialTheme}
      className="min-h-screen"
    >
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6 animate-in fade-in duration-500 pb-28">
        {/* 1. Glassmorphic Header & Actions */}
        <ChannelManagerHeader
          groups={groups}
          socialTheme={socialTheme}
          onSelectTheme={handleSelectTheme}
          rankingMode={rankingMode}
          onToggleRankingMode={handleToggleRankingMode}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
          onCreateChannel={handleCreateChannel}
          onOpenSettings={onOpenSettings}
        />

        {/* 2. Overview Statistics Cards */}
        {channels.length > 0 && (
          <ChannelStatsCards
            groupsCount={groups.length}
            categorizedCount={sectionData.categorizedCount}
            channelsCount={channels.length}
            totalContents={totalContentsCount}
            totalReach={grandTotalFollowers}
            isRefreshingCounts={isRefreshingCounts}
            onRefreshCounts={refetchCounts}
            isSyncingFollowers={isSyncingFollowers}
            onSyncFollowers={handleSyncFollowersNow}
            onManageGroups={() => setIsGroupModalOpen(true)}
          />
        )}

        {/* 3. Section Filter Tabs */}
        <ChannelGroupFilterBar
          groups={groups}
          channelsCount={channels.length}
          selectedFilter={selectedGroupFilter}
          onSelectFilter={setSelectedGroupFilter}
          sectionData={sectionData}
          onOpenManageModal={() => setIsGroupModalOpen(true)}
        />

        {/* 4. Section Channels Grid */}
        <ChannelSectionList
          channels={enrichedChannels}
          groups={groups}
          selectedGroupFilter={selectedGroupFilter}
          sectionData={sectionData}
          contentCountMap={contentCountMap}
          rankingMode={rankingMode}
          onEditChannel={handleEditChannel}
          onDeleteChannel={handleDeleteChannelPrompt}
          onOpenGroupModal={() => setIsGroupModalOpen(true)}
        />

        {/* 5. Modals */}
        <ChannelFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          channel={editingChannel}
          onSave={handleSaveChannel}
        />

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

        <DeleteChannelModal
          isOpen={isDeleteModalOpen}
          channel={channelToDelete}
          contentCount={channelToDelete ? contentCountMap[channelToDelete.id] || 0 : 0}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setChannelToDelete(null);
          }}
          onConfirmDelete={handleConfirmDelete}
        />

        <FollowerSyncProgressModal
          isOpen={isSyncModalOpen}
          state={syncModalState}
          summary={syncSummaryResult}
          errorMessage={syncErrorMessage}
          totalReach={grandTotalFollowers}
          percentage={syncPercentage}
          currentIndex={syncCurrentIndex}
          totalChannels={syncTotalChannels}
          currentChannelName={syncCurrentChannelName}
          currentPlatform={syncCurrentPlatform}
          statusMessage={syncStatusMessage}
          queue={syncQueue}
          logs={syncLogs}
          onClose={() => setIsSyncModalOpen(false)}
          onRetry={handleSyncFollowersNow}
        />
      </div>
    </SocialChannelBackground>
  );
};

export default ChannelManager;
