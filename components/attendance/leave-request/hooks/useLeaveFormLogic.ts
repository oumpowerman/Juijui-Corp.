
import { useState, useEffect } from 'react';
import { format, startOfDay, isBefore } from 'date-fns';
import { LeaveType } from '../../../../types/attendance';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';

interface UseLeaveFormLogicProps {
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File, linkedRemoteType?: 'WFH' | 'ONSITE') => Promise<boolean>;
    onClose: () => void;
    initialDate?: Date;
    initialReason?: string;
    selectedType?: string;
    advanceDays?: number;
    maxFutureDays?: number;
    maxPastDays?: number;
    linkedRemoteType?: 'WFH' | 'ONSITE';
}

import { compressImage } from '../../../../lib/imageUtils';

export const useLeaveFormLogic = ({ 
    onSubmit, onClose, initialDate, initialReason, selectedType, 
    advanceDays, maxFutureDays, maxPastDays, linkedRemoteType
}: UseLeaveFormLogicProps) => {
    const { showAlert } = useGlobalDialog();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState(initialReason || ''); // Use initialReason
    const [file, setFile] = useState<File | null>(null);
    const [targetTime, setTargetTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00'); // New state for FORGOT_BOTH
    const [otHours, setOtHours] = useState(2);
    const [otType, setOtType] = useState<'HOURLY' | 'FIXED'>('HOURLY');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

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
            d = format(minAllowed, 'yyyy-MM-dd');
        } else {
            // If initial date is before the minimum allowed date, adjust it to the min allowed date for better UX
            const parsedInitial = new Date(d);
            parsedInitial.setHours(0, 0, 0, 0);
            if (parsedInitial < minAllowed) {
                d = format(minAllowed, 'yyyy-MM-dd');
            }
        }

        if (item?.rules.forceTodayDate) {
            d = format(new Date(), 'yyyy-MM-dd');
        }
        setStartDate(d);
        setEndDate(d);
        setReason(initialReason || '');
        setFile(null);
        setIsReviewing(false);
        setOtType('HOURLY');
        
        // Set sensible defaults based on the central registry configuration
        setTargetTime(item?.rules.defaultTargetTime || '09:00');
        setEndTime(item?.rules.defaultEndTime || '18:00');
        
        setOtHours(2);
    }, [initialDateStr, initialReason, selectedType, advanceDays]);

    // Automatically sync endDate with startDate for single-day/time-specific requests
    useEffect(() => {
        const item = selectedType ? getRegistryItem(selectedType) : undefined;
        if (item && (item.rules.isSingleDay || item.rules.isTimeSpecific)) {
            setEndDate(startDate);
        }
    }, [startDate, selectedType]);

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

        if (!reason.trim()) {
            showAlert('กรุณาระบุเหตุผลด้วยครับ', 'ข้อมูลไม่ครบ');
            return;
        }
        setIsReviewing(true);
    };

    const handleSubmit = async (selectedType: string) => {
        if (!selectedType) return;
        
        setIsSubmitting(true);

        let finalFile = file;
        if (file && file.type.startsWith('image/')) {
            try {
                finalFile = await compressImage(file);
            } catch (err) {
                console.error('Compression failed', err);
            }
        }

        let finalStartDate = new Date(startDate);
        let finalEndDate = new Date(endDate);
        let finalReason = reason;

        const item = getRegistryItem(selectedType);
        if (item && item.rules.isTimeSpecific && selectedType !== 'OVERTIME') {
            // Combine date and time correctly to avoid midnight issue
            const [year, month, day] = startDate.split('-').map(Number);
            const [hours, minutes] = targetTime.split(':').map(Number);
            finalStartDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
            
            if (selectedType === 'FORGOT_BOTH') {
                finalReason = `[TIME:${targetTime}-${endTime}] ${reason}`;
                const [endH, endM] = endTime.split(':').map(Number);
                finalEndDate = new Date(year, month - 1, day, endH, endM, 0, 0);
            } else {
                finalReason = `[TIME:${targetTime}] ${reason}`;
                finalEndDate = finalStartDate; 
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
            finalFile || undefined,
            linkedRemoteType
        );

        setIsSubmitting(false);
        if (success) onClose();
    };

    return {
        startDate, setStartDate,
        endDate, setEndDate,
        reason, setReason,
        file, setFile,
        targetTime, setTargetTime,
        endTime, setEndTime,
        otHours, setOtHours,
        otType, setOtType,
        isSubmitting,
        isReviewing,
        setIsReviewing,
        handleReview,
        handleSubmit
    };
};
