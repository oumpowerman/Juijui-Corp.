
import React from 'react';
import { User } from '../types';
import { useLeaderboard, TimeRange } from '../hooks/useLeaderboard';
import { Trophy, Sparkles } from 'lucide-react';
import MentorTip from './MentorTip';

// Import refactored sub-components
import PodiumSection from './leaderboard/PodiumSection';
import RankingList from './leaderboard/RankingList';
import UserStatsFooter from './leaderboard/UserStatsFooter';

interface LeaderboardViewProps {
    users: User[];
    currentUser: User;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ users, currentUser }) => {
    const { topThree, restList, myStats, timeRange, setTimeRange } = useLeaderboard(users, currentUser);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-28 relative">
             <MentorTip variant="orange" messages={[
                "🔥 สัปดาห์นี้ใครจะเป็น MVP? ดูคะแนนได้ที่นี่เลย!",
                "XP ได้จากการทำงานเสร็จตรงเวลา และการช่วยเพื่อนๆ",
                "อย่าลืมนะ! ส่งงานช้า หรือโดดเวร คะแนนลดนะจ๊ะ 📉"
            ]} />

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl shadow-lg shadow-orange-200 text-white transform -rotate-6">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                            Hall of Fame
                            <Sparkles className="w-6 h-6 ml-2 text-yellow-400 animate-pulse" />
                        </h1>
                        <p className="text-slate-500 font-bold text-sm">ลานประลองของคนขยัน (Leaderboard)</p>
                    </div>
                </div>

                {/* Time Switcher */}
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex">
                    {['WEEKLY', 'MONTHLY', 'ALL_TIME'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t as TimeRange)}
                            className={`
                                px-4 py-2 rounded-xl text-xs font-black transition-all
                                ${timeRange === t 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                            `}
                        >
                            {t === 'WEEKLY' ? 'สัปดาห์นี้' : t === 'MONTHLY' ? 'เดือนนี้' : 'ตลอดกาล'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 1. TOP 3 PODIUM */}
            <PodiumSection topThree={topThree} />

            {/* 2. RANKING LIST */}
            <RankingList 
                list={restList} 
                emptyMessage={topThree.length === 0 ? "ยังไม่มีข้อมูลในรอบนี้" : undefined}
            />

            {/* 3. STICKY FOOTER (MY STATS) */}
            <UserStatsFooter myStats={myStats} />
        </div>
    );
};

export default LeaderboardView;
