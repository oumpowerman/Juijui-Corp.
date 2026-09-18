import { useState, useEffect } from 'react';
import { Channel } from '../../../types';
import { SyncModalState } from '../sync/FollowerSyncProgressModal';
import { 
  FullSyncSummary, 
  ChannelSyncResult,
  SyncChannelQueueItem, 
  SyncLogEntry,
  FollowerSyncLastRunInfo
} from '../../admin/master/views/follower-sync/types';

interface UseFollowerSyncOptions {
  channels: Channel[];
  refetchChannelsFromDb: () => Promise<void>;
  updateChannelLocally?: (channelId: string, updates: Partial<Channel>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useFollowerSync({
  channels,
  refetchChannelsFromDb,
  updateChannelLocally,
  showToast,
}: UseFollowerSyncOptions) {
  const [isSyncingFollowers, setIsSyncingFollowers] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalState, setSyncModalState] = useState<SyncModalState>('syncing');
  const [syncSummaryResult, setSyncSummaryResult] = useState<FullSyncSummary | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Global follower sync last run metadata (persisted in DB & localStorage)
  const [lastGlobalSyncInfo, setLastGlobalSyncInfo] = useState<FollowerSyncLastRunInfo | null>(() => {
    try {
      const saved = localStorage.getItem('channel_last_global_sync_info');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Fetch last global run info on initial load
  useEffect(() => {
    let isMounted = true;
    const fetchLastRun = async () => {
      try {
        const res = await fetch('/api/cron/follower-sync-last-run');
        if (res.ok) {
          const data = await res.json();
          if (data?.lastRun && isMounted) {
            setLastGlobalSyncInfo(data.lastRun);
            try {
              localStorage.setItem('channel_last_global_sync_info', JSON.stringify(data.lastRun));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('[useFollowerSync] Failed to fetch follower-sync-last-run:', err);
      }
    };
    fetchLastRun();
    return () => {
      isMounted = false;
    };
  }, []);

  // Per-channel sync result modal state
  const [singleSyncResult, setSingleSyncResult] = useState<ChannelSyncResult | null>(null);
  const [isSingleSyncModalOpen, setIsSingleSyncModalOpen] = useState(false);

  const closeSingleSyncModal = () => {
    setIsSingleSyncModalOpen(false);
    setSingleSyncResult(null);
  };

  // Real-time Live Progress States (0-100%, queue, logs, active channel)
  const [syncPercentage, setSyncPercentage] = useState<number>(0);
  const [syncCurrentIndex, setSyncCurrentIndex] = useState<number>(0);
  const [syncTotalChannels, setSyncTotalChannels] = useState<number>(0);
  const [syncCurrentChannelName, setSyncCurrentChannelName] = useState<string>('');
  const [syncCurrentPlatform, setSyncCurrentPlatform] = useState<string>('');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');
  const [syncQueue, setSyncQueue] = useState<SyncChannelQueueItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);

  // Per-channel loading state map
  const [syncingChannelIdMap, setSyncingChannelIdMap] = useState<Record<string, boolean>>({});

  const handleSyncSingleChannel = async (channelId: string, channelName?: string): Promise<boolean> => {
    if (syncingChannelIdMap[channelId]) return false;

    setSyncingChannelIdMap(prev => ({ ...prev, [channelId]: true }));
    const nameToDisplay = channelName || channels.find(c => c.id === channelId)?.name || 'ช่อง';

    showToast(`กำลังอัปเดตยอดผู้ติดตาม "${nameToDisplay}"... ⏳`, 'info');

    try {
      const res = await fetch(`/api/channels/${channelId}/sync-followers`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }

      const result: ChannelSyncResult = data.result;
      const totalFollowers: number = result?.totalFollowers || 0;
      const syncTime = result?.last_sync_followers_at || new Date().toISOString();

      // Immediate in-place state update for instant UI response
      if (updateChannelLocally) {
        updateChannelLocally(channelId, {
          followers: result?.newFollowers || (result?.platforms ? Object.fromEntries(result.platforms.map(p => [p.platform, p.newCount ?? 0])) : undefined),
          last_sync_followers_at: syncTime,
        });
      }

      await refetchChannelsFromDb();

      // Calculate net change
      const totalNetDiff = result?.platforms?.reduce((sum, plat) => {
        if (typeof plat.newCount === 'number' && typeof plat.previousCount === 'number') {
          return sum + (plat.newCount - plat.previousCount);
        }
        return sum;
      }, 0) || 0;

      // Open per-channel detail result modal
      setSingleSyncResult(result);
      setIsSingleSyncModalOpen(true);

      if (result?.updated && totalNetDiff !== 0) {
        const sign = totalNetDiff > 0 ? `+${totalNetDiff.toLocaleString()}` : totalNetDiff.toLocaleString();
        showToast(`✨ อัปเดตยอดผู้ติดตาม "${nameToDisplay}" เรียบร้อย (${sign} รวม ${totalFollowers.toLocaleString()} คน)`, 'success');
      } else {
        showToast(`ตรวจเช็คแล้ว ยอดเป็นปัจจุบัน (${totalFollowers.toLocaleString()} คน)`, 'info');
      }
      return true;
    } catch (err: any) {
      console.error(`[useFollowerSync] Error syncing channel ${channelId}:`, err);
      showToast(`ดึงข้อมูลช่อง "${nameToDisplay}" ล้มเหลว: ${err?.message || 'Error'}`, 'error');
      return false;
    } finally {
      setSyncingChannelIdMap(prev => {
        const next = { ...prev };
        delete next[channelId];
        return next;
      });
    }
  };

  const handleSyncFollowersNow = async () => {
    if (isSyncingFollowers) {
      setIsSyncModalOpen(true);
      return;
    }
    setIsSyncingFollowers(true);
    setIsSyncModalOpen(true);
    setSyncModalState('syncing');
    setSyncErrorMessage(null);
    setSyncPercentage(0);
    setSyncCurrentIndex(0);
    setSyncTotalChannels(channels.length);
    setSyncCurrentChannelName('');
    setSyncCurrentPlatform('');
    setSyncStatusMessage('กำลังเตรียมเชื่อมต่อเซิร์ฟเวอร์...');

    // Initialize initial queue from local channels
    const initialQueue: SyncChannelQueueItem[] = channels.map(c => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      status: 'pending',
    }));
    setSyncQueue(initialQueue);

    const initialLog: SyncLogEntry = {
      id: `${Date.now()}-0`,
      timestamp: new Date().toISOString(),
      timeStr: new Date().toLocaleTimeString('th-TH', { hour12: false }),
      message: `เริ่มกระบวนการตรวจสอบและดึงยอดผู้ติดตาม (${channels.length} ช่อง)...`,
      type: 'start',
    };
    setSyncLogs([initialLog]);

    showToast('กำลังซิงค์ยอดผู้ติดตามแบบ Real-time... ⏳', 'info');

    try {
      // 1. Start background worker job on server and obtain sessionId
      const startRes = await fetch('/api/cron/sync-followers-start?source=manual', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json' 
        },
      });

      const startText = await startRes.text();
      let startData: any = null;
      try {
        startData = startText ? JSON.parse(startText) : null;
      } catch (parseErr) {
        console.warn('[useFollowerSync] Non-JSON start response:', startText);
      }

      // If /sync-followers-start is not found (404), fallback to standard /sync-followers endpoint
      if (startRes.status === 404) {
        console.warn('[useFollowerSync] /api/cron/sync-followers-start returned 404, attempting fallback to /api/cron/sync-followers');
        setSyncStatusMessage('กำลังเชื่อมต่อผ่านช่องทางสำรอง (Direct Sync)...');
        
        const fallbackRes = await fetch('/api/cron/sync-followers?source=manual', {
          method: 'POST',
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
          },
        });

        const fallbackText = await fallbackRes.text();
        let fallbackData: any = null;
        try {
          fallbackData = fallbackText ? JSON.parse(fallbackText) : null;
        } catch {
          // ignore
        }

        if (fallbackRes.ok && fallbackData && fallbackData.success) {
          setSyncPercentage(100);
          setSyncSummaryResult(fallbackData.summary || null);
          setSyncModalState('success');
          await refetchChannelsFromDb();
          const updated = fallbackData.summary?.totalChannelsUpdated || 0;
          const total = fallbackData.summary?.totalChannelsChecked || channels.length;
          showToast(`ซิงค์ยอดผู้ติดตามสำเร็จ (${total} ช่อง / อัปเดต ${updated} ช่อง) 🎉`, 'success');
          return;
        } else {
          throw new Error(
            fallbackRes.status === 404
              ? 'ไม่พบ API Endpoint หลังบ้าน (HTTP 404) — หากกำลังรันบน Localhost กรุณารันด้วยคำสั่ง "npm run dev"'
              : fallbackData?.error || `เซิร์ฟเวอร์ตอบสนองผิดพลาด (HTTP ${fallbackRes.status})`
          );
        }
      }

      if (!startRes.ok || !startData || !startData.success || !startData.sessionId) {
        throw new Error(startData?.error || `เซิร์ฟเวอร์ตอบสนองผิดพลาด (HTTP ${startRes.status})`);
      }

      const sessionId = startData.sessionId;

      // 2. Poll server session status every 450ms
      const pollIntervalMs = 450;
      const maxPollingDurationMs = 180000; // 3 minutes safety timeout
      const startPollingTime = Date.now();

      await new Promise<void>((resolve, reject) => {
        const intervalId = setInterval(async () => {
          if (Date.now() - startPollingTime > maxPollingDurationMs) {
            clearInterval(intervalId);
            reject(new Error('การประมวลผลใช้เวลานานเกินกำหนด (Timeout)'));
            return;
          }

          try {
            const statusRes = await fetch(`/api/cron/sync-status?sessionId=${sessionId}&_t=${Date.now()}`, {
              headers: { 'Accept': 'application/json' }
            });
            if (!statusRes.ok) {
              return;
            }

            const statusText = await statusRes.text();
            let statusData: any = null;
            try {
              statusData = statusText ? JSON.parse(statusText) : null;
            } catch {
              return;
            }

            if (!statusData || !statusData.success || !statusData.session) return;

            const session = statusData.session;

            if (typeof session.percentage === 'number') {
              setSyncPercentage(session.percentage);
            }
            if (typeof session.currentIndex === 'number') {
              setSyncCurrentIndex(session.currentIndex);
            }
            if (typeof session.totalChannels === 'number' && session.totalChannels > 0) {
              setSyncTotalChannels(session.totalChannels);
            }
            if (session.currentChannelName) {
              setSyncCurrentChannelName(session.currentChannelName);
            }
            if (session.currentPlatform) {
              setSyncCurrentPlatform(session.currentPlatform);
            }
            if (session.statusMessage) {
              setSyncStatusMessage(session.statusMessage);
            }
            if (Array.isArray(session.queue) && session.queue.length > 0) {
              setSyncQueue(session.queue);
            }
            if (Array.isArray(session.logs) && session.logs.length > 0) {
              setSyncLogs(session.logs);
            }

            if (session.state === 'completed') {
              clearInterval(intervalId);
              setSyncSummaryResult(session.summary || null);
              setSyncModalState('success');
              await refetchChannelsFromDb();
              const updated = session.summary?.totalChannelsUpdated || 0;
              const total = session.summary?.totalChannelsChecked || session.totalChannels || 0;
              const newRunInfo: FollowerSyncLastRunInfo = {
                last_sync_at: new Date().toISOString(),
                triggered_by: 'manual',
                total_channels: total,
                updated_channels: updated,
                duration_ms: session.summary?.durationMs || 0,
              };
              setLastGlobalSyncInfo(newRunInfo);
              try {
                localStorage.setItem('channel_last_global_sync_info', JSON.stringify(newRunInfo));
              } catch {}

              showToast(`ซิงค์ยอดผู้ติดตามสำเร็จ (${total} ช่อง / อัปเดต ${updated} ช่อง) 🎉`, 'success');
              resolve();
            } else if (session.state === 'error') {
              clearInterval(intervalId);
              setSyncModalState('error');
              setSyncErrorMessage(session.errorMessage || 'เกิดข้อผิดพลาดระหว่างการดึงข้อมูล');
              showToast(`เกิดข้อผิดพลาดในการซิงค์: ${session.errorMessage || 'Error'}`, 'error');
              resolve();
            }
          } catch (pollErr) {
            console.warn('[useFollowerSync] Polling tick error:', pollErr);
          }
        }, pollIntervalMs);
      });
    } catch (err: any) {
      console.error('[useFollowerSync] Follower sync error:', err);
      setSyncModalState('error');
      setSyncErrorMessage(err?.message || 'การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว กรุณาลองใหม่อีกครั้ง');
      showToast(`เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsSyncingFollowers(false);
    }
  };

  return {
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
  };
}
