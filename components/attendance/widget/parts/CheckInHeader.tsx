import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { WorkLocation } from '../../../../types/attendance';
import { CheckInStep } from '../hooks/useCheckInState';

interface CheckInHeaderProps {
    selectedType: WorkLocation | null;
    matchedLocationName?: string;
    compressing: boolean;
    isSubmitting: boolean;
    step: CheckInStep;
    timeLeft: number;
    needsSelfieDynamic: boolean;
    isDriveConnected?: boolean;
    onClose: () => void;
}

const CheckInHeader: React.FC<CheckInHeaderProps> = ({
    selectedType,
    matchedLocationName,
    compressing,
    isSubmitting,
    step,
    timeLeft,
    needsSelfieDynamic,
    isDriveConnected,
    onClose,
}) => {
    const workTypeBadgeInfo = useMemo(() => {
        if (!selectedType) return null;
        switch (selectedType) {
            case 'OFFICE':
                return {
                    label: matchedLocationName || 'Office',
                    icon: '📍',
                    className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
                };
            case 'WFH':
                return {
                    label: 'WFH',
                    icon: '🏠',
                    className: 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                };
            case 'SITE':
                return {
                    label: matchedLocationName || 'On-site',
                    icon: '🎬',
                    className: 'bg-orange-50 text-orange-700 border-orange-200 font-bold'
                };
            default:
                return null;
        }
    }, [selectedType, matchedLocationName]);

    return (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div>
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">ลงเวลาเข้างาน</h3>
                    <AnimatePresence>
                        {workTypeBadgeInfo && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-sm ${workTypeBadgeInfo.className}`}
                            >
                                <span className="text-xs">{workTypeBadgeInfo.icon}</span>
                                <span className="max-w-[120px] truncate">{workTypeBadgeInfo.label}</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                    {compressing ? 'กำลังบีบอัดข้อมูลภาพ...' : 
                     isSubmitting ? `กำลังอัปโหลด... (สำรองใน ${timeLeft}s)` : 
                     step === 'NO_CONFIG' ? 'ยังไม่ได้ตั้งพิกัดระบบ' :
                     needsSelfieDynamic ? 
                     `ขั้นตอน: ${step === 'LOCATION' ? '1/3 ตรวจสอบพิกัด' : step === 'CONFIRM_LOCATION' ? '2/3 ยืนยันพิกัด' : '3/3 ถ่ายภาพเซลฟี่'}` :
                     `ขั้นตอน: ${step === 'LOCATION' ? '1/2 ตรวจสอบพิกัด' : '2/2 ยืนยันพิกัด'}`}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end mr-1">
                    {needsSelfieDynamic && (isDriveConnected ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[8px] font-bold text-emerald-600 uppercase">Drive Ready</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded-full animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                            <span className="text-[8px] font-bold text-rose-600 uppercase">Drive Disconnected</span>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm">
                    <X className="w-4 h-4"/>
                </button>
            </div>
        </div>
    );
};

export default CheckInHeader;
