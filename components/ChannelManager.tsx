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
  SingleChannelSyncResultModal,
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
          email: c.email || '',
          last_sync_followers_at: c.last_sync_followers_at || c.followers?._last_synced_at || null,
          meta_api: c.meta_api || c.social_links?._meta_api || undefined,
        })));
      }
    } catch (err) {
      console.warn('[ChannelManager] Refetch channels failed:', err);
    }
  }, []);

  const updateChannelLocally = useCallback((channelId: string, updates: Partial<Channel>) => {
    setLocalChannels(prev => prev.map(c => (c.id === channelId ? { ...c, ...updates } : c)));
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
    syncingChannelIdMap,
    singleSyncResult,
    isSingleSyncModalOpen,
    closeSingleSyncModal,
    handleSyncFollowersNow,
    handleSyncSingleChannel,
    lastGlobalSyncInfo,
  } = useFollowerSync({
    channels: localChannels,
    refetchChannelsFromDb,
    updateChannelLocally,
    showToast,
  });

  // Latest follower sync timestamp among all channels (used as fallback for stats card)
  const latestChannelSyncAt = useMemo(() => {
    let latest: string | null = null;
    for (const c of localChannels) {
      const ts = c.last_sync_followers_at || (c.followers as any)?._last_synced_at;
      if (ts) {
        if (!latest || new Date(ts).getTime() > new Date(latest).getTime()) {
          latest = ts;
        }
      }
    }
    return latest;
  }, [localChannels]);

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

  // Operational and Monetization Stats Calculations
  const monetizedChannelsCount = useMemo(() => {
    return enrichedChannels.filter(ch => ch.monetization?.is_monetized).length;
  }, [enrichedChannels]);

  const activeChannelsCount = useMemo(() => {
    return enrichedChannels.filter(ch => (ch.status || 'ACTIVE') === 'ACTIVE').length;
  }, [enrichedChannels]);

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

  // Open Edit Channel from SingleChannelSyncResultModal
  const handleOpenEditChannelFromModal = useCallback((channelId: string) => {
    const ch = enrichedChannels.find(c => c.id === channelId) || localChannels.find(c => c.id === channelId);
    if (ch) {
      handleEditChannel(ch);
    }
  }, [enrichedChannels, localChannels]);

  // Quick manual update of platform followers from SingleChannelSyncResultModal
  const handleQuickUpdateFollowerCount = useCallback(async (channelId: string, platform: string, count: number) => {
    try {
      const targetChannel = localChannels.find(c => c.id === channelId);
      if (!targetChannel) return;

      const normKey = platform.toLowerCase();
      const updatedFollowers = {
        ...(targetChannel.followers || {}),
        [normKey]: count,
        _last_synced_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('channels')
        .update({
          followers: updatedFollowers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', channelId);

      if (error) throw error;

      updateChannelLocally(channelId, { followers: updatedFollowers });
      await refetchChannelsFromDb();
      showToast(`บันทึกยอดผู้ติดตาม ${platform} สำเร็จ (${count.toLocaleString()} คน)`, 'success');
    } catch (err: any) {
      console.error('[ChannelManager] Quick update follower failed:', err);
      showToast(`บันทึกยอดไม่สำเร็จ: ${err.message || 'Error'}`, 'error');
      throw err;
    }
  }, [localChannels, updateChannelLocally, refetchChannelsFromDb, showToast]);

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
            activeChannelsCount={activeChannelsCount}
            monetizedChannelsCount={monetizedChannelsCount}
            totalContents={totalContentsCount}
            totalReach={grandTotalFollowers}
            isRefreshingCounts={isRefreshingCounts}
            onRefreshCounts={refetchCounts}
            isSyncingFollowers={isSyncingFollowers}
            onSyncFollowers={handleSyncFollowersNow}
            lastGlobalSyncInfo={lastGlobalSyncInfo}
            latestChannelSyncAt={latestChannelSyncAt}
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
          onSyncFollowers={handleSyncSingleChannel}
          syncingChannelIdMap={syncingChannelIdMap}
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

        {/* 6. Per-Channel Sync Diff Result Modal */}
        <SingleChannelSyncResultModal
          isOpen={isSingleSyncModalOpen}
          result={singleSyncResult}
          onClose={closeSingleSyncModal}
          onOpenEditChannel={handleOpenEditChannelFromModal}
          onUpdateFollowerCount={handleQuickUpdateFollowerCount}
        />
      </div>
    </SocialChannelBackground>
  );
};

export default ChannelManager;