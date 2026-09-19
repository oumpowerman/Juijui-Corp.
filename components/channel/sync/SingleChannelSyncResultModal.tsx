import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
  ShieldAlert,
  Edit3,
  Check,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelSyncResult, SyncPlatformResult } from '../../admin/master/views/follower-sync/types';
import { formatFollowersCompact } from '../helpers/channelHelpers';

interface SingleChannelSyncResultModalProps {
  isOpen: boolean;
  result: ChannelSyncResult | null;
  onClose: () => void;
  onOpenEditChannel?: (channelId: string) => void;
  onUpdateFollowerCount?: (channelId: string, platform: string, count: number) => Promise<void>;
}

export const SingleChannelSyncResultModal: React.FC<SingleChannelSyncResultModalProps> = ({
  isOpen,
  result,
  onClose,
  onOpenEditChannel,
  onUpdateFollowerCount,
}) => {
  // Local platforms copy to support immediate inline edits
  const [platformsState, setPlatformsState] = useState<SyncPlatformResult[]>([]);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (result?.platforms) {
      setPlatformsState(result.platforms);
      setEditingPlatform(null);
      setEditingValue('');
    }
  }, [result]);

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

  // Calculate Net diff for the entire channel based on current platformsState
  const totalNetDiff = platformsState.reduce((sum, plat) => {
    if (typeof plat.newCount === 'number' && typeof plat.previousCount === 'number') {
      return sum + (plat.newCount - plat.previousCount);
    }
    return sum;
  }, 0);

  const totalFollowersLive = platformsState.reduce((sum, plat) => {
    return sum + (typeof plat.newCount === 'number' ? plat.newCount : typeof plat.previousCount === 'number' ? plat.previousCount : 0);
  }, 0);

  const changedPlatforms = platformsState.filter(
    p => typeof p.newCount === 'number' && typeof p.previousCount === 'number' && p.newCount !== p.previousCount
  );

  const hasInstagramIssue = platformsState.some(
    p => (p.platform.toUpperCase() === 'INSTAGRAM' || p.url.includes('instagram.com')) && !p.success
  );

  // Quick edit handlers
  const startEditing = (platformName: string, initialCount?: number) => {
    setEditingPlatform(platformName);
    setEditingValue(initialCount !== undefined && initialCount !== null ? String(initialCount) : '');
  };

  const cancelEditing = () => {
    setEditingPlatform(null);
    setEditingValue('');
  };

  const saveEditing = async (platformName: string) => {
    if (!onUpdateFollowerCount || !result.channelId) return;

    const parsed = parseInt(editingValue.replace(/,/g, '').trim(), 10);
    const count = isNaN(parsed) ? 0 : Math.max(0, parsed);

    setIsSaving(true);
    try {
      await onUpdateFollowerCount(result.channelId, platformName, count);

      // Update local state
      setPlatformsState(prev => prev.map(p => {
        if (p.platform.toLowerCase() === platformName.toLowerCase()) {
          return {
            ...p,
            previousCount: p.newCount !== undefined ? p.newCount : p.previousCount,
            newCount: count,
            success: true,
            error: undefined,
          };
        }
        return p;
      }));

      setEditingPlatform(null);
    } catch (err) {
      // Handled by onUpdateFollowerCount toast
    } finally {
      setIsSaving(false);
    }
  };

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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Top Decorative Header */}
          <div className={`p-5 pb-4 border-b ${
            totalNetDiff > 0
              ? 'bg-gradient-to-br from-emerald-500/10 via-teal-50/50 to-white border-emerald-100'
              : hasInstagramIssue
              ? 'bg-gradient-to-br from-amber-500/10 via-slate-50/60 to-white border-amber-100'
              : 'bg-gradient-to-br from-indigo-500/10 via-slate-50/60 to-white border-slate-100'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  totalNetDiff > 0
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
                    : hasInstagramIssue
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/25'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-500/25'
                }`}>
                  {totalNetDiff > 0 ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : hasInstagramIssue ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 leading-tight truncate">
                    {result.channelName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {totalNetDiff > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        <Sparkles className="w-3 h-3" />
                        อัปเดตยอดใหม่แล้ว
                      </span>
                    ) : hasInstagramIssue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                        <ShieldAlert className="w-3 h-3" />
                        บางแพลตฟอร์มระบุยอดด้วยตนเอง
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                        ตรวจสอบแล้ว ยอดเป็นปัจจุบัน
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
                  {totalFollowersLive.toLocaleString()}
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
          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-0.5">
              <span>รายละเอียดแยกรายแพลตฟอร์ม</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {changedPlatforms.length > 0 ? `${changedPlatforms.length} รายการที่เปลี่ยน` : 'ตรวจสอบครบถ้วน'}
              </span>
            </div>

            {/* Notice for Instagram automated scrape limitation */}
            {hasInstagramIssue && (
              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block">คำแนะนำสำหรับ Instagram:</span>
                  ระบบความปลอดภัยของ Meta ปิดกั้นการดึงข้อมูลจาก Server แต่คุณสามารถกดปุ่ม <span className="font-bold underline text-amber-950">"กรอกยอด"</span> ด้านล่างเพื่อระบุยอดผู้ติดตามล่าสุดได้ทันที
                </div>
              </div>
            )}

            <div className="space-y-2">
              {platformsState && platformsState.length > 0 ? (
                platformsState.map((plat, idx) => {
                  const prev = typeof plat.previousCount === 'number' ? plat.previousCount : undefined;
                  const curr = typeof plat.newCount === 'number' ? plat.newCount : undefined;
                  const diff = (curr !== undefined && prev !== undefined) ? curr - prev : 0;
                  const hasChanged = diff !== 0 && curr !== undefined;
                  const isInstagram = plat.platform.toUpperCase() === 'INSTAGRAM' || plat.url.includes('instagram.com');
                  const isRowEditing = editingPlatform === plat.platform;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all flex flex-col gap-2 ${
                        hasChanged && diff > 0
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : hasChanged && diff < 0
                          ? 'bg-rose-50/40 border-rose-200'
                          : plat.success
                          ? 'bg-slate-50/60 border-slate-200/70'
                          : isInstagram
                          ? 'bg-amber-50/40 border-amber-200/80'
                          : 'bg-rose-50/60 border-rose-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
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
                              {prev !== undefined 
                                ? `เดิม: ${formatFollowersCompact(prev)} คน` 
                                : 'ไม่มีข้อมูลเดิม'}
                            </span>
                          </div>
                        </div>

                        {/* Right: New Count & Badges */}
                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {curr !== undefined
                                ? curr.toLocaleString()
                                : prev !== undefined
                                ? prev.toLocaleString()
                                : 'ยังไม่มียอด'}
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

                            {!hasChanged && plat.success && curr !== undefined && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                                (=)
                              </span>
                            )}

                            {/* Blocked or Error Badge */}
                            {!plat.success && (
                              isInstagram ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  <ShieldAlert className="w-3 h-3" />
                                  Meta ปิดกั้น
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-100 text-rose-700">
                                  <AlertCircle className="w-3 h-3" />
                                  ไม่พบข้อมูล
                                </span>
                              )
                            )}

                            {/* Quick Edit Trigger Button */}
                            {onUpdateFollowerCount && !isRowEditing && (
                              <button
                                type="button"
                                onClick={() => startEditing(plat.platform, curr ?? prev)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs active:scale-95 ${
                                  !plat.success && isInstagram
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="กรอกหรือแก้ไขตัวเลขผู้ติดตามแพลตฟอร์มนี้ด้วยตนเอง"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                กรอกยอด
                              </button>
                            )}
                          </div>

                          {curr !== undefined && (
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                              {formatFollowersCompact(curr)} คน
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inline Quick-Edit Drawer */}
                      {isRowEditing && (
                        <div className="mt-1 pt-2 border-t border-slate-200/60 flex items-center gap-2">
                          <span className="text-[11px] text-slate-600 font-medium shrink-0">ระบุผู้ติดตาม:</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            placeholder="เช่น 25000"
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-slate-900"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditing(plat.platform);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => saveEditing(plat.platform)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                          >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            บันทึก
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer transition-colors"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      )}
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
          <div className="p-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
            {onOpenEditChannel && result.channelId ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditChannel(result.channelId);
                }}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                แก้ไขข้อมูลช่องเต็มรูปแบบ
              </button>
            ) : <div />}

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
