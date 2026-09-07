import React from 'react';
import { Send, History, Info, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DestinationAndLookbackCardProps {
    targetDestination: string;
    maxLookbackHours: string;
    onChangeDestination: (val: string) => void;
    onChangeLookback: (val: string) => void;
}

const LOOKBACK_PRESETS = [
    { label: '1 ชั่วโมง', value: '1' },
    { label: '2 ชั่วโมง (มาตรฐาน)', value: '2' },
    { label: '3 ชั่วโมง', value: '3' },
    { label: '4 ชั่วโมง', value: '4' },
];

export const DestinationAndLookbackCard: React.FC<DestinationAndLookbackCardProps> = ({
    targetDestination,
    maxLookbackHours,
    onChangeDestination,
    onChangeLookback,
}) => {
    return (
        <motion.div
            id="destination-and-lookback-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5"
        >
            {/* Target Destination Input */}
            <div className="space-y-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600 shrink-0" />
                        ปลายทางห้องแชต LINE
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        ระบุ LINE Group ID หรือ Room ID ที่ต้องการให้ระบบส่งแจ้งเตือน
                    </p>
                </div>

                <div className="space-y-2">
                    <input
                        type="text"
                        value={targetDestination}
                        onChange={(e) => onChangeDestination(e.target.value)}
                        placeholder="เช่น C1234567890abcdef... (เว้นว่างไว้เพื่อใช้กลุ่มหลัก)"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-gray-200 rounded-2xl font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all"
                    />
                    <div className="flex items-start gap-1.5 text-[11px] text-gray-400 leading-relaxed">
                        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span>
                            หากเว้นว่างไว้ ระบบจะยิงเข้า <strong className="text-gray-600">LINE Group กลางของบริษัท</strong> หรือส่งตรงเข้าแชตส่วนตัวของผู้รับผิดชอบงาน
                        </span>
                    </div>
                </div>
            </div>

            {/* Lookback Window Selection */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <History className="w-4 h-4 text-purple-600 shrink-0" />
                        กรอบเวลาชดเชยที่เลยมาแล้ว (Max Lookback Window)
                    </label>
                    <p className="text-xs text-gray-500">
                        ระยะเวลาย้อนหลังสูงสุดที่ระบบจะยังตามเตือนสำหรับคลิปที่เลยเวลาลงไปแล้วแต่ยังไม่ได้ตรวจ
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LOOKBACK_PRESETS.map((preset) => {
                        const isSelected = maxLookbackHours === preset.value;
                        return (
                            <motion.button
                                key={preset.value}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onChangeLookback(preset.value)}
                                className={`py-2.5 px-2 rounded-2xl text-xs font-semibold transition-all text-center border cursor-pointer ${
                                    isSelected
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                        : 'bg-slate-50 hover:bg-slate-100 text-gray-700 border-gray-200'
                                }`}
                            >
                                {preset.label}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};
