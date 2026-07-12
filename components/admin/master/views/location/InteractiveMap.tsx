import React, { useState } from 'react';
import { MapPin, Globe, Compass, ExternalLink, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeoLocationItem, getDistanceMeters } from './locationUtils';

interface InteractiveMapProps {
  lat: number;
  lng: number;
  radius: number;
  otherLocations: GeoLocationItem[];
  type: 'WORK_LOCATION' | 'SHOOT_LOCATION';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  lat,
  lng,
  radius,
  otherLocations,
  type,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'radar'>('map');

  // Verify coordinates are realistic
  const isValidCoords = lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);

  // Math calculation: Find nearest overlaps in other registered locations
  const nearestOverlaps = React.useMemo(() => {
    if (!isValidCoords) return [];
    return otherLocations
      .map((loc) => {
        const dist = getDistanceMeters(lat, lng, loc.lat, loc.lng);
        return {
          ...loc,
          distance: dist,
          isOverlapping: dist < (radius + loc.radius),
        };
      })
      .filter((loc) => loc.distance < 2000) // focus on neighbors within 2km
      .sort((a, b) => a.distance - b.distance);
  }, [lat, lng, radius, otherLocations, isValidCoords]);

  // Deep-link URL to Google Maps for exact location lookup
  const googleMapsSearchUrl = isValidCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps`;

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden flex flex-col h-[320px] relative">
      {/* Tab Switcher & Deep Link Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'map'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3 h-3" />
            แผนที่ดาวเทียม
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'radar'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Compass className="w-3 h-3 animate-spin [animation-duration:15s]" />
            เรดาร์ Geofence
          </button>
        </div>

        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all flex items-center gap-1 border border-slate-100"
          title="เปิดตรวจสอบพิกัดบนระบบนำทางหลัก"
        >
          <span>เปิด Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Main Container Stage */}
      <div className="flex-1 relative overflow-hidden bg-slate-900/5">
        <AnimatePresence mode="wait">
          {activeTab === 'map' ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              {isValidCoords ? (
                <iframe
                  title="Google Maps Embed Location Preview"
                  src={`https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0 grayscale-[15%] opacity-95"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <MapPin className="w-8 h-8 text-slate-300 animate-bounce" />
                  <p className="text-xs font-bold text-slate-500">ยังไม่มีพิกัดที่ถูกต้อง</p>
                  <p className="text-[10px] text-slate-400">กรุณากรอก ละติจูด, ลองจิจูด หรือ วางลิงก์ Google Maps เพื่อแสดงตัวอย่าง</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="radar-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-slate-950 p-4 flex flex-col justify-between relative text-slate-200"
            >
              {/* Radar circular container */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-48 h-48 rounded-full border border-indigo-500/30 flex items-center justify-center animate-pulse">
                  <div className="w-36 h-36 rounded-full border border-indigo-500/20 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-indigo-500/10 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-indigo-500/10" />
                    </div>
                  </div>
                </div>
                {/* Rotating scanner sweep */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute w-48 h-48 origin-center bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/15 rounded-full"
                />
              </div>

              {/* Verified Badge / Metrics overlay */}
              <div className="z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Geofence Range Simulator</span>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      รัศมีคุ้มกัน: <span className="text-emerald-400">{radius} เมตร</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Center: {lat.toFixed(4)}, {lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-indigo-950/80 border border-indigo-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm text-[10px] font-bold text-indigo-300">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>ระยะปลอดภัย</span>
                  </div>
                </div>

                {/* Simulated overlaps summary */}
                <div className="space-y-1.5 bg-slate-900/85 border border-slate-800 p-2 rounded-xl backdrop-blur-md max-h-[110px] overflow-y-auto">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">การตรวจหาพิกัดทับซ้อนใกล้เคียง (2 กม.)</span>
                  {nearestOverlaps.length === 0 ? (
                    <p className="text-[10px] text-emerald-400 font-bold">✓ สัญญาณเคลียร์: ไม่มีพิกัดทับซ้อนกับขอบเขตอื่น</p>
                  ) : (
                    <div className="space-y-1">
                      {nearestOverlaps.map((loc) => (
                        <div key={loc.id} className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-300 truncate max-w-[120px]">📍 {loc.label}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">{Math.round(loc.distance)}ม.</span>
                            {loc.isOverlapping ? (
                              <span className="text-rose-400 font-bold animate-pulse text-[9px] bg-rose-950/50 px-1 rounded">
                                ⚠️ ทับซ้อน
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-[9px] bg-emerald-950/50 px-1 rounded">✓ ปลอดภัย</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
