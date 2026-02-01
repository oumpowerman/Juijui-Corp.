
import React from 'react';
import { TrendingUp, MessageCircle, Target } from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';

interface UserStatsFooterProps {
    myStats: LeaderboardEntry | undefined;
}

const UserStatsFooter: React.FC<UserStatsFooterProps> = ({ myStats }) => {
    if (!myStats) return null;

    const isTop = myStats.rank === 1;

    return (
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center pb-safe-area">
            <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-3 pl-4 pr-6 shadow-2xl border border-white/10 w-full max-w-2xl animate-in slide-in-from-bottom-20 duration-500 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                    
                    {/* Left: Rank & Info */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg border border-white/20">
                                #{myStats.rank}
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div>
                            {myStats.nextRankUser && !isTop ? (
                                <div className="flex items-center gap-2 mb-0.5 animate-pulse">
                                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center">
                                        <Target className="w-3 h-3 mr-1" />
                                        Chasing: {myStats.nextRankUser.name.split(' ')[0]}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Score</p>
                                </div>
                            )}

                            <div className="flex items-baseline gap-2">
                                <span className="font-black text-xl text-white">{myStats.score.toLocaleString()} XP</span>
                                
                                {myStats.diffFromNext > 0 && !isTop && (
                                    <span className="text-[10px] text-orange-300 font-bold flex items-center bg-orange-900/40 px-2 py-0.5 rounded-lg border border-orange-500/30">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        -{myStats.diffFromNext} XP to overtake
                                    </span>
                                )}
                                {isTop && (
                                    <span className="text-[10px] text-yellow-300 font-bold flex items-center bg-yellow-900/40 px-2 py-0.5 rounded-lg border border-yellow-500/30">
                                        👑 You are the King!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                        <div className="text-center">
                            <span className="block text-lg font-black text-green-400 leading-none">+{myStats.missions}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Missions</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div className="text-center">
                            <span className="block text-lg font-black text-red-400 leading-none">-{myStats.penalties}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Late</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default UserStatsFooter;
