import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X,
    ShieldCheck,
    Calendar,
    Layers,
    Tag,
    Clock,
    Sparkles
} from 'lucide-react';
import {
    CompanyChecklist,
    ChecklistResetCycle,
    ChecklistCustomIntervalUnit
} from '../../../types';
import { getCustomUnitLabel } from '../utils/checklistCadenceUtils';

interface ChecklistBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBoard?: CompanyChecklist | null;
    onSave: (payload: {
        title: string;
        description: string;
        resetCycle: ChecklistResetCycle;
        customIntervalCount?: number;
        customIntervalUnit?: ChecklistCustomIntervalUnit;
        color: string;
        icon: string;
        defaultCasePrefix?: string;
        isActive: boolean;
    }) => Promise<void>;
}

const CYCLE_OPTIONS: {
    value: ChecklistResetCycle;
    label: string;
    desc: string;
}[] = [
    {
        value: 'ONCE',
        label: 'ตามเคสงานทั่วไป (Ad-hoc)',
        desc: 'เช่น น้องฝึกงานจบ, พนักงานใหม่, ส่งมอบโปรเจกต์'
    },
    {
        value: 'MONTHLY',
        label: 'ประจำทุกเดือน (Monthly)',
        desc: 'แจ้งเตือนและเช็คสถานะการส่งงานทุกต้นเดือน/รายเดือนอัตโนมัติ'
    },
    {
        value: 'WEEKLY',
        label: 'ประจำทุกสัปดาห์ (Weekly)',
        desc: 'แจ้งเตือนและเช็คสถานะการส่งงานประจำสัปดาห์อัตโนมัติ'
    },
    {
        value: 'DAILY',
        label: 'ประจำทุกวัน (Daily)',
        desc: 'ตรวจเช็คประจำวัน เช่น ความปลอดภัยก่อนปิดออฟฟิศ'
    },
    {
        value: 'CUSTOM',
        label: 'กำหนดความถี่เอง (เช่น ทุก 3 เดือน / ทุก 15 วัน)',
        desc: 'ระบุจำนวนวัน สัปดาห์ หรือเดือนที่ต้องการให้ระบบนับรอบเตือนเอง'
    }
];

const QUICK_CUSTOM_PRESETS: {
    label: string;
    count: number;
    unit: ChecklistCustomIntervalUnit;
}[] = [
    { label: 'ทุก 15 วัน', count: 15, unit: 'DAYS' },
    { label: 'ทุก 2 สัปดาห์', count: 2, unit: 'WEEKS' },
    { label: 'ทุก 3 เดือน (รายไตรมาส)', count: 3, unit: 'MONTHS' },
    { label: 'ทุก 6 เดือน (ครึ่งปี)', count: 6, unit: 'MONTHS' }
];

const COLOR_OPTIONS: { value: string; label: string; swatch: string }[] = [
    { value: 'indigo', label: 'Indigo (มาตรฐานองค์กร)', swatch: 'bg-indigo-600' },
    { value: 'emerald', label: 'Emerald (ตรวจสอบประจำรอบ)', swatch: 'bg-emerald-600' },
    { value: 'amber', label: 'Amber (อุปกรณ์และสตูดิโอ)', swatch: 'bg-amber-600' },
    { value: 'rose', label: 'Rose (มาตรการสำคัญ/เร่งด่วน)', swatch: 'bg-rose-600' },
    { value: 'sky', label: 'Sky (ไอทีและระบบข้อมูล)', swatch: 'bg-sky-600' }
];

