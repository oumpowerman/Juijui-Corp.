import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { X, AlertTriangle, Clock, ArrowRight, CheckCircle2, CloudOff, Settings, ShieldCheck, ShieldAlert, MapPin, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { calculateDistance, OFFICE_COORDS, getRandomPose } from '../../../lib/locationUtils';
import { WorkLocation, LocationDef } from '../../../types/attendance';
import CameraView from './CameraView';
import { compressImage } from '../../../lib/imageUtils';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { useUserSession } from '../../../context/UserSessionContext';
import { checkNeedsSelfieVerification } from '../../../lib/selfieUtils';
import { useCheckInLocation } from '../../../hooks/attendance/useCheckInLocation';

// Sub-steps components
import LocationStep from '../steps/LocationStep';
import WorkTypeStep from '../steps/WorkTypeStep';
import PreviewStep from '../steps/PreviewStep';
import LateInterventionOverlay from '../steps/LateInterventionOverlay';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (type: WorkLocation, file: File | null, location: { lat: number, lng: number }, locationName?: string, isProvisionalOnsite?: boolean, provisionalReason?: string) => void;
    availableLocations?: LocationDef[]; // Accept list of locations
    startTime?: string;
    lateBuffer?: number;
    onSwitchToLeave?: () => void;
    approvedWFH?: boolean; 
    approvedOnsite?: boolean;
    hasLateRequest?: boolean; 
    isDriveConnected?: boolean; 
    userId?: string; 
}

type Step = 'LOCATION' | 'CONFIRM_LOCATION' | 'TYPE' | 'CAMERA' | 'PREVIEW' | 'NO_CONFIG';

const STEP_FLOW_ORDER: Step[] = ['LOCATION', 'CONFIRM_LOCATION', 'TYPE', 'CAMERA', 'PREVIEW', 'NO_CONFIG'];

