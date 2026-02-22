
import React from 'react';
import { X, Info, ShieldCheck, HeartHandshake, AlertTriangle, Coins, Zap, Clock, CheckCircle2, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DutyGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DutyGuideModal: React.FC<DutyGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            title: 'กติกาพื้นฐาน (Basic Rules)',
            icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
            color: 'bg-indigo-50',
            items: [
                { icon: <Clock className="w-4 h-4" />, text: 'เวรจะถูกสุ่มล่วงหน้าตามกติกาที่ Admin ตั้งไว้' },
                { icon: <CheckCircle2 className="w-4 h-4" />, text: 'เมื่อทำเสร็จ ต้องถ่ายรูป "ส่งการบ้าน" เพื่อยืนยัน' },
                { icon: <AlertTriangle className="w-4 h-4" />, text: 'หากลืมทำ ระบบจะให้โอกาสแก้ตัวในวันถัดไป (Tribunal)' },
            ]
        },
        {
            title: 'ระบบฮีโร่ (Hero Assist)',
            icon: <HeartHandshake className="w-6 h-6 text-rose-500" />,
            color: 'bg-rose-50',
            items: [
                { icon: <Zap className="w-4 h-4" />, text: 'คุณสามารถช่วยเพื่อนทำเวรได้ โดยกดปุ่ม "Assist" ที่เวรของเพื่อน' },
                { icon: <Coins className="w-4 h-4" />, text: 'ฮีโร่จะได้รับ Bonus XP และแต้มพิเศษเป็นการตอบแทน' },
                { icon: <CheckCircle2 className="w-4 h-4" />, text: 'เพื่อนที่ถูกช่วยจะถือว่าทำเวรเสร็จ (แต่ไม่ได้แต้ม)' },
            ]
        },
        {
            title: 'บทลงโทษ (Penalties)',
            icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
            color: 'bg-amber-50',
            items: [
                { icon: <Ban className="w-4 h-4" />, text: 'หากละเลยหน้าที่จนเวรรอบใหม่มาถึง จะถูกหัก HP อย่างหนัก (Negligence)' },
                { icon: <AlertTriangle className="w-4 h-4" />, text: 'การส่งงานล่าช้าในรอบแก้ตัว (Tribunal) จะถูกหัก HP เล็กน้อย' },
                { icon: <Info className="w-4 h-4" />, text: 'คะแนนที่ถูกหักจะส่งผลต่อโบนัสและลำดับใน Leaderboard' },
            ]
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-white"
                >
                    {/* Header */}
                    <div className="px-8 py-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">คู่มือการใช้งานระบบเวร</h3>
                                <p className="text-xs text-gray-400 font-medium">ทำความเข้าใจกติกาและระบบคะแนน</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 overflow-y-auto space-y-8 bg-gray-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sections.map((section, idx) => (
                                <div key={idx} className={`p-6 rounded-[2rem] border border-white shadow-sm ${section.color} ${idx === 2 ? 'md:col-span-2' : ''}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        {section.icon}
                                        <h4 className="font-black text-gray-800">{section.title}</h4>
                                    </div>
                                    <ul className="space-y-3">
                                        {section.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium leading-relaxed">
                                                <span className="mt-1 shrink-0 text-gray-400">{item.icon}</span>
                                                {item.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Summary / Tip */}
                        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-2xl">
                                    <Zap className="w-6 h-6 text-yellow-300" />
                                </div>
                                <div>
                                    <h5 className="font-black text-lg">ช่วยกันตรวจสอบเพื่อทีมที่แข็งแกร่ง!</h5>
                                    <p className="text-sm text-indigo-100 opacity-90">
                                        หากพบข้อมูลเวรผิดปกติ หรือมีข้อสงสัย สามารถแจ้ง Admin เพื่อตรวจสอบประวัติย้อนหลัง (Report) ได้ตลอดเวลา
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 bg-white flex justify-center shrink-0">
                        <button 
                            onClick={onClose}
                            className="px-10 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                        >
                            เข้าใจแล้ว
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DutyGuideModal;
