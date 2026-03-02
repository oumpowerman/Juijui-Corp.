import React, { useState } from 'react';
import { User, ViewMode } from '../../../types';
import { Trophy, ChevronRight, Crown, TrendingUp, Clock, History, Zap, Medal, Star, Sparkles } from 'lucide-react';
import { useLeaderboard, TimeRange } from '../../../hooks/useLeaderboard';
import UserAvatarWithHP from '../../common/UserAvatarWithHP';

import { motion } from 'framer-motion';

interface HallOfFameWidgetProps {
    users: User[];
    currentUser: User;
    onNavigate: (view: ViewMode) => void;
}



const HallOfFameWidget: React.FC<HallOfFameWidgetProps> = ({ users, currentUser, onNavigate }) => {
    
    // --- 🏆 Real-time Leaderboard Hook Integration ---
    const { topThree, myStats, timeRange, setTimeRange, isLoading } = useLeaderboard(users, currentUser);

    // --- Components ---
    const RenderAvatar = ({ user, rank, score }: { user: User, rank: number, score: number }) => {
        let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
        let badgeIcon = null;
        let mt = 'mt-0';
        let glowColor = '';
        let rankColor = '';

        if (rank === 1) {
            size = 'lg';
            badgeIcon = (
                <motion.div
                    animate={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 z-30"
                >
                    <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" fill="currentColor" />
                    <motion.div
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 text-white/40"
                    >
                        <Sparkles className="w-10 h-10" />
                    </motion.div>
                </motion.div>
            );
            mt = '-mt-12';
            glowColor = 'shadow-[0_0_40px_rgba(251,191,36,0.3)]';
            rankColor = 'bg-gradient-to-br from-amber-400 to-yellow-600';
        } else if (rank === 2) {
            size = 'md';
            badgeIcon = (
                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 z-30"
                >
                    <Medal className="w-7 h-7 text-slate-300 drop-shadow-[0_0_10px_rgba(148,163,184,0.6)]" fill="currentColor" />
                </motion.div>
            );
            mt = 'mt-2';
            glowColor = 'shadow-[0_0_25px_rgba(148,163,184,0.2)]';
            rankColor = 'bg-gradient-to-br from-slate-300 to-slate-500';
        } else if (rank === 3) {
            size = 'md';
            badgeIcon = (
                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 z-30"
                >
                    <Star className="w-6 h-6 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" fill="currentColor" />
                </motion.div>
            );
            mt = 'mt-6';
            glowColor = 'shadow-[0_0_20px_rgba(251,146,60,0.15)]';
            rankColor = 'bg-gradient-to-br from-orange-300 to-orange-500';
        }

        return (
            <div className={`flex flex-col items-center ${mt} relative group`}>
                {badgeIcon}
                <div className={`relative rounded-full p-1 transition-all duration-500 ${glowColor} group-hover:scale-110`}>
                    <UserAvatarWithHP 
                        user={user} 
                        size={size}
                        showLevel={false}
                        showStatus={false}
                        showAdminBadge={false}
                    />
                    <div className={`absolute -bottom-1 -right-1 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-lg z-30 ${rankColor}`}>
                        {rank}
                    </div>
                </div>
                <span className={`text-[12px] font-black mt-4 truncate max-w-[80px] tracking-tight ${rank === 1 ? 'text-slate-900 scale-110' : 'text-slate-600'}`}>
                    {user.name.split(' ')[0]}
                </span>
                <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-1 mt-1 bg-white/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/40 shadow-sm"
                >
                    <Zap className={`w-3 h-3 ${rank === 1 ? 'text-amber-500 fill-amber-500' : 'text-slate-400 fill-slate-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${rank === 1 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {score.toLocaleString()}
                    </span>
                </motion.div>
            </div>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            onClick={() => onNavigate('LEADERBOARD')}
            className="bg-white/30 backdrop-blur-2xl rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 relative overflow-hidden flex flex-col h-full group hover:shadow-amber-200/30 transition-all duration-700 min-h-[450px] cursor-pointer"
        >
            {/* Intense Background Effects */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.5, 1],
                    rotate: [0, 180, 0],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-amber-200/40 to-orange-300/20 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-gradient-to-tr from-purple-200/30 to-indigo-300/20 rounded-full blur-[100px] pointer-events-none"
            />
            
            {/* Header */}
            <div className="p-10 pb-4 relative z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <motion.div 
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.8 }}
                            className="p-4 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-[2rem] text-white shadow-xl shadow-orange-200/50"
                        >
                            <Trophy className="w-7 h-7" />
                        </motion.div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tighter leading-none">Hall of Fame</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-amber-700/70 text-[12px] font-black uppercase tracking-[0.3em]">
                                    {timeRange === 'WEEKLY' ? 'Weekly MVP' : 'Legends'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/40 p-1.5 rounded-[1.5rem] border border-white/60 backdrop-blur-xl shadow-inner">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setTimeRange('WEEKLY'); }}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all tracking-widest ${timeRange === 'WEEKLY' ? 'bg-white text-amber-600 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            WEEK
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setTimeRange('ALL_TIME'); }}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all tracking-widest ${timeRange === 'ALL_TIME' ? 'bg-white text-amber-600 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            ALL
                         </button>
                    </div>
                </div>
            </div>

            {/* Sharp Modern Podium Area */}
            <div className="flex-1 px-10 flex items-center justify-center relative z-10">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                         <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full"
                         />
                         <span className="text-[12px] font-black text-amber-600 uppercase tracking-[0.2em] animate-pulse">Syncing Legends...</span>
                    </div>
                ) : (
                    <div className="flex items-end justify-center gap-2 md:gap-4 pb-10 w-full relative">
                        {/* Podium Base - Modern Sharp Glass */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end gap-2 md:gap-4 pointer-events-none px-2">
                            <div className="flex-1 h-12 bg-white/20 backdrop-blur-md border-t border-x border-white/40 rounded-t-2xl shadow-inner" />
                            <div className="flex-1 h-20 bg-white/30 backdrop-blur-xl border-t border-x border-white/60 rounded-t-3xl shadow-2xl shadow-amber-200/20 relative overflow-hidden">
                                <motion.div 
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                />
                            </div>
                            <div className="flex-1 h-8 bg-white/20 backdrop-blur-md border-t border-x border-white/40 rounded-t-2xl shadow-inner" />
                        </div>

                        {/* Rank 2 */}
                        <div className="flex-1 flex justify-center z-20">
                            {topThree[1] ? <RenderAvatar user={topThree[1].user} rank={2} score={topThree[1].score} /> : <div className="w-14 h-14 rounded-full bg-slate-100/30 border border-white/20" />}
                        </div>
                        
                        {/* Rank 1 */}
                        <div className="flex-1 flex justify-center z-30 scale-125 -translate-y-4">
                            {topThree[0] ? <RenderAvatar user={topThree[0].user} rank={1} score={topThree[0].score} /> : <div className="w-20 h-20 rounded-full bg-amber-100/30 border border-white/20" />}
                        </div>
                        
                        {/* Rank 3 */}
                        <div className="flex-1 flex justify-center z-20">
                            {topThree[2] ? <RenderAvatar user={topThree[2].user} rank={3} score={topThree[2].score} /> : <div className="w-14 h-14 rounded-full bg-slate-100/30 border border-white/20" />}
                        </div>
                    </div>
                )}
            </div>

            {/* My Rank Footer */}
            <div className="p-10 pt-0 mt-auto relative z-10">
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-[3rem] p-6 flex items-center gap-6 shadow-2xl group/rank ${isLoading ? 'opacity-50 pointer-events-none' : ''}`} 
                    onClick={() => onNavigate('LEADERBOARD')}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="bg-amber-500 text-white text-[12px] font-black px-3 py-1 rounded-xl shadow-lg shadow-amber-500/30 tracking-tighter">
                                RANK #{myStats?.rank || '??'}
                            </div>
                            <span className="text-base font-black text-white tracking-tight truncate">
                                {timeRange === 'WEEKLY' ? 'Weekly Status' : 'Your Legacy'}
                            </span>
                        </div>
                        <div className="text-[12px] text-slate-400 font-bold flex items-center truncate">
                            {myStats?.rank === 1 ? (
                                <span className="text-amber-400 font-black flex items-center gap-2 animate-pulse">
                                    <Crown className="w-4 h-4 fill-amber-400" /> UNSTOPPABLE! YOU ARE #1
                                </span>
                            ) : myStats && myStats.diffFromNext > 0 ? (
                                <span className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <b className="text-white">{myStats.diffFromNext.toLocaleString()} XP</b> to reach next rank
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 uppercase tracking-widest text-[10px] opacity-50">
                                    <Zap className="w-4 h-4" /> Keep pushing for the top!
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-14 h-14 bg-white/10 group-hover/rank:bg-amber-500 group-hover/rank:text-white text-white rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-inner border border-white/5">
                        <ChevronRight className="w-7 h-7 group-hover/rank:translate-x-1 transition-transform" />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default HallOfFameWidget;