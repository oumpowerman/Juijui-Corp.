import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { LocationDef } from '../../../types/attendance';
import { format } from 'date-fns';
import TimePickerModal from '../../ui/TimePickerModal';

// Extracted Sub-components & Hooks
import { CheckOutLocationStatus } from './checkout/CheckOutLocationStatus';
import { CheckOutSummaryCard } from './checkout/CheckOutSummaryCard';
import { CheckOutFlowRouter } from './checkout/CheckOutFlowRouter';
import { useCheckOutState } from './hooks/useCheckOutState';

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>;
    onRequest: (time: string, reason: string) => Promise<boolean>;
    availableLocations: LocationDef[];
    checkInTime: Date;
    onOvertimeSubmit?: (otMinutes: number, reason: string) => Promise<boolean>;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({ 
    isOpen, onClose, onConfirm, onRequest, availableLocations, checkInTime, onOvertimeSubmit
}) => {
    const state = useCheckOutState({
        isOpen,
        onClose,
        onConfirm,
        onRequest,
        availableLocations,
        checkInTime,
        onOvertimeSubmit,
    });

    const {
        status,
        isGpsSecure,
        gpsThreatReason,
        distance,
        matchedLocation,
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
        isSubmitting,
        isTimePickerOpen,
        setIsTimePickerOpen,
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
    } = state;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="bg-white w-full max-w-sm min-h-[480px] max-h-[min(640px,85vh)] h-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white relative"
                    >
                        
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

                        <div className="p-6 flex-1 overflow-hidden relative flex flex-col">
                            <div className="flex-1 overflow-y-auto space-y-5 w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                <AnimatePresence initial={false}>
                                    {otFlowStep === 'NONE' && !(checkOutStatus === 'EARLY_LEAVE' && earlyLeaveStep === 'FORM') && (
                                        <motion.div
                                            key="gps-location"
                                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                            className="overflow-hidden"
                                        >
                                            <CheckOutLocationStatus
                                                status={status}
                                                isGpsSecure={isGpsSecure}
                                                gpsThreatReason={gpsThreatReason}
                                                distance={distance}
                                                matchedLocationName={matchedLocation?.name}
                                                onRetry={checkLocation}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence initial={false}>
                                    {statusDetails && !(checkOutStatus === 'EARLY_LEAVE' && earlyLeaveStep === 'FORM') && (
                                        <motion.div
                                            key="working-hours"
                                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                            className="overflow-hidden"
                                        >
                                            <CheckOutSummaryCard
                                                checkInTime={checkInTime}
                                                currentTime={new Date()}
                                                checkOutStatus={checkOutStatus}
                                                statusDetails={statusDetails}
                                                distance={distance}
                                                penaltyHP={checkOutStatus === 'EARLY_LEAVE' ? Math.round((statusDetails.missingMinutes || 0) * ((earlyLeaveRate || 10) / (earlyLeaveInterval || 10))) : undefined}
                                                isOutOfRange={status === 'OUT_OF_RANGE'}
                                                earlyLeaveInterval={earlyLeaveInterval}
                                                earlyLeaveRate={earlyLeaveRate}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div>
                                    {/* Router chooses the correct flow step or checkout view */}
                                    <CheckOutFlowRouter
                                        status={status}
                                        isGpsSecure={isGpsSecure}
                                        gpsThreatReason={gpsThreatReason}
                                        distance={distance}
                                        matchedLocation={matchedLocation}
                                        checkOutStatus={checkOutStatus}
                                        statusDetails={statusDetails}
                                        otFlowStep={otFlowStep}
                                        otReason={otReason}
                                        otStartTime={otStartTime}
                                        otEndTime={otEndTime}
                                        otDetails={otDetails}
                                        forgetCheckOutTime={forgetCheckOutTime}
                                        onSetOtStep={setOtFlowStep}
                                        onSetOtReason={setOtReason}
                                        onSetTimePicker={setActiveOtTimePicker}
                                        onForgetfulSubmit={handleForgetfulSubmit}
                                        onOvertimeSubmit={handleOvertimeSubmit}
                                        onSetForgetCheckOutTime={setForgetCheckOutTime}
                                        onNormalSubmit={handleNormalSubmit}
                                        checkLocation={checkLocation}
                                        time={time}
                                        onOpenTimePicker={() => setIsTimePickerOpen(true)}
                                        reason={reason}
                                        onSetReason={setReason}
                                        isSubmitting={isSubmitting}
                                        isUploading={isUploading}
                                        onSubmitRequest={handleRequestSubmit}
                                        selectedImageFile={selectedImageFile}
                                        imagePreviewUrl={imagePreviewUrl}
                                        onFileSelect={(file, url) => {
                                            setSelectedImageFile(file);
                                            setImagePreviewUrl(url);
                                        }}
                                        onOpenLightbox={() => setIsLightboxOpen(true)}
                                        onAcceptPenalty={handleAcceptPenaltySubmit}
                                        earlyLeaveInterval={earlyLeaveInterval}
                                        earlyLeaveRate={earlyLeaveRate}
                                        earlyLeaveStep={earlyLeaveStep}
                                        onSetEarlyLeaveStep={setEarlyLeaveStep}
                                        checkInTime={checkInTime}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <TimePickerModal
                        isOpen={isTimePickerOpen}
                        onClose={() => setIsTimePickerOpen(false)}
                        initialTime={time}
                        onSelect={(val) => setTime(val)}
                    />

                    <TimePickerModal
                        isOpen={activeOtTimePicker !== null}
                        onClose={() => setActiveOtTimePicker(null)}
                        initialTime={
                            activeOtTimePicker === 'START' 
                                ? otStartTime 
                                : activeOtTimePicker === 'END' 
                                ? otEndTime 
                                : forgetCheckOutTime
                        }
                        onSelect={(val) => {
                            if (activeOtTimePicker === 'START') {
                                setOtStartTime(val);
                            } else if (activeOtTimePicker === 'END') {
                                setOtEndTime(val);
                            } else if (activeOtTimePicker === 'FORGET') {
                                const now = new Date();
                                const currentHHMM = format(now, 'HH:mm');
                                if (val > currentHHMM) {
                                    showAlert('ไม่สามารถเลือกเวลาในอนาคตได้ครับ', 'เกิดข้อผิดพลาด');
                                } else {
                                    setForgetCheckOutTime(val);
                                }
                            }
                            setActiveOtTimePicker(null);
                        }}
                    />

                    {/* Warning Modal */}
                    {warningModal?.isOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                            <div className="bg-white w-full max-w-xs rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 border-2 border-slate-100">
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
                </motion.div>
            )}

            {isLightboxOpen && imagePreviewUrl && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 cursor-zoom-out"
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-sm w-full max-h-[80vh] flex flex-col items-center justify-center"
                    >
                        <button 
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute -top-16 right-0 p-3 bg-black/60 hover:bg-black/80 border border-white/10 text-white rounded-full transition-all duration-200 shadow-lg cursor-pointer active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img 
                            src={imagePreviewUrl} 
                            alt="Proof Lightbox" 
                            className="max-w-full max-h-[75vh] object-contain rounded-[2.5rem] shadow-2xl border-4 border-white"
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
