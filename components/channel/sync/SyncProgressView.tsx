import React, { useRef, useEffect } from 'react';
import { 
  Loader2, Youtube, Facebook, Instagram, Video, Sparkles, 
  Terminal, CheckCircle2, Clock, Activity, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncChannelQueueItem, SyncLogEntry } from '../../admin/master/views/follower-sync/types';
import { formatFollowersCompact } from '../channelHelpers';

interface SyncProgressViewProps {
  percentage: number;
  currentIndex: number;
  totalChannels: number;
  currentChannelName?: string;
  currentPlatform?: string;
  statusMessage?: string;
  queue: SyncChannelQueueItem[];
  logs: SyncLogEntry[];
}

export const SyncProgressView: React.FC<SyncProgressViewProps> = ({
  percentage,
  currentIndex,
  totalChannels,
  currentChannelName,
  currentPlatform,
  statusMessage,
  queue,
  logs,
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Find active channel in queue
  const activeItem: { id?: string; name: string; logoUrl?: string } | null = 
    queue.find(q => q.status === 'processing') || 
    (currentChannelName ? { id: 'current', name: currentChannelName } : null);

  const getPlatformIcon = (platformName?: string) => {
    const norm = (platformName || '').toUpperCase();
    if (norm === 'YOUTUBE') return <Youtube className="w-4 h-4 text-red-500" />;
    if (norm === 'FACEBOOK') return <Facebook className="w-4 h-4 text-blue-600" />;
    if (norm === 'INSTAGRAM') return <Instagram className="w-4 h-4 text-pink-600" />;
    if (norm === 'TIKTOK') return <Video className="w-4 h-4 text-slate-800" />;
    return <Sparkles className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="space-y-5">
      {/* 1. Top Progress Bar & Statistics */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-ping absolute opacity-75"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 relative flex items-center justify-center">
                <Activity className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                กำลังประมวลผลการซิงค์ข้อมูลผู้ติดตาม
                <span className="text-xs font-normal text-indigo-600 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                  Real-time Stream
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalChannels > 0 
                  ? `กำลังตรวจสอบช่องที่ ${Math.min(currentIndex + 1, totalChannels)} จากทั้งหมด ${totalChannels} ช่อง`
                  : 'กำลังเชื่อมต่อ API และเตรียมคิวข้อมูล...'}
              </p>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-mono">
              {Math.min(100, Math.max(0, Math.round(percentage)))}%
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/80 shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full relative"
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </motion.div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-slate-600 truncate max-w-[280px]">
            <Loader2 className="w-3 h-3 animate-spin text-indigo-600 flex-shrink-0" />
            <span className="truncate">{statusMessage || 'กำลังอ่านข้อมูลสถิติล่าสุด...'}</span>
          </span>
          <span className="text-slate-400 font-mono flex-shrink-0">
            {currentIndex}/{totalChannels} ช่อง
          </span>
        </div>
      </div>

      {/* 2. Active Channel Spotlight Card */}
      <AnimatePresence mode="wait">
        {activeItem ? (
          <motion.div
            key={activeItem.id || activeItem.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-xl border border-indigo-200 bg-white shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-md flex-shrink-0 relative overflow-hidden">
                  {activeItem.logoUrl ? (
                    <img 
                      src={activeItem.logoUrl} 
                      alt={activeItem.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    activeItem.name.slice(0, 2).toUpperCase()
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-900 truncate">
                      {activeItem.name}
                    </h5>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 flex-shrink-0">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      กำลังดึงข้อมูล
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>แพลตฟอร์มปัจจุบัน:</span>
                    {currentPlatform ? (
                      <span className="font-semibold text-slate-700 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {getPlatformIcon(currentPlatform)}
                        {currentPlatform}
                      </span>
                    ) : (
                      <span className="text-slate-400">ตรวจสอบโซเชียลมีเดีย...</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Platform badge indicators */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM'].map((plat) => {
                  const isActive = (currentPlatform || '').toUpperCase() === plat;
                  return (
                    <div
                      key={plat}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400/30 scale-110 shadow-sm' 
                          : 'bg-slate-50 border-slate-150 opacity-40'
                      }`}
                      title={plat}
                    >
                      {getPlatformIcon(plat)}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* 3. Channel Queue Checklist (Scrollable if many) */}
      {queue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
            <span>คิวการดึงข้อมูล ({queue.filter(q => q.status === 'completed').length}/{queue.length} เสร็จสิ้น)</span>
            <span className="text-[11px] text-slate-400 font-normal">สถานะแต่ละช่อง</span>
          </div>

          <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 border border-slate-150 rounded-xl p-2 bg-slate-50/50">
            {queue.map((item, idx) => {
              const isDone = item.status === 'completed';
              const isCurrent = item.status === 'processing';
              const isError = item.status === 'error';

              return (
                <div 
                  key={item.id || idx}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                    isCurrent 
                      ? 'bg-white border border-indigo-200 shadow-sm' 
                      : isDone 
                      ? 'bg-white/70 border border-slate-150 opacity-90' 
                      : 'bg-slate-100/60 border border-transparent opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                      ) : isError ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <span className={`truncate font-medium ${isCurrent ? 'text-indigo-900 font-semibold' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isDone && typeof item.totalFollowers === 'number' && (
                      <span className="font-mono font-medium text-slate-600 text-[11px]">
                        {formatFollowersCompact(item.totalFollowers)}
                      </span>
                    )}
                    {isDone && item.updated && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        อัปเดตแล้ว
                      </span>
                    )}
                    {isDone && !item.updated && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                        ยอดคงเดิม
                      </span>
                    )}
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-150 animate-pulse">
                        กำลังตรวจสอบ...
                      </span>
                    )}
                    {!isDone && !isCurrent && !isError && (
                      <span className="text-[10px] text-slate-400">
                        รอคิว
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Live Execution Log Feed (Terminal Style) */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-inner text-slate-200 font-mono text-[11px] overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[10px]">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-300">Live Execution Console</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Connected</span>
          </div>
        </div>

        <div className="max-h-[110px] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800 pr-1">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-1">Initializing stream and waiting for background worker logs...</div>
          ) : (
            logs.map((log) => {
              let colorClass = 'text-slate-300';
              if (log.type === 'start') colorClass = 'text-cyan-400';
              if (log.type === 'success') colorClass = 'text-emerald-400';
              if (log.type === 'warning') colorClass = 'text-amber-400';
              if (log.type === 'error') colorClass = 'text-rose-400';
              if (log.type === 'info') colorClass = 'text-indigo-300';

              return (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-600 select-none flex-shrink-0">[{log.timeStr}]</span>
                  <span className={`${colorClass} break-all`}>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
