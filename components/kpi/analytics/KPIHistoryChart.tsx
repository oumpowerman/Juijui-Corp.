
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KPIRecord } from '../../../types';
import { format, parseISO } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface KPIHistoryChartProps {
    history: KPIRecord[];
}

const KPIHistoryChart: React.FC<KPIHistoryChartProps> = ({ history }) => {
    // 1. Sort by date (Oldest to Newest) and limit to last 6 months
    const data = [...history]
        .sort((a, b) => new Date(a.monthKey).getTime() - new Date(b.monthKey).getTime())
        .slice(-6)
        .map(record => ({
            month: format(new Date(record.monthKey + '-01'), 'MMM'), // '2023-10' -> 'Oct'
            score: record.totalScore,
            grade: record.totalScore >= 80 ? 'A' : record.totalScore >= 70 ? 'B' : record.totalScore >= 60 ? 'C' : 'D'
        }));

    if (data.length < 2) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-bold">ข้อมูลไม่เพียงพอสำหรับกราฟ</p>
                <p className="text-[10px]">ต้องมีการประเมินอย่างน้อย 2 เดือน</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" /> 
                แนวโน้มผลงาน (Performance Trend)
            </h4>
            
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 'bold'}} 
                            dy={10}
                        />
                        <YAxis 
                            hide 
                            domain={[0, 100]} 
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default KPIHistoryChart;