export const ChecklistBoardModal: React.FC<ChecklistBoardModalProps> = ({
    isOpen,
    onClose,
    editingBoard,
    onSave
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [defaultCasePrefix, setDefaultCasePrefix] = useState('');
    const [resetCycle, setResetCycle] = useState<ChecklistResetCycle>('ONCE');
    const [customIntervalCount, setCustomIntervalCount] = useState<number>(3);
    const [customIntervalUnit, setCustomIntervalUnit] =
        useState<ChecklistCustomIntervalUnit>('MONTHS');
    const [color, setColor] = useState('indigo');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingBoard) {
            setTitle(editingBoard.title);
            setDescription(editingBoard.description || '');
            setDefaultCasePrefix(editingBoard.defaultCasePrefix || '');
            setResetCycle(editingBoard.resetCycle || 'ONCE');
            setCustomIntervalCount(editingBoard.customIntervalCount || 3);
            setCustomIntervalUnit(editingBoard.customIntervalUnit || 'MONTHS');
            setColor(editingBoard.color || 'indigo');
        } else {
            setTitle('');
            setDescription('');
            setDefaultCasePrefix('');
            setResetCycle('ONCE');
            setCustomIntervalCount(3);
            setCustomIntervalUnit('MONTHS');
            setColor('indigo');
        }
    }, [editingBoard, isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSubmitting(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim(),
                defaultCasePrefix: defaultCasePrefix.trim() || undefined,
                resetCycle,
                customIntervalCount:
                    resetCycle === 'CUSTOM'
                        ? Math.max(1, Number(customIntervalCount) || 1)
                        : undefined,
                customIntervalUnit:
                    resetCycle === 'CUSTOM' ? customIntervalUnit : undefined,
                color,
                icon: 'ShieldCheck',
                isActive: true
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="checklist-board-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={onClose}
                    className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
                >
                    <motion.div
                        key="checklist-board-modal-dialog"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-auto"
                    >
                        {/* Sticky Header */}
                        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 shrink-0 bg-white">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                    {editingBoard
                                        ? 'แก้ไขหัวข้อ Checklist และความถี่การตรวจ'
                                        : 'สร้างหัวข้อ Checklist ใหม่'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body + Sticky Footer inside Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col flex-1 min-h-0"
                        >
                            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                                        ชื่อหัวข้อ Checklist{' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="เช่น ตรวจอุปกรณ์ประจำต้นเดือน หรือ เช็คลิสต์รับพนักงานใหม่..."
                                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                                        คำอธิบาย / วัตถุประสงค์ของหัวข้อนี้
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="ระบุรายละเอียดหรือขั้นตอนการใช้งานเช็คลิสต์ชุดนี้..."
                                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900 resize-none"
                                    />
                                </div>

                                {/* Cadence / Frequency Selector */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-indigo-600" />
                                        <span>
                                            ความถี่การตรวจ (Cadence & Auto-Reminder)
                                        </span>
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {CYCLE_OPTIONS.map((opt, idx) => {
                                            const active = resetCycle === opt.value;
                                            const isFullSpan =
                                                idx === CYCLE_OPTIONS.length - 1;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setResetCycle(opt.value)}
                                                    className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                                                        isFullSpan ? 'sm:col-span-2' : ''
                                                    } ${
                                                        active
                                                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold flex items-center justify-between gap-2">
                                                        <span>{opt.label}</span>
                                                        {active && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                                                                เลือกอยู่
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`text-[11px] mt-0.5 leading-snug ${
                                                            active
                                                                ? 'text-slate-300'
                                                                : 'text-slate-500'
                                                        }`}
                                                    >
                                                        {opt.desc}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Slide-Down Custom Interval Configurator */}
                                    <AnimatePresence initial={false}>
                                        {resetCycle === 'CUSTOM' && (
                                            <motion.div
                                                key="custom-cadence-drawer"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: [0.16, 1, 0.3, 1]
                                                }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-2.5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                                                        <span className="text-xs font-bold text-indigo-950">
                                                            ตรวจเช็คทุกๆ:
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={365}
                                                            value={customIntervalCount}
                                                            onChange={e =>
                                                                setCustomIntervalCount(
                                                                    Math.max(
                                                                        1,
                                                                        parseInt(
                                                                            e.target.value,
                                                                            10
                                                                        ) || 1
                                                                    )
                                                                )
                                                            }
                                                            className="w-20 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-slate-900 text-center tabular-nums focus:outline-none focus:border-slate-900"
                                                        />
                                                        <select
                                                            value={customIntervalUnit}
                                                            onChange={e =>
                                                                setCustomIntervalUnit(
                                                                    e.target
                                                                        .value as ChecklistCustomIntervalUnit
                                                                )
                                                            }
                                                            className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                                                        >
                                                            <option value="DAYS">วัน</option>
                                                            <option value="WEEKS">
                                                                สัปดาห์
                                                            </option>
                                                            <option value="MONTHS">
                                                                เดือน
                                                            </option>
                                                        </select>
                                                    </div>

                                                    {/* Quick Custom Interval Presets */}
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="text-[11px] font-semibold text-indigo-700 mr-1">
                                                            เลือกด่วน:
                                                        </span>
                                                        {QUICK_CUSTOM_PRESETS.map(qp => {
                                                            const isSelectedPreset =
                                                                customIntervalCount ===
                                                                    qp.count &&
                                                                customIntervalUnit ===
                                                                    qp.unit;
                                                            return (
                                                                <button
                                                                    key={qp.label}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setCustomIntervalCount(
                                                                            qp.count
                                                                        );
                                                                        setCustomIntervalUnit(
                                                                            qp.unit
                                                                        );
                                                                    }}
                                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                                                        isSelectedPreset
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-white text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100/60'
                                                                    }`}
                                                                >
                                                                    {qp.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="text-[11px] text-indigo-800 flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                        <span>
                                                            ระบบจะนับจากใบประวัติล่าสุดและแจ้งเตือนอัตโนมัติเมื่อครบกำหนดทุก{' '}
                                                            <strong>
                                                                {customIntervalCount}{' '}
                                                                {getCustomUnitLabel(
                                                                    customIntervalUnit
                                                                )}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                        <Tag className="w-4 h-4 text-slate-500" />
                                        <span>
                                            คำนำหน้าชื่อเคสอัตโนมัติ (Default Case Prefix)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={defaultCasePrefix}
                                        onChange={e => setDefaultCasePrefix(e.target.value)}
                                        placeholder={
                                            resetCycle === 'ONCE'
                                                ? 'เช่น ตรวจเช็คเคส: หรือ รับพนักงานใหม่:'
                                                : `หากเว้นว่าง ระบบจะใช้ "${
                                                      title.trim() || 'ชื่อหัวข้อ'
                                                  } - รอบเวลาปัจจุบัน" ให้อัตโนมัติ`
                                        }
                                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                                        <Layers className="w-4 h-4 text-slate-500" />
                                        <span>โทนสีประจำหัวข้อ</span>
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLOR_OPTIONS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                                                    color === c.value
                                                        ? 'border-slate-900 bg-slate-100 text-slate-900 font-semibold'
                                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <span
                                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.swatch}`}
                                                />
                                                <span>{c.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !title.trim()}
                                    className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                                >
                                    {isSubmitting
                                        ? 'กำลังบันทึก...'
                                        : editingBoard
                                          ? 'บันทึกการแก้ไข'
                                          : 'สร้างหัวข้อ Checklist'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
