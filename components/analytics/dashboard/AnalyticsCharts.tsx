
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, Info } from 'lucide-react';

interface AnalyticsChartsProps {
    chartData: any[];
    platformDistribution: any[];
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ chartData, platformDistribution }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Bar Chart */}
            <div className="lg:col-span-8 bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            ดัชนีประสิทธิภาพการเข้าถึง
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Top 10 performing contents by reach</p>
                    </div>
                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button className="px-3 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-bold text-indigo-600 uppercase tracking-widest">ยอดวิว</button>
                        <button className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">การมีส่วนร่วม</button>
                    </div>
                </div>
                
                <div className="h-[400px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} 
                                angle={-15}
                                textAnchor="end"
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '1.2rem', 
                                    border: 'none', 
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                    padding: '12px 16px'
                                }}
                                cursor={{ fill: '#f8fafc', radius: 12 }}
                            />
                            <Bar dataKey="views" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-indigo-600" />
                        สัดส่วนรายแพลตฟอร์ม
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Distribution across social ecosystems</p>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="h-[280px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={platformDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {platformDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center text for donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">ยอดรวม</span>
                            <span className="text-2xl font-bold text-slate-900">REACH</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full mt-8">
                        {platformDistribution.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 text-slate-300 py-4">
                                <Info className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">ไม่มีข้อมูล</span>
                            </div>
                        ) : platformDistribution.map((entry, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{entry.name}</span>
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{entry.value.toLocaleString()}</span>
                                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded">VIEWS</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
