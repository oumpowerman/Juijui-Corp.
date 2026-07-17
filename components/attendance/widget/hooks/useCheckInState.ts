import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkLocation, LocationDef } from '../../../../types/attendance';
import { getRandomPose, OFFICE_COORDS } from '../../../../lib/locationUtils';
import { compressImage } from '../../../../lib/imageUtils';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { useMasterData } from '../../../../hooks/useMasterData';
import { useUserSession } from '../../../../context/UserSessionContext';
import { checkNeedsSelfieVerification } from '../../../../lib/selfieUtils';
import { useCheckInLocation } from '../../../../hooks/attendance/useCheckInLocation';

export type CheckInStep = 'LOCATION' | 'CONFIRM_LOCATION' | 'TYPE' | 'CAMERA' | 'PREVIEW' | 'NO_CONFIG';

export interface CheckInLocationMatch extends LocationDef {
    distance: number;
    type?: string;
}

const STEP_FLOW_ORDER: CheckInStep[] = ['LOCATION', 'CONFIRM_LOCATION', 'TYPE', 'CAMERA', 'PREVIEW', 'NO_CONFIG'];

interface UseCheckInStateProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (
        type: WorkLocation,
        file: File | null,
        location: { lat: number, lng: number },
        locationName?: string,
        isProvisionalOnsite?: boolean,
        provisionalReason?: string
    ) => void;
    availableLocations?: LocationDef[];
    startTime?: string;
    lateBuffer?: number;
    approvedWFH?: boolean;
    approvedOnsite?: boolean;
    hasLateRequest?: boolean;
    approvedLateTime?: string;
    pendingLateTime?: string;
    userId?: string;
}

