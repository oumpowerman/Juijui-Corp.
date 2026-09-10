import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { Channel, Task } from '../types';
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
  const { showConfirm } = useGlobalDialog();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

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
          setContentCountMap(json.counts || {});
          setTotalContentsCount(json.total || 0);
          return;
        }
      }
    } catch {
      // Server endpoint unavailable fallback
    }

    try {
      // 2. Resilient Fallback: Direct PostgreSQL HEAD requests
      const totalPromise = supabase
        .from('contents')
        .select('*', { count: 'exact', head: true });

      const channelPromises = channels.map(async (ch) => {
        const { count, error } = await supabase
          .from('contents')
          .select('*', { count: 'exact', head: true })
          .eq('channel_id', ch.id);
        return { id: ch.id, count: error ? 0 : (count || 0) };
      });

      const [totalResult, channelResults] = await Promise.all([
        totalPromise,
        Promise.all(channelPromises)
      ]);

      const map: Record<string, number> = {};
      channelResults.forEach(r => {
        map[r.id] = r.count;
      });

      setContentCountMap(map);
      setTotalContentsCount(totalResult.count || 0);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-500 pb-20">
      <MentorTip moduleId="CHANNEL" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
               จัดการช่องรายการ (Brands & Shows)
            </h1>
            {groups.length > 0 && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-b from-indigo-50 to-indigo-100/70 border border-indigo-200/80 border-b-[2px] border-b-indigo-300/70 text-indigo-700 shadow-2xs">
                {groups.length} ส่วน (Sections)
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
             สร้างและแบ่งกลุ่ม "รายการ" หรือ "แบรนด์" เพื่อติดตามยอดผู้ติดตามรวมและสถิติรายหมวดหมู่
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
            {/* Manage Channel Groups Button */}
            <button
              type="button"
              onClick={() => setIsGroupModalOpen(true)}
              className="flex items-center px-4 py-2.5 bg-gradient-to-b from-white to-slate-50 hover:to-slate-100 text-slate-700 font-bold text-sm rounded-xl border border-slate-200/90 border-b-[3px] border-b-slate-300/90 shadow-2xs hover:shadow-xs transition-all active:translate-y-[2px] active:border-b-[1px] cursor-pointer"
            >
              <FolderKanban className="w-4 h-4 mr-2 text-indigo-600" />
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
  );
};

export default ChannelManager;
