
import React from 'react';
import { RefreshCw, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { LocationDef, WorkLocation } from '../../../types/attendance';

interface PreviewStepProps {
    capturedFile: File | null;
    challenge: string;
    locationState: { lat: number; lng: number; matchedLocation?: LocationDef };
    selectedType: WorkLocation | null;
    isSubmitting: boolean;
    timeLeft: number;
    onRetake: () => void;
    onSubmit: () => void;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ 
    capturedFile, challenge, locationState, selectedType, isSubmitting, timeLeft, onRetake, onSubmit 
}) => {
    if (!capturedFile) return null;

    return (
        <div className="flex-1 w-full flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin pb-4">
                <div className="relative">
                    {/* Photo Preview */}
                    <div className="h-[220px] w-full rounded-[2rem] overflow-hidden shadow-md relative group bg-black">
                        <img src={URL.createObjectURL(capturedFile)} className="w-full h-full object-cover opacity-90" />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-white">
                            <p className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Challenge Completed</p>
                            <p className="text-base font-bold">"{challenge}"</p>
                        </div>
                    </div>
                    
                    {/* Location Confirmation Card (Floating) */}
                    <div className="absolute -bottom-6 left-2 right-2 bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-4 delay-150">
                        <div className={`p-2 rounded-full shrink-0 ${locationState.matchedLocation ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">CHECKING IN AT</p>
                            <h4 className="font-bold text-gray-800 text-xs truncate">
                                {locationState.matchedLocation ? locationState.matchedLocation.name : (selectedType === 'WFH' ? 'บ้าน (WFH)' : 'นอกสถานที่ (On Site)')}
                            </h4>
                            {!locationState.matchedLocation && (
                                <p className="text-[9px] text-gray-400 truncate">{locationState.lat.toFixed(5)}, {locationState.lng.toFixed(5)}</p>
                            )}
                        </div>
                        {locationState.matchedLocation && (
                            <div className="bg-green-500 text-white p-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Spacer for floating card */}
                <div className="h-4"></div>
            </div>
            
            <div className="shrink-0 pt-3 border-t border-gray-100 bg-white flex gap-3 w-full">
                <button 
                    onClick={onRetake}
                    className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center gap-2 text-xs transition-all"
                    disabled={isSubmitting}
                >
                    <RefreshCw className="w-4 h-4" /> ถ่ายใหม่
                </button>
                <button 
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className={`flex-[2] py-3 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs
                        ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}
                    `}
                >
                    {isSubmitting ? (
                        <div className="flex flex-col items-center leading-tight">
                            <div className="flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                                <span>กำลังอัปโหลด...</span>
                            </div>
                            <span className="text-[8px] font-normal opacity-80">ระบบสำรองทำงานใน {timeLeft}s</span>
                        </div>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ยืนยันเช็คอิน</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PreviewStep;
