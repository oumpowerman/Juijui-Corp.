import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
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

interface DailyAttendanceTrendChartProps {
    workingDaysInMonth: Date[];
    userStats: UserStat[];
    startTime: string;
    lateBuffer: number;
}

const DailyAttendanceTrendChart: React.FC<DailyAttendanceTrendChartProps> = ({
    workingDaysInMonth,
    userStats,
    startTime,
    lateBuffer
}) => {
    const trendData = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return workingDaysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            let onTimeCount = 0;
            let lateCount = 0;
            let absentCount = 0;
            let leaveCount = 0;

            userStats.forEach(stat => {
                const log = stat.logs.find(l => l.date === dateStr);
                if (log) {
                    if (log.status === 'LEAVE' || log.workType === 'LEAVE') {
                        leaveCount++;
                    } else if (log.checkInTime) {
                        const [targetHour, targetMinute] = startTime.split(':').map(Number);
                        const checkInDate = new Date(log.checkInTime);
                        const targetTime = new Date(checkInDate);
                        targetTime.setHours(targetHour, targetMinute + lateBuffer, 0, 0);

                        if (checkInDate > targetTime) {
                            lateCount++;
                        } else {
                            onTimeCount++;
                        }
                    } else {
                        absentCount++;
                    }
                } else {
                    if (dateStr <= todayStr) {
                        absentCount++;
                    }
                }
            });

            return {
                date: format(day, 'd MMM', { locale: th }),
                'ตรงเวลา': onTimeCount,
                'สาย': lateCount,
                'ขาดงาน': absentCount,
                'ลา': leaveCount
            };
        });
    }, [workingDaysInMonth, userStats, startTime, lateBuffer]);

    const customTooltipStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '12px'
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    แนวโน้มการเข้างานรายวัน
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> ตรงเวลา
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                        <div className="w-2 h-2 rounded-full bg-amber-500" /> สาย
                    </span>
                    <span className="flex items-center gap-1 font-bold text-sky-500">
                        <div className="w-2 h-2 rounded-full bg-sky-500" /> ลา
                    </span>
                    <span className="flex items-center gap-1 font-bold text-rose-500">
                        <div className="w-2 h-2 rounded-full bg-rose-500" /> ขาดงาน
                    </span>
                </div>
            </div>

            <div className="h-72 flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }}
                        />
                        <Tooltip contentStyle={customTooltipStyle} />
                        <Area type="monotone" dataKey="ตรงเวลา" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOnTime)" />
                        <Area type="monotone" dataKey="สาย" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLate)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DailyAttendanceTrendChart;
