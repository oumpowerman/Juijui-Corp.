
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { Radar as RadarIcon } from 'lucide-react';

interface KPIRadarChartProps {
    breakdown: { okrScore: number; behaviorScore: number; attendanceScore: number };
}

const KPIRadarChart: React.FC<KPIRadarChartProps> = ({ breakdown }) => {
    // Transform data for Recharts
    const data = [
        { subject: 'ผลงาน (OKR)', A: breakdown.okrScore, fullMark: 100 },
        { subject: 'พฤติกรรม (Behavior)', A: breakdown.behaviorScore, fullMark: 100 },
        { subject: 'วินัย (Discipline)', A: breakdown.attendanceScore, fullMark: 100 },
    ];

    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <RadarIcon className="w-4 h-4 mr-2 text-pink-500" /> 
                สมดุลทักษะ (Skill Balance)
            </h4>
            
            <div className="flex-1 w-full min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Performance"
                            dataKey="A"
                            stroke="#ec4899"
                            strokeWidth={2}
                            fill="#ec4899"
                            fillOpacity={0.4}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Score Overlay */}
                <div className="absolute top-0 right-0 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    <div>OKR: {breakdown.okrScore}%</div>
                    <div>Behav: {breakdown.behaviorScore}%</div>
                    <div>Disc: {breakdown.attendanceScore}%</div>
                </div>
            </div>
        </div>
    );
};

export default KPIRadarChart;
