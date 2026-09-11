import React, { useMemo } from 'react';
import { ShieldCheck, Check, Info, Sparkles, CheckCheck, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption } from '../../../../../../../types';

interface StatusGateConfigCardProps {
    masterOptions: MasterOption[];
    requiredStatuses: string[];
    onToggleStatus: (statusKey: string) => void;
    onBatchSelect: (statusKeys: string[]) => void;
}

// Fallback status definitions if master data is empty
const DEFAULT_SYSTEM_STATUSES = [
    { key: 'APPROVE', label: 'อนุมัติแล้ว (APPROVE)', color: '#10b981' },
    { key: 'FINAL', label: 'ไฟนอลพร้อมลง (FINAL)', color: '#059669' },
    { key: 'DONE', label: 'เสร็จสมบูรณ์ (DONE)', color: '#0d9488' },
    { key: 'EDIT_CLIP', label: 'กำลังตัดต่อ (EDIT_CLIP)', color: '#6366f1' },
    { key: 'FEEDBACK', label: 'รอตรวจ / ฟีดแบ็ก (FEEDBACK)', color: '#8b5cf6' },
    { key: 'SHOOTING', label: 'กำลังถ่ายทำ (SHOOTING)', color: '#f59e0b' },
    { key: 'SCRIPT', label: 'เขียนบท (SCRIPT)', color: '#ec4899' },
    { key: 'IDEA', label: 'ไอเดีย (IDEA)', color: '#64748b' },
];

export const StatusGateConfigCard: React.FC<StatusGateConfigCardProps> = ({
    masterOptions,
    requiredStatuses,
    onToggleStatus,
    onBatchSelect,
}) => {
    // Dynamically retrieve active content STATUS master options
    const availableStatuses = useMemo(() => {
        const fromMaster = masterOptions
            .filter((o) => o.type === 'STATUS' && o.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (fromMaster.length > 0) {
            return fromMaster.map((opt) => ({
                key: opt.key,
                label: opt.label || opt.key,
                color: opt.color || '#6366f1',
                description: opt.description,
            }));
        }

        return DEFAULT_SYSTEM_STATUSES;
    }, [masterOptions]);

    // Helpers for quick presets
    const handleSelectDoneApproves = () => {
        const readyKeys = availableStatuses
            .filter((s) => {
                const k = s.key.toUpperCase();
                const l = s.label.toUpperCase();
                return (
                    k.includes('APPROV') ||
                    k.includes('DONE') ||
                    k.includes('FINAL') ||
                    k.includes('READY') ||
                    k.includes('PUBLISH') ||
                    l.includes('อนุมัติ') ||
                    l.includes('เสร็จ') ||
                    l.includes('พร้อม') ||
                    l.includes('ไฟนอล')
                );
            })
            .map((s) => s.key);

        onBatchSelect(readyKeys.length > 0 ? readyKeys : ['APPROVE', 'DONE', 'FINAL']);
    };

    const handleSelectAll = () => {
        onBatchSelect(availableStatuses.map((s) => s.key));
    };

    const handleClearAll = () => {
        onBatchSelect([]);
    };

    return (
        <motion.div
            id="status-gate-config-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        สถานะที่ถือว่าพร้อมแล้ว (Status Gate)
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        เลือกสถานะของคอนเทนต์ที่ <strong>&quot;พร้อมปล่อย / ไม่ต้องส่งแจ้งเตือนเตือน&quot;</strong>
                    </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={handleSelectDoneApproves}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-3 h-3" />
                        เลือกกลุ่ม Approve / Final
                    </button>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all cursor-pointer"
                    >
                        <CheckCheck className="w-3 h-3" />
                        เลือกทั้งหมด
                    </button>
                    <button
                        type="button"
                        onClick={handleClearAll}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-400 hover:text-gray-600 bg-transparent hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                    >
                        <RotateCcw className="w-3 h-3" />
                        ล้าง
                    </button>
                </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {availableStatuses.map((status) => {
                    const isChecked = requiredStatuses.some(
                        (s) => s.toUpperCase() === status.key.toUpperCase()
                    );
                    return (
                        <motion.button
                            key={status.key}
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onToggleStatus(status.key)}
                            className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                isChecked
                                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200 shadow-xs'
                                    : 'bg-slate-50/50 hover:bg-slate-100/70 border-gray-200 text-gray-400'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                                    style={{
                                        backgroundColor: status.color.startsWith('#')
                                            ? status.color
                                            : '#10b981',
                                    }}
                                />
                                <div className="truncate">
                                    <span
                                        className={`text-xs font-bold block truncate ${
                                            isChecked ? 'text-gray-900' : 'text-gray-600'
                                        }`}
                                    >
                                        {status.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono block">
                                        KEY: {status.key}
                                    </span>
                                </div>
                            </div>

                            <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 transition-all ${
                                    isChecked
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                        : 'border-gray-300 bg-white'
                                }`}
                            >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Explanation Note */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800/90 leading-relaxed">
                    <strong>หลักการทำงาน:</strong> หากคลิปใกล้ถึงกำหนดลงและยังอยู่ในสถานะที่ <strong>ไม่ได้ติ๊กเลือก</strong> ไว้ด้านบน (เช่น ยังค้างอยู่ที่ <em>EDIT_CLIP</em> หรือ <em>FEEDBACK</em>) ระบบจะถือว่ายังไม่พร้อมและส่งการแจ้งเตือนเตือนทีมงานทันที
                </div>
            </div>
        </motion.div>
    );
};
