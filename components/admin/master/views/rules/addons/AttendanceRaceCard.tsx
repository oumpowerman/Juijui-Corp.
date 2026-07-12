import React, { useState } from 'react';
import { Trophy, Sparkles, Monitor } from 'lucide-react';
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
}

interface AttendanceRaceCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const AttendanceRaceCard: React.FC<AttendanceRaceCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const [simRace, setSimRace] = useState<{
        active: boolean;
        showPodium: boolean;
        sparkles: Array<{ id: number; left: string; top: string; color: string }>;
    }>({
        active: false,
        showPodium: false,
        sparkles: [],
    });

    const triggerRaceSimulator = () => {
        // Generate random sparkles/confetti locations
        const newSparkles = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 90 + 5}%`,
            top: `${Math.random() * 80 + 10}%`,
            color: ['bg-yellow-400', 'bg-blue-400', 'bg-pink-400', 'bg-emerald-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
        }));

        setSimRace({
            active: true,
            showPodium: !simRace.showPodium,
            sparkles: newSparkles
        });

        // Clean up sparkles after 3 seconds
        setTimeout(() => {
            setSimRace(prev => ({
                ...prev,
                sparkles: []
            }));
        }, 3000);
    };

    return (
        <div id="sim-card-race" className="h-full flex flex-col justify-between space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-600 border border-purple-100">
                        <Trophy className="w-3.5 h-3.5 text-purple-500 animate-pulse" /> 🏆 แผน E (Attendance Race)
                    </span>
                    <span className="flex items-center gap-2 text-xs text-purple-600 font-bold bg-purple-50/60 px-3 py-1 rounded-xl border border-purple-100/40">
                        {tempTimeConfig.enableAttendanceRace === 'true' ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                ระบบเปิดใช้งาน
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                ระบบปิดอยู่
                            </>
                        )}
                    </span>
                </div>
                
                <h4 className="font-extrabold text-gray-800 text-lg tracking-tight mt-3 mb-1.5">
                    สนามวิ่งแข่งเช็คอินรายสัปดาห์
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    ฟังก์ชัน Gamification สร้างบรรยากาศสนุกสนานให้กับการทำงาน คืนความกระปรี้กระเปร่าด้วยลีดเดอร์บอร์ดการตอกบัตรเช้า 3 ลำดับแรกของวัน เพื่อช่วยกระตุ้นพนักงานให้มาเช็คอินเร็วขึ้นอย่างเป็นธรรมชาติ
                </p>
                
                <div className="mt-4 p-3 bg-gradient-to-r from-purple-50/40 to-purple-100/10 rounded-2xl border border-purple-100/70 flex items-center justify-between shadow-sm">
                    <span className="text-xs font-extrabold text-purple-900">⚡ สวิตช์สถานะเปิด/ปิดระบบ:</span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                            id="toggle-attendance-race"
                            type="checkbox" 
                            className="sr-only peer"
                            checked={tempTimeConfig.enableAttendanceRace === 'true'}
                            onChange={e => setTempTimeConfig(prev => ({ 
                                ...prev, 
                                enableAttendanceRace: e.target.checked ? 'true' : 'false' 
                            }))}
                        />
                        <div className="relative w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-purple-600"></div>
                        <span className="ml-2.5 text-xs font-black text-purple-900 min-w-[24px]">
                            {tempTimeConfig.enableAttendanceRace === 'true' ? 'เปิด' : 'ปิด'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Interactive Simulator Section */}
            <div className="bg-purple-50/40 rounded-2xl p-3.5 border border-purple-100/70 text-purple-950 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                
                {simRace.sparkles.map((sp) => (
                    <motion.div
                        key={sp.id}
                        initial={{ y: 50, opacity: 1, scale: 0.5 }}
                        animate={{ y: -100, opacity: 0, scale: 1.2, rotate: 360 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className={`absolute w-2 h-2 rounded-full ${sp.color}`}
                        style={{ left: sp.left, top: sp.top }}
                    />
                ))}

                <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-100/60 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-black text-purple-800">
                        <Monitor className="w-4 h-4 text-purple-500" /> คอนโซลบอร์ดเกียรติยศ
                    </div>
                    
                    <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={triggerRaceSimulator}
                        className="px-3.5 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/10 hover:shadow-purple-600/20"
                    >
                        🏆 {simRace.showPodium ? '🙈 ซ่อนโพเดียม' : '🏅 พรีวิวโพเดียม'}
                    </motion.button>
                </div>

                <div className={`relative h-[200px] bg-gradient-to-b from-purple-50 to-purple-100/20 rounded-xl p-3.5 text-slate-800 border border-purple-100/60 shadow-inner flex flex-col justify-center overflow-hidden`}>
                    <AnimatePresence mode="wait">
                        {simRace.showPodium ? (
                            <motion.div 
                                key="podium"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                                className="w-full flex items-end justify-center gap-4 h-full pt-4 pb-2 font-sans"
                            >
                                {/* RANK 2 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shadow-sm border border-slate-200">
                                        🥈
                                    </div>
                                    <div className="text-[10.5px] text-slate-700 mt-1 font-extrabold">คุณกอล์ฟ</div>
                                    <div className="w-14 h-14 bg-gradient-to-b from-slate-200 to-slate-300 border-t border-white rounded-t-xl flex items-center justify-center text-slate-800 text-[10px] font-black shadow-sm">
                                        #2 (07:45)
                                    </div>
                                </div>

                                {/* RANK 1 */}
                                <div className="flex flex-col items-center">
                                    <motion.div 
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.8 }}
                                        className="w-8.5 h-8.5 rounded-full bg-yellow-400 text-yellow-950 flex items-center justify-center font-bold text-sm shadow border border-yellow-200 relative z-10"
                                    >
                                        👑
                                    </motion.div>
                                    <div className="text-[11.5px] text-yellow-600 font-black mt-1">คุณแอน</div>
                                    <div className="w-16 h-[72px] bg-gradient-to-b from-yellow-300 to-amber-400 border-t border-white rounded-t-xl flex items-center justify-center text-yellow-950 text-[11px] font-black shadow relative">
                                        <Sparkles className="absolute -top-1.5 -right-1.5 text-yellow-600 w-3.5 h-3.5 animate-spin" />
                                        #1 (07:42)
                                    </div>
                                </div>

                                {/* RANK 3 */}
                                <div className="flex flex-col items-center">
                                    <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs shadow border border-amber-200">
                                        🥉
                                    </div>
                                    <div className="text-[10.5px] text-amber-800 mt-1 font-extrabold">คุณบี</div>
                                    <div className="w-14 h-9 bg-gradient-to-b from-amber-200 to-amber-300 border-t border-white rounded-t-xl flex items-center justify-center text-amber-900 text-[10px] font-black shadow-sm">
                                        #3 (07:49)
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-3.5 text-xs text-purple-800/60 font-bold"
                            >
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-purple-100 mb-1.5 text-purple-500">
                                    <Sparkles className="w-5 h-5 animate-pulse" />
                                </div>
                                <span className="text-[10.5px] text-purple-900/60 font-medium">คลิก "พรีวิวโพเดียม" เพื่อดูสรุปบอร์ดเหรียญรางวัลสัปดาห์</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRaceCard;
