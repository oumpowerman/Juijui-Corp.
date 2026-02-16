
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { calculateDistance, OFFICE_COORDS, getRandomPose } from '../../lib/locationUtils';
import { WorkLocation, LocationDef } from '../../types/attendance';
import CameraView from './CameraView';
import { compressImage } from '../../lib/imageUtils';

// Sub-steps components
import LocationStep from './steps/LocationStep';
import WorkTypeStep from './steps/WorkTypeStep';
import PreviewStep from './steps/PreviewStep';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => void;
    availableLocations?: LocationDef[]; // Accept list of locations
    startTime?: string;
    lateBuffer?: number;
    onSwitchToLeave?: () => void;
    approvedWFH?: boolean; // NEW PROP
}

type Step = 'LOCATION' | 'TYPE' | 'CAMERA' | 'PREVIEW';

const CheckInModal: React.FC<CheckInModalProps> = ({ 
    isOpen, onClose, onConfirm, availableLocations = [], startTime, lateBuffer = 0, onSwitchToLeave, approvedWFH 
}) => {
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
    const [compressing, setCompressing] = useState(false);
    const [showLateIntervention, setShowLateIntervention] = useState(false);

    const targets = availableLocations.length > 0 ? availableLocations : [
        { id: 'def', name: 'Office', ...OFFICE_COORDS }
    ];

    useEffect(() => {
        if (isOpen) {
            setStep('LOCATION');
            setChallenge(getRandomPose());
            setCapturedFile(null);
            setShowLateIntervention(false);
            
            // If WFH is approved, we can pre-set type or just handle it in steps
            // We still check location to record it, but UI will change
            checkLocation();
        }
    }, [isOpen]);

    const checkLocation = () => {
        setLocationState({ ...locationState, status: 'LOADING' });
        if (!navigator.geolocation) {
            setLocationState({ ...locationState, status: 'ERROR' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                let matched: LocationDef | undefined = undefined;
                let minDistance = Infinity;
                
                for (const loc of targets) {
                    const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
                    if (dist < minDistance) minDistance = dist;
                    if (dist <= loc.radiusMeters) {
                        matched = loc;
                        minDistance = dist;
                        break;
                    }
                }

                setLocationState({
                    status: 'SUCCESS',
                    lat: latitude,
                    lng: longitude,
                    matchedLocation: matched,
                    distance: minDistance
                });
                
                setTimeout(() => setStep('TYPE'), 1500);
            },
            (err) => {
                console.error(err);
                setLocationState({ ...locationState, status: 'ERROR' });
            },
            { enableHighAccuracy: true }
        );
    };

    const handleTypeSelect = (type: WorkLocation) => {
        // If approved WFH, allow skipping location check for WFH type
        if (type === 'WFH' && approvedWFH) {
             // Allowed by approval
        } else {
             const isNearAnyOffice = !!locationState.matchedLocation;
             if (type === 'OFFICE' && !isNearAnyOffice && locationState.status === 'SUCCESS') {
                alert(`คุณไม่ได้อยู่ในพื้นที่ออฟฟิศครับ (ห่าง ${locationState.distance?.toFixed(0)} ม.)`);
                return;
            }
        }

        setSelectedType(type);
        setStep('CAMERA');
    };

    const handleCapture = (file: File) => {
        setCapturedFile(file);
        setStep('PREVIEW');
    };

    const handleSubmit = async (forceCheckIn = false) => {
        if (!selectedType || !capturedFile) return;

        // --- Late Intervention Logic ---
        if (startTime && !forceCheckIn && !showLateIntervention) {
            const now = new Date();
            const [h, m] = startTime.split(':').map(Number);
            const limit = new Date();
            limit.setHours(h, m + lateBuffer, 0, 0);

            if (now > limit) {
                setShowLateIntervention(true);
                return;
            }
        }

        setIsSubmitting(true);
        setCompressing(true);
        setShowLateIntervention(false);
        
        try {
            // COMPRESSION LOGIC
            const compressedFile = await compressImage(capturedFile);
            
            // Pass Location Name
            let locName = locationState.matchedLocation ? locationState.matchedLocation.name : 'On Site';
            if (selectedType === 'WFH') locName = 'Home (WFH)';
            
            await onConfirm(selectedType, compressedFile, { lat: locationState.lat, lng: locationState.lng }, locName);
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่");
        } finally {
            setCompressing(false);
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (step === 'CAMERA') {
        return <CameraView challengeText={challenge} onCapture={handleCapture} onClose={() => setStep('TYPE')} />;
    }

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-sm h-auto max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">ลงเวลาเข้างาน</h3>
                        <p className="text-xs text-gray-400">
                            {compressing ? 'กำลังบีบอัดภาพ...' : `Step: ${step === 'LOCATION' ? '1/3' : step === 'TYPE' ? '2/3' : '3/3'}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto relative">
                    {/* Late Intervention Overlay */}
                    {showLateIntervention && (
                        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in zoom-in-95">
                            <div className="bg-red-50 p-4 rounded-full mb-4 animate-bounce">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-2">สายเกินกำหนด! 😱</h3>
                            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                                ตอนนี้เลยเวลาเข้างาน ({startTime} น.) แล้ว <br/>
                                ระบบจะบันทึกว่า <b>"มาสาย"</b> และหักคะแนน
                            </p>
                            
                            <div className="w-full space-y-3">
                                <button 
                                    onClick={() => {
                                        if (onSwitchToLeave) onSwitchToLeave();
                                        else onClose();
                                    }}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Clock className="w-5 h-5" /> แจ้งขอเข้าสาย / ลา
                                </button>
                                <button 
                                    onClick={() => handleSubmit(true)}
                                    className="w-full py-3.5 bg-white border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    เช็คอินเลย (ยอมรับโทษ) <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'LOCATION' && (
                        <div className="h-full flex flex-col justify-center">
                            <LocationStep 
                                status={locationState.status} 
                                distance={locationState.distance || 0} 
                                lat={locationState.lat} 
                                lng={locationState.lng} 
                                matchedLocation={locationState.matchedLocation}
                                onRetry={checkLocation}
                                approvedWFH={approvedWFH} // Display "WFH Approved" badge
                            />
                        </div>
                    )}

                    {step === 'TYPE' && (
                        <WorkTypeStep 
                            matchedLocation={locationState.matchedLocation} 
                            onSelect={handleTypeSelect} 
                            approvedWFH={approvedWFH} // Enable WFH button even if location is off
                        />
                    )}

                    {step === 'PREVIEW' && (
                        <PreviewStep 
                            capturedFile={capturedFile}
                            challenge={challenge}
                            locationState={locationState}
                            selectedType={selectedType}
                            isSubmitting={isSubmitting || compressing}
                            onRetake={() => setStep('CAMERA')}
                            onSubmit={() => handleSubmit(false)}
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CheckInModal;
