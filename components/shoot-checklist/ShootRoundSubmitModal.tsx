import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    CheckCircle2,
    AlertTriangle,
    Send,
    PackageCheck,
    Truck,
    ArchiveRestore,
    RotateCcw,
    FileText
} from 'lucide-react';
import { ChecklistItem, ShootRoundKey } from '../../types';
import { SHOOT_ROUND_META } from '../../context/ChecklistContext';

interface ShootRoundSubmitModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRound: ShootRoundKey;
    sessionTitle: string;
    items: ChecklistItem[];
    isSubmitting: boolean;
    onSubmit: (note: string, customTitle: string) => Promise<void>;
}

const ShootRoundSubmitModal: React.FC<ShootRoundSubmitModalProps> = ({
    isOpen,
    onClose,
    currentRound,
    sessionTitle,
    items,
    isSubmitting,
    onSubmit
}) => {
    const [titleInput, setTitleInput] = useState(sessionTitle);
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitleInput(sessionTitle);
            setNoteInput('');
        }
    }, [isOpen, sessionTitle]);

    if (!isOpen) return null;

    const roundMeta = SHOOT_ROUND_META[currentRound];
    const totalCount = items.length;
    const checkedItems = items.filter(i => i.isChecked);
    const uncheckedItems = items.filter(i => !i.isChecked);
    const isAllChecked = totalCount > 0 && uncheckedItems.length === 0;

    const getRoundAccent = (round: ShootRoundKey) => {
        switch (round) {
            case 'PACK_OUT':
                return {
                    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    btnBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
                    icon: <PackageCheck className="w-5 h-5 text-indigo-600" />
                };
            case 'PACK_BACK':
                return {
                    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                    btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200',
                    icon: <Truck className="w-5 h-5 text-amber-600" />
                };
            case 'RETURN_STORAGE':
                return {
                    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
                    icon: <ArchiveRestore className="w-5 h-5 text-emerald-600" />
                };
        }
    };

    const accent = getRoundAccent(currentRound);

    const handleConfirm = async () => {
        await onSubmit(noteInput, titleInput);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* 1. Rigid Header */}
                <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                            {accent.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">
                                บันทึกรายงานประจำรอบ
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                รอบที่ {roundMeta.index}/3 • {roundMeta.label}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 2. Scrollable Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                    {/* Round Status & Count Summary */}
                    <div
                        className={`p-4 rounded-2xl border flex items-center justify-between ${
                            isAllChecked
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-amber-50/70 border-amber-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {isAllChecked ? (
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-bold text-gray-900">
                                    {isAllChecked
                                        ? 'ตรวจเช็คอุปกรณ์ครบทุกชิ้นแล้ว!'
                                        : `ยังไม่ได้ติ๊ก ${uncheckedItems.length} รายการ`}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                    {roundMeta.description}
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                            <span
                                className={`text-xl font-bold tabular-nums ${
                                    isAllChecked ? 'text-emerald-700' : 'text-amber-700'
                                }`}
                            >
                                {checkedItems.length}/{totalCount}
                            </span>
                            <div className="text-[11px] text-gray-500 font-semibold">ชิ้น</div>
                        </div>
                    </div>

                    {/* Shoot Session Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            ชื่อคิวออกกอง / ใบงานนี้
                        </label>
                        <input
                            type="text"
                            value={titleInput}
                            onChange={e => setTitleInput(e.target.value)}
                            placeholder="เช่น ชุดถ่ายนอกสถานที่ · 21 ต.ค. 69 (ลูกค้า ABC)"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Missing / Unchecked Items Warning List */}
                    {uncheckedItems.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    รายการที่ยังไม่ได้ติ๊ก ({uncheckedItems.length} ชิ้น)
                                </span>
                                <span className="text-[11px] font-semibold text-amber-700">
                                    จะถูกบันทึกว่าไม่ได้ติ๊กในรอบนี้
                                </span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                {uncheckedItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="text-xs text-gray-700 bg-white/80 px-2.5 py-1.5 rounded-lg border border-amber-100 flex items-center justify-between"
                                    >
                                        <span className="font-medium truncate">{item.text}</span>
                                        <span className="text-[10px] font-semibold text-amber-600 shrink-0 ml-2">
                                            ยังไม่ติ๊ก
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note / Remark */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-gray-400" />
                            หมายเหตุเพิ่มเติม (ถ้ามี)
                        </label>
                        <textarea
                            rows={2}
                            value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            placeholder="เช่น แบตเตอรี่ก้อนที่ 3 ชาร์จทิ้งไว้ที่ออฟฟิศ / ขาตั้งไฟตัวเล็กฝากไว้กองถ่าย..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                        />
                    </div>

                    {/* Auto-Reset Notice */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                        <RotateCcw className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <span className="font-bold text-slate-700">รีเซ็ตอัตโนมัติหลังส่ง: </span>
                            {roundMeta.nextRound ? (
                                <>
                                    ระบบจะบันทึกชื่อคนติ๊กและเวลาเข้าประวัติ จากนั้นจะล้างเครื่องหมายติ๊กถูกและสลับไปยัง{' '}
                                    <span className="font-bold text-indigo-600">
                                        {SHOOT_ROUND_META[roundMeta.nextRound].shortLabel}
                                    </span>{' '}
                                    ให้พร้อมเช็คต่อทันที
                                </>
                            ) : (
                                <>
                                    นี่คือรอบสุดท้าย (คืนเข้าคลัง) ระบบจะปิดจบทริปนี้เป็นสถานะ{' '}
                                    <span className="font-bold text-emerald-600">ครบทั้ง 3 รอบ</span>{' '}
                                    และล้างติ๊กถูกเพื่อเตรียมพร้อมสำหรับงานถัดไป
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Rigid Sticky Footer */}
                <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px]"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] ${accent.btnBg} disabled:opacity-50`}
                    >
                        <Send className="w-4 h-4" />
                        <span>
                            {isSubmitting
                                ? 'กำลังบันทึก...'
                                : `ยืนยันส่งรอบที่ ${roundMeta.index} (${roundMeta.label})`}
                        </span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShootRoundSubmitModal;
