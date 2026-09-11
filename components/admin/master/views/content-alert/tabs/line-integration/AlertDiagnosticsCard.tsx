import React from 'react';
import { Sparkles, Clock, Sunrise, Loader2, Send } from 'lucide-react';
import { AlertDiagnosticsCardProps } from '../../types';

export const AlertDiagnosticsCard: React.FC<AlertDiagnosticsCardProps> = ({
    isTestingAlert,
    isTestingOverdueSummary,
    isSaving,
    leadMinutes,
    onTestPreRelease,
    onTestOverdueSummary,
}) => {
    return (
        <div id="alert-diagnostics-card" className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        ศูนย์ทดสอบส่งการแจ้งเตือนสด (Live Alert Diagnostics)
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                        ทดสอบส่งข้อความ Flex Card ไปยังปลายทาง LINE ที่ตั้งค่าไว้โดยใช้ข้อมูลจริงในระบบทันที
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Test 1: Pre-Release */}
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col justify-between gap-3">
                    <div>
                        <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-600" />
                            1. ทดสอบเตือนด่วนก่อนคลิปลง
                        </div>
                        <p className="text-[11px] text-purple-700/80 mt-1 leading-relaxed">
                            สแกนหาคลิปที่กำลังจะถึงกำหนดลงในอีก {leadMinutes} นาที และยังไม่พร้อม เพื่อส่งการ์ดแจ้งเตือนรายคลิป
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onTestPreRelease}
                        disabled={isTestingAlert || isSaving}
                        className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                        {isTestingAlert ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                กำลังทดสอบส่ง...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                ยิงทดสอบเตือนก่อนลง
                            </>
                        )}
                    </button>
                </div>

                {/* Test 2: Daily Overdue */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col justify-between gap-3">
                    <div>
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Sunrise className="w-3.5 h-3.5 text-amber-600" />
                            2. ทดสอบสรุปค้างลงประจำวัน (Cron Job Data)
                        </div>
                        <p className="text-[11px] text-amber-700/80 mt-1 leading-relaxed">
                            ประมวลผลคลิปที่เลยกำหนดลงในอดีตทั้งหมด และส่งการ์ด Flex Carousel สรุปแยกตามช่องทันที
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onTestOverdueSummary}
                        disabled={isTestingOverdueSummary || isSaving}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                        {isTestingOverdueSummary ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                กำลังประมวลผลข้อมูลจริง...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                ยิงทดสอบสรุปค้างลง
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
