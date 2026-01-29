
import React from 'react';
import { User, WorkStatus } from '../../../types';
import { WORK_STATUS_CONFIG } from '../../../constants';
import { Trophy, Bell, Heart, ShoppingBag, BookOpen, Edit2, Zap, ChevronDown, Shield } from 'lucide-react';
import { useGreetings } from '../../../hooks/useGreetings';

interface WelcomeHeaderProps {
    user: User;
    onUpdateStatus: (status: WorkStatus) => void;
    onOpenShop: () => void;
    onOpenNotifications: () => void;
    onEditProfile: () => void;
    onOpenRules: () => void;
    unreadNotifications: number;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ 
    user, 
    onUpdateStatus, 
    onOpenShop,
    onOpenNotifications,
    onEditProfile,
    onOpenRules,
    unreadNotifications
}) => {
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
                @keyframes hud-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.2); }
                    50% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.5); }
                }
                @keyframes bar-shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .hud-card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
                }
                .animate-hud-float {
                    animation: hud-float 4s ease-in-out infinite;
                }
                .bar-shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                    animation: bar-shine 2s infinite linear;
                }
            `}</style>

            {/* Main Container: The HUD */}
            <div className="relative rounded-[2.5rem] p-1 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 shadow-xl overflow-hidden">
                {/* Background Deco */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="bg-white/90 backdrop-blur-xl rounded-[2.3rem] p-6 relative z-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        
                        {/* 1. Player Profile Section */}
                        <div className="flex items-center gap-5 w-full lg:w-auto">
                            {/* Avatar Frame */}
                            <div className="relative group cursor-pointer shrink-0 animate-hud-float" onClick={onEditProfile}>
                                {/* Hexagon-ish Glow */}
                                <div className={`absolute inset-0 rounded-full blur-md opacity-50 transition-all duration-300 group-hover:opacity-80 ${isHpLow ? 'bg-red-500 animate-pulse' : 'bg-indigo-400'}`}></div>
                                
                                <div className="w-24 h-24 rounded-full p-1 bg-white relative z-10 ring-4 ring-white/50 shadow-lg group-hover:scale-105 transition-transform duration-300">
                                    <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover border-2 border-gray-100" alt={user.name} />
                                    
                                    {/* Edit Badge */}
                                    <div className="absolute bottom-0 right-0 bg-white text-indigo-600 p-1.5 rounded-full shadow-md border border-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                
                                {/* Level Badge (Floating) */}
                                <div className="absolute -top-2 -left-2 z-20">
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg border-2 border-white flex items-center gap-1 transform -rotate-6 group-hover:rotate-0 transition-transform">
                                        <Trophy className="w-3 h-3" />
                                        LVL.{user.level}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                {/* Role Badge */}
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                        {user.role} • {user.position}
                                    </span>
                                </div>

                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2 drop-shadow-sm">
                                    {user.name}
                                </h1>
                                
                                {/* Status Selector (Sci-Fi Pill) */}
                                <div className="relative group inline-block">
                                    <button className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 transition-all text-xs font-bold shadow-sm active:scale-95 ${currentStatusConfig.color.replace('bg-', 'bg-opacity-10 bg-').replace('text-', 'border-')}`}>
                                        <span className="relative flex h-2 w-2">
                                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatusConfig.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                                          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatusConfig.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                                        </span>
                                        {currentStatusConfig.label} 
                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                    </button>
                                    
                                    {/* Dropdown */}
                                    <div className="absolute top-full left-0 pt-2 w-52 hidden group-hover:block z-50">
                                        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-2 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                                            <p className="text-[9px] text-gray-400 font-bold px-3 py-1 uppercase">Set Status</p>
                                            {Object.entries(WORK_STATUS_CONFIG).map(([key, config]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => onUpdateStatus(key as WorkStatus)}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors ${user.workStatus === key ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600'}`}
                                                >
                                                    <span className="text-base">{config.icon}</span>
                                                    {config.label.split('(')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Stats Dashboard (Bars) */}
                        <div className="flex-1 w-full lg:max-w-md bg-gray-50/50 rounded-2xl p-4 border border-gray-100 relative group cursor-help transition-all hover:bg-white hover:shadow-md hover:border-indigo-100" onClick={onOpenRules}>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    กดเพื่อดูกติกา
                                </span>
                            </div>

                            <div className="space-y-3">
                                {/* HP Bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1 px-1">
                                        <span className="flex items-center gap-1 text-red-500"><Heart className="w-3 h-3 fill-red-500" /> HEALTH (HP)</span>
                                        <span className={isHpLow ? 'text-red-600 animate-pulse font-bold' : ''}>{user.hp}/{user.maxHp}</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-inner relative">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${isHpLow ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-red-400 via-pink-500 to-rose-500'}`}
                                            style={{ width: `${hpPercent}%` }}
                                        >
                                            <div className="bar-shimmer"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* XP Bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] font-black text-gray-400 mb-1 px-1">
                                        <span className="flex items-center gap-1 text-yellow-500"><Zap className="w-3 h-3 fill-yellow-500" /> EXPERIENCE (XP)</span>
                                        <span className="text-indigo-900">{user.xp} <span className="text-gray-300">/ {nextLevelXP}</span></span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-100 shadow-inner relative">
                                        <div 
                                            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 rounded-full transition-all duration-1000 relative overflow-hidden"
                                            style={{ width: `${progressPercent}%` }}
                                        >
                                            <div className="bar-shimmer"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Action Deck (Buttons) */}
                        <div className="flex gap-3 w-full lg:w-auto overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 px-1">
                            {/* Rules */}
                            <button 
                                onClick={onOpenRules}
                                className="group relative flex flex-col items-center justify-center w-[60px] h-[60px] bg-white rounded-2xl border-2 border-indigo-50 shadow-sm hover:border-indigo-300 hover:shadow-indigo-100 transition-all active:scale-95"
                                title="Game Rules"
                            >
                                <BookOpen className="w-6 h-6 text-indigo-300 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-[9px] font-bold text-indigo-300 group-hover:text-indigo-600 mt-0.5">Rules</span>
                            </button>

                            {/* Shop */}
                            <button 
                                onClick={onOpenShop}
                                className="group relative flex flex-col items-center justify-center min-w-[90px] h-[60px] bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-1 text-yellow-300 mb-0.5">
                                    <ShoppingBag className="w-4 h-4 fill-yellow-300" />
                                </div>
                                <span className="text-xs font-black text-white">{user.availablePoints} JP</span>
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl"></div>
                            </button>

                            {/* Notifications */}
                            <button 
                                onClick={onOpenNotifications}
                                className="group relative flex flex-col items-center justify-center w-[60px] h-[60px] bg-white rounded-2xl border-2 border-gray-100 hover:border-pink-300 hover:shadow-pink-100 transition-all active:scale-95 shadow-sm"
                            >
                                <div className="relative">
                                    <Bell className="w-6 h-6 text-gray-400 group-hover:text-pink-500 transition-colors" />
                                    {unreadNotifications > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-bounce"></span>
                                    )}
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-pink-500 mt-0.5">Alerts</span>
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default WelcomeHeader;
