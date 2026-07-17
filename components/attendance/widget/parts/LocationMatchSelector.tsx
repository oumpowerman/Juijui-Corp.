import React from 'react';
import { MapPin } from 'lucide-react';
import { CheckInLocationMatch } from '../hooks/useCheckInState';

interface LocationMatchSelectorProps {
    selectedMatch: CheckInLocationMatch;
    detectedMatches: CheckInLocationMatch[];
    onSelectMatch: (match: CheckInLocationMatch) => void;
}

const LocationMatchSelector: React.FC<LocationMatchSelectorProps> = ({
    selectedMatch,
    detectedMatches,
    onSelectMatch,
}) => {
    return (
        <div className="space-y-4 w-full">
            <div className="w-full bg-gray-50 border border-gray-100 p-4 rounded-3xl space-y-8">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">
                    ระบบตรวจพิกัดปัจจุบันของคุณพบว่า:
                </p>
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
                                onSelectMatch(found);
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
    );
};

export default LocationMatchSelector;
