import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X,
    Clock,
    UserCheck,
    CheckCircle2,
    Square,
    Search,
    ChevronLeft,
    ChevronRight,
    Trash2,
    FileCheck2,
    AlertCircle
} from 'lucide-react';
import { SavedChecklistRecord } from '../../../types';

interface SavedRecordDetailModalProps {
    record: SavedChecklistRecord | null;
    onClose: () => void;
    onDeleteRecord: (record: SavedChecklistRecord) => Promise<void>;
    getPositionLabel: (key?: string) => string;
    getResponsibilityLabel: (key?: string) => string;
    hasPrev?: boolean;
    hasNext?: boolean;
    onPrevRecord?: () => void;
    onNextRecord?: () => void;
    currentIndex?: number;
    totalFiltered?: number;
}

export const SavedRecordDetailModal: React.FC<SavedRecordDetailModalProps> = ({
    record,
    onClose,
    onDeleteRecord,
    getPositionLabel,
    getResponsibilityLabel,
    hasPrev = false,
    hasNext = false,
    onPrevRecord,
    onNextRecord,
    currentIndex,
    totalFiltered
}) => {
    const [itemFilter, setItemFilter] = useState<'ALL' | 'CHECKED' | 'UNCHECKED'>('ALL');
    const [innerSearch, setInnerSearch] = useState('');

    useEffect(() => {
        if (record) {
            setItemFilter('ALL');
            setInnerSearch('');
        }
    }, [record?.id]);

    useEffect(() => {
        if (!record) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && hasPrev && onPrevRecord) onPrevRecord();
            if (e.key === 'ArrowRight' && hasNext && onNextRecord) onNextRecord();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [record, onClose, hasPrev, hasNext, onPrevRecord, onNextRecord]);

    const snapshotCheckers = useMemo(() => {
        if (!record) return [];
        const set = new Set<string>();
        record.snapshotSections?.forEach(sec =>
            sec.items.forEach(it => {
                if (it.isChecked && it.checkedByName) {
                    set.add(it.checkedByName);
                }
            })
        );
        return Array.from(set);
    }, [record]);

    const filteredSections = useMemo(() => {
        if (!record?.snapshotSections) return [];
        const q = innerSearch.trim().toLowerCase();

        return record.snapshotSections
            .map(sec => {
                const filteredItems = sec.items.filter(it => {
                    if (itemFilter === 'CHECKED' && !it.isChecked) return false;
                    if (itemFilter === 'UNCHECKED' && it.isChecked) return false;
                    if (q) {
                        const matchTitle = it.title.toLowerCase().includes(q);
                        const matchDesc = (it.description || '').toLowerCase().includes(q);
                        const matchChecker = (it.checkedByName || '').toLowerCase().includes(q);
                        const matchRemark = (it.remark || '').toLowerCase().includes(q);
                        const matchSec = sec.title.toLowerCase().includes(q);
                        return (
                            matchTitle || matchDesc || matchChecker || matchRemark || matchSec
                        );
                    }
                    return true;
                });

                return {
                    ...sec,
                    filteredItems
                };
            })
            .filter(sec => sec.filteredItems.length > 0);
    }, [record, itemFilter, innerSearch]);

    if (typeof document === 'undefined') return null;

    const percent =
        record && record.totalCount > 0
            ? Math.round((record.checkedCount / record.totalCount) * 100)
            : 0;

    return createPortal(
        <AnimatePresence>
            {record && (
                <motion.div
                    key="saved-record-detail-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={onClose}
                    className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 overflow-y-auto"
                >
                    <motion.div
                        key={`saved-record-dialog-${record.id}`}
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto"
                    >
                        {/* Top Sticky Header */}
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-white flex items-start justify-between gap-3 shrink-0">
                            <div className="flex items-start gap-3 min-w-0">
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs tabular-nums ${
                                        percent === 100
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                    }`}
                                >
                                    {percent}%
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                            {record.caseTitle}
                                        </h2>
                                        <span className="text-xs text-slate-500">
                                            · {record.checklistTitle}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                                        <span className="inline-flex items-center gap-1 tabular-nums">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>
                                                {new Date(record.submittedAt).toLocaleString(
                                                    'th-TH',
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }
                                                )}{' '}
                                                น.
                                            </span>
                                        </span>

                                        <span>·</span>

                                        <span className="inline-flex items-center gap-1">
                                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>
                                                ผู้กดบันทึก:{' '}
                                                <strong className="text-slate-800">
                                                    {record.submittedByName}
                                                </strong>
                                                {record.submittedByPosition
                                                    ? ` (${record.submittedByPosition})`
                                                    : ''}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Prev / Next Navigation + Close */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {typeof currentIndex === 'number' &&
                                    typeof totalFiltered === 'number' &&
                                    totalFiltered > 1 && (
                                        <div className="hidden sm:flex items-center gap-1 mr-2 bg-slate-100 rounded-xl p-1">
                                            <button
                                                type="button"
                                                disabled={!hasPrev}
                                                onClick={onPrevRecord}
                                                className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-35 cursor-pointer"
                                                title="ใบประวัติก่อนหน้า (ลูกศรซ้าย)"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-2 text-xs font-semibold text-slate-600 tabular-nums">
                                                {currentIndex + 1} / {totalFiltered}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={!hasNext}
                                                onClick={onNextRecord}
                                                className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-35 cursor-pointer"
                                                title="ใบประวัติถัดไป (ลูกศรขวา)"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Sub-Header Filter & Summary Strip */}
                        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
                            {record.summaryNote && (
                                <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-700">
                                    <strong className="font-semibold text-slate-900">
                                        หมายเหตุสรุปใบงาน:{' '}
                                    </strong>
                                    {record.summaryNote}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                {/* Filter Tabs Inside Snapshot */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setItemFilter('ALL')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            itemFilter === 'ALL'
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        ทั้งหมด ({record.totalCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setItemFilter('CHECKED')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            itemFilter === 'CHECKED'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <FileCheck2 className="w-3.5 h-3.5" />
                                        <span>ติ๊กผ่านแล้ว ({record.checkedCount})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setItemFilter('UNCHECKED')}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                            itemFilter === 'UNCHECKED'
                                                ? 'bg-amber-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>
                                            ไม่ได้ติ๊ก ({record.totalCount - record.checkedCount})
                                        </span>
                                    </button>
                                </div>

                                {/* Search Inside Snapshot */}
                                <div className="relative w-full sm:w-64">
                                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={innerSearch}
                                        onChange={e => setInnerSearch(e.target.value)}
                                        placeholder="ค้นหาข้อเช็ค หรือชื่อคนติ๊กในใบนี้..."
                                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Snapshot Sections Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/40">
                            {filteredSections.length === 0 ? (
                                <div className="py-12 text-center text-xs sm:text-sm text-slate-500">
                                    ไม่พบรายการเช็คที่ตรงกับตัวกรองในใบประวัตินี้
                                </div>
                            ) : (
                                filteredSections.map((sec, idx) => {
                                    const secChecked = sec.items.filter(i => i.isChecked).length;
                                    return (
                                        <div
                                            key={sec.sectionId || idx}
                                            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900">
                                                        {sec.title}
                                                    </h4>
                                                    {(sec.positionKey || sec.responsibilityKey) && (
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            ผู้รับผิดชอบหมวด:{' '}
                                                            {sec.positionLabel ||
                                                                getPositionLabel(sec.positionKey) ||
                                                                'ทุกตำแหน่ง'}
                                                            {sec.responsibilityKey
                                                                ? ` · หน้าที่: ${
                                                                      sec.responsibilityLabel ||
                                                                      getResponsibilityLabel(
                                                                          sec.responsibilityKey
                                                                      )
                                                                  }`
                                                                : ''}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600 tabular-nums shrink-0">
                                                    ติ๊กแล้ว {secChecked}/{sec.items.length} ข้อ
                                                </span>
                                            </div>

                                            <div className="divide-y divide-slate-100">
                                                {sec.filteredItems.map(it => (
                                                    <div
                                                        key={it.nodeId}
                                                        className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
                                                    >
                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                            {it.isChecked ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                            ) : (
                                                                <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <div
                                                                    className={`font-semibold ${
                                                                        it.isChecked
                                                                            ? 'text-slate-900'
                                                                            : 'text-slate-400'
                                                                    }`}
                                                                >
                                                                    {it.subgroupTitle
                                                                        ? `[${it.subgroupTitle}] `
                                                                        : ''}
                                                                    {it.title}
                                                                </div>
                                                                {it.description && (
                                                                    <div className="text-slate-500 mt-0.5">
                                                                        {it.description}
                                                                    </div>
                                                                )}
                                                                {it.remark && (
                                                                    <div className="text-amber-700 font-medium mt-1">
                                                                        โน้ต: {it.remark}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {it.isChecked && it.checkedByName ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 text-[11px] font-medium shrink-0 self-start">
                                                                <span>
                                                                    ✓ ติ๊กโดย{' '}
                                                                    <strong>
                                                                        {it.checkedByName}
                                                                    </strong>
                                                                    {it.checkedByPosition
                                                                        ? ` (${it.checkedByPosition})`
                                                                        : ''}
                                                                </span>
                                                                {it.checkedAt && (
                                                                    <span className="text-emerald-700 tabular-nums">
                                                                        ·{' '}
                                                                        {new Date(
                                                                            it.checkedAt
                                                                        ).toLocaleTimeString(
                                                                            'th-TH',
                                                                            {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            }
                                                                        )}{' '}
                                                                        น.
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 shrink-0">
                                                                ไม่ได้ติ๊ก
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-slate-500 truncate">
                                {snapshotCheckers.length > 0 ? (
                                    <span>
                                        ผู้ร่วมติ๊กทั้งหมด:{' '}
                                        <strong className="text-slate-800">
                                            {snapshotCheckers.join(', ')}
                                        </strong>
                                    </span>
                                ) : (
                                    <span>ไม่มีรายการที่ถูกติ๊ก</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await onDeleteRecord(record);
                                        onClose();
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>ลบใบประวัตินี้</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
