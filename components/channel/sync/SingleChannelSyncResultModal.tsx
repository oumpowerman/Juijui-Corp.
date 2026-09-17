import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  Sparkles, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Youtube, 
  Facebook, 
  Instagram, 
  Video, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelSyncResult } from '../../admin/master/views/follower-sync/types';
import { formatFollowersCompact } from '../helpers/channelHelpers';

interface SingleChannelSyncResultModalProps {
  isOpen: boolean;
  result: ChannelSyncResult | null;
  onClose: () => void;
}

export const SingleChannelSyncResultModal: React.FC<SingleChannelSyncResultModalProps> = ({
  isOpen,
  result,
  onClose,
}) => {
  // Handle ESC key and scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const getPlatformIcon = (platformName: string) => {
    const norm = platformName.toUpperCase();
    if (norm === 'YOUTUBE') return <Youtube className="w-4 h-4 text-red-500" />;
    if (norm === 'FACEBOOK') return <Facebook className="w-4 h-4 text-blue-600" />;
    if (norm === 'INSTAGRAM') return <Instagram className="w-4 h-4 text-pink-600" />;
    if (norm === 'TIKTOK') return <Video className="w-4 h-4 text-slate-800" />;
    return <Sparkles className="w-4 h-4 text-indigo-500" />;
  };

  // Calculate Net diff for the entire channel
  const totalNetDiff = result.platforms.reduce((sum, plat) => {
    if (typeof plat.newCount === 'number' && typeof plat.previousCount === 'number') {
      return sum + (plat.newCount - plat.previousCount);
    }
    return sum;
  }, 0);

  const changedPlatforms = result.platforms.filter(
    p => typeof p.newCount === 'number' && typeof p.previousCount === 'number' && p.newCount !== p.previousCount
  );

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col"
        >
          {/* Top Decorative Header */}
          <div className={`p-5 pb-4 border-b ${
            result.updated && totalNetDiff > 0
              ? 'bg-gradient-to-br from-emerald-500/10 via-teal-50/50 to-white border-emerald-100'
              : 'bg-gradient-to-br from-indigo-500/10 via-slate-50/60 to-white border-slate-100'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md ${
                  result.updated && totalNetDiff > 0
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-500/25'
                }`}>
                  {result.updated && totalNetDiff > 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {result.channelName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {result.updated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <Sparkles className="w-3 h-3" />
                        อัปเดตยอดใหม่แล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                        ตรวจสอบแล้ว ยอดคงเดิม
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Followers & Net Diff Highlight Banner */}
            <div className="mt-4 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">ผู้ติดตามรวมทุกแพลตฟอร์ม</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {result.totalFollowers.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-1">คน</span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-medium text-slate-500 block">ผลต่างสุทธิ (Net Diff)</span>
                {totalNetDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100/90 text-emerald-800 font-bold text-sm">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{totalNetDiff.toLocaleString()} ใหม่
                  </span>
                ) : totalNetDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100/90 text-rose-800 font-bold text-sm">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {totalNetDiff.toLocaleString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-medium text-xs">
                    <Minus className="w-3.5 h-3.5" />
                    ยอดคงเดิม (=)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Platform Breakdown List */}
          <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-0.5">
              <span>รายละเอียดแยกรายแพลตฟอร์ม</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {changedPlatforms.length > 0 ? `${changedPlatforms.length} รายการที่เปลี่ยน` : 'ทุกแพลตฟอร์มยอดคงเดิม'}
              </span>
            </div>

            <div className="space-y-2">
              {result.platforms && result.platforms.length > 0 ? (
                result.platforms.map((plat, idx) => {
                  const prev = typeof plat.previousCount === 'number' ? plat.previousCount : undefined;
                  const curr = typeof plat.newCount === 'number' ? plat.newCount : undefined;
                  const diff = (curr !== undefined && prev !== undefined) ? curr - prev : 0;
                  const hasChanged = diff !== 0 && curr !== undefined;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        hasChanged && diff > 0
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : hasChanged && diff < 0
                          ? 'bg-rose-50/40 border-rose-200'
                          : plat.success
                          ? 'bg-slate-50/60 border-slate-200/70'
                          : 'bg-rose-50/60 border-rose-200/80'
                      }`}
                    >
                      {/* Left: Platform icon & Name */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                          {getPlatformIcon(plat.platform)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block capitalize truncate">
                            {plat.platform}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {prev !== undefined ? `เดิม: ${formatFollowersCompact(prev)}` : 'ไม่มีข้อมูลเดิม'}
                          </span>
                        </div>
                      </div>

                      {/* Right: New Count & Diff Badge */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {curr !== undefined
                              ? curr.toLocaleString()
                              : plat.error
                              ? 'ไม่พบข้อมูล'
                              : '-'}
                          </span>

                          {/* Diff Badge */}
                          {hasChanged && diff > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              +{diff.toLocaleString()}
                            </span>
                          )}

                          {hasChanged && diff < 0 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800">
                              {diff.toLocaleString()}
                            </span>
                          )}

                          {!hasChanged && curr !== undefined && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                              (=)
                            </span>
                          )}

                          {plat.error && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-100 text-rose-700">
                              <AlertCircle className="w-3 h-3" />
                              ขัดข้อง
                            </span>
                          )}
                        </div>

                        {curr !== undefined && (
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            {formatFollowersCompact(curr)} คน
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-5 text-slate-400 text-xs">
                  ไม่มีลิงก์โซเชียลมีเดียในช่องนี้
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              เข้าใจแล้ว / ปิด
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};
