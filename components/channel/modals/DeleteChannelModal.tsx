import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, X, Radio, Layers, CheckCircle2 } from 'lucide-react';
import { Channel } from '../../../types';
import { formatFollowersCompact, getChannelTotalFollowers } from '../helpers/channelHelpers';

interface DeleteChannelModalProps {
  isOpen: boolean;
  channel: Channel | null;
  contentCount?: number;
  onClose: () => void;
  onConfirmDelete: (channelId: string, deleteTaskOption: 'unlink' | 'cascade') => Promise<void>;
}

export const DeleteChannelModal: React.FC<DeleteChannelModalProps> = ({
  isOpen,
  channel,
  contentCount = 0,
  onClose,
  onConfirmDelete,
}) => {
  const [deleteOption, setDeleteOption] = useState<'unlink' | 'cascade'>('unlink');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !channel) return null;

  const totalFollowers = getChannelTotalFollowers(channel);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(channel.id, deleteOption);
      onClose();
    } catch (err) {
      console.error('[DeleteChannelModal] Deletion failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isDeleting ? onClose : undefined}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10"
        >
          {/* Header Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

          {/* Close Button */}
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Warning Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-lg font-bold text-slate-900">
                  ยืนยันการลบช่องรายการ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  การกระทำนี้ไม่สามารถยกเลิกได้ กรุณาตรวจสอบรายละเอียดก่อนดำเนินการ
                </p>
              </div>
            </div>

            {/* Target Channel Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
                {channel.logoUrl ? (
                  <img
                    src={channel.logoUrl}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-400">
                    {channel.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {channel.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-slate-500">
                  {channel.group_name && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      {channel.group_name}
                    </span>
                  )}
                  {totalFollowers > 0 && (
                    <span>• {formatFollowersCompact(totalFollowers)} ผู้ติดตาม</span>
                  )}
                  {contentCount > 0 && (
                    <span>• {contentCount} คอนเทนต์</span>
                  )}
                </div>
              </div>
            </div>

            {/* Deletion Options */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 block">
                เลือกวิธีจัดการคอนเทนต์ / งานที่ผูกอยู่:
              </label>

              {/* Option 1: Unlink */}
              <div
                onClick={() => !isDeleting && setDeleteOption('unlink')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  deleteOption === 'unlink'
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 text-indigo-950'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {deleteOption === 'unlink' ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">
                    ลบเฉพาะช่องรายการ และคงค้างงาน Content ไว้ (แนะนำ)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    งาน Content และ Tasks เดิมจะยังคงอยู่ในระบบ แต่จะถูกปลดการเชื่อมโยงจากช่องนี้
                  </p>
                </div>
              </div>

              {/* Option 2: Cascade */}
              <div
                onClick={() => !isDeleting && setDeleteOption('cascade')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                  deleteOption === 'cascade'
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200 text-rose-950'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {deleteOption === 'cascade' ? (
                    <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-rose-900">
                    ลบช่องรายการพร้อมเนื้อหาทั้งหมดที่ผูกไว้
                  </p>
                  <p className="text-[11px] text-rose-700/80 mt-0.5">
                    งานที่ผูกกับช่องนี้จะถูกลบออกจากระบบด้วยอย่างถาวร
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold border border-rose-500 border-b-[3px] border-b-rose-700 shadow-md shadow-rose-200 transition-all active:translate-y-[2px] active:border-b-[1px] disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบช่องรายการ'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
