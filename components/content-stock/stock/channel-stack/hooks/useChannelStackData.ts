import { useMemo, useState, useEffect } from 'react';
import { Channel } from '../../../../../types';
import { ChannelItem, GroupCabinet } from '../types';
import { compareChannelsByStatus } from '../utils/channelStackUtils';

interface UseChannelStackDataProps {
  channels: Channel[];
  selectedChannelIds: string[];
  onSelectChannels: React.Dispatch<React.SetStateAction<string[]>>;
  unassignedCount?: number;
}

export const useChannelStackData = ({
  channels,
  selectedChannelIds,
  onSelectChannels,
  unassignedCount,
}: UseChannelStackDataProps) => {
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);

  // 1. Process individual channels with mechanical labels and serials
  const channelItems: ChannelItem[] = useMemo(() => {
    return channels.map((ch, idx) => {
      const prefixes = ['CAB', 'DRW', 'RACK', 'IDX'];
      const pfx = prefixes[idx % prefixes.length];
      const num = String(idx + 1).padStart(2, '0');
      return {
        id: ch.id,
        name: ch.name,
        isAll: false,
        isUnassigned: false,
        color: ch.color || 'bg-slate-400',
        serial: `${pfx}-${num}`,
        logoUrl: ch.logoUrl,
        status: ch.status || 'ACTIVE',
        groupId: ch.group_id || null,
        groupName: ch.group_name || null,
        originalIndex: idx,
      };
    });
  }, [channels]);

  // 2. Lead items: ALL and optional NO_CHANNEL
  const leadItems = useMemo<ChannelItem[]>(() => {
    const list: ChannelItem[] = [
      { 
        id: 'ALL', 
        name: 'รวมทุกช่องทาง', 
        isAll: true, 
        isUnassigned: false, 
        color: 'bg-indigo-500', 
        serial: 'DRW-ALL', 
        logoUrl: undefined, 
        status: 'ACTIVE',
        originalIndex: -2,
      }
    ];

    const isUnassignedSelected = selectedChannelIds.includes('NO_CHANNEL');
    if ((unassignedCount !== undefined && unassignedCount > 0) || isUnassignedSelected) {
      list.push({
        id: 'NO_CHANNEL',
        name: 'ไม่มีช่องทาง',
        isAll: false,
        isUnassigned: true,
        color: 'bg-amber-500',
        serial: 'DRW-NONE',
        logoUrl: undefined,
        status: 'ACTIVE',
        originalIndex: -1,
      });
    }

    return list;
  }, [selectedChannelIds, unassignedCount]);

  // 3. Flat list: Lead items + all channels sorted by status lifecycle (ACTIVE -> PLANNING -> PAUSED -> ARCHIVED)
  const flatItems = useMemo<ChannelItem[]>(() => {
    const sortedChannels = [...channelItems].sort(compareChannelsByStatus);
    return [...leadItems, ...sortedChannels];
  }, [leadItems, channelItems]);

  // 4. Grouped cabinets calculation with internal channel sorting
  const groupCabinets = useMemo<GroupCabinet[]>(() => {
    const groupsMap = new Map<string, { name: string; color: string; channels: ChannelItem[] }>();
    const ungroupedList: ChannelItem[] = [];

    channelItems.forEach(item => {
      if (item.groupId || item.groupName) {
        const gId = item.groupId || item.groupName || 'unknown';
        const gName = item.groupName || 'กลุ่มช่อง';
        if (!groupsMap.has(gId)) {
          groupsMap.set(gId, {
            name: gName,
            color: item.color,
            channels: []
          });
        }
        groupsMap.get(gId)!.channels.push(item);
      } else {
        ungroupedList.push(item);
      }
    });

    const list: GroupCabinet[] = [];
    groupsMap.forEach((grp, id) => {
      const sortedGroupChannels = [...grp.channels].sort(compareChannelsByStatus);
      const selectedCount = sortedGroupChannels.filter(c => selectedChannelIds.includes(c.id)).length;
      list.push({
        id,
        name: grp.name,
        color: grp.color,
        channels: sortedGroupChannels,
        hasPlanning: sortedGroupChannels.some(c => c.status === 'PLANNING'),
        hasPaused: sortedGroupChannels.some(c => c.status === 'PAUSED'),
        hasArchived: sortedGroupChannels.some(c => c.status === 'ARCHIVED'),
        hasActive: sortedGroupChannels.some(c => c.status === 'ACTIVE'),
        selectedCount,
        totalCount: sortedGroupChannels.length,
      });
    });

    if (ungroupedList.length > 0) {
      const sortedUngrouped = [...ungroupedList].sort(compareChannelsByStatus);
      const selectedCount = sortedUngrouped.filter(c => selectedChannelIds.includes(c.id)).length;
      list.push({
        id: 'ungrouped',
        name: 'ช่องอิสระ',
        color: 'bg-slate-400',
        channels: sortedUngrouped,
        hasPlanning: sortedUngrouped.some(c => c.status === 'PLANNING'),
        hasPaused: sortedUngrouped.some(c => c.status === 'PAUSED'),
        hasArchived: sortedUngrouped.some(c => c.status === 'ARCHIVED'),
        hasActive: sortedUngrouped.some(c => c.status === 'ACTIVE'),
        selectedCount,
        totalCount: sortedUngrouped.length,
      });
    }

    return list;
  }, [channelItems, selectedChannelIds]);

  // 5. Auto-expand groups containing selected channels so user sees their active selection
  useEffect(() => {
    if (selectedChannelIds.length > 0) {
      const activeGroupIds = groupCabinets
        .filter(g => g.channels.some(c => selectedChannelIds.includes(c.id)))
        .map(g => g.id);
      if (activeGroupIds.length > 0) {
        setExpandedGroupIds(prev => Array.from(new Set([...prev, ...activeGroupIds])));
      }
    }
  }, [selectedChannelIds, groupCabinets]);

  // Total active filter count
  const activeCount = selectedChannelIds.length;

  const handleToggleChannel = (id: string) => {
    if (id === 'ALL') {
      onSelectChannels([]);
    } else {
      onSelectChannels(prev => {
        if (prev.includes(id)) {
          return prev.filter(item => item !== id);
        } else {
          return [...prev, id];
        }
      });
    }
  };

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroupIds(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleToggleSelectGroup = (group: GroupCabinet, e: React.MouseEvent) => {
    e.stopPropagation();
    const groupChannelIds = group.channels.map(c => c.id);
    const allSelected = groupChannelIds.length > 0 && groupChannelIds.every(id => selectedChannelIds.includes(id));

    if (allSelected) {
      onSelectChannels(prev => prev.filter(id => !groupChannelIds.includes(id)));
    } else {
      onSelectChannels(prev => {
        const set = new Set([...prev, ...groupChannelIds]);
        return Array.from(set);
      });
      if (!expandedGroupIds.includes(group.id)) {
        setExpandedGroupIds(prev => [...prev, group.id]);
      }
    }
  };

  return {
    channelItems,
    leadItems,
    flatItems,
    groupCabinets,
    activeCount,
    expandedGroupIds,
    setExpandedGroupIds,
    toggleGroupExpand,
    handleToggleSelectGroup,
    handleToggleChannel,
  };
};
