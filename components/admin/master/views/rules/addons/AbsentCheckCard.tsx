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
    const [sim, setSim] = useState<{ active: boolean; scanning: boolean; logs: string[]; step: number }>({
        active: false,
        scanning: false,
        logs: [],
        step: 0
    });

    const triggerSimulator = () => {
        setSim({
            active: true,
            scanning: true,
            logs: [`[Server Task] เริ่มขั้นตอนการตรวจสอบการขาดงานประจำวัน (${tempTimeConfig.absentPenaltyTime || '19:00'} น.)...`],
            step: 0
        });

        const scanSteps = [
            '🔍 ดึงรายชื่อพนักงานที่เปิดใช้งานอยู่ตามกลุ่มเป้าหมาย...',
            '📂 กำลังตรวจสอบตารางเวลาทำงานและปฏิทินวันหยุด...',
            '📅 ผลลัพธ์: วันนี้เป็นวันทำงานปกติ (ไม่ตรงกับวันหยุดบริษัท)',
            '⏳ ตรวจสอบการลงเวลา (Attendance Logs) ย้อนหลังของวันนี้...',
            '📋 ตรวจพบพนักงานที่ไม่มีการเข้างาน และไม่มีการลา:',
            '👤 รายชื่อ: นายสุมิตร ตั้งใจทำงาน (การตลาด) [MEMBER]',
            '📉 บันทึกประวัติ "ขาดงาน (ABSENT)" ลงฐานข้อมูลระบบ',
            '💔 หักคะแนนสุขภาพพนักงาน (HP) อัตโนมัติ -10 HP',
            '🔔 บันทึกการแจ้งเตือนและส่งระบบ Push Notification เข้า LINE เรียบร้อย',
            '🎉 ตรวจเช็คเสร็จสิ้นอย่างสมบูรณ์แบบ!'
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < scanSteps.length) {
                setSim(prev => ({
                    ...prev,
                    logs: [...prev.logs, scanSteps[currentStep]],
                    step: currentStep + 1
                }));
                currentStep++;
            } else {
                clearInterval(interval);
                setSim(prev => ({ ...prev, scanning: false }));
            }
        }, 1000);
    };

    const isEnabled = tempTimeConfig.absentPenaltyEnabled === 'true';

    return (
        <div id="sim-card-absent" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-100">
                        <UserMinus className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> 📋 แผน F (Absent Check)
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
                        <Monitor className="w-4 h-4 text-rose-500" /> คอนโซลจำลองการตรวจสอบขาดงาน
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: sim.scanning ? 1 : 1.03, y: sim.scanning ? 0 : -1 }}
                        whileTap={{ scale: sim.scanning ? 1 : 0.97 }}
                        type="button"
                        onClick={triggerSimulator}
                        disabled={sim.scanning}
                        className="px-3.5 py-1.5 bg-rose-600 disabled:bg-rose-200 disabled:text-rose-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black hover:bg-rose-700 flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/10 hover:shadow-rose-600/20"
                    >
                        {sim.scanning ? '⌛ กำลังตรวจสอบ...' : '🔍 เริ่มตรวจสอบขาดงาน'}
                    </motion.button>
                </div>

                <div className={`relative h-[200px] bg-gradient-to-b from-rose-50 to-rose-100/20 rounded-xl p-3 text-slate-800 border border-rose-100/60 shadow-inner flex flex-col ${sim.active ? 'justify-start pt-2' : 'justify-center'} overflow-hidden font-mono`}>
                    <AnimatePresence mode="wait">
                        {sim.active ? (
                            <div className="space-y-1 text-[10.5px] leading-relaxed h-full overflow-y-auto pr-1">
                                {sim.logs.map((log, lIdx) => {
                                    let textColor = 'text-rose-900/80';
                                    if (log.includes('⚠️') || log.includes('📋')) textColor = 'text-amber-600 font-extrabold flex items-center gap-1';
                                    else if (log.includes('👤')) textColor = 'text-indigo-600 font-extrabold pl-3';
                                    else if (log.includes('📉')) textColor = 'text-rose-700 font-bold pl-3';
                                    else if (log.includes('💔')) textColor = 'text-red-600 font-extrabold pl-3 animate-pulse';
                                    else if (log.includes('🎉') || log.includes('✅') || log.includes('🔔')) textColor = 'text-emerald-600 font-black';
                                    return (
                                        <motion.div 
                                            key={lIdx} 
                                            initial={{ opacity: 0, x: -4 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className={textColor}
                                        >
                                            &gt; {log}
                                        </motion.div>
                                    );
                                })}
                                {sim.scanning && (
                                    <div className="text-rose-500/70 animate-pulse pl-1">&gt; [Server Running] กำลังสแกนหาผู้ขาดงาน...</div>
                                )}
                            </div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3.5 text-xs text-rose-800/60 font-bold font-sans"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-rose-100 mb-1.5 text-rose-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-rose-900/60">คลิก "เริ่มตรวจสอบขาดงาน" เพื่อทดสอบและตรวจดู log การทำงาน</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AbsentCheckCard;
