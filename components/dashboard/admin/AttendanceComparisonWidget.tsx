
import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Clock, UserX, Briefcase, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';
import { AttendanceStat } from '../../../hooks/useDashboardStats';

interface AttendanceComparisonWidgetProps {
    todayStats: AttendanceStat;
    yesterdayStats: AttendanceStat;
}

const AttendanceComparisonWidget: React.FC<AttendanceComparisonWidgetProps> = ({ todayStats, yesterdayStats }) => {
    
    const getTrendDisplay = (current: number, prev: number, isGoodMetric: boolean) => {
        const diff = current - prev;
        let colorClass = 'text-slate-400 bg-slate-50';
        let Icon = Minus;

        if (diff > 0) {
            Icon = ArrowUp;
            colorClass = isGoodMetric ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
        } else if (diff < 0) {
            Icon = ArrowDown;
            colorClass = isGoodMetric ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50';
        }

        return (
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full border border-white/40 shadow-sm ${colorClass} ml-2`}
            >
                <Icon className="w-3 h-3 mr-0.5" />
                {Math.abs(diff)}
            </motion.div>
        );
    };

    return (
        <div className="glass-card rounded-[2.5rem] p-6 h-full flex flex-col shadow-indigo-100/50">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg tracking-tight">
                    <span className="p-2 bg-indigo-50 text-indigo-500 rounded-2xl shadow-sm border border-indigo-100">
                        <UserCheck className="w-5 h-5" />
                    </span>
                    การเข้างานวันนี้
                </h3>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest">Live</span>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {/* 1. Present */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-emerald-50/40 rounded-3xl p-4 border border-emerald-100/50 flex flex-col justify-between group transition-all"
                >
                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-2">
                        <UserCheck className="w-4 h-4" /> มาทำงาน
                    </div>
                    <div className="flex items-end">
                        <span className="text-3xl font-black text-emerald-700 tracking-tighter">{todayStats.present}</span>
                        {getTrendDisplay(todayStats.present, yesterdayStats.present, true)}
                    </div>
                </motion.div>

                {/* 2. Late */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-orange-50/40 rounded-3xl p-4 border border-orange-100/50 flex flex-col justify-between group transition-all"
                >
                    <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest mb-2">
                        <Clock className="w-4 h-4" /> สาย
                    </div>
                    <div className="flex items-end">
                        <span className="text-3xl font-black text-orange-700 tracking-tighter">{todayStats.late}</span>
                         {getTrendDisplay(todayStats.late, yesterdayStats.late, false)}
                    </div>
                </motion.div>

                {/* 3. Leave */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-indigo-50/40 rounded-3xl p-4 border border-indigo-100/50 flex flex-col justify-between group transition-all"
                >
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-2">
                        <Briefcase className="w-4 h-4" /> ลา/WFH
                    </div>
                    <div className="flex items-end">
                        <span className="text-3xl font-black text-indigo-700 tracking-tighter">{todayStats.leave}</span>
                        {getTrendDisplay(todayStats.leave, yesterdayStats.leave, false)} 
                    </div>
                </motion.div>

                {/* 4. Absent (Approx) */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="bg-rose-50/40 rounded-3xl p-4 border border-rose-100/50 flex flex-col justify-between group transition-all"
                >
                    <div className="flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest mb-2">
                        <UserX className="w-4 h-4" /> ขาด/ยังไม่เข้า
                    </div>
                    <div className="flex items-end">
                        <span className="text-3xl font-black text-rose-700 tracking-tighter">{todayStats.absent}</span>
                    </div>
                </motion.div>
            </div>
            
            {/* Footer Summary */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active: {todayStats.totalUsers}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        {Math.round((todayStats.present / (todayStats.totalUsers || 1)) * 100)}% Attendance
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AttendanceComparisonWidget;
