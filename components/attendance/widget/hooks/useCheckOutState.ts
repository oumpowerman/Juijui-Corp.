import { useState, useEffect, useRef, useMemo } from 'react';
import { LocationDef } from '../../../../types/attendance';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { useCheckInLocation } from '../../../../hooks/attendance/useCheckInLocation';
import { calculateCheckOutStatus } from '../../../../lib/attendanceUtils';
import { format } from 'date-fns';
import { compressImage } from '../../../../lib/imageUtils';
import { googleDriveService } from '../../../../services/googleDriveService';
import { supabase } from '../../../../lib/supabase';

interface UseCheckOutStateProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>;
    onRequest: (time: string, reason: string) => Promise<boolean>;
    availableLocations: LocationDef[];
    checkInTime: Date;
    onOvertimeSubmit?: (otMinutes: number, reason: string) => Promise<boolean>;
    workType?: string;
}

export const useCheckOutState = ({
    isOpen,
    onClose,
    onConfirm,
    onRequest,
    availableLocations,
    checkInTime,
    onOvertimeSubmit,
    workType = 'OFFICE',
}: UseCheckOutStateProps) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions } = useMasterData();
    const { config } = useGameConfig();

    // Dynamically retrieve early leave interval and rate from Game Config, Master Options, or safe fallbacks
    const earlyLeaveInterval = parseFloat(
        config?.PENALTY_RATES?.HP_PENALTY_EARLY_LEAVE_INTERVAL?.toString() || 
        masterOptions.find(o => o.key === 'HP_PENALTY_EARLY_LEAVE_INTERVAL')?.label || 
        '10'
    );
    const earlyLeaveRate = parseFloat(
        config?.PENALTY_RATES?.HP_PENALTY_EARLY_LEAVE_RATE?.toString() || 
        masterOptions.find(o => o.key === 'HP_PENALTY_EARLY_LEAVE_RATE')?.label || 
        '1'
    );
    
    // Geolocation and anti-spoof checks hook
    const {
        locationState,
        isGpsSecure,
        gpsThreatReason,
        checkLocation: runCheckLocation,
    } = useCheckInLocation(availableLocations);

    // Derive status based on locationState (WFH and SITE bypass GPS check)
    const status: 'LOADING' | 'ERROR' | 'SUCCESS' | 'OUT_OF_RANGE' = (workType === 'WFH' || workType === 'SITE')
        ? 'SUCCESS'
        : locationState.status === 'LOADING'
        ? 'LOADING'
        : locationState.status === 'ERROR'
        ? 'ERROR'
        : locationState.matchedLocation
        ? 'SUCCESS'
        : 'OUT_OF_RANGE';

    const distance = locationState.distance ?? 0;
    const matchedLocation = locationState.matchedLocation;
    const currentLat = locationState.lat;
    const currentLng = locationState.lng;
    
    // Status Logic State
    const [checkOutStatus, setCheckOutStatus] = useState<'COMPLETED' | 'EARLY_LEAVE'>('COMPLETED');
    const [statusDetails, setStatusDetails] = useState<any>(null);

    // Overtime Flow State
    const [otFlowStep, setOtFlowStep] = useState<'NONE' | 'PROMPT' | 'REASON' | 'FORGET_TIME'>('NONE');
    const [otReason, setOtReason] = useState('');
    const [otStartTime, setOtStartTime] = useState('');
    const [otEndTime, setOtEndTime] = useState('');
    const [activeOtTimePicker, setActiveOtTimePicker] = useState<'START' | 'END' | 'FORGET' | null>(null);
    const [forgetCheckOutTime, setForgetCheckOutTime] = useState('18:00');

    // Form for Request / Early Leave
    const [earlyLeaveStep, setEarlyLeaveStep] = useState<'CHOOSE' | 'FORM'>('CHOOSE');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [earlyReason, setEarlyReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [showEarlyConfirmation, setShowEarlyConfirmation] = useState(false);
    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string } | null>(null);

    // Photo upload states
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const checkDriveStatus = async () => {
        try {
            const connected = await googleDriveService.getStatus();
            setIsDriveConnected(connected);
        } catch (err) {
            console.error('Failed to check Google Drive connection:', err);
            setIsDriveConnected(false);
        }
    };

    const handleConnectDrive = async () => {
        try {
            const authUrl = await googleDriveService.getAuthUrl();
            if (!authUrl) {
                showAlert('ไม่สามารถสร้างลิงก์เชื่อมต่อ Google Drive ได้', 'เกิดข้อผิดพลาด');
                return;
            }
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;
            
            const authWindow = window.open(
                authUrl,
                'google_auth_popup',
                `width=${width},height=${height},left=${left},top=${top}`
            );

            // Listen for success message from popup
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                    setIsDriveConnected(true);
                    showAlert('เชื่อมต่อ Google Drive สำเร็จแล้วครับ 🎉', 'เชื่อมต่อสำเร็จ');
                    window.removeEventListener('message', handleMessage);
                }
            };
            window.addEventListener('message', handleMessage);
        } catch (e) {
            console.error('Failed to initiate Google Auth connection:', e);
            showAlert('เกิดข้อผิดพลาดในการเชื่อมต่อกับ Google Drive', 'เกิดข้อผิดพลาด');
        }
    };

    // Calculate real-time projected OT hours and JP rewards based on custom selected start & end times
    const otDetails = useMemo(() => {
        const start = otStartTime || (statusDetails?.requiredEndTime ? format(statusDetails.requiredEndTime, 'HH:mm') : '18:00');
        const end = otEndTime || format(new Date(), 'HH:mm');
        
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        
        let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        if (minutes < 0) {
            minutes += 24 * 60; // handle cross-day OT
        }
        
        const hours = (minutes / 60).toFixed(1);
        const calculatedJP = Math.round((minutes / 60) * 10); // Base rate 10 JP per hour
        return { minutes, hours, calculatedJP };
    }, [otStartTime, otEndTime, statusDetails]);

    const checkLocation = () => {
        runCheckLocation(
            () => {},
            () => {}
        );
    };

    useEffect(() => {
        if (isOpen) {
            checkLocation();
            setEarlyLeaveStep('CHOOSE');
            setTime(format(new Date(), 'HH:mm'));
            setReason('');
            setEarlyReason('');
            setOtFlowStep('NONE');
            setOtReason('');
            setShowEarlyConfirmation(false);
            
            // Reset photo states
            setSelectedImageFile(null);
            setImagePreviewUrl('');
            setIsUploading(false);
            checkDriveStatus();
            
            // Calculate Status Logic (Strict Duration)
            const minHours = parseFloat(masterOptions.find(o => o.key === 'MIN_HOURS')?.label || '9');
            
            const result = calculateCheckOutStatus(checkInTime, new Date(), minHours);
            setCheckOutStatus(result.status);
            setStatusDetails(result);

            // Initialize custom OT start & end times
            if (result && result.requiredEndTime) {
                setOtStartTime(format(result.requiredEndTime, 'HH:mm'));
            } else {
                setOtStartTime('18:00');
            }
            setOtEndTime(format(new Date(), 'HH:mm'));
            setForgetCheckOutTime(format(new Date(), 'HH:mm'));
        }
    }, [isOpen]);

    const handleNormalSubmit = async () => {
        if (!isGpsSecure) {
            showAlert(`ระบบตรวจพบการพยายามใช้แอปสวมสิทธิ์พิกัดปลอมหรือจำลอง GPS: ${gpsThreatReason || 'กรุณาปิดเครื่องมือจำลองพิกัดก่อน'}`, 'ไม่สามารถลงเวลาได้');
            return;
        }

        if (checkOutStatus === 'EARLY_LEAVE') {
            if (!earlyReason.trim()) {
                setWarningModal({ isOpen: true, message: 'กรุณาระบุเหตุผลที่กลับก่อนเวลาด้วยครับ' });
                return;
            }
            if (!showEarlyConfirmation) {
                setShowEarlyConfirmation(true);
                return;
            }
        }

        // Overtime check logic
        if (checkOutStatus === 'COMPLETED' && otFlowStep === 'NONE') {
            const otThresholdOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OT_THRESHOLD_HOURS');
            const otThreshold = parseFloat(otThresholdOpt?.label || '2');
            
            // thresholdEndTime = requiredEndTime + otThreshold (hours)
            if (statusDetails && statusDetails.requiredEndTime) {
                const thresholdEndTime = new Date(statusDetails.requiredEndTime.getTime() + otThreshold * 60 * 60 * 1000);
                if (new Date() > thresholdEndTime) {
                    setOtFlowStep('PROMPT');
                    return;
                }
            }
        }
        
        setIsSubmitting(true);
        let finalReason = earlyReason;

        if (checkOutStatus === 'EARLY_LEAVE' && selectedImageFile) {
            setIsUploading(true);
            try {
                const compressed = await compressImage(selectedImageFile, 1200, 0.7);
                let uploadUrl = '';

                // Try Google Drive if connected
                if (isDriveConnected) {
                    try {
                        const result = await googleDriveService.uploadFile(compressed);
                        if (result?.url) {
                            uploadUrl = result.url;
                        }
                    } catch (driveErr) {
                        console.warn('Failed to upload to Google Drive, falling back to Supabase...', driveErr);
                    }
                }

                // Fallback to Supabase Storage
                if (!uploadUrl) {
                    const fileExt = compressed.name.split('.').pop() || 'jpg';
                    const fileName = `checkout_early_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                    const filePath = `proofs/${fileName}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('chat-files')
                        .upload(filePath, compressed);
                    
                    if (uploadError) {
                        throw uploadError;
                    }
                    
                    const { data: urlData } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(filePath);
                    
                    if (urlData?.publicUrl) {
                        uploadUrl = urlData.publicUrl;
                    }
                }
                
                if (uploadUrl) {
                    finalReason = `${earlyReason} [PROOF:${uploadUrl}]`;
                }
            } catch (err) {
                console.error("Failed to upload check-out proof image:", err);
                showAlert('ไม่สามารถอัปโหลดภาพหลักฐานได้ กรุณาลองใหม่อีกครั้ง', 'อัปโหลดล้มเหลว');
                setIsUploading(false);
                setIsSubmitting(false);
                return;
            }
            setIsUploading(false);
        }

        // Pass location and potential reason
        await onConfirm(
            { lat: currentLat, lng: currentLng }, 
            matchedLocation?.name, 
            finalReason
        );
        setIsSubmitting(false);
        setShowEarlyConfirmation(false);
        onClose();
    };

    const handleForgetfulSubmit = async (customTime?: string) => {
        if (!statusDetails || !statusDetails.requiredEndTime) return;
        setIsSubmitting(true);
        
        let adjustedCheckoutTime = statusDetails.requiredEndTime;
        if (customTime) {
            const [hours, minutes] = customTime.split(':').map(Number);
            adjustedCheckoutTime = new Date(statusDetails.requiredEndTime);
            adjustedCheckoutTime.setHours(hours, minutes, 0, 0);
        }
        
        await onConfirm(
            { lat: currentLat, lng: currentLng },
            matchedLocation?.name,
            `[ADJUSTED_CHECKOUT:${adjustedCheckoutTime.toISOString()}] ลืมลงเวลากลับตามปกติ`
        );
        
        setIsSubmitting(false);
        showAlert('ระบบลงเวลากลับตามปกติเวลา ' + format(adjustedCheckoutTime, 'HH:mm') + ' น. สำเร็จแล้วครับ 👍', 'ลงเวลากลับ');
        onClose();
    };

    const handleOvertimeSubmit = async () => {
        if (!otReason.trim()) {
            showAlert('กรุณาระบุรายละเอียดงานล่วงเวลาด้วยครับ', 'ข้อมูลไม่ครบ');
            return;
        }
        if (!statusDetails || !statusDetails.requiredEndTime) return;

        setIsSubmitting(true);
        
        // 1. Check out now at the actual current time with OT reason
        await onConfirm(
            { lat: currentLat, lng: currentLng },
            matchedLocation?.name,
            `[OT_PENDING:${otReason}] ทำงานล่วงเวลา (OT): ${otReason}`
        );

        // 2. Calculate OT minutes from selected start/end times and submit the formal OT request
        const otMinutes = otDetails.minutes;
        if (onOvertimeSubmit) {
            await onOvertimeSubmit(
                otMinutes, 
                `[OT:${otStartTime}-${otEndTime}] (${otDetails.hours}hr) [OT_MINUTES:${otMinutes}] ${otReason}`
            );
        }

        setIsSubmitting(false);
        onClose();
    };

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            if (checkOutStatus === 'EARLY_LEAVE') {
                setWarningModal({ isOpen: true, message: 'กรุณาระบุเหตุผลที่กลับก่อนเวลาด้วยครับ' });
            } else {
                setWarningModal({ isOpen: true, message: 'กรุณาระบุเหตุผลที่ปฏิบัติงานนอกสถานที่ด้วยครับ' });
            }
            return;
        }
        setIsSubmitting(true);
        let finalReason = reason;

        if (selectedImageFile) {
            setIsUploading(true);
            try {
                const compressed = await compressImage(selectedImageFile, 1200, 0.7);
                let uploadUrl = '';

                // Try Google Drive if connected
                if (isDriveConnected) {
                    try {
                        const result = await googleDriveService.uploadFile(compressed);
                        if (result?.url) {
                            uploadUrl = result.url;
                        }
                    } catch (driveErr) {
                        console.warn('Failed to upload to Google Drive, falling back to Supabase...', driveErr);
                    }
                }

                // Fallback to Supabase Storage
                if (!uploadUrl) {
                    const fileExt = compressed.name.split('.').pop() || 'jpg';
                    const fileName = `checkout_out_of_range_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                    const filePath = `proofs/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('chat-files')
                        .upload(filePath, compressed);

                    if (uploadError) {
                        throw uploadError;
                    }

                    const { data: urlData } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(filePath);

                    if (urlData?.publicUrl) {
                        uploadUrl = urlData.publicUrl;
                    }
                }

                if (uploadUrl) {
                    finalReason = `${reason} [PROOF:${uploadUrl}]`;
                }
            } catch (err) {
                console.error("Failed to upload out-of-range check-out proof image:", err);
                showAlert('ไม่สามารถอัปโหลดภาพหลักฐานได้ กรุณาลองใหม่อีกครั้ง', 'อัปโหลดล้มเหลว');
                setIsUploading(false);
                setIsSubmitting(false);
                return;
            }
            setIsUploading(false);
        }

        // Perform the provisional check-out directly first
        const provTag = '[PROVISIONAL_CHECKOUT]';
        const reasonWithProv = `[TIME:${time}] ${finalReason} ${provTag}`;
        await onConfirm(
            { lat: currentLat, lng: currentLng }, 
            matchedLocation?.name || 'Unknown Location', 
            reasonWithProv
        );

        // Also submit the formal request for admin review/approval
        await onRequest(time, finalReason);

        setIsSubmitting(false);
        onClose();
    };

    const handleAcceptPenaltySubmit = async (reasonStr: string) => {
        setIsSubmitting(true);
        const finalReason = reasonStr.trim() ? `[ACCEPT_PENALTY] ${reasonStr}` : '[ACCEPT_PENALTY] ยอมรับบทลงโทษกลับก่อนเวลา';
        await onConfirm(
            { lat: currentLat, lng: currentLng }, 
            matchedLocation?.name || 'Unknown Location', 
            finalReason
        );
        setIsSubmitting(true);
        onClose();
    };

    return {
        status,
        isGpsSecure,
        gpsThreatReason,
        distance,
        matchedLocation,
        currentLat,
        currentLng,
        checkOutStatus,
        statusDetails,
        otFlowStep,
        setOtFlowStep,
        otReason,
        setOtReason,
        otStartTime,
        setOtStartTime,
        otEndTime,
        setOtEndTime,
        activeOtTimePicker,
        setActiveOtTimePicker,
        forgetCheckOutTime,
        setForgetCheckOutTime,
        earlyLeaveStep,
        setEarlyLeaveStep,
        time,
        setTime,
        reason,
        setReason,
        earlyReason,
        setEarlyReason,
        isSubmitting,
        setIsSubmitting,
        isTimePickerOpen,
        setIsTimePickerOpen,
        showEarlyConfirmation,
        setShowEarlyConfirmation,
        warningModal,
        setWarningModal,
        selectedImageFile,
        setSelectedImageFile,
        imagePreviewUrl,
        setImagePreviewUrl,
        isUploading,
        isDriveConnected,
        isLightboxOpen,
        setIsLightboxOpen,
        earlyLeaveInterval,
        earlyLeaveRate,
        otDetails,
        checkLocation,
        handleConnectDrive,
        handleNormalSubmit,
        handleForgetfulSubmit,
        handleOvertimeSubmit,
        handleRequestSubmit,
        handleAcceptPenaltySubmit,
        showAlert,
    };
};
