import React from 'react';
import { History, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface LookbackConfigCardProps {
    maxLookbackHours: string;
    onChangeLookback: (val: string) => void;
}

const LOOKBACK_PRESETS = [
    { label: '1 ชั่วโมง', value: '1' },
    { label: '2 ชั่วโมง (แนะนำ)', value: '2', isRecommended: true },
    { label: '3 ชั่วโมง', value: '3' },
    { label: '4 ชั่วโมง', value: '4' },
    { label: '6 ชั่วโมง', value: '6' },
];

export const LookbackConfigCard: React.FC<LookbackConfigCardProps> = ({
    maxLookbackHours,
    onChangeLookback,
}) => {
    return (
        <motion.div
            id="lookback-config-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-600 shrink-0" />
                        กรอบเวลาชดเชยที่เลยมาแล้ว (Max Lookback Window)
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        ระยะเวลาย้อนหลังสูงสุดที่ระบบจะยังตามเตือนสำหรับคลิปที่เลยเวลาลงไปแล้วแต่ยังไม่ได้ตรวจอนุมัติ
                    </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs border border-slate-200 self-start sm:self-auto shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    ย้อนหลังสูงสุด {maxLookbackHours} ชม.
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {LOOKBACK_PRESETS.map((preset) => {
                    const isSelected = maxLookbackHours === preset.value;
                    return (
                        <motion.button
                            key={preset.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onChangeLookback(preset.value)}
                            className={`py-3 px-2 rounded-2xl text-xs font-semibold transition-all text-center border cursor-pointer ${
                                isSelected
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200 font-bold'
                                    : 'bg-slate-50 hover:bg-slate-100/80 text-gray-700 border-gray-200'
                            }`}
                        >
                            {preset.label}
                        </motion.button>
                    );
                })}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 leading-relaxed">
                    <strong>ประโยชน์ของ Lookback:</strong> ป้องกันกรณีที่บอททำงานไม่ตรงเวลา หรือมีคลิปที่เลทเกินกำหนด ระบบจะยังตรวจย้อนหลังไปตามจำนวนชั่วโมงนี้ เพื่อไม่ให้คลิปตกหล่น
                </div>
            </div>
        </motion.div>
    );
};
