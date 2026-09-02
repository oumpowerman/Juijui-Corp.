import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, 
    Camera, 
    Clock, 
    Navigation, 
    AlertCircle, 
    Check, 
    X, 
    Loader2, 
    Image as ImageIcon,
    Sparkles
} from 'lucide-react';
import { LocationDef } from '../../../types/attendance';
import { getCurrentLocation, calculateDistance } from '../../../lib/locationUtils';
import { attendanceService } from '../../../services/attendanceService';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';

interface FieldCheckpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    attendanceId?: string;
    userId: string;
    availableLocations: LocationDef[];
    onSuccess?: () => void;
}

export const FieldCheckpointModal: React.FC<FieldCheckpointModalProps> = ({
    isOpen,
    onClose,
    attendanceId,
    userId,
    availableLocations,
    onSuccess
}) => {
    const { showToast } = useToast();
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [locationName, setLocationName] = useState('');
    const [customLocationName, setCustomLocationName] = useState('');
    const [isCustomLocation, setIsCustomLocation] = useState(false);
    const [note, setNote] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Fetch user location on modal open
    useEffect(() => {
        if (!isOpen) {
            // Reset state
            setGpsCoordinates(null);
            setLocationName('');
            setCustomLocationName('');
            setIsCustomLocation(false);
            setNote('');
            setSelectedPhoto(null);
            setPhotoPreview(null);
            setGpsError(null);
            setIsSubmitting(false);
            return;
        }

        const fetchGps = async () => {
            setIsLoadingLocation(true);
            setGpsError(null);
            try {
                const pos = await getCurrentLocation();
                setGpsCoordinates({
                    lat: pos.lat,
                    lng: pos.lng,
                    accuracy: pos.accuracy || 10
                });

                // Check nearest known location
                let nearestLoc: LocationDef | null = null;
                let minDistance = Infinity;

                (availableLocations || []).forEach(loc => {
                    const dist = calculateDistance(pos.lat, pos.lng, loc.lat, loc.lng);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestLoc = loc;
                    }
                });

                // If within 500m of a known location, auto-suggest it
                if (nearestLoc && minDistance <= 500) {
                    setLocationName((nearestLoc as LocationDef).name);
                    setIsCustomLocation(false);
                } else if (availableLocations && availableLocations.length > 0) {
                    setIsCustomLocation(true);
                    setCustomLocationName('จุดออกกอง / นอกสถานที่');
                } else {
                    setIsCustomLocation(true);
                    setCustomLocationName('จุดออกกอง / กองถ่าย');
                }
            } catch (err: any) {
                console.warn("Error acquiring GPS location:", err);
                setGpsError("ไม่สามารถดึงพิกัด GPS อัตโนมัติได้ กรุณาเปิด Location บนอุปกรณ์ของคุณ");
                setIsCustomLocation(true);
                setCustomLocationName('จุดออกกอง / กองถ่าย');
            } finally {
                setIsLoadingLocation(false);
            }
        };

        fetchGps();
    }, [isOpen, availableLocations]);

    // Handle Image Selection
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedPhoto(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Handle Form Submission
    const handleSubmit = async () => {
        const finalLocation = isCustomLocation ? customLocationName.trim() : locationName.trim();
        if (!finalLocation) {
            showToast("กรุณาระบุหรือเลือกชื่อสถานที่ / จุดออกกอง", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedPhotoUrl: string | undefined = undefined;

            // Upload photo if present
            if (selectedPhoto) {
                const fileExt = selectedPhoto.name.split('.').pop() || 'jpg';
                const fileName = `checkpoint-${userId}-${Date.now()}.${fileExt}`;
                const { error: uploadErr } = await supabase.storage
                    .from('chat-files')
                    .upload(`checkpoints/${fileName}`, selectedPhoto, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (!uploadErr) {
                    const { data: urlData } = supabase.storage
                        .from('chat-files')
                        .getPublicUrl(`checkpoints/${fileName}`);
                    uploadedPhotoUrl = urlData.publicUrl;
                } else {
                    console.warn("Storage upload failed, continuing without photo:", uploadErr);
                }
            }

            await attendanceService.createCheckpoint({
                attendance_id: attendanceId,
                user_id: userId,
                location_name: finalLocation,
                latitude: gpsCoordinates?.lat,
                longitude: gpsCoordinates?.lng,
                accuracy: gpsCoordinates?.accuracy,
                note: note.trim() || undefined,
                photo_url: uploadedPhotoUrl
            });

            showToast("📍 บันทึกพิกัดและเวลารายงานออกกองเรียบร้อยแล้ว!", "success");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to save checkpoint:", error);
            showToast(error.message || "ไม่สามารถบันทึกพิกัดออกกองได้ กรุณาลองใหม่อีกครั้ง", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-5 text-white relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-1.5">
                                        รายงานพิกัด / ออกกอง <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                                    </h3>
                                    <p className="text-indigo-100 text-xs mt-0.5">บันทึก TimeStamp จุดปฏิบัติงานและเวลาปัจจุบัน</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white disabled:opacity-50"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                        {/* Time & GPS Info Banner */}
                        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-600" /> เวลาที่รายงาน
                                </span>
                                <span className="text-xs font-mono font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-indigo-100">
                                    {currentTimeStr} น.
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-100/60">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <Navigation className="w-3.5 h-3.5 text-cyan-600" /> พิกัด GPS
                                </span>
                                {isLoadingLocation ? (
                                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" /> กำลังค้นหาตำแหน่ง...
                                    </span>
                                ) : gpsCoordinates ? (
                                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                                        {gpsCoordinates.lat.toFixed(5)}, {gpsCoordinates.lng.toFixed(5)}
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-amber-600 font-medium">
                                        ไม่มีพิกัด (บันทึกเฉพาะเวลา)
                                    </span>
                                )}
                            </div>

                            {gpsError && (
                                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60 leading-tight">
                                    ⚠️ {gpsError}
                                </p>
                            )}
                        </div>

                        {/* Location Selection / Custom Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>📍 ชื่อสถานที่ / จุดออกกอง <span className="text-red-500">*</span></span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomLocation(!isCustomLocation);
                                        if (!isCustomLocation) {
                                            setCustomLocationName('');
                                        }
                                    }}
                                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                                >
                                    {isCustomLocation ? 'เลือกจากสถานที่หลัก' : 'ระบุเอง (นอกสถานที่/กองถ่าย)'}
                                </button>
                            </label>

                            {isCustomLocation ? (
                                <div>
                                    <input
                                        type="text"
                                        value={customLocationName}
                                        onChange={(e) => setCustomLocationName(e.target.value)}
                                        placeholder="เช่น สตูดิโอลาดพร้าว 71, กองถ่ายบ้านริมน้ำ"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                        maxLength={80}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        ระบุชื่อจุดถ่ายทำ, โลเคชั่น, หรือจุดปฏิบัติงานนอกสถานที่
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={locationName}
                                    onChange={(e) => {
                                        if (e.target.value === '__custom__') {
                                            setIsCustomLocation(true);
                                            setCustomLocationName('');
                                        } else {
                                            setLocationName(e.target.value);
                                        }
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
                                >
                                    <option value="" disabled>-- เลือกสถานที่ --</option>
                                    {(availableLocations || []).map(loc => (
                                        <option key={loc.id} value={loc.name}>
                                            {loc.name}
                                        </option>
                                    ))}
                                    <option value="__custom__">➕ ระบุชื่อจุดออกกองเอง...</option>
                                </select>
                            )}
                        </div>

                        {/* Note / Activity Details */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span>📝 รายละเอียดกิจกรรม / หมายเหตุ</span>
                                <span className="text-[10px] text-slate-400 font-normal">ไม่บังคับ</span>
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="เช่น ถึงกองถ่ายเริ่มเซ็ตฉาก A, ย้ายมาจุดถ่ายทำภายนอก, ปล่อยเบรกทานข้าว..."
                                rows={2}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium"
                                maxLength={250}
                            />
                        </div>

                        {/* Photo Upload (Optional) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Camera className="w-3.5 h-3.5 text-cyan-600" /> ถ่ายภาพหน้างาน / บรรยากาศกอง
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">ไม่บังคับ</span>
                            </label>

                            {photoPreview ? (
                                <div className="relative rounded-2xl overflow-hidden border border-indigo-200 aspect-video bg-black/5 group">
                                    <img 
                                        src={photoPreview} 
                                        alt="Preview" 
                                        className="w-full h-full object-cover" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPhoto(null);
                                            setPhotoPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-4 cursor-pointer transition-colors group">
                                    <div className="p-2.5 bg-white group-hover:bg-indigo-100 rounded-full text-slate-400 group-hover:text-indigo-600 shadow-xs transition-colors mb-1.5">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-700">
                                        คลิกเพื่อถ่ายรูปหรือเลือกรูปภาพ
                                    </span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                        JPG, PNG รองรับการเปิดกล้องมือถือ
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || isLoadingLocation}
                            className="flex-2 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> บันทึก Checkpoint
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
