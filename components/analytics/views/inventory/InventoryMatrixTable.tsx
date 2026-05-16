import React from 'react';
import { motion } from 'framer-motion';
import { Landmark, Target, ChevronRight } from 'lucide-react';

interface InventoryMatrixTableProps {
    pillarData: any[];
    totalCount: number;
    onPillarClick: (pillarKey: string) => void;
}

const InventoryMatrixTable: React.FC<InventoryMatrixTableProps> = ({ pillarData, totalCount, onPillarClick }) => {
    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                         <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                         <h3 className="text-xl font-bold text-slate-900 tracking-tight">เมทริกซ์วิเคราะห์กลยุทธ์</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">การวิเคราะห์ประสิทธิภาพข้ามมิติเชิงลึก (Enterprise Matrix)</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-10 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-10">เสาหลักเชิงกลยุทธ์ (Strategic Pillars)</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">ปริมาณงาน</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">นัยสำคัญทางธุรกิจ</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">สถานะปฏิบัติการ</th>
                            <th className="px-10 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right pr-10">วิเคราะห์เชิงลึก</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pillarData.map((item) => (
                            <tr 
                                key={item.key} 
                                onClick={() => onPillarClick(item.key)}
                                className="group hover:bg-indigo-50/30 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-indigo-600"
                            >
                                <td className="px-10 py-8 pl-10">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-900 leading-none mb-2 uppercase">{item.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Core Architecture</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-slate-900">{item.count}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Items</span>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Strategic Share</span>
                                            <span className="text-xs font-bold text-slate-900">{((item.count / (totalCount || 1)) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full max-w-[140px] h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(item.count / (totalCount || 1)) * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${item.count >= (totalCount / pillarData.length) ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${item.count >= (totalCount / pillarData.length) ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {item.count >= (totalCount / pillarData.length) ? 'เสถียรภาพสูง' : 'ควรเฝ้าระวัง'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right pr-10">
                                    <div className="flex items-center justify-end gap-3 translate-x-2 opacity-40 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.15em]">View Intelligence</span>
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 ring-1 ring-indigo-200">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryMatrixTable;
