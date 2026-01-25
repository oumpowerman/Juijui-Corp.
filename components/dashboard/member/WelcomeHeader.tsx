
import React, { useState } from 'react';
import { User, WorkStatus } from '../../../types';
import { WORK_STATUS_CONFIG } from '../../../constants';
import { Trophy, Star, Wallet, ChevronDown, Bell, Heart, ShoppingBag, BookOpen, Edit2, Sparkles, MessageCircle } from 'lucide-react';
import UserStatusBadge from '../../UserStatusBadge';
import GameRulesModal from '../../gamification/GameRulesModal';
import { useGreetings } from '../../../hooks/useGreetings';

interface WelcomeHeaderProps {
    user: User;
    onUpdateStatus: (status: WorkStatus) => void;
    onOpenShop: () => void;
    onOpenNotifications: () => void;
    onEditProfile: () => void;
    unreadNotifications: number;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ 
    user, 
    onUpdateStatus, 
    onOpenShop,
    onOpenNotifications,
    onEditProfile,
    unreadNotifications
}) => {
    const [isRulesOpen, setIsRulesOpen] = useState(false);
    const { randomGreeting } = useGreetings();

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
            {/* Custom Animation Styles */}
            <style>{`
                @keyframes float-gentle {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-6px) rotate(2deg); }
                }
                .animate-float-gentle {
                    animation: float-gentle 3.5s ease-in-out infinite;
                }
                .pop-shadow {
                    box-shadow: 4px 4px 0px 0px rgba(99, 102, 241, 0.2);
                }
                .pop-shadow:hover {
                    transform: translate(-2px, -2px);
                    box-shadow: 6px 6px 0px 0px rgba(99, 102, 241, 0.3);
                }
            `}</style>

            {/* Main Container */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative overflow-visible">
                
                {/* Background Decor Mask */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-bl-full opacity-50" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    {/* 1. User Profile & Status */}
                    <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <div className="relative group cursor-pointer shrink-0 pt-2" onClick={onEditProfile} title="คลิกเพื่อแก้ไขโปรไฟล์">
                            <div className={`w-20 h-20 rounded-full p-1 shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl ${isHpLow ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-tr from-indigo-500 to-purple-500'}`}>
                                <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover border-4 border-white" alt={user.name} />
                            </div>
                            
                            {/* VISIBLE Edit Button (Top Right) */}
                            <div className="absolute -top-1 -right-1 bg-white text-gray-400 hover:text-indigo-600 p-1.5 rounded-full border border-gray-200 shadow-sm z-20 transition-colors mt-2">
                                <Edit2 className="w-3 h-3" />
                            </div>

                            {/* Level Badge (Bottom Right) */}
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md z-10 pointer-events-none">
                                <div className="bg-yellow-400 text-white text-xs font-black px-2 py-0.5 rounded-full border-2 border-white flex items-center shadow-sm">
                                    Lv.{user.level}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col relative">
                            {/* Greeting Bubble (New Design: 3D Pop & Animated) */}
                            <div className="relative -ml-2 mb-2 z-20 animate-float-gentle hidden sm:block origin-bottom-left">
                                <div className="
                                    bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50
                                    border-2 border-indigo-200
                                    px-5 py-3 
                                    rounded-2xl rounded-tl-none
                                    pop-shadow
                                    flex items-center gap-3
                                    w-fit min-w-[200px]
                                    transition-all duration-300
                                    cursor-default
                                ">
                                    <div className="bg-white p-1.5 rounded-full shadow-sm border border-indigo-100">
                                        <span className="text-xl leading-none">✨</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 leading-none">TODAY'S VIBE</p>
                                        <p className="text-sm font-bold text-slate-700 leading-tight">
                                            "{randomGreeting || 'ขอให้เป็นวันที่ดีนะ!'}"
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Triangle Tail (Custom CSS Triangle) */}
                                <div className="absolute top-[0px] -left-[9px] w-0 h-0 
                                    border-t-[14px] border-t-indigo-200 
                                    border-l-[14px] border-l-transparent">
                                </div>
                                <div className="absolute top-[2px] -left-[5px] w-0 h-0 
                                    border-t-[11px] border-t-white 
                                    border-l-[11px] border-l-transparent">
                                </div>
                            </div>

                            {/* Name & Mobile Greeting */}
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight mt-1">
                                สวัสดี, {user.name.split(' ')[0]}! 👋
                            </h1>
                            
                            {/* Mobile Only Greeting Text */}
                            <p className="text-xs font-medium text-indigo-500 sm:hidden mt-1 italic">
                                "{randomGreeting || 'Have a nice day!'}"
                            </p>
                            
                            {/* Status Selector Dropdown */}
                            <div className="relative group mt-2 inline-block w-fit">
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
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
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
