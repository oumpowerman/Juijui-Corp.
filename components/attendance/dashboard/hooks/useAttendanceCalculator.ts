import { useMemo, useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { User } from '../../../../types';
import { AttendanceLog } from '../../../../types/attendance';
import { UserStat, DateFilterMode, GradeInfo } from '../types';
import { getAttendanceSummary, getLateMinutes } from '../../../../lib/attendanceUtils';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { useUserSession } from '../../../../context/UserSessionContext';
import { parseReason } from '../../leave-request/request-detail/utils';
import { useAnnualHolidays } from '../../../../hooks/useAnnualHolidays';
import { useCalendarExceptions } from '../../../../hooks/useCalendarExceptions';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';
import { useMasterData } from '../../../../hooks/useMasterData';

interface UseAttendanceCalculatorParams {
    users: User[];
    logs: AttendanceLog[];
    currentMonth: Date;
    dateFilterMode: DateFilterMode;
    customStartDate: Date;
    customEndDate: Date;
    shouldHideAdmins?: boolean;
}

export const useAttendanceCalculator = ({
    users,
    logs,
    currentMonth,
    dateFilterMode,
    customStartDate,
    customEndDate,
    shouldHideAdmins = false
}: UseAttendanceCalculatorParams) => {
    const { masterOptions } = useMasterData();
    const { otRequests, leaveRequests } = useUserSession();
    const { config } = useGameConfig();
    const { annualHolidays } = useAnnualHolidays();
    const { exceptions } = useCalendarExceptions();

    // Config State
    const [startTime, setStartTime] = useState('10:00');
    const [lateBuffer, setLateBuffer] = useState(0);

    // Load Config
    useEffect(() => {
        const workConfig = masterOptions.filter(opt => opt.type === 'WORK_CONFIG');
        const start = workConfig.find(c => c.key === 'START_TIME')?.label || '10:00';
        const buffer = parseInt(workConfig.find(c => c.key === 'LATE_BUFFER')?.label || '0');
        setStartTime(start);
        setLateBuffer(buffer);
    }, [masterOptions]);

    const multipleShifts = useMemo(() => {
        const workConfig = masterOptions.filter(opt => opt.type === 'WORK_CONFIG');
        const enabled = workConfig.find(c => c.key === 'MULTIPLE_SHIFTS_ENABLED')?.label === 'true';
        const shiftsList = workConfig.find(c => c.key === 'MULTIPLE_SHIFTS_LIST')?.label || '';
        return { enabled, shiftsList };
    }, [masterOptions]);

    // Helper: Get Effective Status for a Day
    const getEffectiveDayStatus = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const exception = exceptions.find(e => e.date === dateStr);
        if (exception) return { status: exception.type, source: 'EXCEPTION' };
        const holiday = annualHolidays.find(h => h.day === date.getDate() && h.month === date.getMonth() + 1 && h.isActive);
        if (holiday) return { status: 'HOLIDAY' as const, source: 'ANNUAL' };
        if (isWeekend(date)) return { status: 'HOLIDAY' as const, source: 'WEEKEND' };
        return { status: 'WORK_DAY' as const, source: 'DEFAULT' };
    };

    // Calculate Working Days in current month or range
    const monthDays = useMemo(() => {
        const start = dateFilterMode === 'MONTH' ? startOfMonth(currentMonth) : customStartDate;
        const end = dateFilterMode === 'MONTH' ? endOfMonth(currentMonth) : customEndDate;
        if (start > end) {
            return [];
        }
        return eachDayOfInterval({
            start,
            end
        });
    }, [currentMonth, dateFilterMode, customStartDate, customEndDate]);

    const workingDaysInMonth = useMemo(() => {
        return monthDays.filter(day => getEffectiveDayStatus(day).status === 'WORK_DAY');
    }, [monthDays, annualHolidays, exceptions]);

    // Calculate Stats per User
    const userStats = useMemo(() => {
        const statsMap: Record<string, UserStat> = {};
        const today = new Date();

        // Initialize for all active users
        users.filter(u => u.isActive && !(shouldHideAdmins && u.role === 'ADMIN')).forEach(u => {
            statsMap[u.id] = {
                userId: u.id,
                present: 0,
                late: 0,
                leaves: 0,
                absent: 0,
                totalHours: 0,
                avgCheckIn: '-',
                logs: [],
                totalLateMinutes: 0,
                hasProvisionalForgot: false,
                provisionalForgotCount: 0
            };
        });

        // Process Logs
        logs.forEach(log => {
            if (statsMap[log.userId]) {
                const stat = statsMap[log.userId];
                stat.logs.push(log);

                const isProvisional = !!log.note?.includes('[PROVISIONAL_FORGOT_CHECKIN]') || 
                                      !!log.note?.includes('[PROVISIONAL_LATE_ENTRY]') || 
                                      !!log.note?.includes('[PROVISIONAL_WFH]') || 
                                      !!log.note?.includes('[PROVISIONAL_ONSITE]') ||
                                      !!log.note?.includes('[PROVISIONAL_CHECKOUT]') ||
                                      !!log.note?.includes('[PROVISIONAL_GPS_SPOOF_APPEAL]') ||
                                      !!log.note?.includes('[GPS_SPOOF_APPEAL_PENDING]') ||
                                      !!log.note?.includes('[FORGOT_BOTH_PENDING]') ||
                                      !!log.note?.includes('[APPEAL_PENDING]');
                if (isProvisional) {
                    stat.provisionalForgotCount = (stat.provisionalForgotCount || 0) + 1;
                    stat.hasProvisionalForgot = true;
                }

                const isGpsRejected = !!log.note?.includes('[REJECTED GPS_SPOOF_APPEAL]') || 
                                      !!log.note?.includes('[REJECTED_GPS_SPOOF_APPEAL]');

                if (log.status === 'LEAVE' || log.workType === 'LEAVE') {
                    const parsed = parseReason(log.note || '');
                    const isHalfDay = parsed.isHalfDay || leaveRequests?.some(req => {
                        if (req.userId !== log.userId || req.status !== 'APPROVED') return false;
                        const registryItem = getRegistryItem(req.leaveType);
                        if (registryItem?.category !== 'LEAVE') return false;
                        const reqStart = format(new Date(req.startDate), 'yyyy-MM-dd');
                        const reqEnd = format(new Date(req.endDate), 'yyyy-MM-dd');
                        return log.date >= reqStart && log.date <= reqEnd && (req.isHalfDay || req.is_half_day);
                    });
                    
                    if (isHalfDay) {
                        stat.leaves += 0.5;
                    } else {
                        stat.leaves += 1.0;
                    }
                } else if (log.status === 'ABSENT' || log.workType === 'ABSENT') {
                    stat.absent++;
                } else {
                    const isApprovedHalfDayLeave = leaveRequests?.some(req => {
                        if (req.userId !== log.userId || req.status !== 'APPROVED') return false;
                        const registryItem = getRegistryItem(req.leaveType);
                        if (registryItem?.category !== 'LEAVE') return false;
                        const reqStart = format(new Date(req.startDate), 'yyyy-MM-dd');
                        const reqEnd = format(new Date(req.endDate), 'yyyy-MM-dd');
                        return log.date >= reqStart && log.date <= reqEnd && (req.isHalfDay || req.is_half_day);
                    });

                    if (!isProvisional && !isGpsRejected) {
                        if (isApprovedHalfDayLeave) {
                            stat.leaves += 0.5;
                        }
                    }

                    const summary = getAttendanceSummary(
                        log.checkInTime,
                        log.checkOutTime,
                        { startTime, buffer: lateBuffer, minHours: 9, note: log.note, multipleShifts }
                    );

                    if (summary.isLate) {
                        stat.late++;
                    }
                    const lateMins = getLateMinutes(log.checkInTime, startTime, lateBuffer, log.note, multipleShifts);
                    stat.totalLateMinutes = (stat.totalLateMinutes || 0) + lateMins;
                    stat.totalHours += summary.workHours;
                }
            }
        });

        // Calculate Absents and un-logged Approved Leaves
        Object.values(statsMap).forEach(stat => {
            const user = users.find(u => u.id === stat.userId);
            const userStartDate = user?.startDate ? new Date(user.startDate) : (user?.createdAt ? new Date(user.createdAt) : null);

            // Map of logs by date
            const logByDateMap = new Map(stat.logs.map(l => [l.date, l]));

            stat.present = 0;

            workingDaysInMonth.forEach(day => {
                if (userStartDate) {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const startStr = format(userStartDate, 'yyyy-MM-dd');
                    if (dayStr < startStr) {
                        return;
                    }
                }
                // Check if this day is in the future
                const isFutureDay = (day.getFullYear() > today.getFullYear()) ||
                                    (day.getFullYear() === today.getFullYear() && day.getMonth() > today.getMonth()) ||
                                    (day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth() && day.getDate() > today.getDate());
                if (isFutureDay) return;

                const isToday = day.getDate() === today.getDate() &&
                                day.getMonth() === today.getMonth() &&
                                day.getFullYear() === today.getFullYear();

                if (isToday) {
                    let targetStartTime = startTime; 

                    if (multipleShifts.enabled && multipleShifts.shiftsList) {
                        const shifts = multipleShifts.shiftsList
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean);
                        
                        if (shifts.length > 0) {
                            shifts.sort();
                            targetStartTime = shifts[shifts.length - 1];
                        }
                    }

                    let [startHour, startMin] = [10, 0];
                    if (targetStartTime && targetStartTime.includes(':')) {
                        const parts = targetStartTime.split(':');
                        startHour = parseInt(parts[0], 10) || 10;
                        startMin = parseInt(parts[1], 10) || 0;
                    }
                    const currentHour = today.getHours();
                    const currentMin = today.getMinutes();

                    if (currentHour < startHour || (currentHour === startHour && currentMin < startMin)) {
                        return;
                    }
                }
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const log = logByDateMap.get(dateStr);
                
                // Check if there is an approved leave request on this date
                const matchingLeaveReq = leaveRequests?.find(req => {
                    if (req.userId !== stat.userId || req.status !== 'APPROVED') return false;
                    const registryItem = getRegistryItem(req.leaveType);
                    if (registryItem?.category !== 'LEAVE') return false;
                    const reqStart = format(new Date(req.startDate), 'yyyy-MM-dd');
                    const reqEnd = format(new Date(req.endDate), 'yyyy-MM-dd');
                    return dateStr >= reqStart && dateStr <= reqEnd;
                });

                if (log && log.checkInTime) {
                    const isLeave = log.status === 'LEAVE' || log.workType === 'LEAVE';
                    const hasLeaveNote = log.note && (
                        (log.note.includes('LEAVE') && !log.note.includes('EARLY_LEAVE')) || 
                        log.note.includes('SICK') || 
                        log.note.includes('VACATION') || 
                        log.note.includes('PERSONAL') || 
                        log.note.includes('EMERGENCY') || 
                        log.note.includes('UNPAID')
                    );
                    if (isLeave || hasLeaveNote) {
                        stat.present += 0.5;
                    } else {
                        stat.present += 1.0;
                    }
                }

                if (!log) {
                    // No attendance log exists for this working day
                    if (matchingLeaveReq) {
                        const isHalf = Boolean(matchingLeaveReq.isHalfDay || matchingLeaveReq.is_half_day === true || matchingLeaveReq.is_half_day === 'true');
                        if (isHalf) {
                            stat.leaves += 0.5;
                            stat.absent += 0.5;
                        } else {
                            stat.leaves += 1.0;
                        }
                    } else {
                        stat.absent += 1.0;
                    }
                } else if (log.status === 'LEAVE' || log.workType === 'LEAVE') {
                    // Log exists with LEAVE status
                    const parsed = parseReason(log.note || '');
                    const isHalf = parsed.isHalfDay || Boolean(matchingLeaveReq?.isHalfDay || matchingLeaveReq?.is_half_day === true || matchingLeaveReq?.is_half_day === 'true');
                    if (isHalf && !log.checkInTime) {
                        // Took half day leave and did not check in for remaining half
                        stat.absent += 0.5;
                    }
                }
            });
        });

        // Calculate approved Overtime for each user in the selected month/range
        const activeOtRequests = otRequests.filter(req => {
            if (req.status !== 'APPROVED') return false;
            const reqDate = new Date(req.date);
            const start = dateFilterMode === 'MONTH' ? startOfMonth(currentMonth) : customStartDate;
            const end = dateFilterMode === 'MONTH' ? endOfMonth(currentMonth) : customEndDate;
            return reqDate >= start && reqDate <= end;
        });

        Object.values(statsMap).forEach(stat => {
            const userOt = activeOtRequests.filter(req => req.userId === stat.userId);
            const hourlyOt = userOt.filter(req => !req.isFixed && (!req.reason || !req.reason.includes('[OT:FIXED]')));
            const fixedOt = userOt.filter(req => req.isFixed || (req.reason && req.reason.includes('[OT:FIXED]')));

            stat.totalOtHours = hourlyOt.reduce((sum, req) => sum + req.durationHours, 0);
            stat.totalFixedOtDays = fixedOt.length;
            stat.totalOtPayout = userOt.reduce((sum, req) => sum + req.computedPayout, 0);
        });

        return Object.values(statsMap);
    }, [users, logs, startTime, lateBuffer, workingDaysInMonth, otRequests, leaveRequests, currentMonth, dateFilterMode, customStartDate, customEndDate, multipleShifts, shouldHideAdmins]);

    // Index users by ID for O(1) lookups
    const userMap = useMemo(() => {
        return new Map(users.map(u => [u.id, u]));
    }, [users]);

    // Compute unique positions from active users
    const positions = useMemo(() => {
        const unique = new Set(
            users
                .filter(u => u.isActive && u.position && !(shouldHideAdmins && u.role === 'ADMIN'))
                .map(u => u.position)
        );
        return Array.from(unique).sort();
    }, [users, shouldHideAdmins]);

    // Aggregates
    const totalCheckins = useMemo(() => {
        return logs.filter(l => l.checkInTime !== null && l.status !== 'ABSENT').length;
    }, [logs]);

    const totalLeaves = useMemo(() => {
        return userStats.reduce((sum, s) => sum + s.leaves, 0);
    }, [userStats]);

    const totalLates = useMemo(() => {
        return userStats.reduce((sum, s) => sum + s.late, 0);
    }, [userStats]);

    const totalAbsents = useMemo(() => {
        return userStats.reduce((sum, s) => sum + s.absent, 0);
    }, [userStats]);

    const lateRate = useMemo(() => {
        return totalCheckins > 0 ? Math.round((totalLates / totalCheckins) * 100) : 0;
    }, [totalCheckins, totalLates]);

    // Grading Function
    const getGrade = (stat: UserStat): GradeInfo => {
        if (stat.hasProvisionalForgot) {
            return { grade: '⏳ WAIT', color: 'bg-amber-50 text-amber-700 border border-amber-200/40 animate-pulse' };
        }
        if (stat.present === 0 && stat.leaves === 0) return { grade: 'N/A', color: 'bg-gray-100 text-gray-400' };

        // Use Dynamic Rules from Config if available
        const rules = config?.ATTENDANCE_GRADING_RULES || [
             { grade: "A+", max_late: 0, color: "bg-green-100 text-green-700" },
             { grade: "B", max_late: 2, color: "bg-blue-100 text-blue-700" },
             { grade: "C", max_late: 4, color: "bg-yellow-100 text-yellow-700" },
             { grade: "F", max_late: 999, color: "bg-red-100 text-red-700" }
        ];

        // Sort rules by strictness (lowest max_late first)
        const sortedRules = [...rules].sort((a: any, b: any) => a.max_late - b.max_late);

        for (const rule of sortedRules) {
            if (stat.late <= rule.max_late) {
                return { grade: rule.grade, color: rule.color };
            }
        }
        
        // Fallback
        return { grade: 'F', color: 'bg-red-100 text-red-700' };
    };

    return {
        startTime,
        lateBuffer,
        multipleShifts,
        workingDaysInMonth,
        monthDays,
        userStats,
        userMap,
        positions,
        aggregates: {
            totalCheckins,
            totalLeaves,
            totalLates,
            totalAbsents,
            lateRate
        },
        getGrade,
        getEffectiveDayStatus
    };
};
