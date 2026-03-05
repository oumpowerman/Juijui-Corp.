
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Trophy, Heart, Coins, Gavel, 
    CircuitBoard, Sparkles, ChevronRight, 
    Zap, Target, Shield, Info,
    Clock, AlertTriangle, Star, Gift,
    UserCheck, Calendar, Coffee, LogOut,
    MapPin, Home, Briefcase
} from 'lucide-react';
import { useGameConfig } from '../../context/GameConfigContext';

interface GameRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Sub-components for better organization ---

const SectionHeader: React.FC<{ title: string; icon: any; color: string }> = ({ title, icon: Icon, color }) => (
    <h4 className={`text-${color}-600 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2`}>
        <Icon className="w-4 h-4" /> {title}
    </h4>
);

const InfoCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className={`flex justify-between items-center p-3 bg-white/50 rounded-2xl border border-${color}-100`}>
        <span className="text-sm font-bold text-gray-700">{label}</span>
        <span className={`text-${color}-600 font-bold`}>{value}</span>
    </div>
);

const XPContent: React.FC<{ config: any }> = ({ config }) => {
    const globals = config?.GLOBAL_MULTIPLIERS || {};
    const diffXP = config?.DIFFICULTY_XP || {};
    const leveling = config?.LEVELING_SYSTEM || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                    <SectionHeader title="รางวัล XP พื้นฐาน" icon={Target} color="amber" />
                    <div className="space-y-3">
                        <InfoCard label="งานระดับง่าย (Easy)" value={`+${diffXP.EASY || 50} XP`} color="amber" />
                        <InfoCard label="งานระดับปกติ (Medium)" value={`+${diffXP.MEDIUM || 100} XP`} color="amber" />
                        <InfoCard label="งานระดับยาก (Hard)" value={`+${diffXP.HARD || 250} XP`} color="amber" />
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                    <SectionHeader title="โบนัสพิเศษ" icon={Zap} color="amber" />
                    <div className="space-y-3">
                        <InfoCard label="XP ต่อชั่วโมงทำงาน" value={`+${globals.XP_PER_HOUR || 20} XP`} color="amber" />
                        <InfoCard label="ส่งงานก่อนกำหนด" value={`+${globals.XP_BONUS_EARLY || 50} XP`} color="amber" />
                        <InfoCard label="ทำเวรเสร็จสิ้น" value={`+${globals.XP_DUTY_COMPLETE || 20} XP`} color="amber" />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-amber-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80">ระบบเลเวล</h4>
                <p className="text-2xl font-bold mb-4">เลเวลอัปทุกๆ {leveling.base_xp_per_level || 1000} XP</p>
                <div className="grid grid-cols-2 gap-4 text-sm font-bold opacity-90">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>เลเวลสูงสุด: {leveling.max_level || 100}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span>โบนัสเงินเมื่อเลเวลอัป: +{leveling.level_up_bonus_coins || 500} JP</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const HPContent: React.FC<{ config: any }> = ({ config }) => {
    const penalties = config?.PENALTY_RATES || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/60 shadow-sm">
                <SectionHeader title="อัตราการลดพลังชีวิต (Damage)" icon={AlertTriangle} color="rose" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-400 uppercase">งานล่าช้า (Overdue)</p>
                            <p className="text-xl font-bold text-rose-900">-{penalties.HP_PENALTY_LATE || 5} HP / วัน</p>
                        </div>
                    </div>
                    <div className="p-5 bg-rose-50/50 rounded-3xl border border-rose-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                            <Gavel className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-rose-400 uppercase">ลืมทำเวร (Missed Duty)</p>
                            <p className="text-xl font-bold text-rose-900">-{penalties.HP_PENALTY_MISSED_DUTY || 10} HP</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                    <h4 className="text-rose-600 font-bold text-xs uppercase tracking-widest mb-3">สถานะวิกฤต (Critical)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        หาก HP ต่ำกว่า <span className="text-rose-600 font-bold">30%</span> กรอบรูปจะกลายเป็นสีแดงกระพริบ 🚨 เพื่อเตือนให้รีบแก้ไขสถานการณ์
                    </p>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                    <h4 className="text-rose-600 font-bold text-xs uppercase tracking-widest mb-3">การฟื้นฟู (Recovery)</h4>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        ฟื้นฟู HP ได้โดยการซื้อ <span className="text-emerald-600 font-bold">ยาแก้ปวดหลัง</span> ในร้านค้า หรือทำความดีพิเศษเพื่อล้างโทษ
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

const CoinContent: React.FC<{ config: any }> = ({ config }) => {
    const globals = config?.GLOBAL_MULTIPLIERS || {};
    const leveling = config?.LEVELING_SYSTEM || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm text-center">
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
                        <Star className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-indigo-400 uppercase mb-1">ปิดงานสำเร็จ</p>
                    <p className="text-xl font-bold text-indigo-900">+{globals.COIN_TASK || 10} JP</p>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm text-center">
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
                        <Zap className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-indigo-400 uppercase mb-1">โบนัสส่งไว</p>
                    <p className="text-xl font-bold text-indigo-900">+{globals.COIN_BONUS_EARLY || 20} JP</p>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm text-center">
                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
                        <CircuitBoard className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-indigo-400 uppercase mb-1">รางวัลทำเวร</p>
                    <p className="text-xl font-bold text-indigo-900">+{globals.COIN_DUTY || 5} JP</p>
                </div>
            </div>

            <div className="bg-indigo-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <Gift className="w-8 h-8 text-indigo-300" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-60">รางวัลเลเวลอัป</h4>
                        <p className="text-3xl font-bold">+{leveling.level_up_bonus_coins || 500} JP</p>
                        <p className="text-xs font-bold text-indigo-300 mt-1">รับทันทีเมื่อเลเวลอัป!</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const AttendanceContent: React.FC<{ config: any }> = ({ config }) => {
    const rules = config?.ATTENDANCE_RULES || {};

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                    <SectionHeader title="การเข้างาน (Check-in)" icon={UserCheck} color="emerald" />
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-gray-700">ตรงเวลา</span>
                            </div>
                            <span className="text-emerald-600 font-bold">+{rules.ON_TIME?.xp || 15} XP / +{rules.ON_TIME?.coins || 5} JP</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-rose-500" />
                                <span className="text-sm font-bold text-gray-700">มาสาย</span>
                            </div>
                            <span className="text-rose-600 font-bold">{rules.LATE?.hp || -5} HP</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-2xl border border-red-100">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-bold text-gray-700">ขาดงาน</span>
                            </div>
                            <span className="text-red-600 font-bold">{rules.ABSENT?.hp || -20} HP</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm">
                    <SectionHeader title="รูปแบบการทำงาน" icon={Briefcase} color="sky" />
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-sky-50/50 rounded-2xl border border-sky-100">
                            <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-sky-500" />
                                <span className="text-sm font-bold text-gray-700">WFH</span>
                            </div>
                            <span className="text-sky-600 font-bold">+{rules.WFH?.xp || 10} XP</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm font-bold text-gray-700">On-Site</span>
                            </div>
                            <span className="text-indigo-600 font-bold">+{rules.SITE?.xp || 20} XP</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                            <div className="flex items-center gap-2">
                                <Coffee className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-bold text-gray-700">ลากิจ/ลาป่วย</span>
                            </div>
                            <span className="text-amber-600 font-bold">ไม่หัก HP</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                        <LogOut className="w-8 h-8 text-emerald-300" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-60">การลงเวลาออกงาน</h4>
                        <p className="text-xl font-bold">อย่าลืม Check-out เพื่อรับรางวัลประจำวัน!</p>
                        <p className="text-xs font-bold text-emerald-300 mt-1">การกลับก่อนเวลาอาจส่งผลต่อ HP ตามระยะเวลาที่ขาดไป</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const JudgeContent: React.FC = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-2xl">
                        <Gavel className="w-16 h-16 text-slate-300" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-bold mb-2">ระบบตุลาการ (The Judge)</h3>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            ระบบ AI อัจฉริยะที่คอยตรวจสอบวินัยและความรับผิดชอบของสมาชิกทุกคนแบบ Real-time และลงดาบเมื่อมีการละเลยหน้าที่
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                    <SectionHeader title="เวลาทำงาน" icon={Clock} color="slate" />
                    <p className="text-sm text-gray-600 font-bold leading-relaxed">
                        The Judge จะตรวจสอบระบบทุก <span className="text-slate-900">เที่ยงคืน</span> หรือทุกครั้งที่มีการ <span className="text-slate-900">Login</span> เข้าใช้งาน
                    </p>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                    <SectionHeader title="ภูมิคุ้มกัน" icon={Shield} color="slate" />
                    <p className="text-sm text-gray-600 font-bold leading-relaxed">
                        ใช้ไอเทม <span className="text-indigo-600 font-bold">Time Warp</span> หรือ <span className="text-emerald-600 font-bold">Duty Shield</span> เพื่อป้องกันการลงโทษจากระบบ
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Modal Component ---

const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
    const { config } = useGameConfig();
    const [selectedTab, setSelectedTab] = useState<'XP' | 'HP' | 'COIN' | 'ATTENDANCE' | 'JUDGE'>('XP');

    if (!isOpen) return null;

    const portalRoot = document.getElementById('portal-root') || document.body;

    const TABS = [
        { id: 'XP', label: 'เลเวล & XP', icon: Trophy, color: 'amber', gradient: 'from-amber-400 via-orange-400 to-orange-500', shadow: 'shadow-orange-200/50' },
        { id: 'HP', label: 'พลังชีวิต (HP)', icon: Heart, color: 'rose', gradient: 'from-rose-400 via-pink-400 to-pink-500', shadow: 'shadow-pink-200/50' },
        { id: 'COIN', label: 'เงินรางวัล (JP)', icon: Coins, color: 'indigo', gradient: 'from-indigo-400 via-violet-400 to-violet-500', shadow: 'shadow-indigo-200/50' },
        { id: 'ATTENDANCE', label: 'การเข้างาน', icon: UserCheck, color: 'emerald', gradient: 'from-emerald-400 via-teal-400 to-teal-500', shadow: 'shadow-emerald-200/50' },
        { id: 'JUDGE', label: 'ระบบตุลาการ', icon: Gavel, color: 'slate', gradient: 'from-slate-600 via-slate-700 to-slate-800', shadow: 'shadow-slate-200/50' },
    ] as const;

    const activeTab = TABS.find(t => t.id === selectedTab);

    const renderContent = () => {
        switch (selectedTab) {
            case 'XP': return <XPContent config={config} />;
            case 'HP': return <HPContent config={config} />;
            case 'COIN': return <CoinContent config={config} />;
            case 'ATTENDANCE': return <AttendanceContent config={config} />;
            case 'JUDGE': return <JudgeContent />;
            default: return null;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl h-[95vh] md:h-[800px] bg-white/80 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden flex flex-col md:flex-row"
            >
                {/* Background Decorative Blobs */}
                <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-br ${activeTab?.gradient} opacity-10 blur-[100px] pointer-events-none transition-all duration-700`} />
                <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-tr ${activeTab?.gradient} opacity-10 blur-[100px] pointer-events-none transition-all duration-700`} />

                {/* Left Sidebar - Navigation (Horizontal on Mobile, Vertical on Desktop) */}
                <div className="w-full md:w-80 bg-white/40 border-b md:border-b-0 md:border-r border-white/40 p-5 md:p-8 flex flex-col relative z-10 shrink-0">
                    <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-12">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl">
                            <CircuitBoard className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">คู่มือระบบ</h2>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">System v3.0</p>
                        </div>
                        {/* Mobile Close Button (Inside Sidebar for better access) */}
                        <button 
                            onClick={onClose}
                            className="md:hidden ml-auto p-2 bg-white/50 text-slate-400 rounded-xl border border-white/60"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`
                                    p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 transition-all relative group shrink-0 md:shrink
                                    ${selectedTab === tab.id 
                                        ? `bg-white shadow-lg md:shadow-xl ${tab.shadow} text-slate-900 scale-[1.02]` 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }
                                `}
                            >
                                {selectedTab === tab.id && (
                                    <motion.div 
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl -z-10"
                                    />
                                )}
                                <tab.icon className={`w-4 h-4 md:w-5 md:h-5 transition-colors ${selectedTab === tab.id ? `text-${tab.color}-500` : ''}`} />
                                <span className="text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">{tab.label}</span>
                                {selectedTab === tab.id && <ChevronRight className="hidden md:block w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:block mt-auto pt-8 border-t border-white/40">
                        <div className="bg-white/60 p-4 rounded-2xl border border-white/80 flex items-center gap-3">
                            <Info className="w-5 h-5 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                ข้อมูลนี้อัปเดตตามการตั้งค่าระบบปัจจุบัน (Master Config)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative overflow-hidden z-10">
                    {/* Desktop Close Button */}
                    <button 
                        onClick={onClose}
                        className="hidden md:block absolute top-8 right-8 p-3 bg-white/50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all z-50 border border-white/60 shadow-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Content Header */}
                    <div className="p-6 md:p-12 pb-2 md:pb-4">
                        <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                            <Sparkles className={`w-4 h-4 md:w-5 md:h-5 text-${activeTab?.color}-500`} />
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em]">รายละเอียดโมดูล</span>
                        </div>
                        <h1 className={`text-3xl md:text-5xl font-bold tracking-tighter mb-2 md:mb-4 bg-gradient-to-r ${activeTab?.gradient} bg-clip-text text-transparent`}>
                            {activeTab?.label}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm md:text-lg max-w-xl line-clamp-2 md:line-clamp-none">
                            {selectedTab === 'XP' && 'สะสมประสบการณ์จากการทำงานและกิจกรรมต่างๆ เพื่อเลื่อนระดับและปลดล็อกรางวัล'}
                            {selectedTab === 'HP' && 'รักษาวินัยและความรับผิดชอบเพื่อไม่ให้พลังชีวิตลดลงจนถึงขั้นวิกฤต'}
                            {selectedTab === 'COIN' && 'รับเงินรางวัลจากการทำภารกิจสำเร็จเพื่อนำไปแลกไอเทมในร้านค้า'}
                            {selectedTab === 'ATTENDANCE' && 'กฎเกณฑ์การเข้า-ออกงาน และรางวัลสำหรับความตรงต่อเวลา'}
                            {selectedTab === 'JUDGE' && 'ระบบตรวจสอบอัตโนมัติที่คอยดูแลความเรียบร้อยของสมาชิกทุกคน'}
                        </p>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-12 pt-2 md:pt-4 scrollbar-hide relative">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={selectedTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Bottom Decorative Element */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
                </div>
            </motion.div>
        </div>,
        portalRoot
    );
};

export default GameRulesModal;
