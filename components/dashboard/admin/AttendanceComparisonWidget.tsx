
import React from 'react';
import { UserCheck, Clock, UserX, Briefcase, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { AttendanceStat } from '../../../hooks/useDashboardStats';

interface AttendanceComparisonWidgetProps {
    todayStats: AttendanceStat;
    yesterdayStats: AttendanceStat;
}

const AttendanceComparisonWidget: React.FC<AttendanceComparisonWidgetProps> = ({ todayStats, yesterdayStats }) => {
    
    // Helper to calc difference
    const getDiff = (current: number, prev: number) => {
        const diff = current - prev;
        if (diff > 0) return { val: diff, icon: ArrowUp, color: 'text-red-500', bg: 'bg-red-50' }; // Assuming higher late/absent is bad usually, but higher present is good. Context matters.
        if (diff < 0) return { val: Math.abs(diff), icon: ArrowDown, color: 'text-green-500', bg: 'bg-green-50' };
        return { val: 0, icon: Minus, color: 'text-gray-400', bg: 'bg-gray-50' };
    };

    // Specific logic for "Good" stats (Present) vs "Bad" stats (Late/Absent)
    const getTrendDisplay = (current: number, prev: number, isGoodMetric: boolean) => {
        const diff = current - prev;
        let colorClass = 'text-gray-400 bg-gray-50';
        let Icon = Minus;

        if (diff > 0) {
            Icon = ArrowUp;
            colorClass = isGoodMetric ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
        } else if (diff < 0) {
            Icon = ArrowDown;
            colorClass = isGoodMetric ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
        }

        return (
            <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colorClass} ml-2`}>
                <Icon className="w-3 h-3 mr-0.5" />
                {Math.abs(diff)}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <UserCheck className="w-4 h-4" />
                    </span>
                    สรุปการเข้างาน (Today)
                </h3>
                <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">เทียบกับเมื่อวาน</span>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {/* 1. Present */}
                <div className="bg-green-50/50 rounded-2xl p-3 border border-green-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-xs mb-1">
                        <UserCheck className="w-4 h-4" /> มาทำงาน
                    </div>
                    <div className="flex items-end">
                        <span className="text-2xl font-black text-green-800">{todayStats.present}</span>
                        {getTrendDisplay(todayStats.present, yesterdayStats.present, true)}
                    </div>
                </div>

                {/* 2. Late */}
                <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-orange-700 font-bold text-xs mb-1">
                        <Clock className="w-4 h-4" /> สาย
                    </div>
                    <div className="flex items-end">
                        <span className="text-2xl font-black text-orange-800">{todayStats.late}</span>
                         {getTrendDisplay(todayStats.late, yesterdayStats.late, false)}
                    </div>
                </div>

                {/* 3. Leave */}
                <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1">
                        <Briefcase className="w-4 h-4" /> ลา/WFH
                    </div>
                    <div className="flex items-end">
                        <span className="text-2xl font-black text-blue-800">{todayStats.leave}</span>
                        {getTrendDisplay(todayStats.leave, yesterdayStats.leave, false)} 
                        {/* Neutral metric basically, but usually less leave is better for capacity */}
                    </div>
                </div>

                {/* 4. Absent (Approx) */}
                <div className="bg-red-50/50 rounded-2xl p-3 border border-red-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-red-700 font-bold text-xs mb-1">
                        <UserX className="w-4 h-4" /> ขาด/ยังไม่เข้า
                    </div>
                    <div className="flex items-end">
                        <span className="text-2xl font-black text-red-800">{todayStats.absent}</span>
                         {/* Don't show trend for absent as it fluctuates during the day */}
                    </div>
                </div>
            </div>
            
            {/* Footer Summary */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
                <span>Active Users: {todayStats.totalUsers}</span>
                <span className="text-indigo-600 font-bold">
                    {Math.round((todayStats.present / (todayStats.totalUsers || 1)) * 100)}% Attendance
                </span>
            </div>
        </div>
    );
};

export default AttendanceComparisonWidget;
