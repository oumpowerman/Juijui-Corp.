
import React, { useState } from 'react';
import { User, WorkStatus } from '../../../types';
import { WORK_STATUS_CONFIG } from '../../../constants';
import { Trophy, Star, Wallet, ChevronDown, Bell, Heart, ShoppingBag, BookOpen } from 'lucide-react';
import UserStatusBadge from '../../UserStatusBadge';
import GameRulesModal from '../../gamification/GameRulesModal';

interface WelcomeHeaderProps {
    user: User;
    onUpdateStatus: (status: WorkStatus) => void;
    onOpenShop: () => void;
    onOpenNotifications: () => void;
    unreadNotifications: number;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ 
    user, 
    onUpdateStatus, 
    onOpenShop,
    onOpenNotifications,
    unreadNotifications
}) => {
    const [isRulesOpen, setIsRulesOpen] = useState(false);

    // Calculate Level Progress
    const nextLevelXP = user.level * 1000;
    const progressPercent = Math.min((user.xp / nextLevelXP) * 100, 100);
    
    // HP Percentage
    const hpPercent = Math.min((user.hp / (user.maxHp || 100)) * 100, 100);
    const isHpLow = hpPercent < 30;

    // Status Logic
    const currentStatusConfig = WORK_STATUS_CONFIG[user.workStatus || 'ONLINE'];

    return (
        <>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-bl-full opacity-50 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* 1. User Profile & Status */}
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className={`w-20 h-20 rounded-full p-1 shadow-lg transition-all ${isHpLow ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>
                                <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white" alt={user.name} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                <div className="bg-yellow-400 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-white flex items-center shadow-sm">
                                    Lv.{user.level}
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                                สวัสดี, {user.name.split(' ')[0]}! 👋
                            </h1>
                            
                            {/* Status Selector Dropdown */}
                            <div className="relative group mt-1 inline-block">
                                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold ${currentStatusConfig.color} bg-opacity-10 hover:bg-opacity-20`}>
                                    {currentStatusConfig.icon} {currentStatusConfig.label} <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold px-2 py-1">เปลี่ยนสถานะ (Set Status)</p>
                                    {Object.entries(WORK_STATUS_CONFIG).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => onUpdateStatus(key as WorkStatus)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors ${user.workStatus === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
                                        >
                                            <span>{config.icon}</span>
                                            {config.label.split('(')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Stats & Gamification */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {/* Status Bars */}
                        <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col justify-center min-w-[200px] gap-2 relative group cursor-help" onClick={() => setIsRulesOpen(true)}>
                             {/* Hint Label */}
                             <div className="absolute -top-2 right-2 bg-white text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm pointer-events-none">
                                คลิกเพื่อดูกติกา
                             </div>

                            {/* HP Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1 px-1">
                                    <span className="flex items-center gap-1 text-red-400"><Heart className="w-3 h-3 fill-red-400" /> HP</span>
                                    <span className={isHpLow ? 'text-red-500 animate-pulse' : ''}>{user.hp}/{user.maxHp || 100}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 relative ${isHpLow ? 'bg-red-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`}
                                        style={{ width: `${hpPercent}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* XP Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1 px-1">
                                    <span className="flex items-center gap-1 text-yellow-500"><Trophy className="w-3 h-3 fill-yellow-500" /> XP</span>
                                    <span>{user.xp}/{nextLevelXP}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-200">
                                    <div 
                                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 relative"
                                        style={{ width: `${progressPercent}%` }}
                                    >
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* Rules Button */}
                            <button 
                                onClick={() => setIsRulesOpen(true)}
                                className="p-3 bg-white border border-gray-200 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center w-[50px] group"
                                title="กติกาการเล่น (Game Rules)"
                            >
                                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>

                            {/* Wallet / Shop Button */}
                            <button 
                                onClick={onOpenShop}
                                className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex flex-col items-center justify-center min-w-[80px] group"
                            >
                                <ShoppingBag className="w-5 h-5 mb-1 group-hover:rotate-12 transition-transform" />
                                <span className="text-xs font-bold">{user.availablePoints} Pts</span>
                            </button>

                            {/* Notification Bell */}
                            <button 
                                onClick={onOpenNotifications}
                                className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 relative flex flex-col items-center justify-center w-[50px]"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Rules Modal */}
            <GameRulesModal 
                isOpen={isRulesOpen} 
                onClose={() => setIsRulesOpen(false)} 
            />
        </>
    );
};

export default WelcomeHeader;
