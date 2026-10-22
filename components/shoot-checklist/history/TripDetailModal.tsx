import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
    X,
    Clock,
    User as UserIcon,
    FileText,
    Check,
    XCircle,
    Play
} from 'lucide-react';
import { ShootTripRecord, ShootRoundKey, ShootRoundReport } from '../../../types';
import { SHOOT_ROUND_META } from '../../../context/checklist/types';
import { ROUND_ORDER, formatDateTime, formatTimeOnly } from './historyUtils';

export interface TripDetailModalProps {
    trip: ShootTripRecord | null;
    onClose: () => void;
    selectedRoundTab: ShootRoundKey;
    onSelectRoundTab: (rk: ShootRoundKey) => void;
    itemFilterMode: 'ALL' | 'UNCHECKED';
    onItemFilterModeChange: (mode: 'ALL' | 'UNCHECKED') => void;
    onResumeTrip: (trip: ShootTripRecord) => Promise<void>;
}

const backdropVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { duration: 0.22, ease: 'easeOut' }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: 'easeIn' }
    }
};

const modalVariants: Variants = {
    initial: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 44,
        opacity: isMobile ? 1 : 0,
        scale: isMobile ? 1 : 0.96
    }),
    animate: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 380,
            damping: 32,
            mass: 0.85
        }
    },
    exit: (isMobile: boolean) => ({
        y: isMobile ? '100%' : 44,
        opacity: isMobile ? 1 : 0,
        scale: isMobile ? 1 : 0.96,
        transition: {
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1] as const
        }
    })
};

