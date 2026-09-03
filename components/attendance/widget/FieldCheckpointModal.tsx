import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, 
    Camera, 
    Clock, 
    Navigation, 
    Check, 
    X, 
    Loader2, 
    Sparkles,
    ChevronDown,
    ChevronUp,
    FileText
} from 'lucide-react';
import { LocationDef } from '../../../types/attendance';
import { getCurrentLocation, calculateDistance } from '../../../lib/locationUtils';
import { attendanceService } from '../../../services/attendanceService';
import { googleDriveService } from '../../../services/googleDriveService';
import { supabase } from '../../../lib/supabase';
import { compressImage } from '../../../lib/imageUtils';
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
    const [locationName, setLocationName] = useState('จุดออกกอง / นอกสถานที่');
    const [customLocationName, setCustomLocationName] = useState('จุดออกกอง / นอกสถานที่');
    const [isCustomLocation, setIsCustomLocation] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [note, setNote] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Fetch user location on modal open with smart defaults
    useEffect(() => {
        if (!isOpen) {
            // Reset state
            setGpsCoordinates(null);
            setLocationName('จุดออกกอง / นอกสถานที่');
            setCustomLocationName('จุดออกกอง / นอกสถานที่');
            setIsCustomLocation(true);
            setShowAdvanced(false);
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

                // If within 500m of a known location, auto-suggest it as default
                if (nearestLoc && minDistance <= 500) {
                    setLocationName((nearestLoc as LocationDef).name);
                    setCustomLocationName((nearestLoc as LocationDef).name);
                    setIsCustomLocation(false);
                } else {
                    // Smart default when outside known office locations
                    setIsCustomLocation(true);
                    setCustomLocationName('จุดออกกอง / นอกสถานที่');
                    setLocationName('จุดออกกอง / นอกสถานที่');
                }
            } catch (err: any) {
                console.warn("Error acquiring GPS location:", err);
                setGpsError("ไม่สามารถดึงพิกัด GPS อัตโนมัติได้ กรุณาเปิด Location บนอุปกรณ์ของคุณ");
                setIsCustomLocation(true);
                setCustomLocationName('จุดออกกอง / นอกสถานที่');
                setLocationName('จุดออกกอง / นอกสถานที่');
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

            // Upload photo if present (Google Drive primary -> Supabase Storage fallback)
            if (selectedPhoto) {
                let compressed = selectedPhoto;
                try {
                    compressed = await compressImage(selectedPhoto, 1200, 0.7);
                } catch (compressErr) {
                    console.warn("Image compression error, using original file:", compressErr);
                }

                // 1. Try Google Drive first
                try {
                    const result = await googleDriveService.uploadFile(compressed);
                    if (result?.url) {
                        uploadedPhotoUrl = result.url;
                    }
                } catch (driveErr) {
                    console.warn("Failed to upload to Google Drive, falling back to Supabase Storage...", driveErr);
                }

                // 2. Fallback to Supabase Storage if Google Drive did not succeed
                if (!uploadedPhotoUrl) {
                    try {
                        const fileExt = compressed.name.split('.').pop() || 'jpg';
                        const fileName = `checkpoint-${userId}-${Date.now()}.${fileExt}`;
                        const filePath = `checkpoints/${fileName}`;

                        const { error: uploadErr } = await supabase.storage
                            .from('chat-files')
                            .upload(filePath, compressed, {
                                cacheControl: '3600',
                                upsert: false
                            });

                        if (!uploadErr) {
                            const { data: urlData } = supabase.storage
                                .from('chat-files')
                                .getPublicUrl(filePath);
                            uploadedPhotoUrl = urlData.publicUrl;
                        } else {
                            console.warn("Supabase storage upload failed:", uploadErr);
                        }
                    } catch (supabaseErr) {
                        console.warn("Supabase upload exception:", supabaseErr);
                    }
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

    const currentTimeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        onClick={isSubmitting ? undefined : onClose}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto relative z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Compact Header */}
                        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-4 py-3.5 sm:px-5 sm:py-4 text-white relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                                            รายงานพิกัด / ออกกอง <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                        </h3>
                                        <p className="text-indigo-100 text-[11px] sm:text-xs">บันทึก TimeStamp จุดปฏิบัติงานทันที</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
                            {/* 1. Time & GPS Info Compact Banner */}
                            <div className="p-3 bg-indigo-50/80 border border-indigo-100/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex items-center gap-1 text-slate-600 font-semibold shrink-0">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                        <span className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">
                                            {currentTimeStr} น.
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-right shrink-0">
                                    <Navigation className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                                    {isLoadingLocation ? (
                                        <span className="flex items-center gap-1 text-indigo-600 font-medium animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" /> ค้นหา GPS...
                                        </span>
                                    ) : gpsCoordinates ? (
                                        <span className="font-mono font-semibold text-slate-700 bg-white/70 px-1.5 py-0.5 rounded-md border border-indigo-50">
                                            {gpsCoordinates.lat.toFixed(4)}, {gpsCoordinates.lng.toFixed(4)}
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-medium">
                                            (บันทึกเฉพาะเวลา)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {gpsError && (
                                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60 leading-tight">
                                    ⚠️ {gpsError}
                                </p>
                            )}

                            {/* 2. Location Selection / Custom Input with Auto-Default */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                                        สถานที่ / จุดปฏิบัติงาน <span className="text-red-500">*</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextCustom = !isCustomLocation;
                                            setIsCustomLocation(nextCustom);
                                            if (nextCustom && !customLocationName) {
                                                setCustomLocationName(locationName || 'จุดออกกอง / นอกสถานที่');
                                            }
                                        }}
                                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline cursor-pointer"
                                    >
                                        {isCustomLocation ? 'เลือกจากสาขาหลัก' : 'พิมพ์ระบุเอง'}
                                    </button>
                                </div>

                                {isCustomLocation ? (
                                    <div>
                                        <input
                                            type="text"
                                            value={customLocationName}
                                            onChange={(e) => setCustomLocationName(e.target.value)}
                                            placeholder="เช่น จุดออกกอง / นอกสถานที่, กองถ่ายลาดพร้าว"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                                            maxLength={80}
                                        />
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
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
                                    >
                                        {(availableLocations || []).map(loc => (
                                            <option key={loc.id} value={loc.name}>
                                                {loc.name}
                                            </option>
                                        ))}
                                        <option value="จุดออกกอง / นอกสถานที่">จุดออกกอง / นอกสถานที่</option>
                                        <option value="__custom__">➕ พิมพ์ระบุเอง...</option>
                                    </select>
                                )}
                            </div>

                            {/* 3. Collapsible Optional Details (Note & Photo) */}
                            <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        <span>เพิ่มเติม: หมายเหตุ & รูปถ่ายหน้างาน</span>
                                        {(note || photoPreview) && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                                        )}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                                        {showAdvanced ? 'ย่อเก็บ' : 'ใส่เพิ่ม (ไม่บังคับ)'}
                                        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </span>
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18 }}
                                            className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100 bg-white"
                                        >
                                            {/* Note */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-600">
                                                    รายละเอียดกิจกรรม / หมายเหตุ
                                                </label>
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="เช่น เริ่มเซ็ตฉากภายนอก, พักกอง, กำลังถ่ายทำ..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium"
                                                    maxLength={250}
                                                />
                                            </div>

                                            {/* Photo Upload */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                                    <Camera className="w-3.5 h-3.5 text-cyan-600" /> ถ่ายภาพหน้างาน / กองถ่าย
                                                </label>

                                                {photoPreview ? (
                                                    <div className="relative rounded-xl overflow-hidden border border-indigo-200 aspect-video bg-black/5">
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
                                                            className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors cursor-pointer"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center justify-center gap-2 border border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/40 rounded-xl p-2.5 cursor-pointer transition-colors group">
                                                        <Camera className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                                        <span className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700">
                                                            คลิกเพื่อถ่ายรูป / เลือกรูปภาพ
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* 4. Footer Actions (One-Tap Ready) */}
                        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || isLoadingLocation}
                                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 min-w-0"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                        <span className="truncate">กำลังบันทึก...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 shrink-0" />
                                        <span className="truncate">📍 บันทึก Checkpoint ทันที</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};


