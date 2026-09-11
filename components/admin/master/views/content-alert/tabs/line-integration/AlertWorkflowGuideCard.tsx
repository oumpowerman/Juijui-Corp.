import React from 'react';
import { Sparkles, Calendar, Search, Bell, CheckCircle2, Sunrise, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const AlertWorkflowGuideCard: React.FC = () => {
    return (
        <motion.div
            id="alert-workflow-guide-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-br from-slate-50 via-white to-purple-50/30 rounded-3xl p-6 border border-purple-100/80 space-y-6 shadow-sm"
        >
            <div className="flex items-center gap-2 text-purple-950 font-bold text-base">
                <Sparkles className="w-5 h-5 text-purple-600" />
                แผนผังเปรียบเทียบวงจรการทำงานของทั้ง 2 ระบบ (System Pipeline Comparison)
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pipeline 1: Pre-Release */}
                <div className="p-5 rounded-2xl bg-white border border-purple-200/70 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xs text-gray-900">
                                1. ระบบเตือนด่วนก่อนคลิปลง (Pre-Release Alert)
                            </h4>
                            <span className="text-[10px] text-purple-600 font-semibold">
                                ทำงานแบบ Real-time / ทุก 15-30 นาที
                            </span>
                        </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-600">
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                            <span>ตรวจคลิปที่มีกำหนดลงในอีก <strong>X นาทีข้างหน้า</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                            <span>กรองด้วย <strong>Status Gate (เกณฑ์ความพร้อม)</strong> — ถ้ายังไม่ถึงสถานะพร้อม จะส่งการ์ดแจ้งเตือนด่วนรายคลิปเข้า LINE</span>
                        </li>
                    </ul>
                </div>

                {/* Pipeline 2: Daily Overdue */}
                <div className="p-5 rounded-2xl bg-white border border-amber-200/70 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Sunrise className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xs text-gray-900">
                                2. ระบบสรุปค้างลงประจำเช้า (Daily Overdue Summary)
                            </h4>
                            <span className="text-[10px] text-amber-700 font-semibold">
                                ทำงานอัตโนมัติผ่าน pg_cron วันละ 1 ครั้งยามเช้า
                            </span>
                        </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-600">
                        <li className="flex items-start gap-2">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>ตรวจคลิปทั้งหมดที่ <strong>เลยกำหนดลงในอดีต</strong> (วันที่ &lt; ปัจจุบัน)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>ยกเว้นคลิปที่มีสถานะ <strong>Done / เผยแพร่แล้ว (Excluded)</strong> — รวมคลิปที่ค้างสรุปแยกตามช่อง (Flex Carousel)</span>
                        </li>
                    </ul>
                </div>
            </div>
        </motion.div>
    );
};
