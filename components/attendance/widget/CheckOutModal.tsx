import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader2, AlertTriangle, Send, LogOut, RefreshCw, Clock, CheckCircle2, MessageSquare, Sparkles, Hourglass, Lock, Info } from 'lucide-react';
import { LocationDef } from '../../../types/attendance';
import { calculateDistance } from '../../../lib/locationUtils';
import { format } from 'date-fns';
import { calculateCheckOutStatus } from '../../../lib/attendanceUtils';
import { useMasterData } from '../../../hooks/useMasterData';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useGameConfig } from '../../../context/GameConfigContext';
import TimePickerModal from '../../ui/TimePickerModal';
import { supabase } from '../../../lib/supabase';
import { compressImage } from '../../../lib/imageUtils';
import { googleDriveService } from '../../../services/googleDriveService';

// Extracted Sub-components
import { OvertimeFlow } from './checkout/OvertimeFlow';
import { EarlyLeaveFlow } from './checkout/EarlyLeaveFlow';
import { ProofUploadZone } from './checkout/ProofUploadZone';
import { OutOfRangeFlow } from './checkout/OutOfRangeFlow';

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>; // Updated signature
    onRequest: (time: string, reason: string) => Promise<boolean>; // Correction request
    availableLocations: LocationDef[];
    checkInTime: Date; // Passed from parent for calculation
    onOvertimeSubmit?: (otMinutes: number, reason: string) => Promise<boolean>;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ 
    isOpen, onClose, onConfirm, onRequest, availableLocations, checkInTime, onOvertimeSubmit
}) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions } = useMasterData(); // Fetch latest config
    const { config } = useGameConfig(); // Fetch game tuner configs

    // Dynamically retrieve early leave interval and rate from Game Config (LawTuner), Master Options (DB), or safe fallbacks
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
    
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'OUT_OF_RANGE' | 'ERROR'>('LOADING');
    const [distance, setDistance] = useState(0);
    const [matchedLocation, setMatchedLocation] = useState<LocationDef | undefined>();
    const [currentLat, setCurrentLat] = useState<number>(0);
    const [currentLng, setCurrentLng] = useState<number>(0);
    
    // Status Logic State
    const [checkOutStatus, setCheckOutStatus] = useState<'COMPLETED' | 'EARLY_LEAVE'>('COMPLETED');
    const [statusDetails, setStatusDetails] = useState<any>(null);

    // Overtime Flow State
    const [otFlowStep, setOtFlowStep] = useState<'NONE' | 'PROMPT' | 'REASON'>('NONE');
    const [otReason, setOtReason] = useState('');
    const [otStartTime, setOtStartTime] = useState('');
    const [otEndTime, setOtEndTime] = useState('');
    const [activeOtTimePicker, setActiveOtTimePicker] = useState<'START' | 'END' | null>(null);

    // Form for Request / Early Leave
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [earlyReason, setEarlyReason] = useState(''); // New state for early leave reason when GPS is OK
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [showEarlyConfirmation, setShowEarlyConfirmation] = useState(false);
    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string } | null>(null);

    // Photo upload states
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDriveConnected, setIsDriveConnected] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    const otDetails = React.useMemo(() => {
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

    useEffect(() => {
        if (isOpen) {
            checkLocation();
            setTime(format(new Date(), 'HH:mm'));
            setReason('');
            setEarlyReason('');
            setOtFlowStep('NONE');
            setOtReason('');
            setStatus('LOADING');
            setShowEarlyConfirmation(false);
            
            // Reset photo states
            setSelectedImageFile(null);
            setImagePreviewUrl('');
            setIsLightboxOpen(false);
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
        }
    }, [isOpen]);

    const checkLocation = () => {
        setStatus('LOADING');
        if (!navigator.geolocation) {
            setStatus('ERROR');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentLat(latitude);
                setCurrentLng(longitude);
                
                let minDetails = { dist: Infinity, loc: undefined as LocationDef | undefined };

                for (const loc of availableLocations) {
                    const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
                    if (dist < minDetails.dist) {
                        minDetails = { dist, loc };
                    }
                    if (dist <= loc.radiusMeters) {
                         // Found valid location
                         setDistance(dist);
                         setMatchedLocation(loc);
                         setStatus('SUCCESS');
                         return;
                    }
                }
                
                // If loop finishes without return, we are out of range
                setDistance(minDetails.dist);
                setMatchedLocation(minDetails.loc); // Closest one
                setStatus('OUT_OF_RANGE');
            },
            () => setStatus('ERROR'),
            { enableHighAccuracy: true }
        );
    };

    const handleNormalSubmit = async () => {
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

    const handleForgetfulSubmit = async () => {
        if (!statusDetails || !statusDetails.requiredEndTime) return;
        setIsSubmitting(true);
        
        // Pass the adjusted checkout timestamp inside the reason parameter using a parsed format
        const adjustedCheckoutTime = statusDetails.requiredEndTime;
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

        const success = await onRequest(time, finalReason);
        setIsSubmitting(false);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border-4 border-white">
                
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0 gap-4">
                    <h3 className="font-bold text-gray-800 truncate">ยืนยันเวลาออก (Check-out)</h3>
                    <div className="flex items-center gap-2 shrink-0">
                        {otFlowStep === 'NONE' && (checkOutStatus === 'EARLY_LEAVE' || status === 'OUT_OF_RANGE') && (
                            isDriveConnected ? (
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span>Drive Ready</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleConnectDrive}
                                    className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full border border-rose-100 shadow-sm hover:scale-102 transition-all shrink-0 animate-pulse"
                                >
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    <span>เชื่อมต่อ Drive</span>
                                </button>
                            )
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"><X className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    {(otFlowStep === 'PROMPT' || otFlowStep === 'REASON') && statusDetails && (
                        <OvertimeFlow
                            step={otFlowStep}
                            checkInTime={checkInTime}
                            requiredEndTime={statusDetails.requiredEndTime}
                            otStartTime={otStartTime}
                            otEndTime={otEndTime}
                            otReason={otReason}
                            isSubmitting={isSubmitting}
                            otDetails={otDetails}
                            onSetStep={(step) => setOtFlowStep(step)}
                            onSetOtReason={(reason) => setOtReason(reason)}
                            onSetTimePicker={(type) => setActiveOtTimePicker(type)}
                            onForgetfulSubmit={handleForgetfulSubmit}
                            onOvertimeSubmit={handleOvertimeSubmit}
                        />
                    )}

                    {otFlowStep === 'NONE' && (
                        <>
                            {statusDetails && checkOutStatus !== 'EARLY_LEAVE' && (
                                <div className="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-green-50 border-green-200">
                                    <div className="p-2 rounded-full shrink-0 bg-green-100 text-green-600">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-green-800">
                                            เวลาครบตามเกณฑ์
                                        </h4>
                                        <p className="text-xs mt-1 text-gray-600">
                                            เวลาที่ต้องออก: <span className="font-bold">{format(statusDetails.requiredEndTime, 'HH:mm')}</span> <br/>
                                            (ทำไปแล้ว {statusDetails.hoursWorked.toFixed(1)} ชม.)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {status === 'LOADING' && (
                                <div className="py-10 text-center">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3"/>
                                    <p className="text-gray-500 font-bold">กำลังตรวจสอบพิกัด...</p>
                                </div>
                            )}

                            {status === 'ERROR' && (
                                <div className="text-center">
                                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3"/>
                                    <p className="text-red-600 font-bold">ไม่สามารถระบุตำแหน่งได้</p>
                                    <p className="text-sm text-gray-500 mt-1">กรุณาลองใหม่ หรือส่งคำขอแบบ Manual</p>
                                    <button onClick={checkLocation} className="mt-4 text-indigo-600 font-bold text-sm underline">ลองใหม่</button>
                                    
                                    {/* Fallback to Request Form if GPS fails */}
                                    <form onSubmit={handleRequestSubmit} className="mt-6 text-left space-y-3 pt-4 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase">ส่งคำขอ Check-out</p>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700">เวลาออกจริง</label>
                                            <button 
                                                type="button"
                                                onClick={() => setIsTimePickerOpen(true)}
                                                className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-center text-xl text-indigo-600 shadow-sm hover:border-indigo-400 transition-all"
                                            >
                                                {time || '--:--'}
                                            </button>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700">เหตุผล / หมายเหตุ</label>
                                            <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded-xl text-sm" placeholder="เช่น GPS มีปัญหา, แบตหมด..." required rows={2} />
                                        </div>
                                        <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex justify-center">
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'ส่งคำขออนุมัติ'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {status === 'SUCCESS' && (
                                checkOutStatus === 'EARLY_LEAVE' ? (
                                    <EarlyLeaveFlow
                                        distance={distance}
                                        matchedLocation={matchedLocation}
                                        statusDetails={statusDetails}
                                        reason={reason}
                                        setReason={setReason}
                                        selectedFile={selectedImageFile}
                                        previewUrl={imagePreviewUrl}
                                        onFileSelect={(file, url) => {
                                            setSelectedImageFile(file);
                                            setImagePreviewUrl(url);
                                        }}
                                        setIsLightboxOpen={setIsLightboxOpen}
                                        isSubmitting={isSubmitting}
                                        isUploading={isUploading}
                                        onSubmit={handleRequestSubmit}
                                        earlyLeaveInterval={earlyLeaveInterval}
                                        earlyLeaveRate={earlyLeaveRate}
                                    />
                                ) : (
                                    <div className="text-center animate-in fade-in duration-300">
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                                            <MapPin className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-green-700">อยู่ในพื้นที่ Check-out</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {matchedLocation?.name} (ระยะ {distance.toFixed(0)}m)
                                        </p>
                                        
                                        <div className="mt-6 space-y-3">
                                            <button 
                                                onClick={handleNormalSubmit}
                                                disabled={isSubmitting}
                                                className="w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg bg-green-600 hover:bg-green-700 shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"/> : <LogOut className="w-6 h-6"/>}
                                                <span>ยืนยันการเลิกงาน</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}

                            {status === 'OUT_OF_RANGE' && (
                                <OutOfRangeFlow
                                    distance={distance}
                                    matchedLocationName={matchedLocation?.name}
                                    checkLocation={checkLocation}
                                    isEarlyLeave={checkOutStatus === 'EARLY_LEAVE'}
                                    earlyLeaveInterval={earlyLeaveInterval}
                                    earlyLeaveRate={earlyLeaveRate}
                                    missingMinutes={statusDetails?.missingMinutes}
                                    time={time}
                                    reason={reason}
                                    onSetReason={setReason}
                                    isSubmitting={isSubmitting}
                                    onSubmitRequest={handleRequestSubmit}
                                    selectedFile={selectedImageFile}
                                    previewUrl={imagePreviewUrl}
                                    onFileSelect={(file, url) => {
                                        setSelectedImageFile(file);
                                        setImagePreviewUrl(url);
                                    }}
                                    onOpenLightbox={() => setIsLightboxOpen(true)}
                                    onEditTime={() => setIsTimePickerOpen(true)}
                                    requiredEndTime={statusDetails?.requiredEndTime}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
            <TimePickerModal
                isOpen={isTimePickerOpen}
                onClose={() => setIsTimePickerOpen(false)}
                initialTime={time}
                onSelect={(val) => setTime(val)}
            />
            <TimePickerModal
                isOpen={activeOtTimePicker !== null}
                onClose={() => setActiveOtTimePicker(null)}
                initialTime={activeOtTimePicker === 'START' ? otStartTime : otEndTime}
                onSelect={(val) => {
                    if (activeOtTimePicker === 'START') {
                        setOtStartTime(val);
                    } else if (activeOtTimePicker === 'END') {
                        setOtEndTime(val);
                    }
                    setActiveOtTimePicker(null);
                }}
            />

            {/* Lightbox Modal */}
            {isLightboxOpen && imagePreviewUrl && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <div className="absolute top-4 right-4 z-50">
                        <button 
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div 
                        className="max-w-[90vw] max-h-[80vh] relative p-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img 
                            src={imagePreviewUrl} 
                            alt="Fullscreen proof" 
                            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </div>
            )}
            {/* Warning Modal */}
            {warningModal?.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-xs rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 border-2 border-slate-100">
                        {/* Circle Info Icon Wrapper */}
                        <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100 mb-4 text-blue-500">
                            <Info className="w-10 h-10 stroke-[2.2]" />
                        </div>
                        
                        <h4 className="text-xl font-bold text-slate-800 mb-2">ข้อมูลไม่ครบ</h4>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                            {warningModal.message}
                        </p>

                        <button
                            type="button"
                            onClick={() => setWarningModal(null)}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all text-center flex items-center justify-center"
                        >
                            รับทราบ
                        </button>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
