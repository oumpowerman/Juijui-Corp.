
import React, { useState } from 'react';
import { FinanceStats, FinanceTransaction } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Wallet, Info } from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import FinanceDetailModal from './FinanceDetailModal'; // Import New Modal

interface FinanceDashboardProps {
    stats: FinanceStats;
    transactions?: FinanceTransaction[]; // Add optional transactions prop for details
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ stats, transactions = [] }) => {
    // Generate simple colors if not provided
    const dataWithColors = stats.chartData.map((d, i) => ({
        ...d,
        color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][i % 5]
    }));

    // State for Modal
    const [detailType, setDetailType] = useState<'INCOME' | 'EXPENSE' | 'PROFIT' | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Income Card */}
                <div 
                    onClick={() => setDetailType('INCOME')}
                    className="bg-green-50 rounded-3xl p-6 border border-green-100 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24 text-green-600"/></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl text-green-600 shadow-sm"><DollarSign className="w-6 h-6"/></div>
                                <span className="text-sm font-black text-green-800 uppercase tracking-widest">Income</span>
                            </div>
                            <Info className="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-3xl font-black text-green-700">฿ {stats.totalIncome.toLocaleString()}</h3>
                        <p className="text-xs text-green-600 mt-1 font-bold bg-white/50 inline-block px-2 py-1 rounded-lg">แตะเพื่อดูที่มาของรายได้</p>
                    </div>
                </div>

                {/* Expense Card */}
                <div 
                    onClick={() => setDetailType('EXPENSE')}
                    className="bg-red-50 rounded-3xl p-6 border border-red-100 relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown className="w-24 h-24 text-red-600"/></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl text-red-600 shadow-sm"><Wallet className="w-6 h-6"/></div>
                                <span className="text-sm font-black text-red-800 uppercase tracking-widest">Expense</span>
                            </div>
                            <Info className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-3xl font-black text-red-700">฿ {stats.totalExpense.toLocaleString()}</h3>
                        <p className="text-xs text-red-600 mt-1 font-bold bg-white/50 inline-block px-2 py-1 rounded-lg">แตะเพื่อดูรายจ่ายย่อย</p>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div 
                    onClick={() => setDetailType('PROFIT')}
                    className={`rounded-3xl p-6 border relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer ${stats.netProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><PieChart className="w-24 h-24 text-gray-600"/></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-2xl text-gray-600 shadow-sm"><PieChart className="w-6 h-6"/></div>
                                <span className="text-sm font-black text-gray-800 uppercase tracking-widest">Net Profit</span>
                            </div>
                            <Info className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className={`text-3xl font-black ${stats.netProfit >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>฿ {stats.netProfit.toLocaleString()}</h3>
                        <p className={`text-xs mt-1 font-bold bg-white/50 inline-block px-2 py-1 rounded-lg ${stats.netProfit >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>{stats.netProfit >= 0 ? 'กำไรสุทธิ (คลิกดูวิเคราะห์)' : 'ขาดทุนสุทธิ (คลิกดูวิเคราะห์)'}</p>
                    </div>
                </div>
            </div>

            {/* Expense Chart */}
            {stats.chartData.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <div className="w-full md:w-1/2 h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={dataWithColors}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dataWithColors.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {dataWithColors.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-500">{entry.name}</span>
                                    <span className="text-sm font-black text-gray-800">฿ {entry.value.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            <FinanceDetailModal 
                isOpen={!!detailType}
                onClose={() => setDetailType(null)}
                type={detailType}
                transactions={transactions}
                stats={stats}
            />
        </div>
    );
};

export default FinanceDashboard;