export const TripDetailModal: React.FC<TripDetailModalProps> = ({
    trip,
    onClose,
    selectedRoundTab,
    onSelectRoundTab,
    itemFilterMode,
    onItemFilterModeChange,
    onResumeTrip
}) => {
    const [isMobile, setIsMobile] = useState<boolean>(() =>
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Escape Key Listener
    useEffect(() => {
        if (!trip) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [trip, onClose]);

    const currentDetailRoundReport: ShootRoundReport | undefined =
        trip?.rounds?.[selectedRoundTab];

    const groupedDetailItems = useMemo(() => {
        if (!currentDetailRoundReport?.items) return {};
        const groups: Record<string, typeof currentDetailRoundReport.items> = {};
        currentDetailRoundReport.items.forEach(item => {
            if (itemFilterMode === 'UNCHECKED' && item.isChecked) return;
            const groupName = item.categoryLabel || 'อุปกรณ์ทั่วไป';
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(item);
        });
        return groups;
    }, [currentDetailRoundReport, itemFilterMode]);

    const isAllDone = Boolean(
        trip?.rounds?.PACK_OUT &&
            trip?.rounds?.PACK_BACK &&
            trip?.rounds?.RETURN_STORAGE
    );

    return createPortal(
        <AnimatePresence>
            {trip && (
                <motion.div
                    key="trip-detail-backdrop"
                    variants={backdropVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        key="trip-detail-dialog"
                        custom={isMobile}
                        variants={modalVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Pull Indicator for Mobile */}
                        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-2.5 -mb-1 shrink-0" />

                        {/* 1. Rigid Header */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="min-w-0 pr-3">
                                <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                                    {trip.title}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    รายละเอียดการเช็คอุปกรณ์รายชิ้นแยกตามรอบ
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                                title="ปิดหน้าต่าง"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                            {/* 3-Round Selector Tabs */}
                            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1.5 rounded-2xl">
                                {ROUND_ORDER.map(rk => {
                                    const meta = SHOOT_ROUND_META[rk];
                                    const rep = trip.rounds?.[rk];
                                    const isActive = selectedRoundTab === rk;

                                    return (
                                        <button
                                            key={rk}
                                            type="button"
                                            onClick={() => onSelectRoundTab(rk)}
                                            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 min-h-[48px] ${
                                                isActive
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <span className="truncate max-w-full">
                                                {meta.shortLabel}
                                            </span>
                                            {rep ? (
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold tabular-nums ${
                                                        rep.checkedCount === rep.totalCount
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}
                                                >
                                                    {rep.checkedCount}/{rep.totalCount} ชิ้น
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    ยังไม่ส่ง
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {!currentDetailRoundReport ? (
                                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                                    <Clock className="w-10 h-10 text-gray-300 mx-auto" />
                                    <div className="text-sm font-bold text-gray-700">
                                        ยังไม่มีการส่งรายงานในรอบ "
                                        {SHOOT_ROUND_META[selectedRoundTab].label}"
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        คุณสามารถกดปุ่ม "ทำต่อรอบนี้" ด้านล่างเพื่อโหลดรายการกลับไปเช็คต่อได้ทันที
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Submitter Info Banner */}
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2.5">
                                                {currentDetailRoundReport.submittedByAvatar ? (
                                                    <img
                                                        src={
                                                            currentDetailRoundReport.submittedByAvatar
                                                        }
                                                        alt={
                                                            currentDetailRoundReport.submittedByName
                                                        }
                                                        className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                        <UserIcon className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">
                                                        ผู้กดส่งปิดรอบ (
                                                        {currentDetailRoundReport.roundLabel})
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {currentDetailRoundReport.submittedByName}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 font-medium">
                                                    เวลาที่ส่ง
                                                </div>
                                                <div className="text-xs font-bold text-gray-800 tabular-nums">
                                                    {formatDateTime(
                                                        currentDetailRoundReport.submittedAt
                                                    )}{' '}
                                                    น.
                                                </div>
                                            </div>
                                        </div>

                                        {currentDetailRoundReport.note && (
                                            <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs text-gray-700 flex items-start gap-2">
                                                <FileText className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-bold text-gray-800">
                                                        หมายเหตุ:{' '}
                                                    </span>
                                                    {currentDetailRoundReport.note}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Filter All vs Unchecked */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-600">
                                            รายการอุปกรณ์ ({currentDetailRoundReport.checkedCount}
                                            /{currentDetailRoundReport.totalCount} ชิ้น)
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onItemFilterModeChange('ALL')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                    itemFilterMode === 'ALL'
                                                        ? 'bg-slate-800 text-white'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                ทั้งหมด
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onItemFilterModeChange('UNCHECKED')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                                    itemFilterMode === 'UNCHECKED'
                                                        ? 'bg-amber-600 text-white'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                เฉพาะที่ไม่ได้ติ๊ก (
                                                {currentDetailRoundReport.totalCount -
                                                    currentDetailRoundReport.checkedCount}
                                                )
                                            </button>
                                        </div>
                                    </div>

                                    {/* Categorized Item List with Checker Attribution */}
                                    <div className="space-y-3">
                                        {Object.entries(groupedDetailItems).map(
                                            ([catLabel, catItems]) => (
                                                <div
                                                    key={catLabel}
                                                    className="rounded-2xl border border-gray-100 overflow-hidden bg-white"
                                                >
                                                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {catLabel}
                                                        </span>
                                                        <span className="text-[11px] font-semibold text-gray-500 tabular-nums">
                                                            {catItems.filter(i => i.isChecked).length}
                                                            /{catItems.length}
                                                        </span>
                                                    </div>
                                                    <div className="divide-y divide-gray-100">
                                                        {catItems.map((item, idx) => (
                                                            <div
                                                                key={`${item.itemId}-${idx}`}
                                                                className={`px-4 py-3 flex items-center justify-between gap-3 ${
                                                                    item.isChecked
                                                                        ? 'bg-white'
                                                                        : 'bg-amber-50/30'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    {item.isChecked ? (
                                                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                                            <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                                            <XCircle className="w-4 h-4" />
                                                                        </div>
                                                                    )}
                                                                    <span
                                                                        className={`text-sm font-medium truncate ${
                                                                            item.isChecked
                                                                                ? 'text-gray-800'
                                                                                : 'text-amber-900 font-semibold'
                                                                        }`}
                                                                    >
                                                                        {item.text}
                                                                    </span>
                                                                </div>

                                                                {item.isChecked ? (
                                                                    <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                                                                        {item.checkedByAvatar ? (
                                                                            <img
                                                                                src={
                                                                                    item.checkedByAvatar
                                                                                }
                                                                                alt={
                                                                                    item.checkedByName
                                                                                }
                                                                                className="w-4 h-4 rounded-full object-cover"
                                                                                referrerPolicy="no-referrer"
                                                                            />
                                                                        ) : (
                                                                            <UserIcon className="w-3 h-3 text-indigo-500" />
                                                                        )}
                                                                        <span className="text-[11px] font-semibold text-gray-700 max-w-[90px] truncate">
                                                                            {item.checkedByName ||
                                                                                'ทีมงาน'}
                                                                        </span>
                                                                        {item.checkedAt && (
                                                                            <span className="text-[10px] text-gray-400 tabular-nums">
                                                                                {formatTimeOnly(
                                                                                    item.checkedAt
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold shrink-0">
                                                                        ไม่ได้ติ๊ก
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                            >
                                ปิดหน้าต่าง
                            </button>
                            {!isAllDone && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const tripToResume = trip;
                                        onClose();
                                        await onResumeTrip(tripToResume);
                                    }}
                                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>ดึงคิวนี้กลับมาเช็คต่อ</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
