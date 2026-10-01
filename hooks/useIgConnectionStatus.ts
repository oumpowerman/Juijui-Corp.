import { useState, useEffect, useCallback } from 'react';
import { Channel } from '../types';

export type ChannelIgStatusType = 'CONNECTED' | 'NOT_FOUND_IN_TOKEN' | 'NO_IG_LINK';

export interface ChannelIgStatusItem {
  channelId: string;
  channelName: string;
  logoUrl?: string;
  color?: string;
  groupName?: string;
  status: ChannelIgStatusType;
  igUrl: string;
  igUsername: string;
  matchedType?: 'channel_override' | 'token_pool';
  matchedAccount?: {
    id: string;
    username: string;
    name?: string;
    followersCount?: number;
    pageName?: string;
    tokenLabel?: string;
  };
  matchedTokenLabel?: string;
  message: string;
  isMetaConnected: boolean;
}

export interface IgConnectionSummary {
  totalChannels: number;
  connectedCount: number;
  notFoundCount: number;
  noLinkCount: number;
  activeTokensCount: number;
  discoveredAccountsCount: number;
}

interface IgConnectionState {
  channels: ChannelIgStatusItem[];
  statusMap: Record<string, ChannelIgStatusItem>;
  summary: IgConnectionSummary;
  timestamp: string | null;
  loading: boolean;
  error: string | null;
}

// Module-level shared cache so multiple ChannelCards do not fire multiple network requests
let sharedState: IgConnectionState = {
  channels: [],
  statusMap: {},
  summary: {
    totalChannels: 0,
    connectedCount: 0,
    notFoundCount: 0,
    noLinkCount: 0,
    activeTokensCount: 0,
    discoveredAccountsCount: 0,
  },
  timestamp: null,
  loading: false,
  error: null,
};

const listeners = new Set<(state: IgConnectionState) => void>();

function notifyListeners() {
  listeners.forEach(fn => fn(sharedState));
}

let fetchPromise: Promise<void> | null = null;

async function fetchIgConnections(force = false) {
  if (fetchPromise && !force) return fetchPromise;

  sharedState = { ...sharedState, loading: true, error: null };
  notifyListeners();

  fetchPromise = (async () => {
    try {
      const url = force ? '/api/follower-sync/ig-connections?force=1' : '/api/follower-sync/ig-connections';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.channels)) {
        const statusMap: Record<string, ChannelIgStatusItem> = {};
        data.channels.forEach((item: ChannelIgStatusItem) => {
          statusMap[item.channelId] = item;
        });

        sharedState = {
          channels: data.channels,
          statusMap,
          summary: data.summary || sharedState.summary,
          timestamp: data.timestamp || new Date().toISOString(),
          loading: false,
          error: null,
        };
      } else {
        sharedState = {
          ...sharedState,
          loading: false,
          error: data.error || 'Failed to fetch IG connection status',
        };
      }
    } catch (err: any) {
      sharedState = {
        ...sharedState,
        loading: false,
        error: err?.message || 'Network error fetching IG connection status',
      };
    } finally {
      fetchPromise = null;
      notifyListeners();
    }
  })();

  return fetchPromise;
}

export function useIgConnectionStatus() {
  const [state, setState] = useState<IgConnectionState>(sharedState);

  useEffect(() => {
    listeners.add(setState);

    // Initial fetch if cache is empty
    if (!sharedState.timestamp && !sharedState.loading) {
      fetchIgConnections();
    }

    return () => {
      listeners.delete(setState);
    };
  }, []);

  const refresh = useCallback((force = true) => {
    return fetchIgConnections(force);
  }, []);

  /**
   * Fast synchronous check if a channel is Meta connected
   */
  const isChannelIgConnected = useCallback((channel?: Channel | null): boolean => {
    if (!channel) return false;
    // 1. Direct channel-specific token
    if (channel.meta_api?.enabled !== false && channel.meta_api?.accessToken?.trim()) {
      return true;
    }
    // 2. Check matched status in server cache
    const item = state.statusMap[channel.id];
    if (item) {
      return item.isMetaConnected;
    }
    return false;
  }, [state.statusMap]);

  /**
   * Get rich IG connection status item for a channel
   */
  const getChannelIgStatus = useCallback((channel?: Channel | null): ChannelIgStatusItem | null => {
    if (!channel) return null;
    return state.statusMap[channel.id] || null;
  }, [state.statusMap]);

  return {
    ...state,
    refresh,
    isChannelIgConnected,
    getChannelIgStatus,
  };
}