const CheckInModal: React.FC<CheckInModalProps> = ({ 
    isOpen, onClose, onConfirm, availableLocations = [], startTime, lateBuffer = 0, onSwitchToLeave, approvedWFH, approvedOnsite, hasLateRequest, isDriveConnected, userId 
}) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions, isLoading } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const [searchParams, setSearchParams] = useSearchParams();
    const [step, setStep] = useState<Step>('LOCATION');
    const [prevStep, setPrevStep] = useState<Step | null>(null);
    const [direction, setDirection] = useState(1);

    const getStepIndex = (s: Step): number => STEP_FLOW_ORDER.indexOf(s);

    const handleSetStep = (newStep: Step) => {
        setDirection(getStepIndex(newStep) >= getStepIndex(step) ? 1 : -1);
        setPrevStep(step);
        setStep(newStep);
    };

    const isFadeOnly = step === 'LOCATION' || prevStep === 'LOCATION';

    const stepVariants: Variants = {
        enter: (direction: number) => ({
            x: isFadeOnly ? 0 : (direction > 0 ? '100%' : '-100%'),
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.25, ease: 'easeOut' }
            }
        },
        exit: (direction: number) => ({
            x: isFadeOnly ? 0 : (direction > 0 ? '-100%' : '100%'),
            opacity: 0,
            transition: {
                x: { type: 'spring', stiffness: 350, damping: 30 },
                opacity: { duration: 0.15, ease: 'easeIn' }
            }
        })
    };
    
    const [selectedType, setSelectedType] = useState<WorkLocation | null>(null);
    const [provisionalOnsite, setProvisionalOnsite] = useState(false);
    const [provisionalReason, setProvisionalReason] = useState('');
    const [challenge, setChallenge] = useState('');
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [compressing, setCompressing] = useState(false);
    const [showLateIntervention, setShowLateIntervention] = useState(false);
    const [bypassSelfie, setBypassSelfie] = useState(false);

    const needsSelfieDynamic = useMemo(() => {
        const selfieModeOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_MODE');
        const selfieDaysOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_DAYS');
        const selfieMode = selfieModeOpt?.label || 'ALWAYS_ON';
        const selfieDays = selfieDaysOpt?.label || '3';
        return checkNeedsSelfieVerification(userId || '', selfieMode, selfieDays, new Date(), currentUserProfile?.workDays);
    }, [masterOptions, userId, currentUserProfile]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isSubmitting && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (!isSubmitting) {
            setTimeLeft(60);
        }
        return () => clearInterval(timer);
    }, [isSubmitting, timeLeft]);

    const targets = useMemo(() => {
        if (availableLocations && availableLocations.length > 0) {
            return availableLocations;
        }

        const latOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
        const lngOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
        const radOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_RADIUS');

        return [{
            id: 'def',
            name: 'Office (Default)',
            lat: latOpt && latOpt.label ? parseFloat(latOpt.label) : OFFICE_COORDS.lat,
            lng: lngOpt && lngOpt.label ? parseFloat(lngOpt.label) : OFFICE_COORDS.lng,
            radiusMeters: radOpt && radOpt.label ? parseFloat(radOpt.label) : OFFICE_COORDS.radiusMeters,
            type: 'WORK_LOCATION'
        }];
    }, [availableLocations, masterOptions]);

    // Geolocation and safety validations hook
    const {
        locationState,
        setLocationState,
        detectedMatches,
        setDetectedMatches,
        selectedMatch,
        setSelectedMatch,
        isGpsSecure,
        gpsThreatReason,
        checkLocation: runCheckLocation,
    } = useCheckInLocation(targets);

    const checkLocation = () => {
        runCheckLocation(
            (matches, primaryMatch) => {
                setSelectedType(primaryMatch.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');
                setTimeout(() => handleSetStep('CONFIRM_LOCATION'), 1200);
            },
            () => {
                setTimeout(() => handleSetStep('TYPE'), 1500);
            }
        );
    };

    useEffect(() => {
        if (isOpen) {
            if (isLoading) return;

            const hasLocations = availableLocations && availableLocations.length > 0;
            const latOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
            const lngOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
            const hasOfficeConfig = !!(latOpt?.label && lngOpt?.label);

            if (!hasLocations && !hasOfficeConfig) {
                setStep('NO_CONFIG');
                setPrevStep(null);
                return;
            }

            setStep('LOCATION');
            setPrevStep(null);
            setChallenge(getRandomPose());
            setCapturedFile(null);
            setShowLateIntervention(false);
            setBypassSelfie(false);
            setDetectedMatches([]);
            setSelectedMatch(null);
            
            checkLocation();
        }
    }, [isOpen, isLoading, availableLocations, masterOptions]);

    useEffect(() => {
        if (hasLateRequest && showLateIntervention) {
            setShowLateIntervention(false);
        }
    }, [hasLateRequest, showLateIntervention]);

    const handleTypeSelect = (type: WorkLocation, customName?: string, isProvisionalOnsite?: boolean, provReason?: string) => {
        if (!isGpsSecure) {
            showAlert(`ระบบตรวจพบการพยายามใช้แอปสวมสิทธิ์พิกัดปลอมหรือจำลอง GPS: ${gpsThreatReason || 'กรุณาปิดเครื่องมือจำลองพิกัดก่อน'}`, 'ไม่สามารถลงเวลาได้');
            return;
        }

        if (type === 'WFH' && approvedWFH) {
             // Allowed by approval
        } else {
             const isNearAnyOffice = !!locationState.matchedLocation;
             if (type === 'OFFICE' && !isNearAnyOffice && locationState.status === 'SUCCESS') {
                showAlert(`คุณไม่ได้อยู่ในพิกัดพื้นที่ออฟฟิศหลักที่กำหนดในระบบครับ (ห่างประมาณ ${locationState.distance?.toFixed(0)} ม.)`, 'อยู่นอกพิกัด');
                return;
            }
        }

        setSelectedType(type);
        setProvisionalOnsite(!!isProvisionalOnsite);
        if (provReason) {
            setProvisionalReason(provReason);
        } else {
            setProvisionalReason('');
        }
        
        if (customName) {
            setLocationState(prev => ({
                ...prev,
                matchedLocation: {
                    id: 'custom_onsite',
                    name: customName,
                    lat: prev.lat,
                    lng: prev.lng,
                    radiusMeters: 500
                }
            }));
        }

        const selfieModeOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_MODE');
        const selfieDaysOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'SELFIE_VERIFICATION_DAYS');
        const selfieMode = selfieModeOpt?.label || 'ALWAYS_ON';
        const selfieDays = selfieDaysOpt?.label || '3';

        const needsSelfie = needsSelfieDynamic;

        if (!needsSelfie) {
            setBypassSelfie(true);
            handleSubmit(false, type, true, !!isProvisionalOnsite);
            return;
        } else {
            setBypassSelfie(false);
            handleSetStep('CAMERA');
        }
    };

    const handleInstantConfirm = () => {
        if (!selectedMatch) return;
        
        const finalType = selectedMatch.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE';
        setSelectedType(finalType);

        const needsSelfie = needsSelfieDynamic;

        if (!needsSelfie) {
            setBypassSelfie(true);
            handleSubmit(false, finalType, true);
            return;
        } else {
            setBypassSelfie(false);
            handleSetStep('CAMERA');
        }
    };

    const handleCapture = (file: File) => {
        setCapturedFile(file);
        handleSetStep('PREVIEW');
    };

    const handleSubmit = async (forceCheckIn = false, typeToSubmit?: WorkLocation, bypassFile?: boolean, passProvisionalOnsite?: boolean) => {
        const targetType = typeToSubmit || selectedType;
        if (!targetType) return;
        
        const actualBypass = bypassFile !== undefined ? bypassFile : bypassSelfie;
        if (!actualBypass && !capturedFile) return;

        // --- Late Intervention Logic ---
        if (startTime && !forceCheckIn && !showLateIntervention && !approvedWFH && !hasLateRequest) {
            const now = new Date();
            const [h, m] = startTime.split(':').map(Number);
            const limit = new Date();
            limit.setHours(h, m + lateBuffer, 0, 0);

            if (now > limit) {
                if (typeToSubmit) setSelectedType(typeToSubmit);
                setShowLateIntervention(true);
                return;
            }
        }

        setIsSubmitting(true);
        if (!actualBypass) {
            setCompressing(true);
        }
        setShowLateIntervention(false);
        
        try {
            const compressedFile = (actualBypass || !capturedFile) ? null : await compressImage(capturedFile);
            
            let locName = locationState.matchedLocation ? locationState.matchedLocation.name : 'On Site';
            if (targetType === 'WFH') locName = 'Home (WFH)';
            
            const isProv = passProvisionalOnsite !== undefined ? passProvisionalOnsite : provisionalOnsite;
            await onConfirm(targetType, compressedFile, { lat: locationState.lat, lng: locationState.lng }, locName, isProv, provisionalReason);
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            showAlert("ไม่สามารถบันทึกข้อมูลการลงเวลาได้ กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
        } finally {
            setCompressing(false);
            setIsSubmitting(false);
        }
    };

    if (step === 'CAMERA' && isOpen) {
        return <CameraView challengeText={challenge} onCapture={handleCapture} onClose={() => handleSetStep(selectedMatch ? 'CONFIRM_LOCATION' : 'TYPE')} />;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-sans"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        className="bg-white w-full max-w-md h-[540px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
                    >
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-800 text-base sm:text-lg">ลงเวลาเข้างาน</h3>
                        <p className="text-xs text-gray-400">
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
                        <button onClick={onClose} className="p-1.5 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm"><X className="w-4 h-4"/></button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-hidden relative flex flex-col">
                    {/* Late Intervention Overlay */}
                    <AnimatePresence>
                        {showLateIntervention && (
                            <LateInterventionOverlay
                                startTime={startTime || '10:00'}
                                onSwitchToLeave={onSwitchToLeave}
                                onClose={onClose}
                                onConfirm={() => handleSubmit(true, undefined, bypassSelfie)}
                                onGoBack={() => setShowLateIntervention(false)}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="w-full flex-1 flex flex-col justify-between"
                        >
                            {/* Step: LOCATION (Scanning GPS) */}
                            {step === 'LOCATION' && (
                                <div className="flex-1 flex flex-col justify-center w-full">
                                    <LocationStep 
                                        status={locationState.status} 
                                        distance={locationState.distance || 0} 
                                        lat={locationState.lat} 
                                        lng={locationState.lng} 
                                        matchedLocation={locationState.matchedLocation}
                                        onRetry={checkLocation}
                                        approvedWFH={approvedWFH} 
                                    />
                                </div>
                            )}

                            {/* Step: CONFIRM_LOCATION (Instant verification match & overlap picker) */}
                            {step === 'CONFIRM_LOCATION' && selectedMatch && (
                                <div className="flex-1 flex flex-col justify-between w-full">
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin w-full">
                                        {/* Shield Verification Badging */}
                                        <div className="flex flex-col items-center pt-1 w-full">
                                            {isGpsSecure ? (
                                                <>
                                                    <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-2 relative animate-pulse">
                                                        <span className="absolute inset-0 rounded-full bg-emerald-200/40 animate-ping" />
                                                        <ShieldCheck className="w-8 h-8 relative z-10" />
                                                    </div>
                                                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold shadow-sm">
                                                        <Check className="w-3 h-3" />
                                                        GPS Secure Verified
                                                    </div>
                                                    <p className="text-[9px] text-gray-400 mt-0.5 text-center px-4">ตรวจสอบระบบยืนยันตัวตนพิกัด & ป้องกันสวมสิทธิ์พิกัดปลอมสำเร็จ</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-2 relative animate-bounce">
                                                        <span className="absolute inset-0 rounded-full bg-rose-200/40 animate-ping" />
                                                        <ShieldAlert className="w-8 h-8 relative z-10" />
                                                    </div>
                                                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[10px] font-bold shadow-sm">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Fake GPS / Emulator Detected!
                                                    </div>
                                                    <p className="text-[10px] text-rose-500 font-bold mt-1 text-center px-4 leading-normal">
                                                        {gpsThreatReason || 'ตรวจพบการพยายามใช้แอปสวมสิทธิ์จำลองพิกัดเพื่อโกงเวลาทำงาน'}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400 mt-1 text-center px-4">
                                                        ไม่อนุญาตให้เช็คอิน! กรุณาปิดแอป Fake GPS หรือแอปจำลองพิกัดบนเครื่องของท่านก่อน
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        <div className="w-full bg-gray-50 border border-gray-100 p-4 rounded-3xl space-y-8">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">ระบบตรวจพิกัดปัจจุบันของคุณพบว่า:</p>
                                            <h4 className="font-bold text-gray-800 text-lg flex items-center justify-center gap-1.5">
                                                <MapPin className={`w-4 h-4 ${selectedMatch.type === 'WORK_LOCATION' ? 'text-indigo-600' : 'text-orange-500'}`} />
                                                {selectedMatch.name}
                                            </h4>
                                            <div className="flex justify-center gap-3 text-[11px]">
                                                <span className="text-gray-500">
                                                    ระยะห่างพิกัด: <span className="font-bold text-gray-700">{selectedMatch.distance.toFixed(0)} เมตร</span>
                                                </span>
                                                <span className="text-gray-300">|</span>
                                                <span className={`font-bold ${selectedMatch.type === 'WORK_LOCATION' ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                    {selectedMatch.type === 'WORK_LOCATION' ? 'พิกัดออฟฟิศหลัก' : 'พิกัดสถานที่ถ่ายทำ'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dropdown in case of overlapping / multiple matching locations */}
                                        {detectedMatches.length > 1 && (
                                            <div className="w-full bg-orange-50/50 border border-orange-100 p-3 rounded-2xl text-left">
                                                <label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase tracking-tight">
                                                    พบสถานที่ซ้อนกันในบริเวณนี้ ({detectedMatches.length} แห่ง) โปรดเลือก:
                                                </label>
                                                <select 
                                                    value={selectedMatch.id}
                                                    onChange={(e) => {
                                                        const found = detectedMatches.find(m => m.id === e.target.value);
                                                        if (found) {
                                                            setSelectedMatch(found);
                                                            setSelectedType(found.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');
                                                            setLocationState(prev => ({
                                                                ...prev,
                                                                matchedLocation: found,
                                                                distance: found.distance
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full px-3 py-2 border border-orange-200 rounded-xl text-xs font-bold text-gray-700 outline-none bg-white focus:border-orange-400"
                                                >
                                                    {detectedMatches.map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.name} ({m.type === 'WORK_LOCATION' ? 'ออฟฟิศหลัก' : 'สถานที่ถ่ายทำ'})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="shrink-0 pt-3 border-t border-gray-100 bg-white space-y-2 w-full">
                                        <button 
                                            onClick={handleInstantConfirm}
                                            disabled={!isGpsSecure}
                                            className={`w-full py-3 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ${
                                                isGpsSecure 
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
                                                    : 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> ใช่, ฉันต้องการเข้างานที่นี่
                                        </button>
                                        <button 
                                            onClick={() => handleSetStep('TYPE')}
                                            disabled={!isGpsSecure}
                                            className={`w-full py-2 border rounded-2xl font-bold transition-all text-xs ${
                                                isGpsSecure 
                                                    ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-500' 
                                                    : 'bg-gray-50 border-gray-150 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            ไม่ใช่ตำแหน่งนี้ / ต้องการเลือกประเภทงานเอง
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step: TYPE (Fallback Mode Selector) */}
                            {step === 'TYPE' && (
                                <WorkTypeStep 
                                    matchedLocation={locationState.matchedLocation} 
                                    onSelect={handleTypeSelect} 
                                    approvedWFH={approvedWFH} 
                                    approvedOnsite={approvedOnsite}
                                    allLocations={targets}
                                    onBack={() => handleSetStep(selectedMatch ? 'CONFIRM_LOCATION' : 'LOCATION')}
                                />
                            )}

                            {/* Step: PREVIEW (Check-in review) */}
                            {step === 'PREVIEW' && (
                                <PreviewStep 
                                    capturedFile={capturedFile}
                                    challenge={challenge}
                                    locationState={locationState}
                                    selectedType={selectedType}
                                    isSubmitting={isSubmitting || compressing}
                                    timeLeft={timeLeft}
                                    onRetake={() => handleSetStep('CAMERA')}
                                    onSubmit={() => handleSubmit(false)}
                                />
                            )}

                            {/* Step: NO_CONFIG (Error Fallback) */}
                            {step === 'NO_CONFIG' && (
                                <div className="flex-1 flex flex-col justify-between text-center">
                                    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center py-4">
                                        <div className="bg-amber-50 p-3 rounded-full mb-3 border border-amber-100">
                                            <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                                        </div>
                                        <h4 className="text-base font-bold text-gray-800 mb-1.5">
                                            ไม่พบข้อมูลพิกัดสถานที่ทำงาน
                                        </h4>
                                        <p className="text-xs text-gray-500 leading-relaxed px-4">
                                            ขณะนี้ระบบยังไม่มีการตั้งค่าพิกัดสำนักงานหลักหรือสถานที่ปฏิบัติงาน กรุณาติดต่อฝ่ายบุคคล (HR) หรือผู้ดูแลระบบให้ดำเนินการปักหมุดพิกัดในเมนูตั้งค่าก่อนครับ
                                        </p>
                                    </div>
                                    <div className="shrink-0 pt-3 border-t border-gray-100 bg-white w-full">
                                        {currentUserProfile?.role === 'ADMIN' ? (
                                            <div className="space-y-2">
                                                <button 
                                                    onClick={() => {
                                                        onClose();
                                                        setSearchParams(prev => {
                                                            const next = new URLSearchParams(prev);
                                                            next.set('view', 'MASTER_DATA');
                                                            next.set('tab', 'ATTENDANCE_RULES');
                                                            return next;
                                                        });
                                                    }}
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Settings className="w-4 h-4" /> ไปหน้าตั้งค่าพิกัดทันที
                                                </button>
                                                <button 
                                                    onClick={onClose}
                                                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-semibold transition-all border border-gray-150 text-xs"
                                                >
                                                    ปิดหน้าต่าง
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={onClose}
                                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                                            >
                                                ตกลง / ปิดหน้าต่าง
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default CheckInModal;
