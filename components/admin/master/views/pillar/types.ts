import { MasterOption, Channel, ChannelGroup, Platform } from '../../../../../types';

export type ViewModeType = 'grouped' | 'matrix';
export type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';
export type ScopeFilterType = 'ALL' | 'HAS_DATA' | 'EMPTY' | 'GLOBAL_ONLY';

export interface PillarFormData {
    id?: string;
    label: string;
    key: string;
    channelId: string;
    description: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
}

export interface CategoryFormData {
    id?: string;
    label: string;
    key: string;
    pillarKey: string;
    description: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
}

export interface MatrixRow {
    id: string;
    pillar: MasterOption;
    channel: Channel | null;
    categories: MasterOption[];
}

export interface PillarStats {
    totalPillars: number;
    totalCategories: number;
    activePillars: number;
    activeCategories: number;
    channelsWithPillars: number;
    totalChannels: number;
    globalPillarsCount: number;
}

export type { MasterOption, Channel, ChannelGroup, Platform };
