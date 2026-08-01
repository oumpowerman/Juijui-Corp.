import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { 
    ArrowRight, CheckCircle2, Star, Sparkles
} from 'lucide-react';
import { User } from '../../../types';
import { AttendanceLog } from '../../../types/attendance';
import { motion, AnimatePresence } from 'framer-motion';
import { getAttendanceSummary } from '../../../lib/attendanceUtils';
import { useUserSession } from '../../../context/UserSessionContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { parseReason } from '../leave-request/request-detail/utils';

// Import our new subcomponents
import { DetailModalHeader } from './modal/DetailModalHeader';
import { DetailModalFilterGrid, FilterType } from './modal/DetailModalFilterGrid';
import { AttendanceRecordCard } from './modal/AttendanceRecordCard';
import { OvertimeBreakdownSection } from './modal/OvertimeBreakdownSection';
import { RecordDetailModal, DetailRecordPayload, formatSpecialTypeName } from './modal/RecordDetailModal';

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
}

interface DashboardUserDetailModalProps {
    user: User;
    stat: UserStat;
    workingDaysInMonth: Date[];
    startTime: string;
    lateBuffer: number;
    onClose: () => void;
}

const DashboardUserDetailModal: React.FC<DashboardUserDetailModalProps> = ({
    user,
    stat,
    workingDaysInMonth,
    startTime,
    lateBuffer,
    onClose
}) => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
    const [isScrolled, setIsScrolled] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<DetailRecordPayload | null>(null);
    const { leaveRequests, otRequests } = useUserSession();
    const { masterOptions } = useMasterData();

    const multipleShifts = useMemo(() => {
        const workConfig = masterOptions.filter(opt => opt.type === 'WORK_CONFIG');
        const enabled = workConfig.find(c => c.key === 'MULTIPLE_SHIFTS_ENABLED')?.label === 'true';
        const shiftsList = workConfig.find(c => c.key === 'MULTIPLE_SHIFTS_LIST')?.label || '';
        return { enabled, shiftsList };
    }, [masterOptions]);

    // Categorize dates
    const onTimeLogs = useMemo(() => {
        return stat.logs.filter(l => {
            if (l.note?.includes('[FORGOT_BOTH_PENDING]')) return false;
            if (l.status === 'LEAVE' || l.workType === 'LEAVE') return false;
            if (l.status === 'ABSENT' || l.workType === 'ABSENT') return false;
            if (!l.checkInTime) return false;
            const summary = getAttendanceSummary(
                l.checkInTime,
                l.checkOutTime,
                { startTime, buffer: lateBuffer, minHours: 9, note: l.note, multipleShifts }
            );
            return !summary.isLate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stat.logs, startTime, lateBuffer, multipleShifts]);

    const lateLogs = useMemo(() => {
        return stat.logs.filter(l => {
            if (l.note?.includes('[FORGOT_BOTH_PENDING]')) return true;
            if (l.status === 'ABSENT' || l.workType === 'ABSENT') return false;
            if (!l.checkInTime) return false;
            const summary = getAttendanceSummary(
                l.checkInTime,
                l.checkOutTime,
                { startTime, buffer: lateBuffer, minHours: 9, note: l.note, multipleShifts }
            );
            return summary.isLate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stat.logs, startTime, lateBuffer, multipleShifts]);

    const leaveLogs = useMemo(() => {
        return stat.logs.filter(l => {
            const hasLeaveNote = l.note && (
                l.note.includes('LEAVE') || 
                l.note.includes('SICK') || 
                l.note.includes('VACATION') || 
                l.note.includes('PERSONAL') || 
                l.note.includes('EMERGENCY') || 
                l.note.includes('UNPAID')
            );
            return l.status === 'LEAVE' || l.workType === 'LEAVE' || hasLeaveNote;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [stat.logs]);

    const absentDates = useMemo(() => {
        // หาค่าวันเริ่มงานจริงจาก startDate หรือวันสร้างบัญชี (createdAt)
        const userStartDate = user.startDate ? new Date(user.startDate) : (user.createdAt ? new Date(user.createdAt) : null);
        const today = new Date();

        return workingDaysInMonth.filter(day => {
            if (day > today) return false;

            // ตรวจสอบวันเริ่มงาน: หากวันทำงานในเดือนนั้นๆ เกิดขึ้นก่อนวันที่พนักงานเริ่มงานจริง ให้ข้ามไป
            if (userStartDate) {
                const dayStr = format(day, 'yyyy-MM-dd');
                const startStr = format(userStartDate, 'yyyy-MM-dd');
                if (dayStr < startStr) {
                    return false;
                }
            }

            // 🌟 เพิ่มเงื่อนไขเหมือนหน้าหลัก: ถ้าเป็นวันนี้แต่ยังไม่ถึงเวลาเข้างาน ให้ข้ามไปก่อน (ยังไม่แสดง Absent)
            const isToday = day.getDate() === today.getDate() &&
                            day.getMonth() === today.getMonth() &&
                            day.getFullYear() === today.getFullYear();

            if (isToday) {
                // 1. กำหนดเวลาเริ่มงานหลักเป็นตัวแปรตั้งต้นก่อน (เช่น 10:00)
                let targetStartTime = startTime; 

                // 2. ถ้าเปิดใช้งาน MULTIPLE_SHIFTS ให้ดึงกะที่สายที่สุดมาใช้งานแทน
                if (multipleShifts.enabled && multipleShifts.shiftsList) {
                    const shifts = multipleShifts.shiftsList
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                    
                    if (shifts.length > 0) {
                        shifts.sort(); // เรียงลำดับเวลาจากเช้าสุดไปสายสุด (เช่น "08:00" -> "08:30" -> "09:00")
                        targetStartTime = shifts[shifts.length - 1]; // เลือกเวลาที่สายที่สุด (เช่น "09:00")
                    }
                }

                // 3. นำเวลาที่เลือกได้ (targetStartTime) มาแปลงเป็นชั่วโมงและนาทีเพื่อเปรียบเทียบตามเดิม
                let [startHour, startMin] = [10, 0];
                if (targetStartTime && targetStartTime.includes(':')) {
                    const parts = targetStartTime.split(':');
                    startHour = parseInt(parts[0], 10) || 10;
                    startMin = parseInt(parts[1], 10) || 0;
                }
                const currentHour = today.getHours();
                const currentMin = today.getMinutes();

                if (currentHour < startHour || (currentHour === startHour && currentMin < startMin)) {
                    return false;
                }
            }

            const dateStr = format(day, 'yyyy-MM-dd');
            const dayLog = stat.logs.find(l => l.date === dateStr);
            if (dayLog) {
                return dayLog.status === 'ABSENT' || dayLog.workType === 'ABSENT';
            }
            return true;
        }).sort((a, b) => b.getTime() - a.getTime());
    }, [workingDaysInMonth, stat.logs, user.startDate, user.createdAt, startTime, multipleShifts]);

    // Calculate OT stats using ot_requests only
    const approvedOtRequests = useMemo(() => {
        if (workingDaysInMonth.length === 0) return [];
        const currentMonth = workingDaysInMonth[0].getMonth();
        const currentYear = workingDaysInMonth[0].getFullYear();

        return (otRequests || []).filter(req => {
            if (req.userId !== user.id) return false;
            if (req.status !== 'APPROVED') return false;
            const reqDate = new Date(req.date);
            return reqDate.getMonth() === currentMonth && reqDate.getFullYear() === currentYear;
        });
    }, [otRequests, user.id, workingDaysInMonth]);

    const totalOtHours = useMemo(() => {
        return approvedOtRequests.reduce((sum, req) => {
            return sum + (req.durationHours || 0);
        }, 0);
    }, [approvedOtRequests]);

    const totalIssues = lateLogs.length + absentDates.length + leaveLogs.length;

    const stats = useMemo(() => ({
        present: onTimeLogs.length + lateLogs.length + leaveLogs.length,
        late: lateLogs.length,
        absent: absentDates.length,
        leaves: leaveLogs.length,
        otHours: totalOtHours
    }), [onTimeLogs, lateLogs, leaveLogs, absentDates, totalOtHours]);

    return createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-0 sm:p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
                className="bg-white w-full max-w-full sm:max-w-2xl h-full sm:h-[1000px] sm:max-h-[85vh] rounded-none sm:rounded-[3rem] shadow-none sm:shadow-[0_32px_64px_-12px_rgba(99,102,241,0.2)] overflow-hidden border-0 sm:border-[8px] border-indigo-50 flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 opacity-10 pointer-events-none">
                    <Sparkles className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="absolute bottom-40 right-10 opacity-10 pointer-events-none">
                    <Star className="w-16 h-16 text-pink-400" />
                </div>

                {/* Header & Quick Filter Stats Grid */}
                <div className="shrink-0">
                    <DetailModalHeader 
                        user={user}
                        isScrolled={isScrolled}
                        totalIssues={totalIssues}
                        onClose={onClose}
                    />
                    
                    {/* Filter grid attached right under header */}
                    <div className="bg-gradient-to-br from-indigo-50/20 via-white to-pink-50/20 px-4 sm:px-6 pb-4 border-b border-indigo-50 shrink-0">
                        <DetailModalFilterGrid 
                            activeFilter={activeFilter}
                            setActiveFilter={setActiveFilter}
                            isScrolled={isScrolled}
                            stats={stats}
                        />
                    </div>
                </div>

                {/* Content Section - Scrollable */}
                <div 
                    className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 scrollbar-thin scrollbar-thumb-indigo-100"
                    onScroll={(e) => {
                        const target = e.currentTarget;
                        setIsScrolled(target.scrollTop > 20);
                    }}
                >
                    <AnimatePresence mode="wait">
                        {/* On-Time Section */}
                        {activeFilter === 'ALL' && onTimeLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="on-time-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-2xl text-emerald-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-left">
                                        On-Time Arrival Records
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {onTimeLogs.map(log => (
                                        <AttendanceRecordCard 
                                            key={log.id}
                                            date={new Date(log.date)}
                                            variant="on-time"
                                            timeLabel={log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm') : '--:--'}
                                            badgeText="ON-TIME"
                                            note={log.note}
                                            onClick={() => setSelectedRecord({ type: 'ATTENDANCE', data: log })}
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Late Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'LATE') && lateLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="late-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-2xl text-amber-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-left">
                                        Late Arrival Records
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {lateLogs.map(log => {
                                        const isForgotBothPending = !!log.note?.includes('[FORGOT_BOTH_PENDING]');
                                        const isProvisionalLate = log.status === 'APPEAL' || !!log.note?.includes('[PROVISIONAL_LATE_ENTRY]');
                                        const parsed = parseReason(log.note || '', log.checkInTime, log.checkOutTime);
                                        const timeLabel = isForgotBothPending && parsed.time ? parsed.time : (log.checkInTime ? format(new Date(log.checkInTime), 'HH:mm') : '--:--');
                                        return (
                                            <AttendanceRecordCard 
                                                key={log.id}
                                                date={new Date(log.date)}
                                                variant={(isForgotBothPending || isProvisionalLate) ? 'appeal' : 'late'}
                                                timeLabel={timeLabel}
                                                badgeText={isForgotBothPending ? 'FORGOT BOTH' : isProvisionalLate ? 'APPEAL' : 'LATE'}
                                                note={log.note}
                                                onClick={() => setSelectedRecord({ type: 'ATTENDANCE', data: log })}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )}

                        {/* Absent Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'ABSENT') && absentDates.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="absent-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-50 rounded-2xl text-rose-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-left">
                                        Missing Attendance
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {absentDates.map(date => (
                                        <AttendanceRecordCard 
                                            key={date.toString()}
                                            date={date}
                                            variant="absent"
                                            badgeText="ABSENT"
                                            onClick={() => setSelectedRecord({ type: 'ABSENT', data: { date } })}
                                        />
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Leave Section */}
                        {(activeFilter === 'ALL' || activeFilter === 'LEAVE') && leaveLogs.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                key="leave-section"
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-50 rounded-2xl text-sky-500">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-left">
                                        Official Leave History
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {leaveLogs.map(log => {
                                        const leaveTypeMatch = log.note?.match(/\[(?:APPROVED|REJECTED) LEAVE: (.*?)\]/);
                                        let extractedType = leaveTypeMatch ? leaveTypeMatch[1] : log.workType;
                                        if (log.note) {
                                            if (log.note.includes('SICK_LEAVE')) extractedType = 'SICK_LEAVE';
                                            else if (log.note.includes('VACATION_LEAVE')) extractedType = 'VACATION_LEAVE';
                                            else if (log.note.includes('PERSONAL_LEAVE')) extractedType = 'PERSONAL_LEAVE';
                                            else if (log.note.includes('EMERGENCY_LEAVE')) extractedType = 'EMERGENCY_LEAVE';
                                            else if (log.note.includes('UNPAID_LEAVE')) extractedType = 'UNPAID_LEAVE';
                                        }
                                        return (
                                            <AttendanceRecordCard 
                                                key={log.id}
                                                date={new Date(log.date)}
                                                variant="leave"
                                                badgeText={formatSpecialTypeName(extractedType)}
                                                note={log.note}
                                                onClick={() => setSelectedRecord({ type: 'LEAVE', data: log })}
                                            />
                                        );
                                    })}
                                </div>
                            </motion.section>
                        )}

                        {/* Overtime Breakdown View */}
                        {activeFilter === 'OT' && (
                            <OvertimeBreakdownSection 
                                leaveRequests={leaveRequests || []}
                                userId={user.id}
                                workingDaysInMonth={workingDaysInMonth}
                                onSelectRecord={(otData) => setSelectedRecord({ type: 'OT', data: otData })}
                            />
                        )}

                        {/* Empty State / Filter Empty State */}
                        {((activeFilter === 'LATE' && lateLogs.length === 0) || 
                          (activeFilter === 'ABSENT' && absentDates.length === 0) || 
                          (activeFilter === 'LEAVE' && leaveLogs.length === 0) ||
                          (activeFilter === 'OT' && approvedOtRequests.length === 0) ||
                          (activeFilter === 'ALL' && totalIssues === 0 && onTimeLogs.length === 0)) && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key="empty-state"
                                className="flex flex-col items-center justify-center py-20 text-indigo-200"
                            >
                                <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 bg-indigo-100 rounded-[2.5rem] animate-ping opacity-20"></div>
                                    <CheckCircle2 className="w-12 h-12 text-indigo-400 relative z-10" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-800">Everything is Good!</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">No records found for this category</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Section - Cute Style */}
                <div className="p-5 sm:p-8 bg-white border-t border-indigo-50 shrink-0">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-[2rem] font-bold text-xs tracking-[0.3em] uppercase hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        Close Details <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>

            {/* Drilldown Detail Sub-Modal */}
            <RecordDetailModal 
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
            />
        </motion.div>,
        document.body
    );
};

export default DashboardUserDetailModal;
