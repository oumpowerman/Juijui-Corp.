import React from 'react';
import { MapPin, Crosshair } from 'lucide-react';

interface OfficeConfig {
    lat: string;
    lng: string;
    radius: string;
}

interface LocationGeofencingCardProps {
    officeConfig: OfficeConfig;
    setOfficeConfig: React.Dispatch<React.SetStateAction<OfficeConfig>>;
    getCurrentLocation: () => void;
    isLocating: boolean;
    handleSaveLocationConfig: () => Promise<void>;
}

const LocationGeofencingCard: React.FC<LocationGeofencingCardProps> = ({
    officeConfig,
    setOfficeConfig,
    getCurrentLocation,
    isLocating,
    handleSaveLocationConfig,
}) => {
    return (
        <div id="location-geofencing-card" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50 pointer-events-none"></div>
            <h3 className="font-bold text-gray-800 flex items-center mb-6 relative z-10">
                <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                ตั้งค่าพิกัดออฟฟิศ (Office Location)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                    <input 
                        id="input-office-lat"
                        type="text" 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-100 outline-none"
                        placeholder="13.xxxxxx"
                        value={officeConfig.lat}
                        onChange={e => setOfficeConfig(prev => ({ ...prev, lat: e.target.value }))}
                    />
                </div>
                <div className="col-span-2">
                     <label className="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                    <input 
                        id="input-office-lng"
                        type="text" 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-100 outline-none"
                        placeholder="100.xxxxxx"
                        value={officeConfig.lng}
                        onChange={e => setOfficeConfig(prev => ({ ...prev, lng: e.target.value }))}
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">รัศมี (เมตร)</label>
                    <input 
                        id="input-office-radius"
                        type="number" 
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-100 outline-none"
                        placeholder="Default: 500"
                        value={officeConfig.radius}
                        onChange={e => setOfficeConfig(prev => ({ ...prev, radius: e.target.value }))}
                    />
                </div>
                <div className="col-span-2 flex items-end gap-2">
                     <button 
                        id="btn-get-current-location"
                        onClick={getCurrentLocation}
                        disabled={isLocating}
                        className="flex-1 bg-orange-50 text-orange-600 border border-orange-100 px-3 py-2.5 rounded-xl font-bold hover:bg-orange-100 transition-all text-xs flex items-center justify-center gap-2 animate-all"
                    >
                        <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} /> 
                        {isLocating ? 'Locating...' : 'ดึงพิกัดปัจจุบัน'}
                    </button>
                    <button 
                        id="btn-save-location-config"
                        onClick={handleSaveLocationConfig}
                        className="flex-1 bg-orange-500 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all text-xs shadow-md shadow-orange-100"
                    >
                        บันทึกพิกัด
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationGeofencingCard;
