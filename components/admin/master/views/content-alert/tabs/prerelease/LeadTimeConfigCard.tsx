import React from 'react';
import { Clock, Sliders, Sparkles, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeadTimeConfigCardProps {
    leadMinutes: string;
    onChange: (minutes: string) => void;
}

const PRESETS = [
    { label: '15 นาที', value: '15' },
    { label: '30 นาที', value: '30', isRecommended: true },
    { label: '45 นาที', value: '45' },
    { label: '1 ชั่วโมง', value: '60' },
    { label: '1.5 ชั่วโมง', value: '90' },
    { label: '2 ชั่วโมง', value: '120' },
];

export const LeadTimeConfigCard: React.FC<LeadTimeConfigCardProps> = ({
    leadMinutes,
    onChange,
}) => {
    const currentVal = parseInt(leadMinutes, 10) || 30;

    const handleAdjust = (delta: number) => {
        const next = Math.max(5, Math.min(360, currentVal + delta));
        onChange(next.toString());
    };

    return (
        <motion.div
            id="lead-time-config-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600 shrink-0" />
                        เวลาแจ้งเตือนล่วงหน้า (Lead Time Countdown)
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        ระบบจะเริ่มส่งสัญญาณเตือนก่อนถึงกำหนดเวลาปล่อยคลิป (scheduled_time) ล่วงหน้าตามเวลาที่กำหนด
                    </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 font-bold rounded-2xl text-sm border border-purple-200 self-start sm:self-auto shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    เตือนล่วงหน้า {leadMinutes} นาที
                </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-500" />
                    เลือกจากค่าแนะนำ:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESETS.map((preset) => {
                        const isSelected = leadMinutes === preset.value;
                        return (
                            <motion.button
                                key={preset.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onChange(preset.value)}
                                className={`py-2.5 px-2 rounded-2xl text-xs font-semibold transition-all relative border cursor-pointer ${
                                    isSelected
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                                        : 'bg-slate-50 hover:bg-purple-50/60 text-gray-700 border-gray-200'
                                }`}
                            >
                                {preset.label}
                                {preset.isRecommended && !isSelected && (
                                    <span className="block text-[9px] font-bold text-purple-600 mt-0.5">
                                        แนะนำ
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Custom Input & Stepper */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">หรือระบุเวลาเอง:</span>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => handleAdjust(-5)}
                            className="p-1 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
                            title="ลด 5 นาที"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                            type="number"
                            min="5"
                            max="360"
                            value={leadMinutes}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-14 text-center py-0.5 text-xs font-bold text-gray-800 bg-transparent focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => handleAdjust(5)}
                            className="p-1 text-gray-500 hover:text-purple-600 hover:bg-white rounded-lg transition-all"
                            title="เพิ่ม 5 นาที"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">นาที</span>
                </div>

                <div className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    💡 ค่าปกติที่ทีม Content นิยมใช้คือ <strong className="text-gray-600">30 - 60 นาที</strong> เพื่อให้มีเวลาตรวจสอบและ Export ทัน
                </div>
            </div>
        </motion.div>
    );
};
