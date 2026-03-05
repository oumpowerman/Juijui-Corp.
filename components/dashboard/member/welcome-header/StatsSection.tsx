
import React from 'react';
import { Heart, Trophy, Skull, Sparkles } from 'lucide-react';
import { User } from '../../../../types';
import { motion } from 'framer-motion';

interface StatsSectionProps {
    user: User;
    hpPercent: number;
    progressPercent: number;
    nextLevelXP: number;
    isHpLow: boolean;
    onOpenRules: () => void;
    onOpenDeathHistory: () => void;
}

const StatsSection: React.FC<StatsSectionProps> = ({ 
    user, 
    hpPercent, 
    progressPercent, 
    nextLevelXP, 
    isHpLow, 
    onOpenRules, 
    onOpenDeathHistory 
}) => {
    return (
        <>
            <style>{`
                @keyframes wave {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .liquid-wave {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 200%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(255, 255, 255, 0.3),
                        transparent
                    );
                    animation: wave 3s linear infinite;
                }
                .wiggle-hover:hover {
                    animation: wiggle 0.3s ease-in-out infinite;
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-1deg); }
                    50% { transform: rotate(1deg); }
                }
                .bar-glow {
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
                }
            `}</style>

            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex-1 relative group cursor-help w-full lg:min-w-[340px] flex flex-col"
                onClick={onOpenRules}
            >
                {/* Glassy Background & Internal Clipping Layer */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-3xl border border-white/50 shadow-xl overflow-hidden pointer-events-none">
                    {/* Decorative Background Sparkle (Now safely clipped inside) */}
                    <Sparkles className="absolute -bottom-2 -right-2 w-12 h-12 text-yellow-400/10 rotate-12 group-hover:scale-125 transition-transform duration-500" />
                </div>

                {/* Hint Label (Now outside the clipping layer, so it won't be cut) */}
                <div className="absolute -top-3 right-4 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0 z-30">
                    CLICK FOR RULES ✨
                </div>

                {/* Actual Content Container (Padded to match the background) */}
                <div className="relative z-20 p-4 sm:p-5 flex flex-col justify-center gap-3 sm:gap-4">
                    {/* HP Bar Section */}
                    <div className="relative">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={isHpLow ? { scale: [1, 1.2, 1] } : { scale: [1, 1.05, 1] }}
                                    transition={{ repeat: Infinity, duration: isHpLow ? 0.6 : 2 }}
                                >
                                    <Heart className={`w-5 h-5 ${isHpLow ? 'text-red-500 fill-red-500 animate-pulse' : 'text-red-400 fill-red-400'}`} />
                                </motion.div>
                                <span className="text-xs font-black text-slate-600 tracking-wider uppercase">Health Points</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-sm font-black ${isHpLow ? 'text-red-600 animate-bounce' : 'text-slate-700'}`}>
                                    {user.hp} <span className="text-[10px] text-slate-400">/ {user.maxHp || 100}</span>
                                </span>
                                {user.deathCount > 0 && (
                                    <motion.button 
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        onClick={(e) => { e.stopPropagation(); onOpenDeathHistory(); }}
                                        className="flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full shadow-md hover:bg-red-600 transition-all border-2 border-white"
                                        title="ดูประวัติการ HP หมด"
                                    >
                                        <Skull className="w-3 h-3" />
                                        <span className="text-[10px] font-black">{user.deathCount}</span>
                                    </motion.button>
                                )}
                            </div>
                        </div>
                        
                        {/* HP Bar Container */}
                        <div className="h-5 w-full bg-slate-100 rounded-full p-1 shadow-inner border border-slate-200 relative overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${hpPercent}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full rounded-full relative overflow-hidden shadow-lg ${isHpLow ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-400'}`}
                            >
                                {/* Liquid Wave Effect */}
                                <div className="liquid-wave" />
                                {/* Shimmer Overlay */}
                                <div className="absolute inset-0 bg-white/10 w-full h-full animate-[shimmer_2s_infinite]"></div>
                            </motion.div>
                        </div>
                    </div>

                    {/* XP Bar Section */}
                    <div className="relative">
                        <div className="flex justify-between items-end mb-1.5 px-1">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 }}
                                >
                                    <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                                </motion.div>
                                <span className="text-xs font-black text-slate-600 tracking-wider uppercase">Experience</span>
                            </div>
                            <div className="text-sm font-black text-slate-700">
                                {user.xp} <span className="text-[10px] text-slate-400">/ {nextLevelXP}</span>
                            </div>
                        </div>

                        {/* XP Bar Container */}
                        <div className="h-5 w-full bg-slate-100 rounded-full p-1 shadow-inner border border-slate-200 relative overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 rounded-full relative overflow-hidden shadow-lg"
                            >
                                {/* Liquid Wave Effect */}
                                <div className="liquid-wave" />
                                {/* Glow Effect */}
                                <div className="absolute top-0 right-0 w-4 h-full bg-white/40 blur-sm" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default StatsSection;
