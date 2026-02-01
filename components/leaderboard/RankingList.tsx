
import React from 'react';
import { CheckCircle2, AlertTriangle, TrendingDown, MessageCircle, Flame, Shield, Skull, Moon } from 'lucide-react';
import { LeaderboardEntry, BadgeType } from '../../hooks/useLeaderboard';

interface RankingListProps {
    list: LeaderboardEntry[];
    emptyMessage?: string;
}

const RankingList: React.FC<RankingListProps> = ({ list, emptyMessage = "ยังไม่มีข้อมูลในรอบนี้" }) => {
    
    const getBadgeIcon = (type: BadgeType) => {
        switch (type) {
            case 'FIRE': return <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />;
            case 'SHIELD': return <Shield className="w-3 h-3 text-blue-500 fill-blue-200" />;
            case 'RISK': return <Skull className="w-3 h-3 text-gray-500" />;
            case 'SLEEPY': return <Moon className="w-3 h-3 text-indigo-300" />;
            default: return null;
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden relative z-10 max-w-4xl mx-auto mb-24">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-4 bg-slate-50/80 border-b border-slate-100 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-20">
                <div className="col-span-2 md:col-span-1 text-center">Rank</div>
                <div className="col-span-6 md:col-span-6 pl-2">Agent & Status</div>
                <div className="col-span-2 md:col-span-3 text-right">Score</div>
                <div className="col-span-2 text-center">Performance</div>
            </div>

            <div className="divide-y divide-slate-50">
                {list.length === 0 && (
                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <TrendingDown className="w-12 h-12 mb-2 opacity-20" />
                        <p>{emptyMessage}</p>
                    </div>
                )}

                {list.map((entry) => (
                    <div key={entry.user.id} className="grid grid-cols-12 px-4 md:px-6 py-4 items-center hover:bg-indigo-50/30 transition-all duration-200 group relative">
                        
                        {/* Rank */}
                        <div className="col-span-2 md:col-span-1 text-center">
                            <span className="text-xl font-black text-slate-300 group-hover:text-indigo-400 transition-colors">
                                {entry.rank}
                            </span>
                        </div>

                        {/* Agent Profile */}
                        <div className="col-span-6 md:col-span-6 flex items-center gap-3 md:gap-4 pl-2">
                            <div className="relative shrink-0">
                                <img 
                                    src={entry.user.avatarUrl} 
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform" 
                                    alt={entry.user.name} 
                                />
                                <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold border-2 border-white">
                                    {entry.user.level}
                                </div>
                            </div>
                            
                            <div className="min-w-0 flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-700 truncate text-sm md:text-base group-hover:text-indigo-700">
                                        {entry.user.name}
                                    </p>
                                    
                                    {/* BADGES ROW */}
                                    <div className="flex gap-1">
                                        {entry.badges.map(badge => (
                                            <div key={badge} className="p-0.5 bg-gray-50 rounded border border-gray-100" title={badge}>
                                                {getBadgeIcon(badge)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Feeling in List */}
                                {entry.user.feeling ? (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <MessageCircle className="w-3 h-3 text-slate-400" />
                                        <p className="text-xs text-slate-500 italic truncate max-w-[140px] md:max-w-xs bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                            "{entry.user.feeling}"
                                        </p>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-slate-400 mt-1">{entry.user.position}</span>
                                )}
                            </div>
                        </div>

                        {/* Score */}
                        <div className="col-span-2 md:col-span-3 text-right">
                            <div className="font-black text-indigo-600 text-base md:text-lg">{entry.score.toLocaleString()}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">XP Points</div>
                        </div>

                        {/* Stats */}
                        <div className="col-span-2 flex justify-center gap-2 md:gap-6">
                            <div className="flex flex-col items-center group/stat" title="Completed Tasks">
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md mb-0.5 group-hover/stat:bg-green-100 transition-colors">
                                    +{entry.missions}
                                </span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            </div>
                            <div className="flex flex-col items-center group/stat" title="Late/Missed">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md mb-0.5 transition-colors ${entry.penalties > 0 ? 'text-red-500 bg-red-50 group-hover/stat:bg-red-100' : 'text-gray-300 bg-gray-50'}`}>
                                    -{entry.penalties}
                                </span>
                                <AlertTriangle className={`w-3.5 h-3.5 ${entry.penalties > 0 ? 'text-red-400' : 'text-gray-300'}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RankingList;
