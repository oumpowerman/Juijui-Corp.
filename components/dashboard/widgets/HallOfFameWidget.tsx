import React, { useState } from 'react';
import { User, ViewMode } from '../../../types';
import { Trophy, ChevronRight, Crown, TrendingUp, Clock, History } from 'lucide-react';
import { useLeaderboard, TimeRange } from '../../../hooks/useLeaderboard';

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
        let sizeClass = 'w-10 h-10';
        let borderClass = 'border-gray-200';
        let crown = null;
        let mt = 'mt-0';

        if (rank === 1) {
            sizeClass = 'w-14 h-14';
            borderClass = 'border-yellow-400 ring-4 ring-yellow-100';
            crown = <Crown className="w-6 h-6 text-yellow-500 absolute -top-5 left-1/2 -translate-x-1/2 animate-bounce-slow drop-shadow-md" fill="currentColor" />;
            mt = '-mt-4'; // Lift up
        } else if (rank === 2) {
            sizeClass = 'w-12 h-12';
            borderClass = 'border-slate-300 ring-2 ring-slate-100'; // Silver
        } else if (rank === 3) {
            sizeClass = 'w-11 h-11';
            borderClass = 'border-orange-300 ring-2 ring-orange-100'; // Bronze
        }

        return (
            <div className={`flex flex-col items-center ${mt} relative group`}>
                {crown}
                <div className={`relative ${sizeClass} rounded-full border-2 ${borderClass} p-0.5 bg-white shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" alt={user.name} />
                    <div className="absolute -bottom-2 -right-1 bg-gray-800 text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {rank}
                    </div>
                </div>
                <span className={`text-[10px] font-bold mt-2 truncate max-w-[60px] ${rank === 1 ? 'text-gray-800 text-xs' : 'text-gray-500'}`}>{user.name.split(' ')[0]}</span>
                <span className="text-[9px] font-medium text-gray-400">{score.toLocaleString()} XP</span>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-white/50 relative overflow-hidden flex flex-col h-full group hover:shadow-xl hover:shadow-orange-100 transition-all duration-500 min-h-[300px]">
            
            {/* Header */}
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-5 pb-8 relative shrink-0 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl -mr-6 -mt-6 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-yellow-300 opacity-20 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl text-white shadow-inner border border-white/10">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-tight leading-none">Hall of Fame</h3>
                            <p className="text-yellow-100 text-[10px] font-bold uppercase tracking-wider mt-1">
                                {timeRange === 'WEEKLY' ? 'MVP of the Week' : 'Top Performers'}
                            </p>
                        </div>
                    </div>

                    {/* --- NEW: Dynamic Time Range Toggle --- */}
                    <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/10 backdrop-blur-sm">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setTimeRange('WEEKLY'); }}
                            className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${timeRange === 'WEEKLY' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-100 hover:bg-white/10'}`}
                         >
                            WEEK
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setTimeRange('ALL_TIME'); }}
                            className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${timeRange === 'ALL_TIME' ? 'bg-white text-orange-600 shadow-sm' : 'text-orange-100 hover:bg-white/10'}`}
                         >
                            ALL
                         </button>
                    </div>
                </div>
            </div>

            {/* Podium Area (Top 3) */}
            <div className="flex-1 p-2 flex items-center justify-center bg-gradient-to-b from-orange-50/30 to-white -mt-4 relative z-10 rounded-t-[2rem]">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2 opacity-40">
                         <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-[10px] font-bold text-orange-500">Updating...</span>
                    </div>
                ) : (
                    <div className="flex items-end justify-center gap-3 md:gap-6 pb-2 w-full animate-in fade-in zoom-in duration-500">
                        {/* Rank 2 */}
                        {topThree[1] ? <RenderAvatar user={topThree[1].user} rank={2} score={topThree[1].score} /> : <div className="w-12 h-20 flex items-end justify-center"><div className="w-10 h-10 rounded-full bg-gray-100"></div></div>}
                        
                        {/* Rank 1 */}
                        {topThree[0] ? <RenderAvatar user={topThree[0].user} rank={1} score={topThree[0].score} /> : <div className="w-16 h-24 flex items-end justify-center"><div className="w-12 h-12 rounded-full bg-gray-100"></div></div>}
                        
                        {/* Rank 3 */}
                        {topThree[2] ? <RenderAvatar user={topThree[2].user} rank={3} score={topThree[2].score} /> : <div className="w-12 h-20 flex items-end justify-center"><div className="w-10 h-10 rounded-full bg-gray-100"></div></div>}
                    </div>
                )}
            </div>

            {/* My Rank Footer */}
            <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                <div 
                    className={`bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 shadow-sm hover:border-orange-200 transition-colors cursor-pointer group/rank ${isLoading ? 'opacity-50 pointer-events-none' : ''}`} 
                    onClick={() => onNavigate('LEADERBOARD')}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="bg-slate-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                #{myStats?.rank || '??'}
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                                {timeRange === 'WEEKLY' ? 'อันดับสัปดาห์นี้' : 'อันดับของคุณ'}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 flex items-center">
                            {myStats?.rank === 1 ? (
                                <span className="text-orange-500 font-bold flex items-center gap-1 animate-pulse">
                                    <Crown className="w-3 h-3" /> คุณคือที่ 1! สุดยอด!
                                </span>
                            ) : myStats && myStats.diffFromNext > 0 ? (
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                    ตามที่ {myStats.rank - 1} อยู่ <b className="text-gray-700">{myStats.diffFromNext.toLocaleString()}</b> XP
                                </span>
                            ) : (
                                "สะสมแต้มเพื่อเลื่อนอันดับ"
                            )}
                        </p>
                    </div>
                    
                    <div className="p-2 bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded-xl transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HallOfFameWidget;