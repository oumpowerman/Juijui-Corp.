import { 
  FullSyncSummary, 
  FollowerSyncProgressEvent, 
  SyncChannelQueueItem, 
  SyncLogEntry 
} from '../../components/admin/master/views/follower-sync/types.js';

export interface SyncSession {
  id: string;
  state: 'syncing' | 'completed' | 'error';
  percentage: number;
  currentIndex: number;
  totalChannels: number;
  currentChannelName: string;
  currentPlatform: string;
  statusMessage: string;
  queue: SyncChannelQueueItem[];
  logs: SyncLogEntry[];
  summary: FullSyncSummary | null;
  errorMessage: string | null;
  startedAt: number;
  updatedAt: number;
}

// In-memory store of active and recent sync sessions
const sessions = new Map<string, SyncSession>();

// Cleanup sessions older than 30 minutes
const cleanupOldSessions = () => {
  const now = Date.now();
  const maxAgeMs = 30 * 60 * 1000;
  for (const [id, session] of sessions.entries()) {
    if (now - session.startedAt > maxAgeMs) {
      sessions.delete(id);
    }
  }
};

export const createSyncSession = (): SyncSession => {
  cleanupOldSessions();
  const id = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  const newSession: SyncSession = {
    id,
    state: 'syncing',
    percentage: 0,
    currentIndex: 0,
    totalChannels: 0,
    currentChannelName: '',
    currentPlatform: '',
    statusMessage: 'กำลังเริ่มต้นเชื่อมต่อและตรวจสอบช่อง...',
    queue: [],
    logs: [
      {
        id: `${now}-0`,
        timestamp: new Date().toISOString(),
        timeStr: new Date().toLocaleTimeString('th-TH', { hour12: false }),
        message: 'เริ่มต้นกระบวนการซิงค์ข้อมูลผู้ติดตาม...',
        type: 'start',
      }
    ],
    summary: null,
    errorMessage: null,
    startedAt: now,
    updatedAt: now,
  };

  sessions.set(id, newSession);
  return newSession;
};

export const getSyncSession = (id: string): SyncSession | null => {
  return sessions.get(id) || null;
};

export const updateSyncSession = (id: string, updates: Partial<SyncSession>): SyncSession | null => {
  const session = sessions.get(id);
  if (!session) return null;

  Object.assign(session, updates, { updatedAt: Date.now() });
  return session;
};

export const handleSessionProgressEvent = (sessionId: string, event: FollowerSyncProgressEvent) => {
  const session = sessions.get(sessionId);
  if (!session) return;

  const now = Date.now();
  session.updatedAt = now;

  if (event.percentage !== undefined) {
    session.percentage = event.percentage;
  }
  if (event.currentIndex !== undefined) {
    session.currentIndex = event.currentIndex;
  }
  if (event.totalChannels !== undefined && event.totalChannels > 0) {
    session.totalChannels = event.totalChannels;
  }
  if (event.channelName) {
    session.currentChannelName = event.channelName;
  }
  if (event.platform) {
    session.currentPlatform = event.platform;
  }
  if (event.message) {
    session.statusMessage = event.message;
  }

  // Create formatted log entry
  const timeStr = new Date(event.timestamp || now).toLocaleTimeString('th-TH', { hour12: false });
  let logType: SyncLogEntry['type'] = 'info';
  if (event.type === 'init') logType = 'start';
  else if (event.type === 'channel_done' || event.type === 'finish') logType = 'success';
  else if (event.type === 'error') logType = 'error';

  session.logs.push({
    id: `${now}-${Math.random()}`,
    timestamp: event.timestamp || new Date().toISOString(),
    timeStr,
    message: event.message,
    type: logType,
    channelName: event.channelName,
    platform: event.platform,
  });

  // Limit in-memory log buffer to last 60 entries
  if (session.logs.length > 60) {
    session.logs = session.logs.slice(-60);
  }

  // Manage Queue status transitions
  if (event.type === 'init' && event.channelsList) {
    session.queue = event.channelsList.map((ch, idx) => ({
      id: ch.id,
      name: ch.name,
      logoUrl: ch.logoUrl,
      status: idx === 0 ? 'processing' : 'pending',
    }));
  } else if (event.type === 'channel_start' && event.channelId) {
    session.queue = session.queue.map(q => {
      if (q.id === event.channelId) {
        return { ...q, status: 'processing' };
      }
      return q;
    });
  } else if (event.type === 'channel_done' && event.channelId) {
    session.queue = session.queue.map(q => {
      if (q.id === event.channelId) {
        return {
          ...q,
          status: 'completed',
          totalFollowers: event.channelResult?.totalFollowers,
          updated: event.channelResult?.updated,
        };
      }
      return q;
    });
  } else if (event.type === 'finish') {
    session.state = 'completed';
    session.percentage = 100;
    session.summary = event.summary || null;
    session.statusMessage = 'ซิงค์ยอดผู้ติดตามครบทุกช่องเรียบร้อยแล้ว';
  } else if (event.type === 'error') {
    session.state = 'error';
    session.errorMessage = event.message || 'เกิดข้อผิดพลาดระหว่างการดึงข้อมูล';
  }
};
