import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Box, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AssetDashboardStatsProps {
    stats: {
        totalValue: number;
        count: number;
        damaged: number;
        lost: number;
        warrantyAlert: number;
    };
}

const AssetDashboardStats: React.FC<AssetDashboardStatsProps> = ({ stats }) => {
    
    // Calculate health
    const healthyCount = stats.count - (stats.damaged + stats.lost);
    const healthData = [
        { name: 'Good', value: healthyCount, color: '#f472b6' }, // Pink
        { name: 'Damaged', value: stats.damaged, color: '#fb923c' }, // Orange
        { name: 'Lost', value: stats.lost, color: '#f87171' }, // Red
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            
            {/* Total Value */}
            <div className="pastel-glass-cute p-5 flex flex-col justify-between relative overflow-hidden group cute-3d-button animate-wiggle-hover">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-200 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-pink-500">
                        <div className="p-2 bg-pink-100 rounded-2xl shadow-inner"><DollarSign className="w-6 h-6" /></div>
                        <span className="text-sm font-black uppercase tracking-wide">มูลค่ารวม (Total Value)</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-800 mt-2">฿ {stats.totalValue.toLocaleString()}</h3>
                </div>
            </div>

            {/* Total Count */}
            <div className="pastel-glass-cute p-5 flex flex-col justify-between relative overflow-hidden group cute-3d-button animate-wiggle-hover">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-200 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-purple-500">
                        <div className="p-2 bg-purple-100 rounded-2xl shadow-inner"><Box className="w-6 h-6" /></div>
                        <span className="text-sm font-black uppercase tracking-wide">จำนวนของ (Asset Count)</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-800 mt-2">{stats.count.toLocaleString()} <span className="text-sm text-purple-400 font-bold">ชิ้น</span></h3>
                </div>
            </div>

            {/* Health Chart */}
            <div className="lg:col-span-2 pastel-glass-cute p-5 flex items-center gap-6 relative cute-3d-button animate-wiggle-hover">
                 <div className="h-28 w-28 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={healthData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={10}
                            >
                                {healthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ShieldCheck className="w-6 h-6 text-pink-300 animate-pulse" />
                    </div>
                 </div>

                 <div className="flex-1 grid grid-cols-2 gap-4">
                     <div>
                         <p className="text-xs text-pink-400 uppercase font-black mb-2">สถานะของ (Status)</p>
                         <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white/50 px-3 py-1.5 rounded-xl">
                                 <span className="w-3 h-3 rounded-full bg-pink-400 shadow-sm"></span> {healthyCount} สภาพดี
                             </div>
                             <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white/50 px-3 py-1.5 rounded-xl">
                                 <span className="w-3 h-3 rounded-full bg-orange-400 shadow-sm"></span> {stats.damaged} ส่งซ่อม/พัง
                             </div>
                             <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white/50 px-3 py-1.5 rounded-xl">
                                 <span className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></span> {stats.lost} สูญหาย
                             </div>
                         </div>
                     </div>
                     <div className="flex flex-col justify-center">
                         {stats.warrantyAlert > 0 ? (
                             <div className="bg-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-black border-2 border-red-200 flex items-center gap-2 shadow-sm animate-bounce">
                                 <AlertTriangle className="w-5 h-5" />
                                 {stats.warrantyAlert} ชิ้นใกล้หมดประกัน!
                             </div>
                         ) : (
                             <div className="bg-green-100 text-green-600 px-4 py-3 rounded-2xl text-sm font-black border-2 border-green-200 flex items-center gap-2 shadow-sm">
                                 <ShieldCheck className="w-5 h-5" />
                                 ประกันยังโอเคอยู่!
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default AssetDashboardStats;