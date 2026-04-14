
import React from 'react';
import { motion } from 'framer-motion';
import { User, KPIRecord, KPIConfig, KPIStats } from '../../../types';
import { Coins, Printer, Sparkles, Award } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { calculateKPIBonus, GradeResult } from '../../../lib/kpiLogic';
import DisciplineScore from '../DisciplineScore';
import KPIHistoryChart from '../analytics/KPIHistoryChart';

interface OverviewTabProps {
    selectedUser: User | null;
    currentRecord: KPIRecord | null | undefined;
    gradeData: GradeResult;
    config: KPIConfig;
    userHistory: KPIRecord[];
    liveStats: KPIStats;
    selectedMonth: string;
    onExport: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
    selectedUser, currentRecord, gradeData, config, userHistory, liveStats, selectedMonth, onExport 
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-2">คะแนนรวม (Total Score)</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-5xl font-bold tracking-tighter">{gradeData.finalScore.toFixed(1)}</h3>
                        <p className="text-indigo-200 text-sm font-bold mb-1.5">/ 100</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Performance Index</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-rose-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-2">เกรดที่ได้ (Grade)</p>
                    <h3 className="text-5xl font-bold tracking-tighter">{gradeData.grade}</h3>
                    <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                        <Award className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Quality Standard</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">โบนัสสะสม (Bonus)</p>
                    <div className="flex items-center gap-2">
                        <Coins className="w-8 h-8 text-emerald-500" />
                        <h3 className="text-4xl font-bold tracking-tighter text-gray-800">
                            {calculateKPIBonus(gradeData.grade).toLocaleString()}
                        </h3>
                        <p className="text-gray-400 text-sm font-bold mt-2">THB</p>
                    </div>
                    <p className="mt-4 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full">คำนวณตามเกรดปัจจุบัน</p>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100 flex flex-col justify-between group">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">รอบการประเมิน</p>
                        <h3 className="text-2xl font-bold text-gray-800">{format(addMonths(new Date(selectedMonth + '-01'), 0), 'MMMM yyyy')}</h3>
                    </div>
                    <button 
                        onClick={onExport}
                        className="mt-4 w-full bg-gray-900 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        <Printer className="w-4 h-4" /> พิมพ์ใบประเมิน
                    </button>
                </div>
            </div>

            {/* Charts & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">แนวโน้มผลงาน (Performance Trend)</h3>
                            <p className="text-gray-400 text-sm font-bold">เปรียบเทียบย้อนหลัง 6 เดือน</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <KPIHistoryChart history={userHistory} />
                    </div>
                </div>

                <div className="space-y-8">
                    <DisciplineScore 
                        stats={liveStats}
                        config={config}
                        userId={selectedUser?.id || ''} 
                        monthKey={selectedMonth} 
                    />
                    
                    <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full -mr-10 -mt-10 blur-3xl"></div>
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-400" /> สรุปกิจกรรมเดือนนี้
                        </h4>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold text-gray-400">มาสาย (Late)</span>
                                <span className={`text-xl font-bold ${liveStats.attendanceLate > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {liveStats.attendanceLate} ครั้ง
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold text-gray-400">ลางาน (Leave)</span>
                                <span className="text-xl font-bold text-indigo-400">{liveStats.attendanceAbsent} วัน</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-sm font-bold text-gray-400">งานที่เสร็จ (Tasks)</span>
                                <span className="text-xl font-bold text-amber-400">{liveStats.taskCompleted} งาน</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default OverviewTab;
