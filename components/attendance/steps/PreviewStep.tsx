
import React from 'react';
import { RefreshCw, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { LocationDef, WorkLocation } from '../../../types/attendance';

interface PreviewStepProps {
    capturedFile: File | null;
    challenge: string;
    locationState: { lat: number; lng: number; matchedLocation?: LocationDef };
    selectedType: WorkLocation | null;
    isSubmitting: boolean;
    onRetake: () => void;
    onSubmit: () => void;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ 
    capturedFile, challenge, locationState, selectedType, isSubmitting, onRetake, onSubmit 
}) => {
    if (!capturedFile) return null;

    return (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
            <div className="relative">
                {/* Photo Preview */}
                <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md relative group bg-black">
                    <img src={URL.createObjectURL(capturedFile)} className="w-full h-full object-cover opacity-90" />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 text-white">
                        <p className="text-xs opacity-80 uppercase font-bold">Challenge Completed</p>
                        <p className="text-lg font-bold">"{challenge}"</p>
                    </div>
                </div>
                
                {/* Location Confirmation Card (Floating) */}
                <div className="absolute -bottom-6 left-2 right-2 bg-white p-3 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in slide-in-from-bottom-4 delay-150">
                    <div className={`p-2.5 rounded-full shrink-0 ${locationState.matchedLocation ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">CHECKING IN AT</p>
                        <h4 className="font-bold text-gray-800 text-sm truncate">
                            {locationState.matchedLocation ? locationState.matchedLocation.name : (selectedType === 'WFH' ? 'บ้าน (WFH)' : 'นอกสถานที่ (On Site)')}
                        </h4>
                        {!locationState.matchedLocation && (
                            <p className="text-[10px] text-gray-400 truncate">{locationState.lat.toFixed(5)}, {locationState.lng.toFixed(5)}</p>
                        )}
                    </div>
                    {locationState.matchedLocation && (
                        <div className="bg-green-500 text-white p-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Spacer for floating card */}
            <div className="h-4"></div>
            
            <div className="flex gap-3 pt-2">
                <button 
                    onClick={onRetake}
                    className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                >
                    <RefreshCw className="w-4 h-4" /> ถ่ายใหม่
                </button>
                <button 
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5" />}
                    ยืนยันเช็คอิน
                </button>
            </div>
        </div>
    );
};

export default PreviewStep;
