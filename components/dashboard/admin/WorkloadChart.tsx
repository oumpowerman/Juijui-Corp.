
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WorkloadChartProps {
    chartData: any[];
    progressPercentage: number;
    timeRangeLabel: string;
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({ chartData, progressPercentage, timeRangeLabel }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6 self-start">
                กราฟความจุ๊ย 📈 ({timeRangeLabel})
            </h3>
            <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} itemStyle={{ color: '#1e293b' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
                <p className="text-4xl font-black text-gray-800">
                    {progressPercentage}
                    <span className="text-lg text-gray-400 font-medium ml-1">%</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">ความคืบหน้า (All Done)</p>
            </div>
        </div>
    );
};

export default WorkloadChart;
