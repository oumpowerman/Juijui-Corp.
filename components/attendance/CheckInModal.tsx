
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { calculateDistance, OFFICE_COORDS, getRandomPose } from '../../lib/locationUtils';
import { WorkLocation, LocationDef } from '../../types/attendance';
import CameraView from './CameraView';

// Sub-steps components
import LocationStep from './steps/LocationStep';
import WorkTypeStep from './steps/WorkTypeStep';
import PreviewStep from './steps/PreviewStep';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => void;
    availableLocations?: LocationDef[]; // Accept list of locations
}

type Step = 'LOCATION' | 'TYPE' | 'CAMERA' | 'PREVIEW';

const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, onConfirm, availableLocations = [] }) => {
    const [step, setStep] = useState<Step>('LOCATION');
    
    // Updated State: Added 'distance' to store the calculated meters
    const [locationState, setLocationState] = useState<{ 
        status: 'LOADING' | 'SUCCESS' | 'ERROR', 
        lat: number, 
        lng: number, 
        matchedLocation?: LocationDef,
        distance?: number // Distance to the matched OR closest location
    }>({
        status: 'LOADING', lat: 0, lng: 0
    });

    const [selectedType, setSelectedType] = useState<WorkLocation | null>(null);
    const [challenge, setChallenge] = useState('');
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fallback if no locations provided (should come from Master Data)
    const targets = availableLocations.length > 0 ? availableLocations : [
        { id: 'def', name: 'Office', ...OFFICE_COORDS }
    ];

    // Reset when open
    useEffect(() => {
        if (isOpen) {
            setStep('LOCATION');
            setChallenge(getRandomPose());
            setCapturedFile(null);
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
                
                // Check against ALL defined locations to find Match OR Closest
                let matched: LocationDef | undefined = undefined;
                let minDistance = Infinity;
                
                for (const loc of targets) {
                    const dist = calculateDistance(latitude, longitude, loc.lat, loc.lng);
                    
                    // Track closest distance for UI feedback
                    if (dist < minDistance) {
                        minDistance = dist;
                    }

                    if (dist <= loc.radiusMeters) {
                        matched = loc;
                        minDistance = dist; // If matched, this is the relevant distance
                        break; // Stop at first match
                    }
                }

                setLocationState({
                    status: 'SUCCESS',
                    lat: latitude,
                    lng: longitude,
                    matchedLocation: matched,
                    distance: minDistance // Store calculated distance
                });
                
                // Auto proceed after short delay
                setTimeout(() => setStep('TYPE'), 1500); // Increased delay slightly to let user see the status
            },
            (err) => {
                console.error(err);
                setLocationState({ ...locationState, status: 'ERROR' });
            },
            { enableHighAccuracy: true }
        );
    };

    const handleTypeSelect = (type: WorkLocation) => {
        const isNearAnyOffice = !!locationState.matchedLocation;
        
        if (type === 'OFFICE' && !isNearAnyOffice && locationState.status === 'SUCCESS') {
            alert(`คุณไม่ได้อยู่ในพื้นที่ Office หรือ Site งานที่กำหนดไว้ครับ \n\n(ห่างจากจุดที่ใกล้ที่สุด ${locationState.distance?.toFixed(0)} เมตร) \n\nกรุณาเลือก "On Site" หากออกกองนอกสถานที่ หรือ "WFH"`);
            return;
        }
        
        setSelectedType(type);
        setStep('CAMERA');
    };

    const handleCapture = (file: File) => {
        setCapturedFile(file);
        setStep('PREVIEW'); // Close camera view, show preview modal
    };

    const handleSubmit = async () => {
        if (!selectedType || !capturedFile) return;
        setIsSubmitting(true);
        
        // Pass location name if matched, otherwise generic
        const locName = locationState.matchedLocation ? locationState.matchedLocation.name : undefined;
        
        await onConfirm(selectedType, capturedFile, { lat: locationState.lat, lng: locationState.lng }, locName);
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    // --- STEP: CAMERA OVERLAY (Intercepts if step is CAMERA) ---
    if (step === 'CAMERA') {
        return <CameraView challengeText={challenge} onCapture={handleCapture} onClose={() => setStep('TYPE')} />;
    }

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4 animate-in fade-in duration-200 font-sans">
            {/* 
                RESPONSIVE ADJUSTMENT: 
                Mobile: w-full h-full rounded-none (Full Screen App feel)
                Desktop: w-full max-w-sm rounded-3xl (Card feel)
            */}
            <div className="bg-white w-full h-full md:h-auto md:max-w-sm md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-10 duration-300">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0 safe-area-top">
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">ลงเวลาเข้างาน</h3>
                        <p className="text-xs text-gray-400">
                            Step: {step === 'LOCATION' ? '1/3' : step === 'TYPE' ? '2/3' : '3/3'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    
                    {step === 'LOCATION' && (
                        <div className="h-full flex flex-col justify-center">
                            <LocationStep 
                                status={locationState.status} 
                                distance={locationState.distance || 0} // Pass calculated distance
                                lat={locationState.lat} 
                                lng={locationState.lng} 
                                matchedLocation={locationState.matchedLocation}
                                onRetry={checkLocation}
                            />
                        </div>
                    )}

                    {step === 'TYPE' && (
                        <WorkTypeStep 
                            matchedLocation={locationState.matchedLocation} 
                            onSelect={handleTypeSelect} 
                        />
                    )}

                    {step === 'PREVIEW' && (
                        <PreviewStep 
                            capturedFile={capturedFile}
                            challenge={challenge}
                            locationState={locationState}
                            selectedType={selectedType}
                            isSubmitting={isSubmitting}
                            onRetake={() => setStep('CAMERA')}
                            onSubmit={handleSubmit}
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CheckInModal;
