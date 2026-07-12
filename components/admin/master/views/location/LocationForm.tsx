import React from 'react';
import { MapPin, Crosshair, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveMap } from './InteractiveMap';
import { GeoLocationItem } from './locationUtils';

interface LocationFormProps {
  isEditing: boolean;
  isOffice: boolean;
  type: 'WORK_LOCATION' | 'SHOOT_LOCATION';
  name: string;
  setName: (v: string) => void;
  lat: string;
  setLat: (v: string) => void;
  lng: string;
  setLng: (v: string) => void;
  radius: string;
  setRadius: (v: string) => void;
  isLocating: boolean;
  smartInput: string;
  parseSuccess: boolean;
  handleSmartParse: (val: string) => void;
  getCurrentLocation: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  mapOtherLocations: GeoLocationItem[];
}

export const LocationForm: React.FC<LocationFormProps> = ({
  isEditing,
  isOffice,
  type,
  name,
  setName,
  lat,
  setLat,
  lng,
  setLng,
  radius,
  setRadius,
  isLocating,
  smartInput,
  parseSuccess,
  handleSmartParse,
  getCurrentLocation,
  onSubmit,
  onCancel,
  mapOtherLocations,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-150 p-5 space-y-5 animate-in fade-in duration-300">
      <h3 className="font-bold text-slate-800 flex items-center text-base">
        <span className={`p-1.5 rounded-lg mr-2 ${isOffice ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
          <MapPin className="w-4 h-4" />
        </span>
        {isEditing ? `แก้ไขพิกัด${isOffice ? 'ออฟฟิศหลัก' : 'สถานที่ถ่ายทำ'}` : `เพิ่มพิกัด${isOffice ? 'ออฟฟิศหลัก' : 'สถานที่ถ่ายทำ'}ใหม่`}
      </h3>

      {/* Interactive Dynamic Map Preview & Geofence Simulator */}
      <div className="rounded-2xl border border-slate-150 overflow-hidden shadow-sm bg-slate-50">
        <InteractiveMap 
          lat={parseFloat(lat) || 13.7563}
          lng={parseFloat(lng) || 100.5018}
          radius={parseInt(radius) || 100}
          otherLocations={mapOtherLocations}
          type={type}
        />
        {/* Map Quick-Action Controls */}
        <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} /> 
            ดึง GPS ปัจจุบัน
          </button>

          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] text-center"
          >
            <span>🔍 ค้นหาพิกัดบนเว็บ</span>
          </a>
        </div>
      </div>

      {/* Smart Coordinates Parser Module */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>💡 ตัวดึงพิกัดอัจฉริยะ (Smart Paste Engine)</span>
          </span>
          <AnimatePresence>
            {parseSuccess && (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 animate-pulse"
              >
                ✓ สกัดพิกัดสำเร็จ!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <input
            type="text"
            className={`w-full px-3 py-2.5 border rounded-xl text-xs font-bold outline-none transition-all placeholder-slate-400 ${
              parseSuccess 
                ? 'border-emerald-500 ring-2 ring-emerald-50/50 text-emerald-700 bg-emerald-50/10' 
                : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 text-slate-700 bg-white'
            }`}
            placeholder="วางลิงก์ Google Maps หรือพิกัดที่คัดลอกมา เช่น 13.75, 100.5"
            value={smartInput}
            onChange={e => handleSmartParse(e.target.value)}
          />
        </div>
        <p className="text-[9px] text-slate-400 leading-normal">
          * คัดลอกค่าละติจูด-ลองจิจูด หรือกดแชร์หมุดจากแอป <b>Google Maps</b> บนอุปกรณ์ของคุณ แล้วนำลิงก์มาวางในช่องนี้เพื่อสกัดพิกัดอัตโนมัติได้อย่างแม่นยำ 100%
        </p>
      </div>

      {/* Entry form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">
            {isOffice ? '🏢 ชื่อออฟฟิศ / สาขาหลัก' : '🎬 ชื่อสถานที่ถ่ายทำ / กองถ่าย'}
          </label>
          <div className="relative">
            <input 
              type="text" 
              className="w-full pl-3 pr-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50 transition-all placeholder-slate-400"
              placeholder={isOffice ? 'เช่น สำนักงานใหญ่, ออฟฟิศอโศก' : 'เช่น สตูดิโอ A, สยามพารากอน'}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus={!isEditing}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">📍 ละติจูด (Lat)</label>
            <input 
              type="number" 
              step="any"
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-mono text-slate-600 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
              value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="เช่น 13.7563"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">📍 ลองจิจูด (Lng)</label>
            <input 
              type="number" 
              step="any"
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-mono text-slate-600 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
              value={lng}
              onChange={e => setLng(e.target.value)}
              placeholder="เช่น 100.5018"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">🎯 รัศมีการอนุญาตเช็คอิน (เมตร)</label>
          <input 
            type="number" 
            className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
            value={radius}
            onChange={e => setRadius(e.target.value)}
            placeholder="แนะนำ 100 - 500 เมตร"
          />
        </div>

        <div className="pt-2">
          <div className="flex gap-2">
            {isEditing && (
              <button 
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                ยกเลิก
              </button>
            )}
            <button 
              type="submit"
              className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] ${
                isOffice 
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' 
                  : 'bg-orange-600 hover:bg-orange-700 shadow-orange-100'
              }`}
            >
              {isEditing ? '✓ บันทึกการแก้ไข' : '＋ บันทึกสถานที่ใหม่'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
