import React, { useMemo } from 'react';
import { Sunrise, Clock, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, Info, CheckCheck, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { MasterOption } from '../../../../../types';
import { DailyOverdueConfigCardProps } from './types';

export type { DailyOverdueConfigCardProps };

const TIME_PRESETS = [
    { label: '07:30 น.', value: '07:30', desc: 'ช่วงเช้าตรู่' },
    { label: '08:00 น.', value: '08:00', desc: 'เวลามาตรฐาน (แนะนำ)', isDefault: true },
    { label: '08:30 น.', value: '08:30', desc: 'ก่อนเริ่มงาน' },
    { label: '09:00 น.', value: '09:00', desc: 'เวลาเข้างาน' },
    { label: '10:00 น.', value: '10:00', desc: 'ช่วงสาย' },
];

const DEFAULT_SYSTEM_STATUSES = [
    { key: 'DONE', label: 'Done ✅ (เสร็จสิ้น)', color: '#10b981' },
    { key: 'APPROVE', label: 'Approve 👍 (อนุมัติแล้ว)', color: '#059669' },
    { key: 'FINAL', label: 'Final 🎬 (ไฟนอลพร้อมลง)', color: '#0d9488' },
    { key: 'EDIT_DRAFT_2', label: 'Edit Draft 2 🔧 (ตัดต่อดราฟท์ 2)', color: '#06b6d4' },
    { key: 'FEEDBACK_1', label: 'Feedback 1 🗣️ (ฟีดแบ็ก 1)', color: '#a855f7' },
    { key: 'EDIT_DRAFT_1', label: 'Edit Draft1 🛠️ (ตัดต่อดราฟท์ 1)', color: '#6366f1' },
    { key: 'FEEDBACK', label: 'Feedback 💬 (รอตรวจฟีดแบ็ก)', color: '#ec4899' },
    { key: 'EDIT_CLIP', label: 'Edit Clip ✂️ (กำลังตัดต่อ)', color: '#3b82f6' },
    { key: 'SHOOTING', label: 'Shooting 🎥 (กำลังถ่ายทำ)', color: '#f59e0b' },
    { key: 'SCRIPT', label: 'Script ✍️ (เขียนบท)', color: '#eab308' },
    { key: 'IDEA', label: 'Idea/Draft 💡 (ไอเดีย/บรีฟ)', color: '#64748b' },
];

export const DailyOverdueConfigCard: React.FC<DailyOverdueConfigCardProps> = ({
    isDailyAlertEnabled,
    onToggleEnabled,
    dailyAlertTime,
    onChangeAlertTime,
    excludedStatuses,
    onToggleExcludedStatus,
    onBatchSelectExcludedStatuses,
    masterOptions,
}) => {
    // Single Source of Truth: Retrieve active content STATUS master options
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

    // Quick Presets
    const handleSelectCompletedPreset = () => {
        const completedKeys = availableStatuses
            .filter((s) => {
                const k = s.key.toUpperCase();
                const l = s.label.toUpperCase();
                return (
                    k.includes('DONE') ||
                    k.includes('APPROV') ||
                    k.includes('FINAL') ||
                    k.includes('PUBLISH') ||
                    k.includes('POSTED') ||
                    k.includes('COMPLETE') ||
                    k.includes('SUCCESS') ||
                    k.includes('PASS') ||
                    l.includes('เสร็จ') ||
                    l.includes('อนุมัติ') ||
                    l.includes('เผยแพร่') ||
                    l.includes('ไฟนอล')
                );
            })
            .map((s) => s.key);

        const finalKeys = completedKeys.length > 0 ? completedKeys : ['DONE', 'APPROVE', 'FINAL'];
        if (onBatchSelectExcludedStatuses) {
            onBatchSelectExcludedStatuses(finalKeys);
        } else {
            finalKeys.forEach(k => {
                if (!excludedStatuses.includes(k)) onToggleExcludedStatus(k);
            });
        }
    };

    const handleSelectAll = () => {
        const allKeys = availableStatuses.map((s) => s.key);
        if (onBatchSelectExcludedStatuses) {
            onBatchSelectExcludedStatuses(allKeys);
        }
    };

    const handleClearAll = () => {
        if (onBatchSelectExcludedStatuses) {
            onBatchSelectExcludedStatuses([]);
        }
    };

    return (
        <div id="daily-overdue-config-card" className="space-y-6">
            {/* 1. Master Toggle Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                        <Sunrise className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">
                                ระบบสรุปคลิปค้างลงประจำวัน (Daily Overdue Summary)
                            </h3>
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    isDailyAlertEnabled
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                                {isDailyAlertEnabled ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        เปิดใช้งาน (Active)
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-3 h-3 text-slate-500" />
                                        ปิดการทำงาน
                                    </>
                                )}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                            รัน Cron Job อัตโนมัติทุกเช้าเพื่อตรวจสอบคลิปที่เลยกำหนดลงในอดีต (วันที่/เวลา &lt; เวลาปัจจุบัน) หากพบคลิปที่ยังไม่ได้ปรับสถานะเป็นลงเสร็จแล้ว ระบบจะส่งรายงานสรุปแยกตามช่อง (LINE Flex Carousel) ให้ทีมงานทราบทันที
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isDailyAlertEnabled}
                            onChange={(e) => onToggleEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                </div>
            </motion.div>

            {/* 2. Alert Time Picker & Presets */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            ตั้งเวลาส่งสรุปประจำวัน (Morning Alert Time)
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                            เลือกเวลาที่ต้องการให้ระบบประมวลผลและยิงแจ้งเตือนเข้า LINE กลุ่ม (เวลาประเทศไทย Asia/Bangkok)
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 font-bold rounded-2xl text-xs border border-amber-200 self-start sm:self-auto">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        เวลาปัจจุบัน: {dailyAlertTime} น.
                    </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {TIME_PRESETS.map((preset) => {
                        const isSelected = dailyAlertTime === preset.value;
                        return (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => onChangeAlertTime(preset.value)}
                                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                                        : 'bg-slate-50/60 border-gray-200 hover:bg-slate-100/80 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-gray-900">
                                        {preset.label}
                                    </span>
                                    {preset.isDefault && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/60 text-amber-900">
                                            แนะนำ
                                        </span>
                                    )}
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1">
                                    {preset.desc}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Time Input & Tech Info */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-700 whitespace-nowrap">
                            หรือระบุเวลาเอง:
                        </label>
                        <input
                            type="time"
                            value={dailyAlertTime}
                            onChange={(e) => onChangeAlertTime(e.target.value)}
                            className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 shadow-2xs"
                        />
                        <span className="text-xs text-gray-500 font-medium">น.</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>เมื่อบันทึก ระบบจะปรับตั้งเวลาบนฐานข้อมูล pg_cron ให้ทันที</span>
                    </div>
                </div>
            </motion.div>

            {/* 3. Excluded Statuses (สถานะที่ยกเว้น ไม่นับว่าค้างลง) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            สถานะที่ถือว่าลงเสร็จแล้ว (Excluded / Done Statuses)
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            คลิปที่มีสถานะที่เลือกไว้ด้านล่าง <strong>&quot;จะไม่ถูกนับเป็นคลิปค้างลง&quot;</strong> ในรายงานสรุปยามเช้า
                        </p>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleSelectCompletedPreset}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-3 h-3" />
                            เลือกกลุ่ม Done / Approve / Final
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

                {/* Status Grid matching Single Source of Truth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {availableStatuses.map((status) => {
                        const isExcluded = excludedStatuses.some(
                            (s) => s.toUpperCase() === status.key.toUpperCase()
                        );
                        return (
                            <motion.button
                                key={status.key}
                                type="button"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => onToggleExcludedStatus(status.key)}
                                className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                    isExcluded
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
                                                : '#6366f1',
                                        }}
                                    />
                                    <div className="min-w-0">
                                        <div
                                            className={`text-xs font-bold truncate ${
                                                isExcluded ? 'text-gray-900' : 'text-gray-600'
                                            }`}
                                        >
                                            {status.label}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono">
                                            {status.key}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                        isExcluded
                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                            : 'bg-white border-gray-300 text-transparent'
                                    }`}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <div className="font-bold">หลักการทำงาน:</div>
                        <p className="leading-relaxed text-amber-800">
                            หากคลิปมีกำหนดลงก่อนเวลาสรุป และ<strong>ยังมีสถานะนอกเหนือจากที่เลือกไว้ด้านบน</strong> (เช่น ยังอยู่สถานะ ไอเดีย, เขียนบท, กำลังตัดต่อ, รอตรวจ) ระบบจะจัดว่าเป็น <strong>&quot;คลิปค้างลง&quot;</strong> และรวบรวมส่งสรุปยามเช้าเข้า LINE กลุ่มทันที
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
