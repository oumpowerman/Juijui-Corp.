
import React from 'react';
import { Crown, Swords, Sparkles } from 'lucide-react';
import { LeaderboardEntry } from '../../hooks/useLeaderboard';

interface PodiumSectionProps {
    topThree: LeaderboardEntry[];
}

const PodiumSection: React.FC<PodiumSectionProps> = ({ topThree }) => {
    
    const PodiumItem = ({ entry, place }: { entry: LeaderboardEntry, place: 1 | 2 | 3 }) => {
        if (!entry) return <div className="w-full flex-1"></div>; // Placeholder

        const isGold = place === 1;
        const isSilver = place === 2;
        
        // Dynamic Styles based on rank
        const height = isGold ? 'h-72' : isSilver ? 'h-60' : 'h-48';
        const color = isGold ? 'bg-gradient-to-b from-yellow-300 to-yellow-500' : isSilver ? 'bg-gradient-to-b from-slate-300 to-slate-400' : 'bg-gradient-to-b from-orange-300 to-orange-500';
        const shadowColor = isGold ? 'shadow-yellow-200' : isSilver ? 'shadow-slate-200' : 'shadow-orange-200';
        const ringColor = isGold ? 'ring-yellow-400' : isSilver ? 'ring-slate-300' : 'ring-orange-400';
        
        // Animation delay
        const delay = isGold ? 'delay-300' : isSilver ? 'delay-150' : 'delay-0';

        return (
            <div className={`flex flex-col items-center justify-end w-1/3 relative z-10 animate-in slide-in-from-bottom-20 duration-1000 ${delay}`}>
                
                {/* --- FEELING BUBBLE (FLOATING) --- */}
                {entry.user.feeling && (
                    <div className={`
                        absolute ${isGold ? '-top-24' : '-top-20'} left-1/2 -translate-x-1/2 z-30 
                        animate-float-gentle origin-bottom-center w-max max-w-[140px]
                    `}>
                        <div className="bg-white border-2 border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg text-[10px] md:text-xs font-bold relative text-center leading-snug">
                            "{entry.user.feeling}"
                            {/* Triangle Tail */}
                            <div className="absolute -bottom-1.5 left-0 w-3 h-3 bg-white border-b-2 border-l-2 border-indigo-100 transform -skew-x-12"></div>
                        </div>
                    </div>
                )}

                {/* Avatar & Crown */}
                <div className="relative mb-4 group cursor-pointer hover:scale-105 transition-transform duration-300">
                    {isGold && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-lg z-20">
                            <Crown className="w-12 h-12 text-yellow-500 fill-yellow-300 stroke-[2.5px]" />
                        </div>
                    )}
                    <div className={`
                        relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden z-10
                        ring-4 ${ringColor}
                    `}>
                        <img src={entry.user.avatarUrl} className="w-full h-full object-cover" alt={entry.user.name} />
                    </div>
                    {/* Level Badge */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black text-white shadow-md whitespace-nowrap bg-gray-900 border-2 border-white z-20">
                        Lv.{entry.user.level}
                    </div>
                </div>

                {/* Name & Score Info */}
                <div className="text-center mb-3 z-10 relative">
                    <p className={`font-black text-slate-800 truncate max-w-[100px] md:max-w-full ${isGold ? 'text-lg' : 'text-sm'}`}>
                        {entry.user.name.split(' ')[0]}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                        <span className={`font-black ${isGold ? 'text-yellow-600' : 'text-slate-500'}`}>{entry.score.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">XP</span>
                    </div>
                </div>

                {/* Podium Block */}
                <div className={`
                    w-full ${height} rounded-t-[2.5rem] ${color} relative overflow-hidden shadow-2xl flex flex-col items-center pt-2 text-white
                `}>
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                    {/* Rank Number */}
                    <span className="text-6xl md:text-8xl font-black opacity-30 select-none relative z-10 mix-blend-overlay translate-y-2">{place}</span>
                    
                    {/* Stats Badge in Podium */}
                    <div className="mt-auto mb-6 flex flex-col items-center gap-1 relative z-10">
                        <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-xl flex items-center border border-white/20">
                            <Swords className="w-3.5 h-3.5 mr-1.5 text-yellow-300" /> 
                            <span className="text-xs font-bold">{entry.missions} Missions</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative pt-16 px-2 pb-8">
            <style>{`
                @keyframes float-gentle {
                    0%, 100% { transform: translate(-50%, 0px); }
                    50% { transform: translate(-50%, -8px); }
                }
                .animate-float-gentle {
                    animation: float-gentle 3s ease-in-out infinite;
                }
            `}</style>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-gradient-to-t from-indigo-100/50 via-purple-100/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            <div className="flex justify-center items-end gap-2 md:gap-6 max-w-4xl mx-auto h-[420px]">
                <PodiumItem entry={topThree[1]} place={2} /> {/* Silver */}
                <PodiumItem entry={topThree[0]} place={1} /> {/* Gold */}
                <PodiumItem entry={topThree[2]} place={3} /> {/* Bronze */}
            </div>
        </div>
    );
};

export default PodiumSection;
