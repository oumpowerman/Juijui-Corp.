
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../../types';
import { Palette, Users, User as UserIcon, ChevronDown, Sparkles, BatteryCharging } from 'lucide-react';
import MentorTip from '../../MentorTip';
import { TimeRangeOption, ViewScope } from '../../../hooks/useDashboardStats';
import { useGreetings } from '../../../hooks/useGreetings';
import NotificationBellBtn from '../../NotificationBellBtn';

interface DashboardHeaderProps {
    currentUser: User;
    currentThemeName: string;
    timeRange: TimeRangeOption;
    setTimeRange: (range: TimeRangeOption) => void;
    customDays: number;
    setCustomDays: (days: number) => void;
    viewScope: ViewScope;
    setViewScope: (scope: ViewScope) => void;
    onOpenSettings: () => void;
    onOpenNotifications?: () => void; 
    unreadCount?: number; 
    getTimeRangeLabel: () => string;
    onOpenWorkload: () => void; // New Prop
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    currentUser,
    currentThemeName,
    timeRange,
    setTimeRange,
    customDays,
    setCustomDays,
    viewScope,
    setViewScope,
    onOpenSettings,
    onOpenNotifications,
    unreadCount = 0,
    getTimeRangeLabel,
    onOpenWorkload
}) => {
    const { randomGreeting } = useGreetings();
    
    const DASHBOARD_TIPS = [
        "สัปดาห์นี้มาในธีม: " + currentThemeName,
        "คลิกที่การ์ดสถานะด้านบน เพื่อดูรายการงานทั้งหมดในกลุ่มนั้นได้เลย",
        "ช่วง Script คือหัวใจสำคัญ วางโครงเรื่องให้แน่น จะถ่ายง่ายขึ้นเยอะ!",
        "พักสายตาทุก 45 นาทีด้วยนะ งานเดิน สุขภาพต้องดีด้วย"
    ];

    return (
        <div className="flex flex-col xl:flex-row gap-6 items-stretch mb-4">
            <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-start">
                    <div className="relative">
                        <motion.h1 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-4xl font-black text-slate-800 tracking-tighter flex items-center"
                        >
                            ยินดีต้อนรับ, {currentUser.name.split(' ')[0]}! 
                            <motion.span 
                                animate={{ rotate: [0, 20, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                className="text-4xl ml-3 inline-block"
                            >
                                🚀
                            </motion.span>
                        </motion.h1>
                        
                        {/* Dynamic Greeting */}
                        {randomGreeting ? (
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-sm font-bold text-indigo-500/80 mt-2 flex items-center italic"
                            >
                                <Sparkles className="w-4 h-4 mr-2 text-amber-400 animate-pulse" />
                                "{randomGreeting}"
                            </motion.p>
                        ) : (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] bg-white/60 backdrop-blur-md text-indigo-600 px-3 py-1 rounded-full font-black border border-white/40 flex items-center shadow-sm uppercase tracking-widest">
                                    <Palette className="w-3 h-3 mr-1.5" /> Theme: {currentThemeName}
                                </span>
                            </div>
                        )}
                        
                         <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             ภาพรวมในช่วง: <span className="text-slate-600">{getTimeRangeLabel()}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <motion.button 
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onOpenWorkload}
                            className="p-3 bg-white/70 backdrop-blur-md border border-white/50 text-teal-500 hover:text-teal-600 rounded-2xl shadow-sm hover:shadow-xl transition-all hidden md:flex"
                            title="เช็คภาระงาน (Workload)"
                        >
                            <BatteryCharging className="w-6 h-6" />
                        </motion.button>
                        <NotificationBellBtn 
                            onClick={() => { if (onOpenNotifications) onOpenNotifications(); else onOpenSettings(); }}
                            unreadCount={unreadCount}
                            className="hidden md:flex"
                        />
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 flex shadow-sm">
                        <button 
                            onClick={() => setViewScope('ALL')} 
                            className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-black transition-all ${viewScope === 'ALL' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Users className="w-4 h-4 mr-2" /> ทีม (All)
                        </button>
                        <button 
                            onClick={() => setViewScope('ME')} 
                            className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-black transition-all ${viewScope === 'ME' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <UserIcon className="w-4 h-4 mr-2" /> ของฉัน (Me)
                        </button>
                    </div>

                    <div className="relative group z-20 w-fit">
                        <div className="flex flex-wrap items-center gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-white/40">
                            <div className="relative">
                                <select 
                                    value={timeRange} 
                                    onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)} 
                                    className="appearance-none bg-white/80 hover:bg-white text-slate-700 font-black py-2.5 pl-5 pr-12 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm border-transparent shadow-sm"
                                >
                                    <option value="THIS_MONTH">📅 เดือนนี้</option>
                                    <option value="LAST_30">🗓️ 30 วันล่าสุด</option>
                                    <option value="LAST_90">📊 90 วันล่าสุด</option>
                                    <option value="CUSTOM">✏️ กำหนดเอง</option>
                                    <option value="ALL">♾️ ทั้งหมด</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {timeRange === 'CUSTOM' && (
                            <motion.div 
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 'auto', opacity: 1 }}
                                className="flex items-center bg-white/80 rounded-xl px-3 border border-white/40 shadow-sm"
                            >
                                <input 
                                    type="number" 
                                    value={customDays} 
                                    onChange={(e) => { const val = parseInt(e.target.value); if(val > 0) setCustomDays(val); }} 
                                    className="w-14 py-2 bg-transparent text-center font-black text-indigo-600 outline-none" 
                                />
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-2">วัน</span>
                            </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 xl:max-w-2xl h-full flex items-center">
                 <MentorTip variant="blue" messages={DASHBOARD_TIPS} className="h-full w-full glass-card rounded-[2.5rem] border-none shadow-indigo-100/50" />
            </div>
        </div>
    );
};

export default DashboardHeader;
