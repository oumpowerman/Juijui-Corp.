import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Sparkles } from 'lucide-react';

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
}

interface AttendanceDistributionChartProps {
    userStats: UserStat[];
}

const AttendanceDistributionChart: React.FC<AttendanceDistributionChartProps> = ({ userStats }) => {
    const donutData = useMemo(() => {
        let totalOnTime = 0;
        let totalLate = 0;
        let totalLeave = 0;
        let totalAbsent = 0;

        userStats.forEach(stat => {
            totalLate += stat.late;
            totalLeave += stat.leaves;
            totalAbsent += stat.absent;
            const onTime = Math.max(0, stat.present - stat.late);
            totalOnTime += onTime;
        });

        return [
            { name: 'ตรงเวลา', value: totalOnTime, color: '#10B981' },
            { name: 'สาย', value: totalLate, color: '#F59E0B' },
            { name: 'ลางาน', value: totalLeave, color: '#0EA5E9' },
            { name: 'ขาดงาน', value: totalAbsent, color: '#F43F5E' }
        ].filter(d => d.value > 0);
    }, [userStats]);

    const totalRecords = useMemo(() => donutData.reduce((sum, d) => sum + d.value, 0), [donutData]);

    const customTooltipStyle = {
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '12px'
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        สัดส่วนการลงเวลา (เดือนนี้)
                    </h3>
                </div>
                <div className="h-64 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={donutData}
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                                animationDuration={800}
                            >
                                {donutData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={customTooltipStyle}
                                formatter={(value) => [`${value} วัน`, 'จำนวน']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                        <span id="donut-total" className="text-3xl font-bold text-slate-800">
                            {totalRecords}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">รายการบันทึก</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                {donutData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 bg-gray-50/50 rounded-xl border border-gray-100/50">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-500 truncate">{d.name}</p>
                            <p className="text-sm font-bold text-slate-800 leading-none">{d.value} <span className="text-[10px] font-normal text-slate-400">วัน</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttendanceDistributionChart;
