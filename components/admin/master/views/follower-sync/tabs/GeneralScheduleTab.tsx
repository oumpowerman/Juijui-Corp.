import React, { useState } from 'react';
import { Clock, Sliders, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { FollowerSyncConfig } from '../types';
import TimePickerModal from '../../../../../ui/TimePickerModal';

interface GeneralScheduleTabProps {
    config: FollowerSyncConfig;
    onChange: (updater: (prev: FollowerSyncConfig) => FollowerSyncConfig) => void;
}

export const GeneralScheduleTab: React.FC<GeneralScheduleTabProps> = ({
    config,
    onChange
}) => {
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* 1. Master On/Off Switch */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            config.isEnabled 
                                ? 'bg-indigo-100 text-indigo-600' 
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">
                                เปิดใช้งาน Cronjob อัตโนมัติ (Automated Schedule)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                สั่งให้เซิร์ฟเวอร์รันดึงข้อมูลตามรอบเวลาประจำวันโดยอัตโนมัติ
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={config.isEnabled}
                            onChange={e => onChange(prev => ({ ...prev, isEnabled: e.target.checked }))}
                        />
                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold ${
                    config.isEnabled 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${config.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span>สถานะปัจจุบัน: {config.isEnabled ? 'เปิดใช้งาน (Active)' : 'ปิดการทำงาน (Paused)'}</span>
                    </div>
                    {config.isEnabled && (
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            รันทุกวันเวลา {config.syncTime} น. (Asia/Bangkok)
                        </span>
                    )}
                </div>
            </div>

            {/* 2. Schedule Timing Config */}
            <div className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 transition-opacity ${!config.isEnabled ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                        กำหนดเวลาทำงานประจำวัน (Daily Sync Time)
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            เลือกเวลา (Time in Asia/Bangkok UTC+7)
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsTimePickerOpen(true)}
                                className="flex-1 flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-black text-xl hover:bg-slate-100 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-left cursor-pointer group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Clock className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                    <span>{config.syncTime} น.</span>
                                </span>
                                <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    เลือกเวลา 🕒
                                </span>
                            </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            * แนะนำช่วง 06:00 - 08:30 น. ก่อนเริ่มงานในแต่ละวัน
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            เวลารวดเร็วยอดนิยม (Quick Presets)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: '06:00 (เช้าตรู่)', value: '06:00' },
                                { label: '08:00 (ค่าเริ่มต้น)', value: '08:00' },
                                { label: '12:00 (เที่ยงวัน)', value: '12:00' },
                                { label: '20:00 (รอบค่ำ)', value: '20:00' },
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => onChange(prev => ({ ...prev, syncTime: preset.value }))}
                                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                        config.syncTime === preset.value
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Rate Limit & Delay Throttling */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">
                            การควบคุมความเร็ว (Rate Limit & Throttling)
                        </h3>
                        <p className="text-xs text-slate-500">
                            หน่วงเวลาคั่นระหว่างแต่ละช่อง เพื่อป้องกันไม่ให้ IP เซิร์ฟเวอร์ถูกมองว่าเป็นบอท
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {[
                        { label: 'รวดเร็ว (800ms)', desc: 'ประหยัดเวลา เหมาะกับช่องน้อยกว่า 10 ช่อง', value: 800 },
                        { label: 'มาตรฐาน (1200ms)', desc: 'ค่าแนะนำ มีความเสถียรและปลอดภัยสูง', value: 1200 },
                        { label: 'ปลอดภัยสูง (2000ms)', desc: 'เหมาะกับช่องจำนวนมาก ป้องกัน Rate Limit ได้ดีเยี่ยม', value: 2000 },
                    ].map(opt => (
                        <div
                            key={opt.value}
                            onClick={() => onChange(prev => ({ ...prev, rateLimitDelayMs: opt.value }))}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                config.rateLimitDelayMs === opt.value
                                    ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                            }`}
                        >
                            <span className="text-xs font-bold text-slate-900 block">{opt.label}</span>
                            <span className="text-[11px] text-slate-500 mt-1 block leading-snug">{opt.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Picker Modal */}
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                onSelect={(selectedTime) => onChange(prev => ({ ...prev, syncTime: selectedTime }))}
                initialTime={config.syncTime}
            />
        </div>
    );
};
