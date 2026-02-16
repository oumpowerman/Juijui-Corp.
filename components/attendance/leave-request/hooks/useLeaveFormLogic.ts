
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LeaveType } from '../../../types/attendance';

interface UseLeaveFormLogicProps {
    onSubmit: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>;
    onClose: () => void;
    initialDate?: Date;
}

export const useLeaveFormLogic = ({ onSubmit, onClose, initialDate }: UseLeaveFormLogicProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [targetTime, setTargetTime] = useState('09:00');
    const [otHours, setOtHours] = useState(2);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const d = initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        setStartDate(d);
        setEndDate(d);
        setReason('');
        setFile(null);
        setTargetTime('18:00');
        setOtHours(2);
    }, [initialDate]);

    const handleSubmit = async (selectedType: string) => {
        if (!selectedType) return;
        
        if (!reason.trim()) {
            alert('กรุณาระบุเหตุผลด้วยครับ');
            return;
        }

        setIsSubmitting(true);

        let finalReason = reason;
        let finalEndDate = endDate;

        if (['LATE_ENTRY', 'FORGOT_CHECKIN', 'FORGOT_CHECKOUT'].includes(selectedType)) {
            finalReason = `[TIME:${targetTime}] ${reason}`;
            finalEndDate = startDate; 
        } else if (selectedType === 'OVERTIME') {
            finalReason = `[OT:${otHours}hr] ${reason}`;
            finalEndDate = startDate;
        }

        const success = await onSubmit(
            selectedType as LeaveType,
            new Date(startDate),
            new Date(finalEndDate),
            finalReason,
            file || undefined
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
        otHours, setOtHours,
        isSubmitting,
        handleSubmit
    };
};
