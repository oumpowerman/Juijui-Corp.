import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { LeaveRequest } from '../../../../types/attendance';
import { useUserSession } from '../../../../context/UserSessionContext';

// Import refactored subcomponents and utils
import { ProcessedOtRequest } from './overtime-breakdown/types';
import { calculateOtSummary, matchOtWithScannedLogs } from './overtime-breakdown/utils';
import { OvertimeProgressTracker } from './overtime-breakdown/OvertimeProgressTracker';
import { OvertimeRateGrid } from './overtime-breakdown/OvertimeRateGrid';
import { OvertimeLogList } from './overtime-breakdown/OvertimeLogList';

interface OvertimeBreakdownSectionProps {
    leaveRequests: LeaveRequest[];
    userId: string;
    workingDaysInMonth: Date[]; // For date boundary matching
}

export const OvertimeBreakdownSection: React.FC<OvertimeBreakdownSectionProps> = ({
    leaveRequests,
    userId,
    workingDaysInMonth
}) => {
    const { otRequests, attendanceLogs } = useUserSession();

    // Determine boundary dates for current selection
    const selectedMonthDates = useMemo(() => {
        if (workingDaysInMonth.length === 0) return { start: new Date(), end: new Date() };
        const sorted = [...workingDaysInMonth].sort((a, b) => a.getTime() - b.getTime());
        return {
            start: sorted[0],
            end: sorted[sorted.length - 1]
        };
    }, [workingDaysInMonth]);

    // Process only otRequests into approved overtime records with automatic multiplier calculation
    const processedOtRequests = useMemo(() => {
        const approvedOtReqs = (otRequests || []).filter(req => {
            if (req.userId !== userId) return false;
            if (req.status !== 'APPROVED') return false;
            
            // Check if within selected month range
            const reqDate = new Date(req.date);
            const matchMonth = reqDate.getMonth() === selectedMonthDates.start.getMonth() &&
                               reqDate.getFullYear() === selectedMonthDates.start.getFullYear();
            return matchMonth;
        });

        const mappedOts: ProcessedOtRequest[] = approvedOtReqs.map(req => {
            const dateObj = new Date(req.date);
            return {
                id: req.id,
                date: dateObj,
                durationHours: req.durationHours,
                reason: req.reason,
                type: req.type as 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME',
                startTime: req.startTime,
                endTime: req.endTime,
                source: 'OT_REQUEST'
            };
        });

        // Sort by date descending
        return mappedOts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [otRequests, userId, selectedMonthDates]);

    const [activeRateFilter, setActiveRateFilter] = useState<'ALL' | 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME'>('ALL');

    // Calculate aggregated statistics
    const otSummary = useMemo(() => {
        return calculateOtSummary(processedOtRequests);
    }, [processedOtRequests]);

    // Match each OT request with scanned attendance logs for display
    const matchedOtRequests = useMemo(() => {
        return processedOtRequests.map(req => 
            matchOtWithScannedLogs(req, attendanceLogs || [], userId)
        );
    }, [processedOtRequests, attendanceLogs, userId]);

    // Filter matched OT requests based on active rate filter
    const filteredMatchedRequests = useMemo(() => {
        if (activeRateFilter === 'ALL') return matchedOtRequests;
        return matchedOtRequests.filter(req => req.type === activeRateFilter);
    }, [matchedOtRequests, activeRateFilter]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            {/* Header Badge */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-2xl text-purple-500">
                    <Zap className="w-5 h-5 animate-bounce" />
                </div>
                <div className="text-left">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Overtime Breakdown
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold">
                        สะสมตามอัตราคูณรายเดือน (คำนวณผ่านกฎ Safe Minimum Rule อัตโนมัติ)
                    </p>
                </div>
            </div>

            {/* Aggregated Visual Card */}
            <div className="bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 rounded-[2.5rem] border border-purple-100 p-4 sm:p-6 shadow-sm">
                <OvertimeProgressTracker summary={otSummary} />
                <OvertimeRateGrid 
                    summary={otSummary} 
                    activeFilter={activeRateFilter}
                    onFilterChange={setActiveRateFilter}
                />
            </div>

            {/* List Header */}
            <div className="text-left flex items-center justify-between px-2">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Chronological Logs ({filteredMatchedRequests.length} จาก {processedOtRequests.length} รายการ)
                </h5>
            </div>

            {/* Detail Logs List */}
            <OvertimeLogList 
                matchedRequests={filteredMatchedRequests} 
                activeFilter={activeRateFilter}
                onClearFilter={() => setActiveRateFilter('ALL')}
            />
        </motion.div>
    );
};
