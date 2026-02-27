
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LeaveType } from '../../../../types/attendance';

interface UseLeaveFormLogicProps {
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    onClose: () => void;
    initialDate?: Date;
    initialReason?: string;
    selectedType?: string;
}

import { compressImage } from '../../../../lib/imageUtils';

export const useLeaveFormLogic = ({ onSubmit, onClose, initialDate, initialReason, selectedType }: UseLeaveFormLogicProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState(initialReason || ''); // Use initialReason
    const [file, setFile] = useState<File | null>(null);
    const [targetTime, setTargetTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00'); // New state for FORGOT_BOTH
    const [otHours, setOtHours] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialDateStr = initialDate ? format(initialDate, 'yyyy-MM-dd') : '';

    useEffect(() => {
        const d = initialDateStr || format(new Date(), 'yyyy-MM-dd');
        setStartDate(d);
        setEndDate(d);
        setReason(initialReason || '');
        setFile(null);
        
        // Set sensible defaults based on type
        if (selectedType === 'FORGOT_CHECKOUT') {
            setTargetTime('18:00');
        } else if (selectedType === 'FORGOT_CHECKIN' || selectedType === 'LATE_ENTRY') {
            setTargetTime('09:00');
        } else if (selectedType === 'FORGOT_BOTH') {
            setTargetTime('09:00');
            setEndTime('18:00');
        } else {
            setTargetTime('09:00');
        }
        
        setOtHours(2);
    }, [initialDateStr, initialReason, selectedType]);

    const handleSubmit = async (selectedType: string) => {
        if (!selectedType) return;
        
        if (!reason.trim()) {
            alert('กรุณาระบุเหตุผลด้วยครับ');
            return;
        }

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

        if (['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT', 'FORGOT_BOTH'].includes(selectedType)) {
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
            finalReason = `[OT:${otHours}hr] ${reason}`;
            finalEndDate = finalStartDate;
        }

        const success = await onSubmit(
            selectedType as LeaveType,
            finalStartDate,
            finalEndDate,
            finalReason,
            finalFile || undefined
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
        isSubmitting,
        handleSubmit
    };
};
