import { Channel, ChannelGroup, MasterOption, Task } from '../../../../../types';

export interface DrillDownFilterState {
    channelId?: string;
    channelName: string;
    groupName?: string;
    formatKey?: string;
    formatLabel: string;
    statusKey?: string;
    statusLabel: string;
}

export interface GroupSectionData {
    groupId: string;
    groupName: string;
    groupColor?: string;
    groupDescription?: string;
    channels: Channel[];
    totalClips: number;
    isUngrouped?: boolean;
}

export interface ChannelMatrixProps {
    tasks: Task[];
    allActiveTasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    selectedChannel: string;
    scopeMode: 'STOCK_ONLY' | 'ALL_UNPUBLISHED';
    onScopeChange: (scope: 'STOCK_ONLY' | 'ALL_UNPUBLISHED') => void;
    onEditTask?: (task: Task) => void;
}

export interface FormatSummaryItem {
    formatKey: string;
    formatLabel: string;
    color?: string;
    count: number;
}

export interface StatusSummaryItem {
    statusKey: string;
    statusLabel: string;
    color?: string;
    count: number;
}
