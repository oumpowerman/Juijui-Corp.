
import React from 'react';
import { AlertTriangle, MapPin, CheckCircle2, Navigation } from 'lucide-react';
import { LocationDef } from '../../../types/attendance';

interface LocationStepProps {
    status: 'LOADING' | 'SUCCESS' | 'ERROR';
    distance: number;
    lat: number;
    lng: number;
    matchedLocation?: LocationDef;
    onRetry: () => void;
}

const LocationStep: React.FC<LocationStepProps> = ({ status, distance, lat, lng, matchedLocation, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
            {status === 'LOADING' ? (
                <>
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">กำลังระบุตำแหน่ง...</p>
                </>
            ) : status === 'ERROR' ? (
                <>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2"><AlertTriangle className="w-8 h-8"/></div>
                    <p className="text-red-600 font-bold">ไม่สามารถระบุตำแหน่งได้</p>
                    <p className="text-xs text-gray-400">กรุณาเปิด GPS / อนุญาต Browser แล้วลองใหม่</p>
                    <button onClick={onRetry} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">ลองใหม่</button>
                </>
            ) : (
                <>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 animate-bounce-slow ${matchedLocation ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {matchedLocation ? <MapPin className="w-8 h-8"/> : <Navigation className="w-8 h-8" />}
                    </div>
                    <div className="space-y-1">
                        <p className="text-gray-800 font-bold text-lg">ระบุตำแหน่งสำเร็จ</p>
                        {matchedLocation ? (
                            <>
                                <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                                    <CheckCircle2 className="w-3 h-3"/> อยู่ที่: {matchedLocation.name}
                                </p>
                                <p className="text-[10px] text-gray-400">ระยะห่าง: {distance.toFixed(0)} เมตร</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-orange-500 font-medium">อยู่นอกพื้นที่ออฟฟิศ</p>
                                <p className="text-xs text-gray-400">
                                    ห่างจากจุดที่ใกล้ที่สุด: <span className="font-bold text-gray-600">{distance.toFixed(0)} เมตร</span>
                                </p>
                            </>
                        )}
                        <p className="text-[10px] text-gray-300 font-mono mt-1 pt-1 border-t border-gray-100 w-fit mx-auto px-3">
                            GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default LocationStep;
