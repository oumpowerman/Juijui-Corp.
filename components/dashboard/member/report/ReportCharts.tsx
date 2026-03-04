import React from 'react';
import { PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import GlassyCard from './GlassyCard';

interface ReportChartsProps {
    roleData: any[];
    platformData: any[];
    colors: string[];
}

const ReportCharts: React.FC<ReportChartsProps> = ({ roleData, platformData, colors }) => {
    return (
        <div className="grid grid-cols-2 gap-8 mb-10">
             {/* Role Breakdown */}
             <GlassyCard className="p-8 h-[400px] relative" delay={0.4}>
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                        <PieIcon className="w-4 h-4 mr-2 text-indigo-500" /> Contribution by Role
                    </h4>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">Analytics</div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                        <Pie
                            data={roleData}
                            cx="50%" cy="50%"
                            innerRadius={70} outerRadius={100}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                        >
                            {roleData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                            ))}
                        </Pie>
                        <Legend 
                            verticalAlign="bottom" 
                            align="center" 
                            iconType="circle" 
                            wrapperStyle={{ fontSize: '11px', fontWeight: '900', paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }} 
                        />
                        <ReTooltip 
                            contentStyle={{ 
                                borderRadius: '24px', 
                                border: 'none', 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                padding: '12px 20px',
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(10px)'
                            }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
             </GlassyCard>

             {/* Platform Distribution */}
             <GlassyCard className="p-8 h-[400px] relative" delay={0.5}>
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2 text-purple-500" /> Platform Distribution
                    </h4>
                    <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase">Reach</div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={platformData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 11, fontWeight: '900', fill: '#64748b' }} 
                            width={100} 
                        />
                        <ReTooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }} 
                            contentStyle={{ 
                                borderRadius: '24px', 
                                border: 'none',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                padding: '12px 20px',
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(10px)'
                            }} 
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 20, 20, 0]} barSize={24}>
                            {platformData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[(index + 2) % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </GlassyCard>
        </div>
    );
};

export default ReportCharts;
