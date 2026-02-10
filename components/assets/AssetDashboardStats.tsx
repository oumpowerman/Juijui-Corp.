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
        { name: 'Good', value: healthyCount, color: '#22c55e' }, // Green
        { name: 'Damaged', value: stats.damaged, color: '#f97316' }, // Orange
        { name: 'Lost', value: stats.lost, color: '#ef4444' }, // Red
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Total Value */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600">
                        <div className="p-2 bg-indigo-50 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                        <span className="text-xs font-bold uppercase tracking-wide">Total Value</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800">฿ {stats.totalValue.toLocaleString()}</h3>
                </div>
            </div>

            {/* Total Count */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <div className="p-2 bg-blue-50 rounded-xl"><Box className="w-5 h-5" /></div>
                        <span className="text-xs font-bold uppercase tracking-wide">Asset Count</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800">{stats.count.toLocaleString()} <span className="text-sm text-gray-400 font-medium">Items</span></h3>
                </div>
            </div>

            {/* Health Chart */}
            <div className="lg:col-span-2 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 relative">
                 <div className="h-24 w-24 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={healthData}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {healthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ShieldCheck className="w-5 h-5 text-gray-300" />
                    </div>
                 </div>

                 <div className="flex-1 grid grid-cols-2 gap-4">
                     <div>
                         <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status Overview</p>
                         <div className="space-y-1">
                             <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                 <span className="w-2 h-2 rounded-full bg-green-500"></span> {healthyCount} Good
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                 <span className="w-2 h-2 rounded-full bg-orange-500"></span> {stats.damaged} Fix/Bad
                             </div>
                             <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                 <span className="w-2 h-2 rounded-full bg-red-500"></span> {stats.lost} Lost
                             </div>
                         </div>
                     </div>
                     <div className="flex flex-col justify-center">
                         {stats.warrantyAlert > 0 ? (
                             <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                 <AlertTriangle className="w-4 h-4" />
                                 {stats.warrantyAlert} Expiring
                             </div>
                         ) : (
                             <div className="bg-green-50 text-green-600 px-3 py-2 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-2">
                                 <ShieldCheck className="w-4 h-4" />
                                 Warranty OK
                             </div>
                         )}
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default AssetDashboardStats;