import React, { useState } from 'react';
import { CalendarClock, Clock, Monitor, Play, Sparkles, Users, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TimePickerModal from '../../../../../ui/TimePickerModal';
import { WorkTimeConfig } from '../WorkTimeCard';

interface MidnightCheckCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const MidnightCheckCard: React.FC<MidnightCheckCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const [isCheckoutTimeOpen, setIsCheckoutTimeOpen] = useState(false);
    const [simC, setSimC] = useState<{ active: boolean; messageSent: boolean; time: string }>({
        active: false,
        messageSent: false,
        time: ''
    });

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const triggerPlanCSimulator = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setSimC({
            active: true,
            messageSent: false,
            time: ''
        });

        timeoutRef.current = setTimeout(() => {
            setSimC(prev => ({
                ...prev,
                messageSent: true,
                time: tempTimeConfig.checkoutPenaltyTime || '24:00'
            }));
        }, 1000);
    };

    return (
        <div id="sim-card-c" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-600 border border-amber-100">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 📋 แผน B (Midnight Check)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50/60 px-3 py-1 rounded-xl border border-amber-100/40">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        ระบบสแตนด์บาย
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5">
                    ตรวจพนักงานลืมออกงานข้ามคืน
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    ระบบอัจฉริยะช่วยตรวจสอบฐานข้อมูลหลังเที่ยงคืนโดยอัตโนมัติ เพื่อป้องกันการบันทึกชั่วโมงทำงานผิดพลาด บันทึกสถานะ "ลืมออกงาน" และเคลียร์สถานะตอกบัตรของพนักงานสำหรับเช้าวันถัดไป
                </p>
                
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50/50 to-amber-100/20 rounded-2xl border border-amber-100/70 flex items-center justify-between text-xs font-bold text-amber-900 shadow-sm">
                    <span className="flex items-center gap-1.5">⏰ เวลาประมวลผลระบบ:</span>
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-checkout-penalty-time"
                            type="button"
                            onClick={() => setIsCheckoutTimeOpen(true)}
                            className="px-3 py-1.5 bg-white border border-amber-200/80 rounded-xl text-xs font-extrabold text-amber-700 flex items-center gap-1.5 hover:border-amber-400 transition-all shadow-sm cursor-pointer"
                        >
                            {tempTimeConfig.checkoutPenaltyTime} น.
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <TimePickerModal 
                            isOpen={isCheckoutTimeOpen}
                            onClose={() => setIsCheckoutTimeOpen(false)}
                            initialTime={tempTimeConfig.checkoutPenaltyTime}
                            onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, checkoutPenaltyTime: val }))}
                        />
                    </div>
                </div>

                {/* 🎯 กลุ่มเป้าหมายหักแต้ม / เตือนลืมออกงาน */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-black text-gray-700 tracking-tight flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-500" /> กลุ่มเป้าหมายที่รับการลงโทษ / เตือนลืมออกงาน
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 border border-slate-200/50 rounded-2xl">
                        {[
                            { value: 'MEMBER', label: 'เฉพาะทั่วไป', desc: 'Member', icon: Users },
                            { value: 'ADMIN', label: 'เฉพาะผู้ดูแล', desc: 'Admin', icon: ShieldAlert },
                            { value: 'BOTH', label: 'ทั้งหมด', desc: 'Both', icon: Sparkles }
                        ].map((role) => {
                            const RoleIcon = role.icon;
                            const isActive = (tempTimeConfig.checkoutPenaltyTargetRoles || 'BOTH') === role.value;
                            return (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => setTempTimeConfig(prev => ({ ...prev, checkoutPenaltyTargetRoles: role.value }))}
                                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all outline-none relative overflow-hidden select-none cursor-pointer ${
                                        isActive
                                            ? 'bg-white text-amber-700 shadow-sm border-b-2 border-amber-500/80'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                                >
                                    <RoleIcon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                                    <span className="text-[10px] font-black tracking-tight">{role.label}</span>
                                    <span className="text-[8px] font-bold opacity-60 leading-none">{role.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 🛡️ กฎแอดมินโดนหักคะแนนขาดงาน */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-black text-gray-700 tracking-tight flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> หักคะแนนแอดมินขาดงาน
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            (tempTimeConfig.adminAbsentPenaltyEnabled === 'true') 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                            {(tempTimeConfig.adminAbsentPenaltyEnabled === 'true') ? 'เปิด (Active)' : 'ปิด (Bypassed)'}
                        </span>
                    </label>
                    <div className="flex items-center justify-between p-3 bg-slate-50/60 border border-slate-200/50 rounded-2xl">
                        <div className="space-y-0.5 pr-2">
                            <p className="text-[11px] font-bold text-gray-700 leading-tight">ลงโทษ/แจ้งเตือนเมื่อแอดมินขาดงาน</p>
                            <p className="text-[9.5px] font-medium text-gray-400 leading-snug">เมื่อ ADMIN ขาดงาน จะไม่หักคะแนนและไม่แจ้งเตือนใน LINE/Notification</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTempTimeConfig(prev => ({ 
                                ...prev, 
                                adminAbsentPenaltyEnabled: prev.adminAbsentPenaltyEnabled === 'true' ? 'false' : 'true' 
                            }))}
                            className={`w-10 h-6 shrink-0 rounded-full transition-colors relative focus:outline-none ${
                                (tempTimeConfig.adminAbsentPenaltyEnabled === 'true') ? 'bg-amber-600' : 'bg-slate-200'
                            }`}
                        >
                            <span 
                                className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                                    (tempTimeConfig.adminAbsentPenaltyEnabled === 'true') ? 'left-5' : 'left-1'
                                }`} 
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-100/70 text-amber-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100/60 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-800">
                        <Monitor className="w-4 h-4 text-amber-500" /> คอนโซลจำลอง LINE API
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={triggerPlanCSimulator}
                        className="px-3.5 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-black hover:bg-amber-700 flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/10 hover:shadow-amber-600/20"
                    >
                        <Play className="w-3 h-3 fill-current text-white/90 animate-pulse" /> ทดสอบส่งแจ้งเตือน
                    </motion.button>
                </div>

                <div className={`relative min-h-[220px] bg-slate-50/50 rounded-xl p-3.5 text-slate-800 border border-slate-100 shadow-inner flex flex-col ${simC.active ? 'justify-start' : 'justify-center'} overflow-hidden`}>
                    <AnimatePresence mode="wait">
                        {simC.active ? (
                            <div className="w-full space-y-3">
                                {!simC.messageSent ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-8 text-xs text-slate-600 font-bold"
                                    >
                                        <div className="flex gap-1.5 mb-2">
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                        </div>
                                        <span className="text-[11px] font-extrabold text-slate-500 tracking-wide">กำลังประมวลข้อมูล...</span>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="message"
                                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        className="w-full max-w-sm mx-auto bg-white rounded-xl overflow-hidden shadow-md border border-slate-100 flex flex-col"
                                    >
                                        {/* Header */}
                                        <div className="bg-[#4f46e5] px-3.5 py-2 flex items-center gap-2 text-white font-extrabold text-xs shadow-sm">
                                            <span>⏰</span>
                                            <span>Juijui Alert Center</span>
                                        </div>
                                        
                                        {/* Body */}
                                        <div className="p-3.5 flex flex-col bg-white">
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                <span className="text-gray-600 text-xs">🛠️</span>
                                                <span className="font-extrabold text-gray-950 text-xs tracking-tight">
                                                    แจ้งเตือน: ลืมบันทึกเวลาออกงานเมื่อวาน!
                                                </span>
                                            </div>
                                            
                                            {/* Status Box */}
                                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-2.5 text-[10px] font-bold text-gray-600 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>📅 วันที่เตือน:</span>
                                                    <span className="text-gray-950">วันนี้</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>⏱️ เวลากะงาน:</span>
                                                    <span className="text-gray-950">ตามกะงานของคุณ</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>⏳ สิ้นสุดช่วงผ่อนปรน:</span>
                                                    <span className="text-gray-950">-</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>⚠️ Status:</span>
                                                    <span className="text-red-500 font-extrabold">ยังไม่พบข้อมูลเช็คเอาท์</span>
                                                </div>
                                            </div>

                                            {/* Text Content */}
                                            <div className="text-gray-700 font-semibold text-[10.5px] text-center leading-relaxed bg-slate-100/80 p-3 rounded-lg border border-slate-200/50">
                                                ระบบพบบันทึกเวลาของวันที่ {new Date(Date.now() - 86400000).toISOString().split('T')[0]}<br />
                                                ค้างโดยไม่มีเวลาออก กรุณาส่งคำขอแก้ไขเวลา<br />
                                                (Forgot Checkout) ภายในวันนี้<br />
                                                <span className="font-extrabold text-[#4f46e5]">เพื่อรักษาแต้มและกู้คืน HP ของคุณกลับมานะครับ</span>
                                            </div>
                                            
                                            {/* Footer Info */}
                                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[9px] font-extrabold text-slate-400">
                                                <span>ระบบลงเวลาทำงาน</span>
                                                <span>{simC.time} น.</span>
                                            </div>
                                        </div>
                                        
                                        {/* Action Button */}
                                        <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                            <button 
                                                type="button"
                                                className="w-full py-2 bg-[#4f46e5] hover:bg-[#4338ca] active:scale-[0.98] transition-all rounded-lg text-[11px] font-black text-white shadow-sm flex items-center justify-center gap-1"
                                            >
                                                ลงเวลาเข้างานทันที ⏱️
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-6 text-xs text-amber-800/60 font-bold font-sans"
                            >
                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-amber-100 mb-2 text-amber-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-amber-900/70">คลิก "ทดสอบส่งแจ้งเตือน" เพื่อลองส่งจำลองข้อความจริง</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MidnightCheckCard;
