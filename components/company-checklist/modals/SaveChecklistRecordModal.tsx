import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X,
    CheckCircle2,
    AlertCircle,
    Save,
    RotateCcw,
    Users,
    Calendar,
    FileCheck2
} from 'lucide-react';
import {
    CompanyChecklist,
    CompanyChecklistNode,
    ActiveChecklistItemState,
    User
} from '../../../types';

interface SaveChecklistRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    preset: CompanyChecklist;
    sections: CompanyChecklistNode[];
    getSectionItemNodes: (sectionId: string) => CompanyChecklistNode[];
    activeItemStates: Record<string, ActiveChecklistItemState>;
    initialCaseTitle: string;
    users: User[];
    currentUser?: User;
    onConfirmSave: (
        caseTitle: string,
        summaryNote: string,
        resetAfterSave: boolean
    ) => Promise<void>;
}

export const SaveChecklistRecordModal: React.FC<SaveChecklistRecordModalProps> = ({
    isOpen,
    onClose,
    preset,
    sections,
    getSectionItemNodes,
    activeItemStates,
    initialCaseTitle,
    users,
    currentUser,
    onConfirmSave
}) => {
    const [caseTitle, setCaseTitle] = useState('');
    const [summaryNote, setSummaryNote] = useState('');
    const [resetAfterSave, setResetAfterSave] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const suggestedCaseTitle = useMemo(() => {
        const now = new Date();
        const thaiDate = now.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        return `${preset.defaultCasePrefix || preset.title} · ${thaiDate}`;
    }, [preset]);

    useEffect(() => {
        if (isOpen) {
            setCaseTitle(initialCaseTitle.trim() || '');
            setSummaryNote('');
            setResetAfterSave(true);
        }
    }, [isOpen, initialCaseTitle]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const summaryData = useMemo(() => {
        let totalItems = 0;
        let checkedItems = 0;
        const contributorSet = new Set<string>();

        const sectionRows = sections.map(sec => {
            const items = getSectionItemNodes(sec.id);
            let secChecked = 0;
            items.forEach(item => {
                totalItems += 1;
                const st = activeItemStates[item.id];
                if (st?.isChecked) {
                    checkedItems += 1;
                    secChecked += 1;
                    if (st.checkedByName) contributorSet.add(st.checkedByName);
                }
            });
            return {
                id: sec.id,
                title: sec.title,
                checked: secChecked,
                total: items.length
            };
        });

        const percent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
        return {
            totalItems,
            checkedItems,
            percent,
            sectionRows,
            contributors: Array.from(contributorSet)
        };
    }, [sections, getSectionItemNodes, activeItemStates]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalTitle = caseTitle.trim() || suggestedCaseTitle;
        setIsSaving(true);
        try {
            await onConfirmSave(finalTitle, summaryNote, resetAfterSave);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const isAllComplete =
        summaryData.totalItems > 0 && summaryData.checkedItems === summaryData.totalItems;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="save-checklist-record-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={onClose}
                    className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                >
                    <motion.div
                        key="save-checklist-record-dialog"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl my-auto"
                    >
                        {/* Sticky Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 truncate">
                                        ยืนยันการกดตกลง & บันทึกผลการเช็ค (Save Checklist Record)
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate">
                                        หัวข้อ: {preset.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body + Sticky Footer */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                                {/* 1. Case / Subject Title Input */}
                                <div className="space-y-2">
                                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
                                        ชื่อเคส / หัวข้อการบันทึกครั้งนี้ (Subject / Case Name){' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={caseTitle}
                                        onChange={e => setCaseTitle(e.target.value)}
                                        placeholder={suggestedCaseTitle}
                                        className="w-full px-3.5 py-2 text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900"
                                        autoFocus
                                    />

                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        <span className="text-[11px] text-slate-400 font-medium mr-1">
                                            ตัวช่วยกรอกด่วน:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const m = new Date().toLocaleDateString('th-TH', {
                                                    month: 'long',
                                                    year: 'numeric'
                                                });
                                                setCaseTitle(`${preset.title} (${m})`);
                                            }}
                                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            <span>+ รอบเดือนนี้</span>
                                        </button>

                                        {users.slice(0, 5).map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() =>
                                                    setCaseTitle(
                                                        `${preset.defaultCasePrefix || `${preset.title} - `}${
                                                            u.name
                                                        }${u.position ? ` (${u.position})` : ''}`
                                                    )
                                                }
                                                className="px-2.5 py-1 text-[11px] font-medium bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                                            >
                                                + {u.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Progress & Category Summary Card */}
                                <div
                                    className={`rounded-xl border p-4 space-y-3 ${
                                        isAllComplete
                                            ? 'bg-emerald-50/50 border-emerald-200'
                                            : 'bg-amber-50/40 border-amber-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isAllComplete ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                            )}
                                            <span className="text-sm font-bold text-slate-900">
                                                สรุปสถานะการเช็คที่จะถูกบันทึกเป็นประวัติ
                                            </span>
                                        </div>
                                        <span
                                            className={`text-sm font-bold tabular-nums ${
                                                isAllComplete ? 'text-emerald-700' : 'text-amber-700'
                                            }`}
                                        >
                                            {summaryData.checkedItems}/{summaryData.totalItems} ข้อ (
                                            {summaryData.percent}%)
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-200/70 max-h-36 overflow-y-auto pr-1">
                                        {summaryData.sectionRows.map(row => {
                                            const done = row.total > 0 && row.checked === row.total;
                                            return (
                                                <div
                                                    key={row.id}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <span className="text-slate-700 font-medium truncate pr-3">
                                                        • {row.title}
                                                    </span>
                                                    <span
                                                        className={`font-semibold tabular-nums shrink-0 ${
                                                            done ? 'text-emerald-700' : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {row.checked}/{row.total} {done ? '✓' : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {summaryData.contributors.length > 0 && (
                                        <div className="pt-2 border-t border-slate-200/70 flex items-center gap-2 text-xs text-slate-600">
                                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>
                                                ผู้ร่วมกดติ๊กในรอบนี้:{' '}
                                                <strong className="text-slate-900">
                                                    {summaryData.contributors.join(', ')}
                                                </strong>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Summary Note */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                                        หมายเหตุสรุปท้ายใบเช็ค (Optional Note)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={summaryNote}
                                        onChange={e => setSummaryNote(e.target.value)}
                                        placeholder="ระบุข้อสังเกต หรือรายละเอียดการส่งมอบเพิ่มเติม..."
                                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 resize-none"
                                    />
                                </div>

                                {/* 4. Reset after save toggle */}
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={resetAfterSave}
                                        onChange={e => setResetAfterSave(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                    />
                                    <div className="text-xs">
                                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                                            <span>
                                                รีเซ็ตล้างเครื่องหมายติ๊กบนกระดานหลังบันทึกเสร็จ (พร้อมเริ่มเคสใหม่)
                                            </span>
                                        </div>
                                        <p className="text-slate-500 mt-0.5">
                                            ข้อมูลที่ติ๊กในรอบนี้จะถูกเก็บไว้ในแท็บ "ประวัติการบันทึก" อย่างปลอดภัย
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Sticky Footer */}
                            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
                                <div className="text-xs text-slate-500 truncate">
                                    ผู้กดยืนยันบันทึก:{' '}
                                    <strong className="text-slate-800">
                                        {currentUser?.name || 'ผู้ใช้งาน'}
                                    </strong>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs whitespace-nowrap"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>
                                            {isSaving ? 'กำลังบันทึก...' : 'ตกลง · บันทึกเข้าประวัติ'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
