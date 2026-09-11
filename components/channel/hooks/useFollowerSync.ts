import { useState } from 'react';
import { Channel } from '../../../types';
import { SyncModalState } from '../sync/FollowerSyncProgressModal';
import { 
  FullSyncSummary, 
  SyncChannelQueueItem, 
  SyncLogEntry 
} from '../../admin/master/views/follower-sync/types';

interface UseFollowerSyncOptions {
  channels: Channel[];
  refetchChannelsFromDb: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useFollowerSync({
  channels,
  refetchChannelsFromDb,
  showToast,
}: UseFollowerSyncOptions) {
  const [isSyncingFollowers, setIsSyncingFollowers] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalState, setSyncModalState] = useState<SyncModalState>('syncing');
  const [syncSummaryResult, setSyncSummaryResult] = useState<FullSyncSummary | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Real-time Live Progress States (0-100%, queue, logs, active channel)
  const [syncPercentage, setSyncPercentage] = useState<number>(0);
  const [syncCurrentIndex, setSyncCurrentIndex] = useState<number>(0);
  const [syncTotalChannels, setSyncTotalChannels] = useState<number>(0);
  const [syncCurrentChannelName, setSyncCurrentChannelName] = useState<string>('');
  const [syncCurrentPlatform, setSyncCurrentPlatform] = useState<string>('');
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('');
  const [syncQueue, setSyncQueue] = useState<SyncChannelQueueItem[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);

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
    handleSyncFollowersNow,
  };
}
