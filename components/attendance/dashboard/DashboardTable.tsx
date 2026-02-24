
import React from 'react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';

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

interface DashboardTableProps {
    isLoading: boolean;
    filteredStats: UserStat[];
    users: User[];
    getGrade: (stat: UserStat) => { grade: string, color: string };
    onUserClick: (user: User, stat: UserStat) => void;
}

const DashboardTable: React.FC<DashboardTableProps> = ({
    isLoading,
    filteredStats,
    users,
    getGrade,
    onUserClick
}) => {
    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <th className="px-6 py-4 font-bold">Employee</th>
                            <th className="px-6 py-4 font-bold text-center">Days Present</th>
                            <th className="px-6 py-4 font-bold text-center">Late Count</th>
                            <th className="px-6 py-4 font-bold text-center">Absent</th>
                            <th className="px-6 py-4 font-bold text-center">Leaves</th>
                            <th className="px-6 py-4 font-bold text-center">Total Hours</th>
                            <th className="px-6 py-4 font-bold text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={7} className="py-20 text-center text-gray-400">Loading Report...</td></tr>
                        ) : filteredStats.length === 0 ? (
                            <tr><td colSpan={7} className="py-20 text-center text-gray-400">No data found</td></tr>
                        ) : (
                            filteredStats.map(stat => {
                                const user = users.find(u => u.id === stat.userId);
                                if (!user) return null;
                                const grade = getGrade(stat);

                                return (
                                    <tr 
                                        key={stat.userId} 
                                        className="hover:bg-indigo-50/30 transition-all cursor-pointer group"
                                        onClick={() => onUserClick(user, stat)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100" />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.position}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
                                                {stat.present}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.late > 0 ? 'bg-red-50 text-red-600' : 'text-gray-400'}`}>
                                                {stat.late}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.absent > 0 ? 'bg-red-100 text-red-700' : 'text-gray-400'}`}>
                                                {stat.absent}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${stat.leaves > 0 ? 'bg-pink-50 text-pink-600' : 'text-gray-400'}`}>
                                                {stat.leaves}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-mono text-gray-600">
                                                {stat.totalHours.toFixed(1)} h
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block w-10 py-1 rounded-lg text-xs font-black ${grade.color}`}>
                                                {grade.grade}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DashboardTable;
