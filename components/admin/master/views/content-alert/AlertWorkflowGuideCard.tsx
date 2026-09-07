import React from 'react';
import { Sparkles, Calendar, Search, Bell, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const AlertWorkflowGuideCard: React.FC = () => {
    const steps = [
        {
            icon: Calendar,
            color: 'text-blue-600 bg-blue-50 border-blue-200',
            title: '1. อ่านตารางลงคลิป',
            desc: 'สแกนคิวงานจากตาราง contents ตามวันและเวลา scheduled_time ใน Calendar',
        },
        {
            icon: Search,
            color: 'text-purple-600 bg-purple-50 border-purple-200',
            title: '2. ตรวจสอบ Status Gate',
            desc: 'ตรวจสอบว่าคลิปมีสถานะที่ผ่านการอนุมัติหรือยัง หากยังไม่พร้อม จะเข้าสู่กระบวนการเตือน',
        },
        {
            icon: Bell,
            color: 'text-amber-600 bg-amber-50 border-amber-200',
            title: '3. แจ้งเตือนเข้า LINE',
            desc: 'ยิงข้อความ Flex Message แจ้งเวลาที่เหลือ พร้อมแท็กทีมงานและส่งการ์ดข้อมูลคลิป',
        },
        {
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
            title: '4. Quick Action Approve',
            desc: 'ผู้รับผิดชอบสามารถกด Approve ทันที หรือกดลิงก์เข้าดูคลิปในปฏิทินได้ในคลิกเดียว',
        },
    ];

    return (
        <motion.div
            id="alert-workflow-guide-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-3xl p-6 border border-purple-100/80 space-y-4 shadow-sm"
        >
            <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-600" />
                วงจรการทำงานของระบบแจ้งเตือนคอนเทนต์ (Workflow Automation)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-purple-100/70 shadow-2xs space-y-2 flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${step.color}`}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs font-bold text-gray-900">{step.title}</h4>
                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};
