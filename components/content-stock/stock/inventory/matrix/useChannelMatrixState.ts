import { useState, useCallback, useMemo } from 'react';
import { Channel, ChannelGroup, MasterOption, Task } from '../../../../../types';
import { DrillDownFilterState, GroupSectionData } from './types';
import { isStockTerminalStatus } from '../../../../../config/status';

interface UseChannelMatrixStateProps {
    channels: Channel[];
    tasks: Task[];
    allActiveTasks: Task[];
    groups: ChannelGroup[];
    selectedChannel: string;
    masterOptions: MasterOption[];
}

export const useChannelMatrixState = ({
    channels,
    tasks,
    allActiveTasks,
    groups,
    selectedChannel,
    masterOptions
}: UseChannelMatrixStateProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
    
    // Default Collapsed by default: expandedChannelIds starts empty!
    const [expandedChannelIds, setExpandedChannelIds] = useState<Set<string>>(new Set());
    
    // Group collapsed state (default all groups open)
    const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set());

    // Drilldown modal state
    const [drillDown, setDrillDown] = useState<DrillDownFilterState | null>(null);
    const [drillSearchQuery, setDrillSearchQuery] = useState('');

    // Dynamic Formats from Master Data (Zero hardcoding)
    const activeFormats = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'FORMAT' && o.isActive)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [masterOptions]);

    // Dynamic Workflow Statuses from Master Data (excluding Terminal statuses)
    const activeStatuses = useMemo(() => {
        return masterOptions
            .filter(o => o.type === 'STATUS' && o.isActive && !isStockTerminalStatus(o.key))
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [masterOptions]);

    // Filter channels based on selectedChannel prop & user search query
    const filteredChannels = useMemo(() => {
        let list = channels;
        if (selectedChannel !== 'ALL') {
            list = list.filter(c => c.id === selectedChannel);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim().replace(/^#/, '');
            list = list.filter(c => {
                const matchName = c.name?.toLowerCase().includes(q);
                const matchCode = c.code?.toLowerCase().includes(q);
                const matchDesc = c.description?.toLowerCase().includes(q);
                return matchName || matchCode || matchDesc;
            });
        }

        return list;
    }, [channels, selectedChannel, searchQuery]);

    // Grouping channels into GroupSectionData
    const groupSections = useMemo((): GroupSectionData[] => {
        const sections: GroupSectionData[] = [];
        const groupMap: Record<string, Channel[]> = {};
        const ungroupedChannels: Channel[] = [];

        // Initialize map for all existing groups
        groups.forEach(g => {
            groupMap[g.id] = [];
        });

        // Distribute channels
        filteredChannels.forEach(ch => {
            if (ch.group_id && groupMap[ch.group_id]) {
                groupMap[ch.group_id].push(ch);
            } else {
                ungroupedChannels.push(ch);
            }
        });

        // Build sections for defined groups
        groups.forEach(g => {
            const grpChannels = groupMap[g.id] || [];
            // Apply selectedGroupFilter
            if (selectedGroupFilter !== 'ALL' && selectedGroupFilter !== g.id) {
                return;
            }

            const totalClips = grpChannels.reduce((sum, ch) => {
                return sum + tasks.filter(t => t.channelId === ch.id).length;
            }, 0);

            sections.push({
                groupId: g.id,
                groupName: g.name,
                groupColor: g.color,
                groupDescription: g.description,
                channels: grpChannels,
                totalClips,
                isUngrouped: false
            });
        });

        // Build section for Ungrouped channels (if applicable)
        if (ungroupedChannels.length > 0 && (selectedGroupFilter === 'ALL' || selectedGroupFilter === 'UNGROUPED')) {
            const totalClips = ungroupedChannels.reduce((sum, ch) => {
                return sum + tasks.filter(t => t.channelId === ch.id).length;
            }, 0);

            sections.push({
                groupId: 'UNGROUPED',
                groupName: 'ช่องทางทั่วไป (ยังไม่จัดกลุ่ม)',
                groupColor: 'bg-slate-100 text-slate-700 border-slate-200',
                groupDescription: 'ช่องทางและแบรนด์ที่ยังไม่ได้ระบุหมวดหมู่กลุ่ม',
                channels: ungroupedChannels,
                totalClips,
                isUngrouped: true
            });
        }

        return sections;
    }, [groups, filteredChannels, selectedGroupFilter, tasks]);

    // Channel accordion actions
    const toggleChannelExpanded = useCallback((channelId: string) => {
        setExpandedChannelIds(prev => {
            const next = new Set(prev);
            if (next.has(channelId)) {
                next.delete(channelId);
            } else {
                next.add(channelId);
            }
            return next;
        });
    }, []);

    const expandAllChannels = useCallback(() => {
        const allIds = new Set(filteredChannels.map(c => c.id));
        setExpandedChannelIds(allIds);
    }, [filteredChannels]);

    const collapseAllChannels = useCallback(() => {
        setExpandedChannelIds(new Set());
    }, []);

    // Group accordion actions
    const toggleGroupCollapsed = useCallback((groupId: string) => {
        setCollapsedGroupIds(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    }, []);

    // Quick Scope Counters
    const stockCount = useMemo(() => allActiveTasks.filter(t => t.isUnscheduled).length, [allActiveTasks]);
    const allCount = allActiveTasks.length;

    // Drilldown matching tasks
    const drillDownTasks = useMemo(() => {
        if (!drillDown) return [];

        return tasks.filter(task => {
            // Channel Match
            if (drillDown.channelId) {
                if (drillDown.channelId === '__UNASSIGNED__') {
                    if (task.channelId && channels.some(c => c.id === task.channelId)) return false;
                } else if (task.channelId !== drillDown.channelId) {
                    return false;
                }
            }

            // Format Match
            if (drillDown.formatKey) {
                if (drillDown.formatKey === '__OTHER__') {
                    const taskFormats = task.contentFormats || [];
                    const hasRecognized = taskFormats.some(f => activeFormats.some(af => af.key === f));
                    if (hasRecognized) return false;
                } else {
                    const formats = task.contentFormats || [];
                    if (!formats.includes(drillDown.formatKey)) return false;
                }
            }

            // Status Match
            if (drillDown.statusKey) {
                if (task.status !== drillDown.statusKey) return false;
            }

            // In-modal search query
            if (drillSearchQuery.trim()) {
                const q = drillSearchQuery.toLowerCase().trim();
                return task.title?.toLowerCase().includes(q) || false;
            }

            return true;
        });
    }, [tasks, drillDown, drillSearchQuery, channels, activeFormats]);

    return {
        searchQuery,
        setSearchQuery,
        selectedGroupFilter,
        setSelectedGroupFilter,
        expandedChannelIds,
        toggleChannelExpanded,
        expandAllChannels,
        collapseAllChannels,
        collapsedGroupIds,
        toggleGroupCollapsed,
        groupSections,
        filteredChannels,
        activeFormats,
        activeStatuses,
        stockCount,
        allCount,
        drillDown,
        setDrillDown,
        drillSearchQuery,
        setDrillSearchQuery,
        drillDownTasks,
    };
};
