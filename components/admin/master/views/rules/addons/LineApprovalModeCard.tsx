import React, { useState } from 'react';
import { Smartphone, Sparkles, MessageSquare, Check, X, Bell, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkTimeConfig {
    start: string;
    end: string;
    buffer: string;
    minHours: string;
    otThreshold: string;
    checkoutPenaltyTime: string;
    dailySummaryDelayHours: string;
    lineSummaryDestination: string;
    enableAttendanceRace: string;
    lateAlertMode?: string;
    lateAlertOffset?: string;
    multipleShiftsEnabled?: string;
    multipleShiftsList?: string;
    lineApprovalMode?: string;
}

interface LineApprovalModeCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const LineApprovalModeCard: React.FC<LineApprovalModeCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const isInteractive = (tempTimeConfig.lineApprovalMode || 'INTERACTIVE') === 'INTERACTIVE';
    const [mockInteracted, setMockInteracted] = useState<'APPROVED' | 'REJECTED' | null>(null);

    const toggleMode = () => {
        setMockInteracted(null);
        setTempTimeConfig(prev => ({
            ...prev,
            lineApprovalMode: isInteractive ? 'SIMPLE_NOTIF' : 'INTERACTIVE'
        }));
    };

    return (
        <div id="line-approval-mode-card" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> 💬 LINE Rich Message Mode
                    </span>
                    <span className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50/60 px-3 py-1 rounded-xl border border-emerald-100/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        พร้อมใช้งาน
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5 flex items-center gap-2">
                    รูปแบบการอนุมัติผ่าน LINE Chat
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    เลือกระหว่างระบบ Rich Message แบบโต้ตอบได้ (มีปุ่มอนุมัติ/ปฏิเสธส่งตรงไปยังกลุ่ม LINE เพื่อให้ผู้บริหารกดจัดการได้ทันที) หรือแบบแจ้งเตือนเพื่อดูข้อมูลอย่างเดียว
                </p>

                {/* MODE TOGGLE SWITCH */}
                <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50/50 to-emerald-100/20 rounded-2xl border border-emerald-100/70 flex items-center justify-between text-xs font-bold text-emerald-900 shadow-sm">
                    <span className="flex items-center gap-1.5">🔌 รูปแบบปุ่มโต้ตอบไลน์:</span>
                    <button
                        type="button"
                        onClick={toggleMode}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isInteractive ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                        aria-label="Toggle LINE approval mode"
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isInteractive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* LIVE PREVIEW SIMULATOR */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[260px]">
                {/* Smartphone status bar simulation */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2 border-b border-slate-800/60 pb-1.5">
                    <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-500" /> LINE Chat Simulation
                    </span>
                    <span>10:15 AM</span>
                </div>

                {/* LINE Chat Bubble Container */}
                <div className="space-y-3 my-2 flex-grow flex flex-col justify-center">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm text-white">
                            JUI
                        </div>
                        <div className="flex-grow max-w-[85%]">
                            <span className="block text-[10px] text-slate-400 font-bold mb-1">JuiJui Attendance Bot</span>
                            
                            {/* Message Bubble */}
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-full"></div>
                                
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5" /> แจ้งขอเข้าสาย (Late Entry)
                                    </span>
                                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black px-1.5 py-0.5 rounded-lg border border-emerald-500/30">
                                        รออนุมัติ
                                    </span>
                                </div>

                                <div className="space-y-1 text-[11px] font-medium text-slate-300">
                                    <p>👤 <span className="font-bold text-white">นายสมศักดิ์ รักขยัน</span> (คลังสินค้า)</p>
                                    <p>⏰ วันที่: <span className="text-white">วันนี้</span> | ขอเข้าเวลา: <span className="text-white">10:30 น.</span></p>
                                    <p>📝 เหตุผล: "พาน้องไปโรงพยาบาลและรถติดหนักมาก"</p>
                                </div>

                                {/* Interactive Buttons inside LINE Mockup */}
                                <AnimatePresence mode="wait">
                                    {isInteractive ? (
                                        mockInteracted ? (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className={`mt-3 p-2 rounded-xl text-center text-xs font-black border flex items-center justify-center gap-1.5 ${
                                                    mockInteracted === 'APPROVED' 
                                                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                                        : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                                                }`}
                                            >
                                                {mockInteracted === 'APPROVED' ? (
                                                    <>
                                                        <Check className="w-4 h-4" /> อนุมัติแล้ว (โดย Admin ผ่านไลน์)
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="w-4 h-4" /> ปฏิเสธแล้ว (โดย Admin ผ่านไลน์)
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
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 border border-emerald-500/20"
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
                                        )
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-3 p-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5"
                                        >
                                            <Bell className="w-3.5 h-3.5 text-slate-500" /> แสดงผลการแจ้งเตือนแบบธรรมดา (ไม่มีปุ่มโต้ตอบ)
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center font-medium mt-1">
                    {isInteractive ? (
                        <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> โหมดอนุมัติโต้ตอบสมบูรณ์ (Interactive Mode)
                        </span>
                    ) : (
                        <span>โหมดส่งข้อมูลเพื่อแจ้งสถานะอย่างเดียว (Simple Notification Mode)</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LineApprovalModeCard;
