import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { LocationDef } from '../../../../types/attendance';
import { OvertimeFlow } from './OvertimeFlow';
import { ForgotCheckOutFlow } from './ForgotCheckOutFlow';
import { EarlyLeaveFlow } from './EarlyLeaveFlow';
import { OutOfRangeFlow } from './OutOfRangeFlow';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckOutFlowRouterProps {
    status: 'LOADING' | 'ERROR' | 'SUCCESS' | 'OUT_OF_RANGE';
    isGpsSecure: boolean;
    gpsThreatReason?: string;
    distance: number;
    matchedLocation: LocationDef | undefined;
    checkOutStatus: 'COMPLETED' | 'EARLY_LEAVE';
    statusDetails: any;
    
    // Overtime State & Callback
    otFlowStep: 'NONE' | 'PROMPT' | 'REASON' | 'FORGET_TIME';
    otReason: string;
    otStartTime: string;
    otEndTime: string;
    otDetails: any;
    forgetCheckOutTime: string;
    onSetOtStep: (step: 'NONE' | 'PROMPT' | 'REASON' | 'FORGET_TIME') => void;
    onSetOtReason: (reason: string) => void;
    onSetTimePicker: (type: 'START' | 'END' | 'FORGET' | null) => void;
    onForgetfulSubmit: (customTime?: string) => Promise<void>;
    onOvertimeSubmit: () => Promise<void>;
    onSetForgetCheckOutTime: (time: string) => void;

    // Normal Submit & Location check
    onNormalSubmit: () => Promise<void>;
    checkLocation: () => void;

    // Form inputs and triggers
    time: string;
    onOpenTimePicker: () => void;
    reason: string;
    onSetReason: (reason: string) => void;
    isSubmitting: boolean;
    isUploading: boolean;
    onSubmitRequest: (e: React.FormEvent) => void;

    // Early Leave
    selectedImageFile: File | null;
    imagePreviewUrl: string;
    onFileSelect: (file: File | null, url: string) => void;
    onOpenLightbox: () => void;
    onAcceptPenalty: (reason: string) => Promise<void>;
    earlyLeaveInterval: number;
    earlyLeaveRate: number;
    earlyLeaveStep: 'CHOOSE' | 'FORM';
    onSetEarlyLeaveStep: (step: 'CHOOSE' | 'FORM') => void;

    // Misc
    checkInTime: Date;
}

