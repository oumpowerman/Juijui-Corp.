
import React from 'react';
import { useAttendanceStats } from '../../../hooks/attendance/useAttendanceStats';
import { AttendanceStats as StatsType } from '../../../types/attendance';
import { TrendingUp, Clock, Calendar, AlertCircle } from 'lucide-react';

interface AttendanceStatsProps {
    userId: string;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ userId }) => {
    const { stats, isStatsLoading } = useAttendanceStats(userId);

    if (isStatsLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>)}
    </div>;

    const statItems = [
        { label: 'Streak', value: `${stats.currentStreak} วัน`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'ชั่วโมงงาน', value: `${stats.totalHours} ชม.`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'มาสาย', value: `${stats.lateDays} ครั้ง`, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'มาตรงเวลา', value: `${stats.onTimeDays} วัน`, icon: Calendar, color: 'text-green-500', bg: 'bg-green-50' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${item.bg}`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                        <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AttendanceStats;
