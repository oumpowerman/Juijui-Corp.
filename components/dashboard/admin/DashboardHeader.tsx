
import React from 'react';
import { User, DashboardConfig } from '../../../types';
import { Palette, Bell, Users, User as UserIcon, ChevronDown, Sparkles } from 'lucide-react';
import MentorTip from '../../MentorTip';
import { TimeRangeOption, ViewScope } from '../../../hooks/useDashboardStats';
import { useGreetings } from '../../../hooks/useGreetings';

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
    onOpenNotifications?: () => void; // New prop
    getTimeRangeLabel: () => string;
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
    getTimeRangeLabel
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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center">
                            ยินดีต้อนรับ, {currentUser.name.split(' ')[0]}! <span className="text-4xl ml-2">🚀</span>
                        </h1>
                        
                        {/* Dynamic Greeting */}
                        {randomGreeting ? (
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center animate-in fade-in slide-in-from-left-4 duration-700 italic">
                                <Sparkles className="w-3 h-3 mr-1.5 text-yellow-500" />
                                "{randomGreeting}"
                            </p>
                        ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100 flex items-center">
                                    <Palette className="w-3 h-3 mr-1" /> Theme: {currentThemeName}
                                </span>
                            </div>
                        )}
                        
                         <p className="text-gray-400 text-xs mt-2">
                             ภาพรวมในช่วง: <span className="font-bold text-gray-600">{getTimeRangeLabel()}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onOpenNotifications || onOpenSettings} // Use notifications if available, else settings
                        className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95"
                        title="การแจ้งเตือน"
                    >
                        <Bell className="w-5 h-5" />
                    </button>
                </div>

                {/* Controls Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                        <button onClick={() => setViewScope('ALL')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewScope === 'ALL' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <Users className="w-4 h-4 mr-2" /> ทีม (All)
                        </button>
                        <button onClick={() => setViewScope('ME')} className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewScope === 'ME' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <UserIcon className="w-4 h-4 mr-2" /> ของฉัน (Me)
                        </button>
                    </div>

                    <div className="relative group z-20 w-fit">
                        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
                            <div className="relative">
                                <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)} className="appearance-none bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 pl-4 pr-10 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm border-transparent focus:border-indigo-500">
                                    <option value="THIS_MONTH">📅 เดือนนี้</option>
                                    <option value="LAST_30">🗓️ 30 วันล่าสุด</option>
                                    <option value="LAST_90">📊 90 วันล่าสุด</option>
                                    <option value="CUSTOM">✏️ กำหนดเอง</option>
                                    <option value="ALL">♾️ ทั้งหมด</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                            </div>
                            {timeRange === 'CUSTOM' && (
                            <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300 bg-gray-50 rounded-lg px-2 border border-gray-200">
                                <input type="number" value={customDays} onChange={(e) => { const val = parseInt(e.target.value); if(val > 0) setCustomDays(val); }} className="w-14 py-1.5 bg-transparent text-center font-bold text-indigo-600 outline-none border-b-2 border-indigo-200 focus:border-indigo-500 transition-colors" />
                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap ml-2 mr-1">วัน</span>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 xl:max-w-2xl h-full flex items-center">
                 <MentorTip variant="blue" messages={DASHBOARD_TIPS} className="h-full" />
            </div>
        </div>
    );
};

export default DashboardHeader;