export const CheckOutFlowRouter: React.FC<CheckOutFlowRouterProps> = ({
    status,
    isGpsSecure,
    distance,
    matchedLocation,
    checkOutStatus,
    statusDetails,
    
    otFlowStep,
    otReason,
    otStartTime,
    otEndTime,
    otDetails,
    forgetCheckOutTime,
    onSetOtStep,
    onSetOtReason,
    onSetTimePicker,
    onForgetfulSubmit,
    onOvertimeSubmit,
    onSetForgetCheckOutTime,

    onNormalSubmit,
    checkLocation,

    time,
    onOpenTimePicker,
    reason,
    onSetReason,
    isSubmitting,
    isUploading,
    onSubmitRequest,

    selectedImageFile,
    imagePreviewUrl,
    onFileSelect,
    onOpenLightbox,
    onAcceptPenalty,
    earlyLeaveInterval,
    earlyLeaveRate,
    earlyLeaveStep,
    onSetEarlyLeaveStep,

    checkInTime,
}) => {
    const getFlowElement = () => {
        // 1. Overtime flow steps take priority if triggered
        if ((otFlowStep === 'PROMPT' || otFlowStep === 'REASON' || otFlowStep === 'FORGET_TIME') && statusDetails) {
            return (
                <motion.div
                    key="overtime"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                >
                    <OvertimeFlow
                        step={otFlowStep}
                        checkInTime={checkInTime}
                        requiredEndTime={statusDetails.requiredEndTime}
                        otStartTime={otStartTime}
                        otEndTime={otEndTime}
                        otReason={otReason}
                        isSubmitting={isSubmitting}
                        otDetails={otDetails}
                        onSetStep={onSetOtStep}
                        onSetOtReason={onSetOtReason}
                        onSetTimePicker={onSetTimePicker}
                        onForgetfulSubmit={onForgetfulSubmit}
                        onOvertimeSubmit={onOvertimeSubmit}
                        forgetCheckOutTime={forgetCheckOutTime}
                        onSetForgetCheckOutTime={onSetForgetCheckOutTime}
                    />
                </motion.div>
            );
        }

        if (otFlowStep === 'NONE') {
            // 2. GPS location loading or check issues
            if (status === 'LOADING') {
                return null; // The location card shows loading, router can be quiet
            }

            if (status === 'ERROR') {
                return (
                    <motion.div
                        key="gps-error"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ForgotCheckOutFlow
                            time={time}
                            onOpenTimePicker={onOpenTimePicker}
                            reason={reason}
                            onSetReason={onSetReason}
                            isSubmitting={isSubmitting}
                            onSubmit={onSubmitRequest}
                            title="ไม่สามารถระบุตำแหน่ง GPS ได้"
                            description="ระบบไม่สามารถยืนยันตำแหน่งของคุณได้ในขณะนี้ กรุณากรอกเวลากลับและเหตุผลเพื่อยื่นขออนุมัติแบบแมนนวลต่อหัวหน้างาน"
                        />
                    </motion.div>
                );
            }

            // 3. Early Leave flow (Successfully in range, but before scheduled end)
            if (status === 'SUCCESS' && checkOutStatus === 'EARLY_LEAVE') {
                return (
                    <motion.div
                        key="early-leave"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
                        <EarlyLeaveFlow
                            distance={distance}
                            matchedLocation={matchedLocation}
                            statusDetails={statusDetails}
                            reason={reason}
                            setReason={onSetReason}
                            selectedFile={selectedImageFile}
                            previewUrl={imagePreviewUrl}
                            onFileSelect={onFileSelect}
                            onOpenLightbox={onOpenLightbox}
                            isSubmitting={isSubmitting}
                            isUploading={isUploading}
                            onSubmit={onSubmitRequest}
                            onAcceptPenalty={onAcceptPenalty}
                            earlyLeaveInterval={earlyLeaveInterval}
                            earlyLeaveRate={earlyLeaveRate}
                            earlyLeaveStep={earlyLeaveStep}
                            setEarlyLeaveStep={onSetEarlyLeaveStep}
                        />
                    </motion.div>
                );
            }

            // 4. Out of Range flow
            if (status === 'OUT_OF_RANGE') {
                return (
                    <motion.div
                        key="out-of-range"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
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
                            onSetReason={onSetReason}
                            isSubmitting={isSubmitting}
                            onSubmitRequest={onSubmitRequest}
                            selectedFile={selectedImageFile}
                            previewUrl={imagePreviewUrl}
                            onFileSelect={onFileSelect}
                            onOpenLightbox={onOpenLightbox}
                            onEditTime={onOpenTimePicker}
                            requiredEndTime={statusDetails?.requiredEndTime}
                        />
                    </motion.div>
                );
            }

            // 5. Normal successful in-range clock-out
            if (status === 'SUCCESS' && checkOutStatus !== 'EARLY_LEAVE') {
                return (
                    <motion.div
                        key="normal-success"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                        className="text-center pt-1"
                    >
                        <div className="space-y-3">
                            <button 
                                onClick={onNormalSubmit}
                                disabled={isSubmitting || !isGpsSecure}
                                className={`w-full py-4 text-white rounded-2xl font-bold text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                    isGpsSecure
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-pointer'
                                        : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin"/> : <LogOut className="w-6 h-6"/>}
                                <span>ยืนยันการเลิกงาน (Check-out)</span>
                            </button>
                        </div>
                    </motion.div>
                );
            }
        }

        return null;
    };

    return (
        <AnimatePresence mode="wait">
            {getFlowElement()}
        </AnimatePresence>
    );
};
