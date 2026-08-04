import React, { useState } from 'react';
import { Smartphone, Sparkles, MessageSquare, Check, X, Bell, BellOff, Users, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { WorkTimeConfig } from '../WorkTimeCard';

interface SubmissionAlertCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const SubmissionAlertCard: React.FC<SubmissionAlertCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const currentMode = tempTimeConfig.lineSubmissionAlertMode || 'ADMIN_PRIVATE';
    const [mockInteracted, setMockInteracted] = useState<'APPROVED' | 'REJECTED' | null>(null);

    const handleModeChange = (mode: 'ADMIN_PRIVATE' | 'GROUP_ONLY' | 'NONE') => {
        setMockInteracted(null);
        setTempTimeConfig(prev => ({
            ...prev,
            lineSubmissionAlertMode: mode
        }));
    };

    return (
        <div id="submission-alert-card" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Bell className="w-3.5 h-3.5 text-indigo-500" /> 📥 Submission Notification Flow
                    </span>
                    <span className="flex items-center gap-2 text-xs text-indigo-600 font-bold bg-indigo-50/60 px-3 py-1 rounded-xl border border-indigo-100/40">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        พร้อมตั้งค่า
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5 flex items-center gap-2">
                    ปลายทางการแจ้งเตือนคำขอพนักงาน
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    กำหนดช่องทางการจัดส่งแจ้งเตือนเมื่อพนักงานยื่นคำขออนุมัติใหม่ (เช่น ขอลา, ขอ OT, แจ้งเข้าสาย) เพื่อลดความซ้ำซ้อนและจัดระเบียบข้อมูล
                </p>

                {/* SELECTABLE MODE TILES */}
                <div className="mt-4 space-y-2">
                    {/* ADMIN_PRIVATE */}
                    <button
                        type="button"
                        onClick={() => handleModeChange('ADMIN_PRIVATE')}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                            currentMode === 'ADMIN_PRIVATE'
                                ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-100/50'
                                : 'bg-slate-50/50 border-gray-200 hover:bg-slate-50/80 hover:border-gray-300'
                        }`}
                    >
                        <div className={`p-2 rounded-xl shrink-0 ${
                            currentMode === 'ADMIN_PRIVATE' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                แจ้งแอดมินรายบุคคล (LINE ส่วนตัว)
                                {currentMode === 'ADMIN_PRIVATE' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-medium">
                                ส่งการแจ้งเตือนเข้าไปที่ห้องแชทส่วนตัวของแอดมินแต่ละคนโดยตรง
                            </span>
                        </div>
                    </button>

                    {/* GROUP_ONLY */}
                    <button
                        type="button"
                        onClick={() => handleModeChange('GROUP_ONLY')}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                            currentMode === 'GROUP_ONLY'
                                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-100/50'
                                : 'bg-slate-50/50 border-gray-200 hover:bg-slate-50/80 hover:border-gray-300'
                        }`}
                    >
                        <div className={`p-2 rounded-xl shrink-0 ${
                            currentMode === 'GROUP_ONLY' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            <Users className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                ส่งเข้าไลน์กลุ่มส่วนกลางอย่างเดียว
                                {currentMode === 'GROUP_ONLY' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-medium">
                                ส่งแจ้งเตือนตรงไปที่กลุ่มไลน์หลักเพียงข้อความเดียว (Deduplicated) แอดมินทุกคนจะเห็นร่วมกัน
                            </span>
                        </div>
                    </button>

                    {/* NONE */}
                    <button
                        type="button"
                        onClick={() => handleModeChange('NONE')}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                            currentMode === 'NONE'
                                ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-100/50'
                                : 'bg-slate-50/50 border-gray-200 hover:bg-slate-50/80 hover:border-gray-300'
                        }`}
                    >
                        <div className={`p-2 rounded-xl shrink-0 ${
                            currentMode === 'NONE' ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            <BellOff className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                ไม่แจ้งเตือนลงไลน์สำหรับคำขอพนักงาน
                                {currentMode === 'NONE' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
                            </span>
                            <span className="block text-[10px] text-gray-400 font-medium">
                                ปิดแจ้งเตือนไลน์ทั้งหมด ฝ่ายบุคคลจะทำการตรวจและจัดการผ่านหน้าเว็บเพียงช่องทางเดียว
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* LIVE PREVIEW SIMULATOR */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                {/* Smartphone status bar simulation */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2 border-b border-slate-800/60 pb-1.5">
                    <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-500" /> 
                        {currentMode === 'GROUP_ONLY' ? 'LINE Group Chat Simulation' : 'LINE Chat Simulation'}
                    </span>
                    <span>10:15 AM</span>
                </div>

                {/* LINE Chat Bubble Container */}
                <div className="space-y-3 my-2 flex-grow flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {currentMode === 'NONE' ? (
                            <motion.div
                                key="none"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center text-center p-4 space-y-2"
                            >
                                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                                    <BellOff className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-white">LINE Notifications Silenced 📴</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[240px]">
                                        ระบบจะไม่ส่งสัญญาณแจ้งเตือนเข้า LINE สำหรับคำขอยื่นของพนักงานใดๆ เพื่อลดข้อความรบกวน โดยแอดมินจะต้องตรวจผ่านหน้าเว็บเป็นหลัก
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={currentMode}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="flex items-start gap-2.5"
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm text-white ${
                                    currentMode === 'GROUP_ONLY' ? 'bg-emerald-600' : 'bg-indigo-600'
                                }`}>
                                    {currentMode === 'GROUP_ONLY' ? 'GRP' : 'JUI'}
                                </div>
                                <div className="flex-grow max-w-[85%]">
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1">
                                        {currentMode === 'GROUP_ONLY' ? '👥 กลุ่มบริหารงานส่วนกลาง' : '💬 JuiJui Attendance Bot'}
                                    </span>
                                    
                                    {/* Message Header Simulation */}
                                    <div className={`p-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 ${
                                        currentMode === 'GROUP_ONLY' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                                    }`}>
                                        <span className="text-sm shrink-0">📋</span>
                                        <span className="truncate">{tempTimeConfig.lineHeaderTitle || 'Juijui Alert Center'}</span>
                                    </div>
                                    
                                    {/* Message Bubble Body */}
                                    <div className="bg-slate-800 border border-slate-700/50 rounded-b-2xl p-3 text-slate-200 shadow-sm relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-indigo-400 flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> ยื่นขอลาหยุดงาน
                                            </span>
                                            <span className="text-[10px] bg-slate-700 text-amber-400 font-black px-1.5 py-0.5 rounded-lg border border-slate-600">
                                                รอแอดมินอนุมัติ
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-[11px] font-medium text-slate-300">
                                            <p>👤 <span className="font-bold text-white">นางสาวมะลิ ยิ้มแย้ม</span> (ฝ่ายการตลาด)</p>
                                            <p>🌴 ประเภท: <span className="text-white">พักร้อน (Vacation)</span></p>
                                            <p>📅 ช่วงเวลา: <span className="text-white">พรุ่งนี้ - วันศุกร์ (2 วัน)</span></p>
                                            <p>📝 เหตุผล: "พาลูกไปเที่ยวพักผ่อนประจำปีที่พัทยา"</p>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {mockInteracted ? (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`mt-3 p-2 rounded-xl text-center text-xs font-black border flex items-center justify-center gap-1.5 ${
                                                        mockInteracted === 'APPROVED' 
                                                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                                            : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                                                    }`}
                                                >
                                                    {mockInteracted === 'APPROVED' ? (
                                                        <>
                                                            <Check className="w-4 h-4" /> อนุมัติการลาสำเร็จแล้ว
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="w-4 h-4" /> ปฏิเสธการลาเรียบร้อย
                                                        </>
                                                    )}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMockInteracted(null);
                                                        }}
                                                        className="ml-2 text-[10px] underline hover:text-white"
                                                    >
                                                        รีเซ็ต
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="mt-3 grid grid-cols-2 gap-2"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setMockInteracted('APPROVED')}
                                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 border border-indigo-500/20"
                                                    >
                                                        <Check className="w-3 h-3" /> อนุมัติ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setMockInteracted('REJECTED')}
                                                        className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 border border-rose-500/20"
                                                    >
                                                        <X className="w-3 h-3" /> ปฏิเสธ
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="text-[10px] text-slate-500 text-center font-medium mt-1">
                    {currentMode === 'ADMIN_PRIVATE' && (
                        <span className="text-indigo-400 font-bold flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> ส่งเข้า LINE ส่วนตัวแอดมินรายคน (Private Chat)
                        </span>
                    )}
                    {currentMode === 'GROUP_ONLY' && (
                        <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 animate-pulse" /> ส่งเข้ากลุ่มส่วนกลาง (ข้อความเดียว ไม่เด้งซ้ำซ้อน)
                        </span>
                    )}
                    {currentMode === 'NONE' && (
                        <span>จัดการผ่าน Web Portal ปลอดภัย รวดเร็ว</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionAlertCard;
