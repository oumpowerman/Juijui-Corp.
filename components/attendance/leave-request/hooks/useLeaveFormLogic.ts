
import { useState, useEffect, useMemo } from 'react';
import { format, startOfDay, isBefore } from 'date-fns';
import { LeaveType } from '../../../../types/attendance';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useUserSession } from '../../../../context/UserSessionContext';
import { calculateShiftAndActualTime, formatCorrectionNote, calculateRequiredCheckOutTime, isValidCheckOutTime, getHalfDayOffset, calculatePMShiftDetails, timeToMinutes } from '../../../../utils/shiftCalculator';
import { compressImage } from '../../../../lib/imageUtils';

interface UseLeaveFormLogicProps {
    onSubmit: (
        type: LeaveType, 
        start: Date, 
        end: Date, 
        reason: string, 
        files?: File[], 
        linkedRemoteType?: 'WFH' | 'ONSITE',
        isHalfDay?: boolean,
        halfDaySession?: string,
        isInstantCheckIn?: boolean
    ) => Promise<boolean>;
    onClose: () => void;
    initialDate?: Date;
    initialReason?: string;
    initialTargetTime?: string;
    selectedType?: string;
    advanceDays?: number;
    maxFutureDays?: number;
    maxPastDays?: number;
    linkedRemoteType?: 'WFH' | 'ONSITE';
    isInstantCheckIn?: boolean;
}

