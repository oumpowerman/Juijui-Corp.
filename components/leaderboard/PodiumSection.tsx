
import React from 'react';
import { Crown, Swords, Sparkles, Zap, Star, Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';
import UserAvatarWithHP from '../common/UserAvatarWithHP';
import { motion } from 'framer-motion';

interface PodiumSectionProps {
    topThree: LeaderboardEntry[];
}

const PodiumSection: React.FC<PodiumSectionProps> = ({ topThree }) => {
    
    const PodiumItem = ({ entry, place }: { entry: LeaderboardEntry, place: 1 | 2 | 3 }) => {
        if (!entry) return <div className="w-full flex-1"></div>; // Placeholder

        const isGold = place === 1;
        const isSilver = place === 2;
        const isBronze = place === 3;
        
        // Glassy & Dimensional Styles based on rank
        const height = isGold ? 'h-80' : isSilver ? 'h-64' : 'h-52';
        
        // Colors & Gradients
        const podiumGradient = isGold 
            ? 'from-yellow-300/80 via-amber-200/60 to-yellow-100/40 border-yellow-200/50' 
            : isSilver 
                ? 'from-slate-300/80 via-slate-200/60 to-slate-100/40 border-slate-200/50' 
                : 'from-orange-300/80 via-orange-200/60 to-orange-100/40 border-orange-200/50';
        
        const glowColor = isGold ? 'bg-yellow-400' : isSilver ? 'bg-slate-400' : 'bg-orange-400';
        const textColor = isGold ? 'text-yellow-700' : isSilver ? 'text-slate-700' : 'text-orange-800';

        return (
            <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                    duration: 0.8, 
                    delay: isGold ? 0.2 : isSilver ? 0.1 : 0.3,
                    type: "spring",
                    stiffness: 100
                }}
                className={`flex flex-col items-center justify-end w-1/3 relative z-10`}
            >
                {/* --- FEELING BUBBLE (FLOATING) --- */}
                {entry.user.feeling && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 1, type: "spring" }}
                        className={`
                            absolute ${isGold ? '-top-32' : '-top-28'} left-1/2 -translate-x-1/2 z-30 
                            w-max max-w-[160px]
                        `}
                    >
                        <motion.div 
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-white/90 backdrop-blur-md border-2 border-white/50 text-slate-700 px-4 py-2 rounded-2xl rounded-bl-none shadow-xl text-xs font-bold relative text-center leading-snug"
                        >
                            "{entry.user.feeling}"
                            {/* Triangle Tail */}
                            <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white/90 border-b-2 border-l-2 border-white/50 transform -skew-x-12"></div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Avatar & Crown Container */}
                <div className="relative mb-6 group cursor-pointer perspective-1000">
                    
                    {/* 1st Place Special Effects */}
                    {isGold && (
                        <>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] h-[180%] bg-gradient-to-t from-yellow-200/0 via-yellow-400/20 to-yellow-200/0 rounded-full blur-3xl -z-10"
                            />
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_10px_10px_rgba(234,179,8,0.5)]"
                            >
                                <Crown className="w-16 h-16 text-yellow-500 fill-yellow-300 stroke-[2.5px]" />
                                <motion.div 
                                    animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-2 -right-2"
                                >
                                    <Sparkles className="w-6 h-6 text-yellow-200 fill-white" />
                                </motion.div>
                            </motion.div>
                        </>
                    )}

                    {/* 2nd & 3rd Place Crowns (Smaller) */}
                    {!isGold && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 }}
                            className="absolute -top-8 left-1/2 -translate-x-1/2 z-20"
                        >
                            {isSilver ? (
                                <Trophy className="w-8 h-8 text-slate-400 fill-slate-200" />
                            ) : (
                                <Trophy className="w-8 h-8 text-orange-400 fill-orange-200" />
                            )}
                        </motion.div>
                    )}

                    <motion.div
                        whileHover={{ scale: 1.1, rotateY: 10 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative z-10"
                    >
                        <UserAvatarWithHP 
                            user={entry.user} 
                            size={isGold ? '2xl' : 'xl'}
                            showLevel={true}
                            showStatus={true}
                            showAdminBadge={true}
                        />
                        
                        {/* Rank Badge on Avatar */}
                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${isGold ? 'bg-yellow-400 text-yellow-900' : isSilver ? 'bg-slate-300 text-slate-800' : 'bg-orange-400 text-white'}`}>
                            <span className="font-black text-sm">{place}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Name & Score Info */}
                <div className="text-center mb-4 z-10 relative">
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`font-black text-slate-800 truncate max-w-[120px] md:max-w-full ${isGold ? 'text-2xl drop-shadow-sm' : 'text-lg'}`}
                    >
                        {entry.user.name.split(' ')[0]}
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-white/50 mt-1"
                    >
                        <span className={`font-black ${textColor}`}>{entry.score.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">XP</span>
                    </motion.div>
                </div>

                {/* Glassy Podium Block */}
                <div className={`
                    w-full ${height} rounded-t-[3rem] relative overflow-hidden shadow-2xl flex flex-col items-center pt-4
                    bg-gradient-to-b backdrop-blur-xl border-t border-x border-white/60
                    ${podiumGradient}
                    group hover:brightness-105 transition-all duration-500
                `}>
                    {/* Inner Shine/Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-50 pointer-events-none"></div>
                    
                    {/* Rank Number (Big & Glassy) */}
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.2, scale: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-8xl md:text-9xl font-black select-none relative z-0 mix-blend-overlay translate-y-4"
                    >
                        {place}
                    </motion.span>
                    
                    {/* Stats Badge in Podium */}
                    <div className="mt-auto mb-8 flex flex-col items-center gap-2 relative z-10 w-full px-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center justify-center gap-2 border border-white/40 shadow-sm w-full max-w-[140px]"
                        >
                            <Swords className={`w-4 h-4 ${isGold ? 'text-yellow-600' : 'text-slate-600'}`} /> 
                            <span className={`text-xs font-bold ${isGold ? 'text-yellow-800' : 'text-slate-700'}`}>{entry.missions} ภารกิจ</span>
                        </motion.div>
                        
                        {isGold && (
                            <motion.div 
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 uppercase tracking-widest"
                            >
                                <Zap className="w-3 h-3 fill-yellow-500 text-yellow-600" />
                                Top Performer (สุดยอดผู้เล่น)
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom Glow */}
                    <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t ${isGold ? 'from-yellow-500/30' : isSilver ? 'from-slate-500/30' : 'from-orange-500/30'} to-transparent`}></div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="relative pt-24 px-2 pb-12">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-5xl">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl mix-blend-multiply animate-pulse delay-1000"></div>
            </div>
            
            <div className="flex justify-center items-end gap-4 md:gap-8 max-w-5xl mx-auto h-[500px] perspective-1000">
                <PodiumItem entry={topThree[1]} place={2} /> {/* Silver */}
                <PodiumItem entry={topThree[0]} place={1} /> {/* Gold */}
                <PodiumItem entry={topThree[2]} place={3} /> {/* Bronze */}
            </div>
        </div>
    );
};

export default PodiumSection;
