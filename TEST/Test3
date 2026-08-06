import React, { useState } from 'react';
import { Trophy, Sparkles, Monitor, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { WorkTimeConfig } from '../WorkTimeCard';

interface AttendanceRaceCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
}

const AttendanceRaceCard: React.FC<AttendanceRaceCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
}) => {
    const isEnabled = tempTimeConfig.enableAttendanceRace === 'true';

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
            color: ['bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-emerald-400', 'bg-purple-300'][Math.floor(Math.random() * 5)]
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

    const handleToggle = (checked: boolean) => {
        setTempTimeConfig((prev) => ({
            ...prev,
            enableAttendanceRace: checked ? 'true' : 'false',
        }));
    };

    return (
        <div id="attendance-race-card" className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm relative overflow-hidden mt-8">
            {/* Elegant Purple corner gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/20 rounded-bl-full pointer-events-none"></div>

            <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-600 animate-pulse" />
                        สนามวิ่งแข่งเช็คอินรายสัปดาห์ (Weekly Attendance Race)
                    </h3>
                    <p className="text-xs text-gray-400">
                        ฟังก์ชัน Gamification สร้างบรรยากาศสนุกสนานให้กับการทำงานด้วยลีดเดอร์บอร์ดการตอกบัตรเช้า เพื่อช่วยกระตุ้นพนักงานให้มาทำงานเร็วขึ้นอย่างเป็นธรรมชาติ
                    </p>
                </div>

                {/* PREMIUM PURPLE TOGGLE SWITCH */}
                <div className="flex items-center gap-2.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-150 shrink-0">
                    <span className={`text-xs font-bold ${isEnabled ? 'text-purple-600' : 'text-gray-400'}`}>
                        {isEnabled ? 'เปิดใช้งานระบบ' : 'ปิดการใช้งาน'}
                    </span>
                    <button
                        type="button"
                        onClick={() => handleToggle(!isEnabled)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                            isEnabled ? 'bg-purple-500' : 'bg-gray-300'
                        }`}
                        aria-label="Toggle attendance race mode"
                    >
                        <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                                isEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!isEnabled ? (
                    <motion.div
                        key="disabled-mode"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-start gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-gray-700">โหมดปัจจุบัน: ปิดการจัดอันดับ Attendance Race</h4>
                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    ระบบจะคำนวณการสายและการบันทึกสถิติแบบปกติ โดยจะไม่มีการแสดงตารางเหรียญรางวัลเกียรติยศหรือจัดประกวดความไวสำหรับการเข้างานรายวันเพื่อกระตุ้นพนักงานในทีม
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="enabled-mode"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-6">
                            {/* Attendance Race Active Banner */}
                            <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl flex items-start gap-3">
                                <div className="p-2 bg-purple-500 text-white rounded-xl shrink-0 shadow-sm shadow-purple-100">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-purple-800">โหมดแข่งขันวิ่งเช็คอินเปิดทำงานอยู่</h4>
                                    <p className="text-[11px] text-purple-600/90 leading-relaxed">
                                        พนักงานที่เช็คอินเข้างานเช้า 3 คนแรกของวันจะได้รับสัญลักษณ์เกียรติยศ 🥇🥈🥉 บนหน้าแดชบอร์ดส่วนตัวของตนเอง พร้อมรับเหรียญรางวัลพิเศษเพื่อนำไปแลกรับของรางวัลที่ร้านค้าสวัสดิการได้ทันที
                                    </p>
                                </div>
                            </div>

                            {/* Two Column Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                                {/* Left Column: Tips and Slogans */}
                                <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50 flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                                            <Info className="w-4 h-4 text-purple-500" />
                                            ประโยชน์และคำแนะนำการตั้งค่า
                                        </h4>
                                        <p className="text-[11.5px] text-purple-900/80 leading-relaxed font-medium">
                                            กระตุ้นบรรยากาศที่สดใสในตอนเช้า! การให้รางวัลเล็กๆ น้อยๆ แก่ผู้ที่เข้างานตรงต่อเวลาหรือเช้าที่สุดเป็นจิตวิทยาเชิงบวก (Positive Reinforcement) ที่ได้ผลดีกว่าการทำโทษเพียงอย่างเดียว
                                        </p>
                                        <ul className="text-[10.5px] text-purple-850/70 space-y-1.5 list-disc pl-4 font-medium">
                                            <li>ปรับลดเวลา Late Buffer ควบคู่กับการจัดอันดับจะยิ่งเห็นผลดี</li>
                                            <li>เหรียญรางวัลของรางวัลร้านค้าสามารถปรับแต่งอัตราแลกได้ในหมวด Game Tuner</li>
                                            <li>แนะนำให้ติดประกาศความสำเร็จทุกช่วงสิ้นสัปดาห์เพื่อกระตุ้นพนักงาน</li>
                                        </ul>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl text-[10px] text-purple-600/80 leading-normal border border-purple-100/50">
                                        💡 <b>ทิป:</b> มาตอกบัตรให้เช้าขึ้นเพื่อสร้าง Daily Streaks และสะสมแต้ม HP ให้แข็งแกร่งในแอปพลิเคชัน!
                                    </div>
                                </div>

                                {/* Right Column: Interactive Sandbox Podium */}
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[240px] relative overflow-hidden group">
                                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-100/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>

                                    {/* Particle sparks */}
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
                                        <div className="flex items-center gap-1.5 text-xs font-black text-purple-900">
                                            <Monitor className="w-4 h-4 text-purple-500" /> คอนโซลจำลองบอร์ดโพเดียม
                                        </div>
                                        
                                        <motion.button
                                            whileHover={{ scale: 1.03, y: -1 }}
                                            whileTap={{ scale: 0.97 }}
                                            type="button"
                                            onClick={triggerRaceSimulator}
                                            className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/10 hover:shadow-purple-600/20"
                                        >
                                            🏆 {simRace.showPodium ? '🙈 ซ่อนโพเดียม' : '🏅 พรีวิวโพเดียม'}
                                        </motion.button>
                                    </div>

                                    <div className="relative flex-1 bg-gradient-to-b from-purple-50 to-purple-100/20 rounded-xl p-3.5 text-slate-800 border border-purple-100/60 shadow-inner flex flex-col justify-center overflow-hidden min-h-[160px]">
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
                                                        <div className="w-14 h-11 bg-gradient-to-b from-slate-200 to-slate-300 border-t border-white rounded-t-xl flex items-center justify-center text-slate-800 text-[10px] font-black shadow-sm">
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
                                                        <div className="w-16 h-[64px] bg-gradient-to-b from-yellow-300 to-amber-400 border-t border-white rounded-t-xl flex items-center justify-center text-yellow-950 text-[11px] font-black shadow relative">
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
                                                        <div className="w-14 h-7 bg-gradient-to-b from-amber-200 to-amber-300 border-t border-white rounded-t-xl flex items-center justify-center text-amber-900 text-[10px] font-black shadow-sm">
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AttendanceRaceCard;
