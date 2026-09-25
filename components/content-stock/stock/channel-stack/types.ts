import { Channel } from '../../../../types';

export type StockDisplayMode = 'classic' | 'logo';
export type StockGroupingMode = 'grouped' | 'flat';

export interface StockChannelStackProps {
  channels: Channel[];
  selectedChannelIds: string[];
  onSelectChannels: React.Dispatch<React.SetStateAction<string[]>>;
  unassignedCount?: number;
  isExpanded?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface ChannelItem {
  id: string;
  name: string;
  isAll: boolean;
  isUnassigned: boolean;
  color: string;
  serial: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'PLANNING' | 'PAUSED' | 'ARCHIVED';
  groupId?: string | null;
  groupName?: string | null;
  originalIndex: number;
}

export interface GroupCabinet {
  id: string;
  name: string;
  color: string;
  channels: ChannelItem[];
  hasPlanning: boolean;
  hasPaused: boolean;
  hasArchived: boolean;
  hasActive: boolean;
  selectedCount: number;
  totalCount: number;
}

// Status lifecycle sorting priority: ACTIVE (1) -> PLANNING (2) -> PAUSED (3) -> ARCHIVED (4)
export const STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 1,
  PLANNING: 2,
  PAUSED: 3,
  ARCHIVED: 4,
};

export const springTransition = { type: 'spring', stiffness: 380, damping: 30 } as const;
