import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { BarChart2, PieChart as PieChartIcon } from 'lucide-react';

interface ChartData {
    name: string;
    count?: number;
    value?: number;
}

interface InventoryDistributionChartsProps {
    pillarData: any[];
    categoryData: any[];
    colors: string[];
}

const InventoryDistributionCharts: React.FC<InventoryDistributionChartsProps> = ({ 
    pillarData, 
    categoryData, 
    colors 
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pillar Bar Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">สัดส่วนเสาหลักคอนเทนต์ (Pillar)</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">พื้นที่เป้าหมายสำคัญของกลยุทธ์คุณ</p>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pillarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                            />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={45}>
                                {pillarData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600">
                            <PieChartIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">สัดส่วนหมวดหมู่คอนเทนต์ (Category)</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">แสดงความหลากหลายของรูปแบบคอนเทนต์</p>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full flex items-center">
                    <div className="w-3/5 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-2/5 space-y-3 pr-4">
                        {categoryData.slice(0, 6).map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between group cursor-pointer hover:translate-x-1 transition-transform">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: colors[index % colors.length] }} />
                                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-900 truncate max-w-[90px]">{entry.name}</span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-900">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryDistributionCharts;