export const useLeaveFormLogic = ({ 
    onSubmit, onClose, initialDate, initialReason, initialTargetTime, selectedType, 
    advanceDays, maxFutureDays, maxPastDays, linkedRemoteType, isInstantCheckIn
}: UseLeaveFormLogicProps) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions } = useMasterData();
    const { attendanceLogs, leaveRequests = [] } = useUserSession();

    const shiftsEnabledOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_ENABLED');
    const shiftsListOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'MULTIPLE_SHIFTS_LIST');
    const isShiftsEnabled = shiftsEnabledOpt ? shiftsEnabledOpt.label === 'true' : true;
    const shiftsList = useMemo(() => {
        if (shiftsListOpt?.label) {
            return shiftsListOpt.label.split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['08:00', '08:30', '09:00'];
    }, [shiftsListOpt]);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState(initialReason || ''); // Use initialReason
    const [files, setFiles] = useState<File[]>([]);
    const [targetTime, setTargetTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00'); // New state for FORGOT_BOTH
    const [otHours, setOtHours] = useState(2);
    const [otType, setOtType] = useState<'HOURLY' | 'FIXED'>('HOURLY');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [isHalfDay, setIsHalfDay] = useState(false);
    const [halfDaySession, setHalfDaySession] = useState<'AM' | 'PM'>('AM');

    const hasAMHalfDayLeave = useMemo(() => {
        if (!leaveRequests || !startDate) return false;
        return leaveRequests.some((r: any) => {
            const rDate = r.startDate ? format(new Date(r.startDate), 'yyyy-MM-dd') : '';
            const isApproved = r.status === 'APPROVED';
            const isHalf = r.isHalfDay === true || r.is_half_day === true || r.isHalfDay === 'true' || r.is_half_day === 'true';
            const isAM = r.halfDaySession === 'AM' || r.half_day_session === 'AM';
            return rDate === startDate && isApproved && isHalf && isAM;
        });
    }, [leaveRequests, startDate]);

    useEffect(() => {
        if (startDate && endDate && startDate !== endDate) {
            setIsHalfDay(false);
        }
    }, [startDate, endDate]);

    const initialDateStr = initialDate ? format(initialDate, 'yyyy-MM-dd') : '';

    useEffect(() => {
        const item = selectedType ? getRegistryItem(selectedType) : undefined;
        let d = initialDateStr;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minAllowed = new Date(today);
        if (advanceDays && advanceDays > 0) {
            minAllowed.setDate(today.getDate() + advanceDays);
        }

        if (!d) {
            // No initial date, default to today + advanceDays (or today)
            if (selectedType === 'FORGOT_BOTH') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                d = format(yesterday, 'yyyy-MM-dd');
            } else if (item?.rules.forceTodayDate) {
                d = format(new Date(), 'yyyy-MM-dd');
            } else {
                d = format(minAllowed, 'yyyy-MM-dd');
            }
        } else {
            // If initial date is provided (e.g. from past log correction or resubmit),
            // preserve it for CORRECTION category or when initialDate is explicitly passed.
            const isCorrection = item?.category === 'CORRECTION';
            if (!isCorrection && !item?.rules.forceTodayDate && advanceDays && advanceDays > 0) {
                const parsedInitial = new Date(d);
                parsedInitial.setHours(0, 0, 0, 0);
                if (parsedInitial < minAllowed) {
                    d = format(minAllowed, 'yyyy-MM-dd');
                }
            }
        }
        setStartDate(d);
        setEndDate(d);
        setReason(initialReason || '');
        setFiles([]);
        setIsReviewing(false);
        setOtType('HOURLY');
        
        // Set sensible defaults based on the central registry configuration
        if (selectedType === 'LATE_ENTRY') {
            const now = new Date();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            setTargetTime(`${currentHours}:${currentMinutes}`);
        } else {
            setTargetTime(initialTargetTime || item?.rules.defaultTargetTime || '09:00');
        }
        setEndTime(item?.rules.defaultEndTime || '18:00');
        
        setOtHours(2);
    }, [initialDateStr, initialReason, selectedType, advanceDays, initialTargetTime]);

    // Automatically sync endDate with startDate for single-day/time-specific requests
    useEffect(() => {
        const item = selectedType ? getRegistryItem(selectedType) : undefined;
        if (item && (item.rules.isSingleDay || item.rules.isTimeSpecific)) {
            setEndDate(startDate);
        }
    }, [startDate, selectedType]);

    // Sync earliest required checkout time when selectedType is FORGOT_CHECKOUT
    useEffect(() => {
        if (isShiftsEnabled && selectedType === 'FORGOT_CHECKOUT' && startDate) {
            const log = attendanceLogs?.find(l => l.date === startDate);
            if (log?.checkInTime) {
                const checkInDate = new Date(log.checkInTime);
                const checkInStr = format(checkInDate, 'HH:mm');
                const minHours = parseFloat(masterOptions?.find(o => o.key === 'MIN_HOURS')?.label || '9');
                const requiredCheckOut = calculateRequiredCheckOutTime(checkInStr, minHours);
                setTargetTime(requiredCheckOut);
            }
        }
    }, [startDate, selectedType, isShiftsEnabled, attendanceLogs, masterOptions]);

    // Sync earliest required checkout time when selectedType is FORGOT_BOTH
    useEffect(() => {
        if (isShiftsEnabled && selectedType === 'FORGOT_BOTH' && targetTime) {
            const minHours = parseFloat(masterOptions?.find(o => o.key === 'MIN_HOURS')?.label || '9');
            const requiredCheckOut = calculateRequiredCheckOutTime(targetTime, minHours);
            setEndTime(requiredCheckOut);
        }
    }, [targetTime, selectedType, isShiftsEnabled, masterOptions]);

    const handleReview = () => {
        if (!startDate || !endDate) {
            showAlert('กรุณาระบุวันที่ให้ครบถ้วนครับ', 'ข้อมูลไม่ครบ');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            showAlert('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุดครับ', 'วันที่ไม่ถูกต้อง');
            return;
        }

        if (advanceDays && advanceDays > 0) {
            const today = startOfDay(new Date());
            const minAllowedDate = new Date(today);
            minAllowedDate.setDate(today.getDate() + advanceDays);
            
            if (isBefore(startOfDay(start), minAllowedDate)) {
                showAlert(`ประเภทการลานี้ต้องแจ้งล่วงหน้าอย่างน้อย ${advanceDays} วัน (สามารถเลือกได้ตั้งแต่วันที่ ${format(minAllowedDate, 'd/M/yyyy')})`, 'ต้องแจ้งล่วงหน้า');
                return;
            }
        }

        if (maxFutureDays && maxFutureDays > 0) {
            const today = startOfDay(new Date());
            const maxAllowedDate = new Date(today);
            maxAllowedDate.setDate(today.getDate() + maxFutureDays);
            
            if (isBefore(maxAllowedDate, startOfDay(start))) {
                showAlert(`ประเภทการลานี้สามารถขอล่วงหน้าได้ไม่เกิน ${maxFutureDays} วัน (เลือกได้ไม่เกินวันที่ ${format(maxAllowedDate, 'd/M/yyyy')})`, 'เกินกำหนดล่วงหน้า');
                return;
            }
        }

        if (maxPastDays && maxPastDays > 0) {
            const today = startOfDay(new Date());
            const minAllowedDate = new Date(today);
            minAllowedDate.setDate(today.getDate() - maxPastDays);
            
            if (isBefore(startOfDay(start), minAllowedDate)) {
                showAlert(`ประเภทการลานี้สามารถขอลาย้อนหลังได้ไม่เกิน ${maxPastDays} วัน (เลือกได้ตั้งแต่วันที่ ${format(minAllowedDate, 'd/M/yyyy')})`, 'เกินกำหนดลาย้อนหลัง');
                return;
            }
        }

        const item = selectedType ? getRegistryItem(selectedType) : undefined;
        if (item && item.category === 'CORRECTION') {
            const today = startOfDay(new Date());
            if (isBefore(today, startOfDay(start))) {
                showAlert('ไม่สามารถทำรายการลืมลงเวลารูปแบบล่วงหน้าได้ครับ', 'วันที่ไม่ถูกต้อง');
                return;
            }
        }

        if (isShiftsEnabled) {
            const minHours = parseFloat(masterOptions?.find(o => o.key === 'MIN_HOURS')?.label || '9');
            
            if (selectedType === 'FORGOT_CHECKOUT') {
                const log = attendanceLogs?.find(l => l.date === startDate);
                if (log?.checkInTime) {
                    const checkInDate = new Date(log.checkInTime);
                    const checkInStr = format(checkInDate, 'HH:mm');
                    if (!isValidCheckOutTime(checkInStr, targetTime, minHours)) {
                        const requiredCheckOut = calculateRequiredCheckOutTime(checkInStr, minHours);
                        showAlert(
                            `เวลาออกงานต้องทำงานอย่างน้อย ${minHours} ชั่วโมงครับ (เร็วที่สุดสำหรับวันดังกล่าวคือตั้งแต่เวลา ${requiredCheckOut} น. เป็นต้นไป)`,
                            'เวลาออกงานไม่ถูกต้อง'
                        );
                        return;
                    }
                }
            } else if (selectedType === 'FORGOT_BOTH') {
                if (!isValidCheckOutTime(targetTime, endTime, minHours)) {
                    const requiredCheckOut = calculateRequiredCheckOutTime(targetTime, minHours);
                    showAlert(
                        `เวลาออกงานต้องทำงานอย่างน้อย ${minHours} ชั่วโมงจากเวลาเข้างานครับ (เร็วที่สุดคือตั้งแต่เวลา ${requiredCheckOut} น. เป็นต้นไป)`,
                        'เวลาออกงานไม่ถูกต้อง'
                    );
                    return;
                }
            }
        }

        if (!reason.trim()) {
            showAlert('กรุณาระบุเหตุผลด้วยครับ', 'ข้อมูลไม่ครบ');
            return;
        }
        setIsReviewing(true);
    };

    const handleSubmit = async (selectedType: string) => {
        if (!selectedType) return;
        
        setIsSubmitting(true);

        const finalFiles: File[] = [];
        if (files && files.length > 0) {
            for (const singleFile of files) {
                if (singleFile.type && singleFile.type.startsWith('image/')) {
                    try {
                        const compressed = await compressImage(singleFile);
                        finalFiles.push(compressed);
                    } catch (err) {
                        console.error('Compression failed', err);
                        finalFiles.push(singleFile);
                    }
                } else {
                    finalFiles.push(singleFile);
                }
            }
        }

        let finalStartDate = new Date(startDate);
        let finalEndDate = new Date(endDate);
        let finalReason = reason;

        const item = getRegistryItem(selectedType);
        if (item && item.rules.isTimeSpecific && selectedType !== 'OVERTIME') {
            const [year, month, day] = startDate.split('-').map(Number);
            const isCheckInCorrection = ['FORGOT_CHECKIN', 'FORGOT_BOTH', 'LATE_ENTRY'].includes(selectedType);

            if (isShiftsEnabled && isCheckInCorrection) {
                const minHours = parseFloat(masterOptions.find(o => o.key === 'MIN_HOURS')?.label || '9');
                let mappedShift = '';
                let actualCheckIn = '';

                if (hasAMHalfDayLeave) {
                    const pmDetails = calculatePMShiftDetails(targetTime, shiftsList, minHours);
                    mappedShift = pmDetails.matchedPMStart;
                    actualCheckIn = pmDetails.adjustedInputTime;
                } else {
                    const shiftCalc = calculateShiftAndActualTime(targetTime, shiftsList);
                    mappedShift = shiftCalc.targetShift;
                    actualCheckIn = shiftCalc.actualTime;
                }

                if (selectedType === 'LATE_ENTRY') {
                    const [targetH, targetM] = targetTime.split(':').map(Number);
                    finalStartDate = new Date(year, month - 1, day, targetH, targetM, 0, 0);
                } else {
                    const [actualH, actualM] = actualCheckIn.split(':').map(Number);
                    finalStartDate = new Date(year, month - 1, day, actualH, actualM, 0, 0);
                }

                if (selectedType === 'FORGOT_BOTH') {
                    finalReason = formatCorrectionNote(mappedShift, actualCheckIn, reason, endTime);
                    const [endH, endM] = endTime.split(':').map(Number);
                    finalEndDate = new Date(year, month - 1, day, endH, endM, 0, 0);
                } else {
                    finalReason = formatCorrectionNote(mappedShift, actualCheckIn, reason);
                    finalEndDate = finalStartDate;
                }
            } else {
                const [hours, minutes] = targetTime.split(':').map(Number);
                finalStartDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
                
                let targetShiftTime = targetTime;
                if (hasAMHalfDayLeave) {
                    const minHours = parseFloat(masterOptions.find(o => o.key === 'MIN_HOURS')?.label || '9');
                    const startTimeStr = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
                    const offset = getHalfDayOffset(minHours);
                    const startMins = timeToMinutes(startTimeStr);
                    const pmMins = (startMins + offset * 60) % 1440;
                    const pmH = Math.floor(pmMins / 60);
                    const pmM = pmMins % 60;
                    targetShiftTime = `${pmH.toString().padStart(2, '0')}:${pmM.toString().padStart(2, '0')}`;
                }
                
                if (selectedType === 'FORGOT_BOTH') {
                    finalReason = `[TARGET_SHIFT:${targetShiftTime}] [TIME:${targetTime}-${endTime}] ${reason}`;
                    const [endH, endM] = endTime.split(':').map(Number);
                    finalEndDate = new Date(year, month - 1, day, endH, endM, 0, 0);
                } else {
                    finalReason = `[TARGET_SHIFT:${targetShiftTime}] [TIME:${targetTime}] ${reason}`;
                    finalEndDate = finalStartDate; 
                }
            }
        } else if (selectedType === 'OVERTIME') {
            if (otType === 'FIXED') {
                finalReason = `[OT:FIXED] [OT:00:00-00:00] (0hr) ${reason}`;
            } else {
                finalReason = `[OT:${targetTime}-${endTime}] (${otHours}hr) ${reason}`;
            }
            finalEndDate = finalStartDate;
        }

        const success = await onSubmit(
            selectedType as LeaveType,
            finalStartDate,
            finalEndDate,
            finalReason,
            finalFiles.length > 0 ? finalFiles : undefined,
            linkedRemoteType,
            isHalfDay,
            halfDaySession,
            isInstantCheckIn
        );

        setIsSubmitting(false);
        if (success) onClose();
    };

    return {
        startDate, setStartDate,
        endDate, setEndDate,
        reason, setReason,
        files, setFiles,
        targetTime, setTargetTime,
        endTime, setEndTime,
        otHours, setOtHours,
        otType, setOtType,
        isSubmitting,
        isReviewing,
        setIsReviewing,
        isHalfDay,
        setIsHalfDay,
        halfDaySession,
        setHalfDaySession,
        handleReview,
        handleSubmit
    };
};
