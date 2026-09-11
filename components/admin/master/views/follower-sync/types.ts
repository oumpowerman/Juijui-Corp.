export interface FollowerSyncPlatformSettings {
    YOUTUBE: boolean;
    FACEBOOK: boolean;
    TIKTOK: boolean;
    INSTAGRAM: boolean;
}

export interface FollowerSyncConfig {
    isEnabled: boolean;
    syncTime: string; // e.g. "08:00"
    platforms: FollowerSyncPlatformSettings;
    enabledChannelIds: string[]; // List of specific channel IDs to sync (empty array or undefined means all)
    rateLimitDelayMs: number; // e.g. 1200
}

export type FollowerSyncSubTab = 'schedule' | 'channels' | 'platforms' | 'bandwidth';

export interface SyncPlatformResult {
    platform: string;
    url: string;
    previousCount?: number;
    newCount?: number;
    success: boolean;
    skipped?: boolean;
    error?: string;
}

export interface ChannelSyncResult {
    channelId: string;
    channelName: string;
    platforms: SyncPlatformResult[];
    totalFollowers: number;
    updated: boolean;
    error?: string;
}

export interface FullSyncSummary {
    timestamp: string;
    triggeredBy: 'cron' | 'api' | 'manual';
    totalChannelsChecked: number;
    totalChannelsUpdated: number;
    results: ChannelSyncResult[];
    durationMs: number;
}

export interface FollowerSyncProgressEvent {
    type: 'init' | 'channel_start' | 'platform_done' | 'channel_done' | 'finish' | 'error';
    currentIndex?: number;
    totalChannels?: number;
    percentage?: number;
    channelId?: string;
    channelName?: string;
    brandName?: string;
    platform?: string;
    message: string;
    timestamp?: string;
    channelResult?: ChannelSyncResult;
    summary?: FullSyncSummary;
    channelsList?: Array<{ id: string; name: string; brandName?: string; logoUrl?: string }>;
}

export interface SyncChannelQueueItem {
    id: string;
    name: string;
    brandName?: string;
    logoUrl?: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    activePlatform?: string;
    totalFollowers?: number;
    updated?: boolean;
    error?: string;
}

export interface SyncLogEntry {
    id: string;
    timestamp: string;
    timeStr: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'start';
    channelName?: string;
    platform?: string;
}

export const DEFAULT_FOLLOWER_SYNC_CONFIG: FollowerSyncConfig = {
    isEnabled: true,
    syncTime: '08:00',
    platforms: {
        YOUTUBE: true,
        FACEBOOK: true,
        TIKTOK: false,
        INSTAGRAM: true,
    },
    enabledChannelIds: [], // Empty means all channels by default until customized
    rateLimitDelayMs: 1200,
};
