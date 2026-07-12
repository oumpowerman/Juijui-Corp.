import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { X, AlertTriangle, Clock, ArrowRight, CheckCircle2, CloudOff, Settings, ShieldCheck, ShieldAlert, MapPin, Check, RefreshCw } from 'lucide-react';
import { calculateDistance, OFFICE_COORDS, getRandomPose } from '../../../lib/locationUtils';
import { WorkLocation, LocationDef } from '../../../types/attendance';
import CameraView from './CameraView';
import { compressImage } from '../../../lib/imageUtils';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useMasterData } from '../../../hooks/useMasterData';
import { useUserSession } from '../../../context/UserSessionContext';
import { checkNeedsSelfieVerification } from '../../../lib/selfieUtils';

// Sub-steps components
import LocationStep from '../steps/LocationStep';
import WorkTypeStep from '../steps/WorkTypeStep';
import PreviewStep from '../steps/PreviewStep';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (type: WorkLocation, file: File | null, location: { lat: number, lng: number }, locationName?: string) => void;
    availableLocations?: LocationDef[]; // Accept list of locations
    startTime?: string;
    lateBuffer?: number;
    onSwitchToLeave?: () => void;
    approvedWFH?: boolean; 
    hasLateRequest?: boolean; 
    isDriveConnected?: boolean; 
    userId?: string; 
}

type Step = 'LOCATION' | 'CONFIRM_LOCATION' | 'TYPE' | 'CAMERA' | 'PREVIEW' | 'NO_CONFIG';

