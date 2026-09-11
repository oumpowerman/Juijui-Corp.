import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FullSyncSummary, SyncChannelQueueItem, SyncLogEntry } from '../../admin/master/views/follower-sync/types';
import { SyncProgressView } from './SyncProgressView';
import { SyncSuccessView } from './SyncSuccessView';
import { SyncErrorView } from './SyncErrorView';

export type SyncModalState = 'syncing' | 'success' | 'error';

export interface FollowerSyncProgressModalProps {
  isOpen: boolean;
  state: SyncModalState;
  summary: FullSyncSummary | null;
  errorMessage?: string | null;
  totalReach?: number;
  percentage?: number;
  currentIndex?: number;
  totalChannels?: number;
  currentChannelName?: string;
  currentPlatform?: string;
  statusMessage?: string;
  queue?: SyncChannelQueueItem[];
  logs?: SyncLogEntry[];
  onClose: () => void;
  onRetry?: () => void;
}

export const FollowerSyncProgressModal: React.FC<FollowerSyncProgressModalProps> = ({
  isOpen,
  state,
  summary,
  errorMessage,
  totalReach,
  percentage = 0,
  currentIndex = 0,
  totalChannels = 0,
  currentChannelName,
  currentPlatform,
  statusMessage,
  queue = [],
  logs = [],
  onClose,
  onRetry,
}) => {
  const [mounted, setMounted] = useState(false);

  // Ensure DOM is mounted for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key and Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'syncing') {
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
  }, [isOpen, state, onClose]);

  if (!mounted) return null;

  const portalElement = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          id="follower-sync-modal-portal"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* 1. Backdrop with Glassmorphic Blur and Dark Overlay */}
          <motion.div
            id="follower-sync-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              // Allow closing by clicking backdrop only when NOT syncing
              if (state !== 'syncing') {
                onClose();
              }
            }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* 2. Modal Dialog Container with Spring Scale Transition */}
          <motion.div
            id="follower-sync-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden z-10 my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs transition-colors ${
                  state === 'syncing'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : state === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}>
                  {state === 'syncing' && <RefreshCw className="w-5 h-5 animate-spin" />}
                  {state === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {state === 'error' && <AlertCircle className="w-5 h-5" />}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {state === 'syncing' && 'กำลังซิงค์ยอดผู้ติดตาม (Live Progress)'}
                    {state === 'success' && 'ซิงค์ยอดผู้ติดตามสำเร็จ'}
                    {state === 'error' && 'การซิงค์ข้อมูลไม่สำเร็จ'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {state === 'syncing' && 'ระบบกำลังรวบรวมและตรวจสอบข้อมูล Social Media'}
                    {state === 'success' && 'บันทึกสถิติผู้ติดตามชุดล่าสุดลงระบบแล้ว'}
                    {state === 'error' && 'เกิดปัญหาขณะพยายามดึงข้อมูลจากแพลตฟอร์ม'}
                  </p>
                </div>
              </div>

              {state !== 'syncing' ? (
                <button
                  id="btn-close-sync-modal"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-150 text-[11px] font-semibold text-indigo-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  Processing
                </div>
              )}
            </div>

            {/* Modal Body with Animated View Switching */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {state === 'syncing' && (
                  <motion.div
                    key="syncing-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SyncProgressView
                      percentage={percentage}
                      currentIndex={currentIndex}
                      totalChannels={totalChannels}
                      currentChannelName={currentChannelName}
                      currentPlatform={currentPlatform}
                      statusMessage={statusMessage}
                      queue={queue}
                      logs={logs}
                    />
                  </motion.div>
                )}

                {state === 'success' && (
                  <motion.div
                    key="success-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SyncSuccessView
                      summary={summary}
                      totalReach={totalReach}
                      onClose={onClose}
                    />
                  </motion.div>
                )}

                {state === 'error' && (
                  <motion.div
                    key="error-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SyncErrorView
                      errorMessage={errorMessage}
                      onRetry={onRetry}
                      onClose={onClose}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalElement
  );
};
