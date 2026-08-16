import React, { useState } from 'react';
import { ShieldAlert, Clock, Monitor, Play, Sparkles, Users, UserMinus, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TimePickerModal from '../../../../../ui/TimePickerModal';
import { WorkTimeConfig } from '../WorkTimeCard';

interface AbsentCheckCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const AbsentCheckCard: React.FC<AbsentCheckCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [sim, setSim] = useState<{ active: boolean; messageSent: boolean; time: string }>({
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

    const triggerSimulator = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setSim({
            active: true,
            messageSent: false,
            time: ''
        });

        timeoutRef.current = setTimeout(() => {
            setSim(prev => ({
                ...prev,
                messageSent: true,
                time: tempTimeConfig.absentPenaltyTime || '19:00'
            }));
        }, 1000);
    };

    const isEnabled = tempTimeConfig.absentPenaltyEnabled === 'true';

    return (
        <div id="sim-card-absent" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-100">
                        <UserMinus className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> 📋 แผน G (Absent Check)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-rose-600 font-bold bg-rose-50/60 px-3 py-1 rounded-xl border border-rose-100/40">
                        <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {isEnabled ? 'ระบบเปิดใช้งาน' : 'ระบบปิดการทำงาน'}
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5">
                    ตรวจสอบการขาดงานประจำวันอัตโนมัติ
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    ระบบอัจฉริยะช่วยสแกนประวัติการเข้างานหลังสิ้นสุดเวลาทำงาน หากไม่พบประวัติการตอกบัตรเช็คอิน (Check-in) และไม่มีการส่งใบลาในระบบ ระบบจะหักคะแนน HP อัตโนมัติพร้อมยิงข้อความแจ้งเตือนทาง LINE ทันที
                </p>
                
                {/* 🛡️ สวิตช์ เปิด/ปิด การทำงาน */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-black text-gray-700 tracking-tight flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> ตรวจจับและลงโทษการขาดงาน
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isEnabled 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                            {isEnabled ? 'เปิด (Active)' : 'ปิด (Bypassed)'}
                        </span>
                    </label>
                    <div className="flex items-center justify-between p-3 bg-slate-50/60 border border-slate-200/50 rounded-2xl">
                        <div className="space-y-0.5 pr-2">
                            <p className="text-[11px] font-bold text-gray-700 leading-tight">ระบบหักคะแนน HP และบันทึกประวัติขาดงาน</p>
                            <p className="text-[9.5px] font-medium text-gray-400 leading-snug">หากเปิด พนักงานที่ไม่มีการตอกบัตรและไม่มีใบลาจะถูกปรับขาดงานโดยอัตโนมัติ</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTempTimeConfig(prev => ({ 
                                ...prev, 
                                absentPenaltyEnabled: prev.absentPenaltyEnabled === 'true' ? 'false' : 'true' 
                            }))}
                            className={`w-10 h-6 shrink-0 rounded-full transition-colors relative focus:outline-none ${
                                isEnabled ? 'bg-rose-600' : 'bg-slate-200'
                            }`}
                        >
                            <span 
                                className={`block w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                                    isEnabled ? 'left-5' : 'left-1'
                                }`} 
                            />
                        </button>
                    </div>
                </div>

                {/* ⏰ เวลาประมวลผล */}
                <div className="mt-4 p-3 bg-gradient-to-r from-rose-50/50 to-rose-100/20 rounded-2xl border border-rose-100/70 flex items-center justify-between text-xs font-bold text-rose-900 shadow-sm">
                    <span className="flex items-center gap-1.5">⏰ เวลาสแกนตรวจสอบของเซิร์ฟเวอร์:</span>
                    <div className="flex items-center gap-2">
                        <button
                            id="btn-absent-penalty-time"
                            type="button"
                            onClick={() => setIsTimeOpen(true)}
                            className="px-3 py-1.5 bg-white border border-rose-200/80 rounded-xl text-xs font-extrabold text-rose-700 flex items-center gap-1.5 hover:border-rose-400 transition-all shadow-sm cursor-pointer"
                        >
                            {tempTimeConfig.absentPenaltyTime || '19:00'} น.
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                        <TimePickerModal 
                            isOpen={isTimeOpen}
                            onClose={() => setIsTimeOpen(false)}
                            initialTime={tempTimeConfig.absentPenaltyTime || '19:00'}
                            onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, absentPenaltyTime: val }))}
                        />
                    </div>
                </div>

                {/* 🎯 กลุ่มเป้าหมายขาดงาน */}
                <div className="mt-4 space-y-2">
                    <label className="text-xs font-black text-gray-700 tracking-tight flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-rose-500" /> กลุ่มเป้าหมายที่รับการลงโทษขาดงาน
                    </label>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 border border-slate-200/50 rounded-2xl">
                        {[
                            { value: 'MEMBER', label: 'เฉพาะทั่วไป', desc: 'Member', icon: Users },
                            { value: 'ADMIN', label: 'เฉพาะผู้ดูแล', desc: 'Admin', icon: ShieldAlert },
                            { value: 'BOTH', label: 'ทั้งหมด', desc: 'Both', icon: Sparkles }
                        ].map((role) => {
                            const RoleIcon = role.icon;
                            const isActive = (tempTimeConfig.absentPenaltyTargetRoles || 'BOTH') === role.value;
                            return (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => setTempTimeConfig(prev => ({ ...prev, absentPenaltyTargetRoles: role.value }))}
                                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all outline-none relative overflow-hidden select-none cursor-pointer ${
                                        isActive
                                            ? 'bg-white text-rose-700 shadow-sm border-b-2 border-rose-500/80'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                                >
                                    <RoleIcon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                                    <span className="text-[10px] font-black tracking-tight">{role.label}</span>
                                    <span className="text-[8px] font-bold opacity-60 leading-none">{role.desc}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-rose-50/40 rounded-2xl p-3.5 border border-rose-100/70 text-rose-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-100/60 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-800">
                        <Monitor className="w-4 h-4 text-rose-500" /> คอนโซลจำลอง LINE API
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={triggerSimulator}
                        className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20"
                    >
                        <Play className="w-3 h-3 fill-current text-white/90 animate-pulse" /> ทดสอบส่งแจ้งเตือน
                    </motion.button>
                </div>

                <div className={`relative min-h-[220px] bg-slate-50/50 rounded-xl p-3.5 text-slate-800 border border-slate-100 shadow-inner flex flex-col ${sim.active ? 'justify-start' : 'justify-center'} overflow-hidden`}>
                    <AnimatePresence mode="wait">
                        {sim.active ? (
                            <div className="w-full space-y-3">
                                {!sim.messageSent ? (
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
                                        <div className="bg-[#e62e2e] px-3.5 py-2 flex items-center gap-2 text-white font-extrabold text-xs shadow-sm">
                                            <span className="animate-pulse">🚨</span>
                                            <span>Juijui Alert Center</span>
                                        </div>
                                        
                                        {/* Body */}
                                        <div className="p-3.5 flex flex-col bg-white">
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                <span className="text-red-600 text-sm animate-pulse">🔴</span>
                                                <span className="font-extrabold text-gray-950 text-xs tracking-tight">
                                                    แจ้งเตือน: พบการขาดงานในระบบวันนี้!
                                                </span>
                                            </div>
                                            
                                            <div className="text-gray-700 font-bold text-[10.5px] leading-relaxed space-y-1 bg-slate-50/75 p-2.5 rounded-lg border border-slate-100/60">
                                                <p>เนื่องจากพบบันทึกเวลาของวันที่ {new Date().toISOString().split('T')[0]}</p>
                                                <p>ว่าคุณไม่ได้ลงเวลาเข้างาน</p>
                                                <p>และไม่มีคำขอลาในระบบจนถึงเลยเวลาเช็คเวลาขาดงาน</p>
                                                <p className="text-red-600 font-extrabold">ระบบจึงทำบันทึกเป็นขาดงานและหัก HP ของคุณ</p>
                                            </div>
                                            
                                            {/* Footer Info */}
                                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[9px] font-extrabold text-slate-400">
                                                <span>แจ้งเตือนอันตราย</span>
                                                <span>{sim.time} น.</span>
                                            </div>
                                        </div>
                                        
                                        {/* Action Button */}
                                        <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                            <button 
                                                type="button"
                                                className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-100 active:scale-[0.98] transition-all rounded-lg text-[11px] font-black text-gray-800 shadow-sm"
                                            >
                                                เปิดเข้าแอป
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
                                className="flex flex-col items-center justify-center py-6 text-xs text-rose-800/60 font-bold font-sans"
                            >
                                <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-rose-100 mb-2 text-rose-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-rose-900/70">คลิก "ทดสอบส่งแจ้งเตือน" เพื่อลองส่งจำลองข้อความจริง</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AbsentCheckCard;
