import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Clock } from 'lucide-react';
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

interface CheckInTimeDistributionProps {
    userStats: UserStat[];
    startTime: string;
}

const CheckInTimeDistribution: React.FC<CheckInTimeDistributionProps> = ({ userStats, startTime }) => {
    const distributionData = useMemo(() => {
        let beforeTime = 0;
        let lateLessThan15 = 0;
        let late15to30 = 0;
        let late30to60 = 0;
        let lateMoreThan60 = 0;

        const [startHour, startMinute] = startTime.split(':').map(Number);

        userStats.forEach(stat => {
            stat.logs.forEach(log => {
                if (log.checkInTime && log.status !== 'LEAVE' && log.workType !== 'LEAVE') {
                    const checkInDate = new Date(log.checkInTime);
                    const targetTime = new Date(checkInDate);
                    targetTime.setHours(startHour, startMinute, 0, 0);

                    const diffMin = (checkInDate.getTime() - targetTime.getTime()) / (1000 * 60);

                    if (diffMin <= 0) {
                        beforeTime++;
                    } else if (diffMin <= 15) {
                        lateLessThan15++;
                    } else if (diffMin <= 30) {
                        late15to30++;
                    } else if (diffMin <= 60) {
                        late30to60++;
                    } else {
                        lateMoreThan60++;
                    }
                }
            });
        });

        return [
            { range: 'ก่อนเวลาเข้างาน', count: beforeTime, fill: '#10B981' },
            { range: 'สาย < 15 นาที', count: lateLessThan15, fill: '#FBBF24' },
            { range: 'สาย 15-30 นาที', count: late15to30, fill: '#F59E0B' },
            { range: 'สาย 30-60 นาที', count: late30to60, fill: '#D97706' },
            { range: 'สาย > 1 ชม.', count: lateMoreThan60, fill: '#EF4444' }
        ];
    }, [userStats, startTime]);

    const customTooltipStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '12px'
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    การกระจายตัวของเวลาเข้างาน (Check-In)
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                    อ้างอิงจากเวลาทำงานหลัก <span className="text-indigo-600 font-extrabold">{startTime} น.</span>
                </p>
            </div>

            <div className="h-64 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                        <YAxis 
                            dataKey="range" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#475569', fontWeight: 'bold' }} 
                            width={90}
                        />
                        <Tooltip 
                            contentStyle={customTooltipStyle}
                            formatter={(value) => [`${value} ครั้ง`, 'จำนวนการตอกบัตร']}
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={24}>
                            {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CheckInTimeDistribution;
