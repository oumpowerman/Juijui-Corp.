import React from 'react';
import { 
  CheckCircle2, Sparkles, Layers, Clock, Youtube, Facebook, 
  Instagram, Video, ArrowUpRight, TrendingUp, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FullSyncSummary } from '../../admin/master/views/follower-sync/types';
import { formatFollowersCompact } from '../channelHelpers';

interface SyncSuccessViewProps {
  summary: FullSyncSummary | null;
  totalReach?: number;
  onClose: () => void;
}

export const SyncSuccessView: React.FC<SyncSuccessViewProps> = ({
  summary,
  totalReach,
  onClose,
}) => {
  const getPlatformIcon = (platformName: string) => {
    const norm = platformName.toUpperCase();
    if (norm === 'YOUTUBE') return <Youtube className="w-3.5 h-3.5 text-red-500" />;
    if (norm === 'FACEBOOK') return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
    if (norm === 'INSTAGRAM') return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
    if (norm === 'TIKTOK') return <Video className="w-3.5 h-3.5 text-slate-800" />;
    return <Sparkles className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const totalChecked = summary?.totalChannelsChecked || 0;
  const totalUpdated = summary?.totalChannelsUpdated || 0;
  const durationSec = summary ? (summary.durationMs / 1000).toFixed(1) : '0';

  // Total reach computed from summary results if available
  const computedReach = summary?.results?.reduce((sum, ch) => sum + (ch.totalFollowers || 0), 0) || totalReach || 0;

  // Filter channels with changes
  const changedChannels = summary?.results?.filter(r => r.updated) || [];
  const unchangedChannels = summary?.results?.filter(r => !r.updated) || [];

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center relative overflow-hidden">
        <div className="inline-flex p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 mb-2">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-900 tracking-tight">
          ซิงค์ยอดผู้ติดตามสำเร็จสมบูรณ์!
        </h4>
        <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
          ระบบดึงข้อมูลสถิติล่าสุดจาก YouTube, Facebook, TikTok และ Instagram พร้อมอัปเดตลงฐานข้อมูลเรียบร้อยแล้ว
        </p>
      </div>

      {/* 2. Key Metrics Grid (4 Stat Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
          <span className="text-[11px] font-medium text-slate-500 block mb-0.5">ตรวจสอบแล้ว</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{totalChecked}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">ช่องทั้งหมด</span>
        </div>

        <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80 text-center">
          <span className="text-[11px] font-medium text-emerald-700 block mb-0.5">อัปเดตใหม่</span>
          <span className="text-xl font-bold text-emerald-700 font-mono">{totalUpdated}</span>
          <span className="text-[10px] text-emerald-600/80 block mt-0.5">ช่องที่มีการเปลี่ยน</span>
        </div>

        <div className="bg-indigo-50/80 p-3.5 rounded-xl border border-indigo-200/80 text-center">
          <span className="text-[11px] font-medium text-indigo-700 block mb-0.5">ยอดผู้ติดตามรวม</span>
          <span className="text-xl font-bold text-indigo-700 font-mono">
            {formatFollowersCompact(computedReach)}
          </span>
          <span className="text-[10px] text-indigo-600/80 block mt-0.5">Total Reach</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-center">
          <span className="text-[11px] font-medium text-slate-500 block mb-0.5">เวลาที่ใช้</span>
          <span className="text-xl font-bold text-slate-800 font-mono">{durationSec}s</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">วินาที</span>
        </div>
      </div>

      {/* 3. Detailed Results List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            รายละเอียดรายช่อง ({summary?.results?.length || 0} ช่อง)
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {changedChannels.length} มีการเปลี่ยนแปลง
          </span>
        </div>

        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 border border-slate-150 rounded-xl p-2.5 bg-slate-50/40">
          {summary?.results && summary.results.length > 0 ? (
            summary.results.map((ch) => {
              return (
                <div 
                  key={ch.channelId}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    ch.updated 
                      ? 'bg-white border-emerald-200 shadow-sm' 
                      : 'bg-white/80 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-slate-900 truncate">
                        {ch.channelName}
                      </span>
                      {ch.updated ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex-shrink-0">
                          ✨ ยอดอัปเดตใหม่
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 flex-shrink-0">
                          ยอดคงเดิม
                        </span>
                      )}
                    </div>

                    <div className="text-right font-mono font-bold text-slate-800 flex-shrink-0 text-xs">
                      {ch.totalFollowers.toLocaleString()} followers
                    </div>
                  </div>

                  {/* Platform breakdown pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
                    {ch.platforms.map((plat, pIdx) => {
                      const hasChanged = plat.previousCount !== plat.newCount && typeof plat.newCount === 'number';
                      return (
                        <span 
                          key={pIdx} 
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border ${
                            hasChanged 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' 
                              : plat.success 
                              ? 'bg-slate-50 border-slate-200 text-slate-700' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {getPlatformIcon(plat.platform)}
                          <span>{plat.platform}:</span>
                          <span className="font-mono">
                            {plat.newCount !== undefined 
                              ? formatFollowersCompact(plat.newCount) 
                              : plat.error 
                              ? 'error' 
                              : '-'}
                          </span>
                          {hasChanged && (
                            <span className="text-[10px] text-emerald-600 font-bold ml-0.5">
                              (↑)
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              ไม่พบข้อมูลผลลัพธ์การตรวจสอบ
            </div>
          )}
        </div>
      </div>

      {/* 4. Action Button */}
      <div className="pt-2">
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>รับทราบและปิดหน้าต่าง</span>
        </button>
      </div>
    </div>
  );
};