export function useCheckInState({
    isOpen,
    onClose,
    onConfirm,
    availableLocations = [],
    startTime,
    lateBuffer = 0,
    approvedWFH,
    approvedOnsite,
    hasLateRequest,
    approvedLateTime,
    pendingLateTime,
    userId,
}: UseCheckInStateProps) {
    const { showAlert } = useGlobalDialog();
    const { masterOptions, isLoading } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const [, setSearchParams] = useSearchParams();

    const [step, setStep] = useState<CheckInStep>('LOCATION');
    const [prevStep, setPrevStep] = useState<CheckInStep | null>(null);
    const [direction, setDirection] = useState(1);

    const getStepIndex = (s: CheckInStep): number => STEP_FLOW_ORDER.indexOf(s);

    const handleSetStep = (newStep: CheckInStep) => {
        setDirection(getStepIndex(newStep) >= getStepIndex(step) ? 1 : -1);
        setPrevStep(step);
        setStep(newStep);
        if (newStep === 'TYPE' || newStep === 'LOCATION') {
            setSelectedType(null);
        }
    };

    const isFadeOnly = step === 'LOCATION' || prevStep === 'LOCATION';

    const [selectedType, setSelectedType] = useState<WorkLocation | null>(null);
    const [provisionalOnsite, setProvisionalOnsite] = useState(false);
    const [provisionalReason, setProvisionalReason] = useState('');
    const [challenge, setChallenge] = useState('');
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [compressing, setCompressing] = useState(false);
    const [showLateIntervention, setShowLateIntervention] = useState(false);
    const [showLatePenaltyBreakdown, setShowLatePenaltyBreakdown] = useState(false);
    const [hasAcceptedLateness, setHasAcceptedLateness] = useState(false);
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

    const isUserLate = useMemo(() => {
        if (!startTime || approvedWFH || hasAcceptedLateness) return false;
        
        const now = new Date();
        if (pendingLateTime) {
            const [ph, pm] = pendingLateTime.split(':').map(Number);
            const pendingLimit = new Date();
            pendingLimit.setHours(ph, pm + lateBuffer, 0, 0);
            const isPendingLatePast = now > pendingLimit;
            
            if (!isPendingLatePast) {
                return false;
            } else {
                return true;
            }
        }
        
        if (hasLateRequest && !approvedLateTime) return false;

        const effectiveStartTime = approvedLateTime || startTime;
        const [h, m] = effectiveStartTime.split(':').map(Number);
        const limit = new Date();
        limit.setHours(h, m + lateBuffer, 0, 0);
        return now > limit;
    }, [startTime, lateBuffer, approvedWFH, hasLateRequest, approvedLateTime, pendingLateTime, hasAcceptedLateness]);

    const lateMinutes = useMemo(() => {
        if (!startTime) return 0;
        
        const now = new Date();
        let effectiveStartTime = startTime;
        if (approvedLateTime) {
            effectiveStartTime = approvedLateTime;
        } else if (pendingLateTime) {
            const [ph, pm] = pendingLateTime.split(':').map(Number);
            const pendingLimit = new Date();
            pendingLimit.setHours(ph, pm + lateBuffer, 0, 0);
            if (now > pendingLimit) {
                effectiveStartTime = pendingLateTime;
            }
        }
        
        const [h, m] = effectiveStartTime.split(':').map(Number);
        const limit = new Date();
        limit.setHours(h, m, 0, 0);
        const diff = Math.floor((now.getTime() - limit.getTime()) / 60000);
        return Math.max(0, diff);
    }, [startTime, approvedLateTime, pendingLateTime, lateBuffer]);

    useEffect(() => {
        if (step === 'CONFIRM_LOCATION' && isGpsSecure && isUserLate && isOpen && !showLateIntervention && !showLatePenaltyBreakdown) {
            const timer = setTimeout(() => {
                setShowLateIntervention(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, isGpsSecure, isUserLate, isOpen, showLateIntervention, showLatePenaltyBreakdown]);

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
            setShowLatePenaltyBreakdown(false);
            setHasAcceptedLateness(false);
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

    const handleSubmit = async (forceCheckIn = false, typeToSubmit?: WorkLocation, bypassFile?: boolean, passProvisionalOnsite?: boolean) => {
        if (isSubmitting) return;

        const targetType = typeToSubmit || selectedType;
        if (!targetType) return;

        const actualBypass = bypassFile !== undefined ? bypassFile : bypassSelfie;
        if (!actualBypass && !capturedFile) return;

        if (startTime && !forceCheckIn && !showLateIntervention && !showLatePenaltyBreakdown && !approvedWFH && !hasAcceptedLateness) {
            const now = new Date();
            let shouldBypass = false;
            
            if (pendingLateTime) {
                const [ph, pm] = pendingLateTime.split(':').map(Number);
                const pendingLimit = new Date();
                pendingLimit.setHours(ph, pm + lateBuffer, 0, 0);
                if (now <= pendingLimit) {
                    shouldBypass = true;
                }
            } else if (hasLateRequest && !approvedLateTime) {
                shouldBypass = true;
            }
            
            if (shouldBypass) {
                // Bypass late check
            } else {
                let effectiveStartTime = startTime;
                if (approvedLateTime) {
                    effectiveStartTime = approvedLateTime;
                } else if (pendingLateTime) {
                    effectiveStartTime = pendingLateTime;
                }
                
                const [h, m] = effectiveStartTime.split(':').map(Number);
                const limit = new Date();
                limit.setHours(h, m + lateBuffer, 0, 0);

                if (now > limit) {
                    if (typeToSubmit) setSelectedType(typeToSubmit);
                    setShowLateIntervention(true);
                    return;
                }
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

    const handleTypeSelect = (type: WorkLocation, customName?: string, isProvisionalOnsite?: boolean, provReason?: string) => {
        if (isSubmitting) return;
        
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
        if (!selectedMatch || isSubmitting) return;

        const finalType = (selectedMatch as CheckInLocationMatch).type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE';
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

    const handleAcceptLateness = () => {
        setShowLateIntervention(false);
        setShowLatePenaltyBreakdown(false);
        setHasAcceptedLateness(true);

        const finalType = selectedType || ((selectedMatch as CheckInLocationMatch)?.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');
        if (!selectedType) {
            setSelectedType(finalType);
        }

        const needsSelfie = needsSelfieDynamic;

        if (!needsSelfie) {
            setBypassSelfie(true);
            handleSubmit(true, finalType, true);
        } else {
            setBypassSelfie(false);
            handleSetStep('CAMERA');
        }
    };

    return {
        step,
        prevStep,
        direction,
        isFadeOnly,
        selectedType,
        setSelectedType,
        provisionalOnsite,
        provisionalReason,
        challenge,
        capturedFile,
        isSubmitting,
        timeLeft,
        compressing,
        showLateIntervention,
        setShowLateIntervention,
        showLatePenaltyBreakdown,
        setShowLatePenaltyBreakdown,
        hasAcceptedLateness,
        bypassSelfie,
        needsSelfieDynamic,
        locationState,
        setLocationState,
        detectedMatches: detectedMatches as CheckInLocationMatch[],
        setDetectedMatches,
        selectedMatch: selectedMatch as CheckInLocationMatch | null,
        setSelectedMatch,
        isGpsSecure,
        gpsThreatReason,
        isUserLate,
        lateMinutes,
        targets,
        isLoadingMasterData: isLoading,
        currentUserProfile,
        handleSetStep,
        checkLocation,
        handleTypeSelect,
        handleInstantConfirm,
        handleCapture,
        handleAcceptLateness,
        handleSubmit,
        setSearchParams,
    };
}
