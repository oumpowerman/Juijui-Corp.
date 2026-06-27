import React, { useMemo } from 'react';
import { Trophy, AlertTriangle, Clock, UserX } from 'lucide-react';
import { User } from '../../../../types';
import { AttendanceLog } from '../../../../types/attendance';

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
}

interface LeaderboardSectionProps {
    users: User[];
    userStats: UserStat[];
    getGrade: (stat: UserStat) => { grade: string; color: string };
    onUserClick: (user: User, stat: UserStat) => void;
}

const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
    users,
    userStats,
    getGrade,
    onUserClick
}) => {
    const leaderboards = useMemo(() => {
        // Hall of Fame: High present, low late
        const sortedHallOfFame = [...userStats]
            .map(stat => {
                const user = users.find(u => u.id === stat.userId);
                return { stat, user };
            })
            .filter(item => item.user?.isActive && item.stat.present > 0)
            .sort((a, b) => {
                if (b.stat.present !== a.stat.present) {
                    return b.stat.present - a.stat.present; // More present days first
                }
                return a.stat.late - b.stat.late; // Fewer late days as tie-breaker
            })
            .slice(0, 5);

        // Need Attention: High late or high absent
        const sortedNeedsAttention = [...userStats]
            .map(stat => {
                const user = users.find(u => u.id === stat.userId);
                return { stat, user };
            })
            .filter(item => item.user?.isActive && (item.stat.late > 0 || item.stat.absent > 0))
            .sort((a, b) => {
                const scoreA = a.stat.late * 1.5 + a.stat.absent * 2.5;
                const scoreB = b.stat.late * 1.5 + b.stat.absent * 2.5;
                return scoreB - scoreA;
            })
            .slice(0, 5);

        return {
            hallOfFame: sortedHallOfFame,
            needsAttention: sortedNeedsAttention
        };
    }, [userStats, users]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Hall of Fame */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">ตรงเวลาดีเด่น (Top 5)</h3>
                    </div>

                    <div className="space-y-3">
                        {leaderboards.hallOfFame.map((item, index) => {
                            if (!item.user) return null;
                            const gradeInfo = getGrade(item.stat);
                            return (
                                <div 
                                    key={item.user.id}
                                    onClick={() => onUserClick(item.user!, item.stat)}
                                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative">
                                            <img src={item.user.avatarUrl} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" alt={item.user.name} />
                                            <div className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{item.user.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate">{item.user.position}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${gradeInfo.color}`}>
                                            Grade {gradeInfo.grade}
                                        </span>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1">มา {item.stat.present} วัน</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">ควรช่วยเหลือ/ตักเตือน (Top 5)</h3>
                    </div>

                    <div className="space-y-3">
                        {leaderboards.needsAttention.map((item, index) => {
                            if (!item.user) return null;
                            return (
                                <div 
                                    key={item.user.id}
                                    onClick={() => onUserClick(item.user!, item.stat)}
                                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative">
                                            <img src={item.user.avatarUrl} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" alt={item.user.name} />
                                            <div className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{item.user.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate">{item.user.position}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {item.stat.late > 0 && (
                                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-bold flex items-center gap-0.5">
                                                    <Clock className="w-2 h-2" /> {item.stat.late}
                                                </span>
                                            )}
                                            {item.stat.absent > 0 && (
                                                <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[8px] font-bold flex items-center gap-0.5">
                                                    <UserX className="w-2 h-2" /> {item.stat.absent}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">คะแนนหักรวม {(item.stat.late * 1.5 + item.stat.absent * 2.5).toFixed(1)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardSection;