const CheckInModal: React.FC<CheckInModalProps> = ({ 
    isOpen, onClose, onConfirm, availableLocations = [], startTime, lateBuffer = 0, onSwitchToLeave, approvedWFH, hasLateRequest, isDriveConnected, userId 
}) => {
    const { showAlert } = useGlobalDialog();
    const { masterOptions, isLoading } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const [searchParams, setSearchParams] = useSearchParams();
    const [step, setStep] = useState<Step>('LOCATION');
    
    const [locationState, setLocationState] = useState<{ 
        status: 'LOADING' | 'SUCCESS' | 'ERROR', 
        lat: number, 
        lng: number, 
        matchedLocation?: LocationDef,
        distance?: number 
    }>({
        status: 'LOADING', lat: 0, lng: 0
    });

    const [selectedType, setSelectedType] = useState<WorkLocation | null>(null);
    const [challenge, setChallenge] = useState('');
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [compressing, setCompressing] = useState(false);
    const [showLateIntervention, setShowLateIntervention] = useState(false);
    const [bypassSelfie, setBypassSelfie] = useState(false);

    // Dynamic Multi-Match location states
    const [detectedMatches, setDetectedMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
    const [isGpsSecure, setIsGpsSecure] = useState(true);

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

    useEffect(() => {
        if (isOpen) {
            if (isLoading) return;

            const hasLocations = availableLocations && availableLocations.length > 0;
            const latOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
            const lngOpt = masterOptions?.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
            const hasOfficeConfig = !!(latOpt?.label && lngOpt?.label);

            if (!hasLocations && !hasOfficeConfig) {
                setStep('NO_CONFIG');
                return;
            }

            setStep('LOCATION');
            setChallenge(getRandomPose());
            setCapturedFile(null);
            setShowLateIntervention(false);
            setBypassSelfie(false);
            setDetectedMatches([]);
            setSelectedMatch(null);
            setIsGpsSecure(true);
            
            checkLocation();
        }
    }, [isOpen, isLoading, availableLocations, masterOptions]);

    useEffect(() => {
        if (hasLateRequest && showLateIntervention) {
            setShowLateIntervention(false);
        }
    }, [hasLateRequest, showLateIntervention]);

    const checkLocation = () => {
        setLocationState({ status: 'LOADING', lat: 0, lng: 0 });
        if (!navigator.geolocation) {
            setLocationState({ status: 'ERROR', lat: 0, lng: 0 });
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                
                // Heuristic anti-fake location / simulated GPS verification
                // Extremely low accuracy values (e.g. exactly 0) are highly suspicious on standard browsers.
                const suspicious = accuracy === 0;
                setIsGpsSecure(!suspicious);

                const matches: any[] = [];
                let minDistance = Infinity;
                let closestTarget: any = null;
                
                for (const loc of targets) {
                    const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestTarget = loc;
                    }
                    if (dist <= loc.radiusMeters) {
                        matches.push({
                            ...loc,
                            distance: dist
                        });
                    }
                }

                // Sort matches with closest first
                matches.sort((a, b) => a.distance - b.distance);

                if (matches.length > 0) {
                    const primaryMatch = matches[0];
                    setDetectedMatches(matches);
                    setSelectedMatch(primaryMatch);
                    setSelectedType(primaryMatch.type === 'WORK_LOCATION' ? 'OFFICE' : 'SITE');

                    setLocationState({
                        status: 'SUCCESS',
                        lat: latitude,
                        lng: longitude,
                        matchedLocation: primaryMatch,
                        distance: primaryMatch.distance
                    });
                    
                    // Route to confirmation screen immediately after short check transition
                    setTimeout(() => setStep('CONFIRM_LOCATION'), 1200);
                } else {
                    // No locations matched, go straight to manual selector step (WorkTypeStep)
                    setDetectedMatches([]);
                    setSelectedMatch(null);

                    setLocationState({
                        status: 'SUCCESS',
                        lat: latitude,
                        lng: longitude,
                        matchedLocation: undefined,
                        distance: minDistance
                    });

                    setTimeout(() => setStep('TYPE'), 1500);
                }
            },
            (err) => {
                console.error(err);
                setLocationState({ status: 'ERROR', lat: 0, lng: 0 });
            },
            { enableHighAccuracy: true }
        );
    };

    const handleTypeSelect = (type: WorkLocation, customName?: string) => {
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
            handleSubmit(false, type, true);
            return;
        } else {
            setBypassSelfie(false);
            setStep('CAMERA');
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
            setStep('CAMERA');
        }
    };

    const handleCapture = (file: File) => {
        setCapturedFile(file);
        setStep('PREVIEW');
    };

    const handleSubmit = async (forceCheckIn = false, typeToSubmit?: WorkLocation, bypassFile?: boolean) => {
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
            
            await onConfirm(targetType, compressedFile, { lat: locationState.lat, lng: locationState.lng }, locName);
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            showAlert("ไม่สามารถบันทึกข้อมูลการลงเวลาได้ กรุณาลองใหม่อีกครั้ง", "เกิดข้อผิดพลาด");
        } finally {
            setCompressing(false);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (step === 'CAMERA') {
        return <CameraView challengeText={challenge} onCapture={handleCapture} onClose={() => setStep(selectedMatch ? 'CONFIRM_LOCATION' : 'TYPE')} />;
    }

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-sm h-auto max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
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

                <div className="p-6 flex-1 overflow-y-auto relative">
                    {/* Late Intervention Overlay */}
                    {showLateIntervention && (
                        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in zoom-in-95">
                            <div className="bg-red-50 p-4 rounded-full mb-4 animate-bounce">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">เข้างานสายเกินกำหนด! 😱</h3>
                            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                                ตอนนี้เลยกำหนดเวลาเริ่มเข้างานแล้ว ({startTime} น.) <br/>
                                ระบบจะบันทึกสถานะว่า <b>"มาสาย"</b> และอาจมีการหักแต้ม HP อัตโนมัติ
                            </p>
                            
                            <div className="w-full space-y-3">
                                <button 
                                    onClick={() => {
                                        if (onSwitchToLeave) onSwitchToLeave();
                                        else onClose();
                                    }}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Clock className="w-5 h-5" /> แจ้งขออนุญาตลา / เข้าสายพิเศษ
                                </button>
                                <button 
                                    onClick={() => handleSubmit(true, undefined, bypassSelfie)}
                                    className="w-full py-3.5 bg-white border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    เช็คอินทันที (ยอมรับเงื่อนไขการสาย) <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: LOCATION (Scanning GPS) */}
                    {step === 'LOCATION' && (
                        <div className="h-full flex flex-col justify-center">
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
                        <div className="text-center space-y-5 animate-in slide-in-from-right-8 duration-300">
                            {/* Shield Verification Badging */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3 relative animate-pulse">
                                    <span className="absolute inset-0 rounded-full bg-emerald-200/40 animate-ping" />
                                    <ShieldCheck className="w-10 h-10 relative z-10" />
                                </div>
                                <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold shadow-sm">
                                    <Check className="w-3.5 h-3.5" />
                                    GPS Secure Verified
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">ตรวจสอบระบบยืนยันตัวตนพิกัด & ป้องกันสวมสิทธิ์พิกัดปลอมสำเร็จ</p>
                            </div>

                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-3xl space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">ระบบตรวจพิกัดปัจจุบันของคุณพบว่า:</p>
                                <h4 className="font-bold text-gray-800 text-xl flex items-center justify-center gap-1.5">
                                    <MapPin className={`w-5 h-5 ${selectedMatch.type === 'WORK_LOCATION' ? 'text-indigo-600' : 'text-orange-500'}`} />
                                    {selectedMatch.name}
                                </h4>
                                <div className="flex justify-center gap-3 text-xs">
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
                                <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-2xl text-left animate-in slide-in-from-bottom-2 duration-200">
                                    <label className="block text-[11px] font-bold text-orange-600 mb-1 uppercase tracking-tight">
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
                                        className="w-full px-3 py-2 border border-orange-200 rounded-xl text-sm font-bold text-gray-700 outline-none bg-white focus:border-orange-400"
                                    >
                                        {detectedMatches.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.type === 'WORK_LOCATION' ? 'ออฟฟิศหลัก' : 'สถานที่ถ่ายทำ'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <button 
                                    onClick={handleInstantConfirm}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> ใช่, ฉันต้องการเข้างานที่นี่
                                </button>
                                <button 
                                    onClick={() => setStep('TYPE')}
                                    className="w-full py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 rounded-2xl font-bold transition-all text-xs"
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
                            allLocations={targets}
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
                            onRetake={() => setStep('CAMERA')}
                            onSubmit={() => handleSubmit(false)}
                        />
                    )}

                    {/* Step: NO_CONFIG (Error Fallback) */}
                    {step === 'NO_CONFIG' && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-6 animate-in fade-in duration-300">
                            <div className="bg-amber-50 p-4 rounded-full mb-4 border border-amber-100">
                                <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-800 mb-2">
                                ไม่พบข้อมูลพิกัดสถานที่ทำงาน
                            </h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6 px-2">
                                ขณะนี้ระบบยังไม่มีการตั้งค่าพิกัดสำนักงานหลักหรือสถานที่ปฏิบัติงาน กรุณาติดต่อฝ่ายบุคคล (HR) หรือผู้ดูแลระบบให้ดำเนินการปักหมุดพิกัดในเมนูตั้งค่าก่อนครับ
                            </p>
                            {currentUserProfile?.role === 'ADMIN' ? (
                                <div className="w-full space-y-2">
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
                                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Settings className="w-4 h-4" /> ไปหน้าตั้งค่าพิกัดทันที
                                    </button>
                                    <button 
                                        onClick={onClose}
                                        className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-semibold transition-all border border-gray-150"
                                    >
                                        ปิดหน้าต่าง
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={onClose}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                                >
                                    ตกลง / ปิดหน้าต่าง
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CheckInModal;
