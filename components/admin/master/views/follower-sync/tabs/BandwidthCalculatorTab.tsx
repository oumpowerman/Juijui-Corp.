import React from 'react';
import { Wifi, TrendingUp, Info, ShieldCheck, Zap } from 'lucide-react';
import { FollowerSyncConfig } from '../types';

interface BandwidthCalculatorTabProps {
    config: FollowerSyncConfig;
    totalChannelsCount: number;
    selectedChannelsCount: number;
}

export const BandwidthCalculatorTab: React.FC<BandwidthCalculatorTabProps> = ({
    config,
    totalChannelsCount,
    selectedChannelsCount
}) => {
    const enabledPlatformsCount = Object.values(config.platforms).filter(Boolean).length;

    // Calculation formulas
    const estimatedDailyMb = (selectedChannelsCount * 0.15 * (enabledPlatformsCount / 4)).toFixed(2);
    const estimatedMonthlyMb = (selectedChannelsCount * 4.5 * (enabledPlatformsCount / 4)).toFixed(1);

    return (
        <div className="space-y-6">
            {/* Main Benchmark Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base">
                            📊 การคำนวณปริมาณ Data & Bandwidth
                        </h3>
                        <p className="text-xs text-slate-500">
                            ตารางเปรียบเทียบและการประเมินทรัพยากรการรับส่งข้อมูลผ่านระบบเครือข่าย
                        </p>
                    </div>
                </div>

                {/* Benchmark Comparison Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                            <tr>
                                <th className="p-3.5">รายการ</th>
                                <th className="p-3.5 text-center">ปริมาณต่อ 1 Channel</th>
                                <th className="p-3.5 text-center text-indigo-700 bg-indigo-50/50">ถ้ามี 20 Channels</th>
                                <th className="p-3.5 text-center">ถ้ามี 100 Channels</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                                <td className="p-3.5 font-semibold text-slate-900">
                                    ขนาด Data ต่อ Request <br/>
                                    <span className="text-[11px] text-slate-400 font-normal">(ดึงเฉพาะ HTML Header)</span>
                                </td>
                                <td className="p-3.5 text-center font-mono">~50 KB – 150 KB</td>
                                <td className="p-3.5 text-center font-mono font-bold text-indigo-700 bg-indigo-50/30">~1 MB – 3 MB</td>
                                <td className="p-3.5 text-center font-mono">~5 MB – 15 MB</td>
                            </tr>
                            <tr>
                                <td className="p-3.5 font-semibold text-slate-900">
                                    Bandwidth รวมต่อวัน <br/>
                                    <span className="text-[11px] text-slate-400 font-normal">(รันวันละ 1 ครั้ง ตอน {config.syncTime} น.)</span>
                                </td>
                                <td className="p-3.5 text-center font-mono">~0.15 MB / วัน</td>
                                <td className="p-3.5 text-center font-mono font-bold text-indigo-700 bg-indigo-50/30">~3 MB / วัน</td>
                                <td className="p-3.5 text-center font-mono">~15 MB / วัน</td>
                            </tr>
                            <tr className="bg-slate-50/60 font-semibold">
                                <td className="p-3.5 font-bold text-slate-900">
                                    Bandwidth รวมต่อเดือน <br/>
                                    <span className="text-[11px] text-slate-400 font-normal">(30 วัน)</span>
                                </td>
                                <td className="p-3.5 text-center font-mono text-emerald-600 font-bold">~4.5 MB / เดือน</td>
                                <td className="p-3.5 text-center font-mono font-black text-indigo-700 bg-indigo-100/60">~90 MB / เดือน</td>
                                <td className="p-3.5 text-center font-mono text-purple-700 font-bold">~450 MB / เดือน</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dynamic Live Estimation Card */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-bold text-indigo-950 text-sm">
                            คำนวณสดตามการตั้งค่าจริง (Live System Estimation)
                        </h4>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-2xs">
                        ช่องที่เลือก: {selectedChannelsCount} / {totalChannelsCount} ช่อง | {enabledPlatformsCount} แพลตฟอร์ม
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/90 p-4 rounded-2xl border border-indigo-100/70 shadow-2xs space-y-1">
                        <span className="text-xs text-slate-500 font-semibold">ปริมาณเน็ตต่อรอบการรัน (ต่อวัน)</span>
                        <p className="text-2xl font-black text-indigo-600 font-mono">
                            ~{estimatedDailyMb} <span className="text-sm font-bold text-slate-500">MB / วัน</span>
                        </p>
                        <p className="text-[11px] text-slate-400">คำนวณจาก {selectedChannelsCount} ช่องที่ติ๊กเลือก</p>
                    </div>

                    <div className="bg-white/90 p-4 rounded-2xl border border-indigo-100/70 shadow-2xs space-y-1">
                        <span className="text-xs text-slate-500 font-semibold">ปริมาณเน็ตรวมต่อเดือน (30 วัน)</span>
                        <p className="text-2xl font-black text-purple-700 font-mono">
                            ~{estimatedMonthlyMb} <span className="text-sm font-bold text-slate-500">MB / เดือน</span>
                        </p>
                        <p className="text-[11px] text-slate-400">เทียบเท่าไม่ถึง 0.1% ของแพ็กเกจ Cloud Server</p>
                    </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/70 border border-indigo-100 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                        <strong>คำแนะนำ:</strong> การปิดแพลตฟอร์มที่ไม่ได้ใช้งาน หรือเลือกเฉพาะช่องที่มีการอัปเดตบ่อย จะช่วยลดเวลาประมวลผลของเซิร์ฟเวอร์ และประหยัด Bandwidth ลงได้อย่างมีนัยสำคัญ
                    </div>
                </div>
            </div>
        </div>
    );
};
