
import React from 'react';
import { TrendingUp, Target, Crown, Zap } from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';
import { motion } from 'framer-motion';

interface UserStatsFooterProps {
    myStats: LeaderboardEntry | undefined;
}

const UserStatsFooter: React.FC<UserStatsFooterProps> = ({ myStats }) => {
    if (!myStats) return null;

    const isTop = myStats.rank === 1;

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center pb-safe-area">
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="pointer-events-auto bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-4 pl-5 pr-8 shadow-2xl shadow-indigo-500/20 border border-white/60 w-full max-w-2xl ring-1 ring-indigo-100 relative overflow-hidden group"
            >
                {/* Background Gradient Mesh */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    
                    {/* Left: Rank & Info */}
                    <div className="flex items-center gap-5">
                        <div className="relative">
                             <motion.div 
                                whileHover={{ scale: 1.1, rotate: 10 }}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-lg border border-white/30 ${
                                    isTop 
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-orange-300/50' 
                                    : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-300/50'
                                }`}
                            >
                                {isTop ? <Crown className="w-7 h-7 fill-white" /> : `#${myStats.rank}`}
                            </motion.div>
                            {!isTop && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                                </span>
                            )}
                        </div>
                        
                        <div>
                            {myStats.nextRankUser && !isTop ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                        <Target className="w-3 h-3 mr-1" />
                                        กำลังไล่ตาม: <span className="text-indigo-700 ml-1">{myStats.nextRankUser.name.split(' ')[0]}</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">คะแนนของคุณ</p>
                                </div>
                            )}

                            <div className="flex items-baseline gap-3">
                                <span className="font-black text-2xl text-slate-800 tracking-tight">{myStats.score.toLocaleString()} <span className="text-sm text-slate-400 font-bold">XP</span></span>
                                
                                {myStats.diffFromNext > 0 && !isTop && (
                                    <motion.span 
                                        animate={{ opacity: [0.6, 1, 0.6] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-[10px] text-orange-600 font-bold flex items-center bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200"
                                    >
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        -{myStats.diffFromNext} เพื่อแซง
                                    </motion.span>
                                )}
                                {isTop && (
                                    <span className="text-[10px] text-yellow-700 font-bold flex items-center bg-yellow-100 px-2 py-0.5 rounded-lg border border-yellow-200 shadow-sm">
                                        <Zap className="w-3 h-3 mr-1 fill-yellow-500" />
                                        ไม่มีใครหยุดได้!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Stats */}
                    <div className="hidden sm:flex items-center gap-8">
                        <div className="text-center group/stat cursor-help">
                            <span className="block text-xl font-black text-emerald-500 leading-none group-hover/stat:scale-110 transition-transform">+{myStats.missions}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1 block">ภารกิจ</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="text-center group/stat cursor-help">
                            <span className="block text-xl font-black text-rose-500 leading-none group-hover/stat:scale-110 transition-transform">-{myStats.penalties}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1 block">สาย/ขาด</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default UserStatsFooter;
