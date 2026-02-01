
import React, { useState, useMemo, useEffect } from 'react';
import { useAttendance } from '../../../hooks/useAttendance';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import { User, MasterOption } from '../../../types';
import { WorkLocation } from '../../../types/attendance';
import { MapPin, Clock, LogIn, LogOut, Camera, CheckCircle2, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import CheckInModal from '../../attendance/CheckInModal';

interface SmartAttendanceProps {
    user: User;
    masterOptions: MasterOption[]; // Receive from parent
}

const SmartAttendance: React.FC<SmartAttendanceProps> = ({ user, masterOptions }) => {
    const { todayLog, isLoading, checkIn, checkOut } = useAttendance(user.id);
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [time, setTime] = useState(new Date());

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 1. Prepare Locations
    const availableLocations = useMemo(() => {
        const locs = masterOptions.filter(o => o.type === 'WORK_LOCATION');
        const parsed = locs.map(l => {
            const parts = l.key.split(',');
            if (parts.length >= 2) {
                return {
                    id: l.id,
                    name: l.label,
                    lat: parseFloat(parts[0]),
                    lng: parseFloat(parts[1]),
                    radiusMeters: parts[2] ? parseFloat(parts[2]) : 500
                };
            }
            return null;
        }).filter(Boolean) as any[];

        if (parsed.length === 0) {
            // Fallback default
            const defLat = masterOptions.find(o => o.key === 'OFFICE_LAT')?.label;
            const defLng = masterOptions.find(o => o.key === 'OFFICE_LNG')?.label;
            if (defLat && defLng) {
                parsed.push({
                    id: 'default',
                    name: 'Office',
                    lat: parseFloat(defLat),
                    lng: parseFloat(defLng),
                    radiusMeters: 500
                });
            }
        }
        return parsed;
    }, [masterOptions]);

    const handleConfirmCheckIn = async (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => {
        const note = locationName ? `📍 ${locationName}` : undefined;
        
        // Google Drive Uploader Wrapper
        const googleDriveUploader = isDriveReady ? async (fileToUpload: File): Promise<string | null> => {
            const currentMonthFolder = format(new Date(), 'yyyy-MM');
            return new Promise((resolve) => {
                uploadFileToDrive(
                    fileToUpload, 
                    (result) => {
                        const finalUrl = result.thumbnailUrl || result.url;
                        resolve(finalUrl);
                    },
                    ['Attendance', currentMonthFolder]
                );
            });
        } : undefined;

        await checkIn(type, file, location, note, googleDriveUploader);
    };

    if (isLoading) return <div className="h-28 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>;

    const isCheckedIn = !!todayLog;
    const isCheckedOut = !!todayLog?.checkOutTime;

    // --- RENDER STATES ---

    // 1. FINISHED WORK (Pastel Green)
    if (isCheckedOut) {
        return (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <CheckCircle2 className="w-32 h-32 text-emerald-500" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-lg font-black text-emerald-700 flex items-center gap-2">
                        🎉 เลิกงานแล้ว!
                    </h3>
                    <p className="text-sm text-emerald-600 mt-1 font-medium">พักผ่อนให้เต็มที่ เจอกันพรุ่งนี้ครับ</p>
                </div>
                <div className="text-right relative z-10 bg-white/60 px-4 py-2 rounded-2xl backdrop-blur-sm border border-emerald-100">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">Clock Out</p>
                    <p className="text-xl font-black text-emerald-700 font-mono">{format(todayLog.checkOutTime!, 'HH:mm')}</p>
                </div>
            </div>
        );
    }

    // 2. WORKING NOW (Pastel Purple Outline)
    if (isCheckedIn) {
        return (
            <div className="bg-white/90 backdrop-blur-md border-2 border-purple-100 rounded-[2.5rem] p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
                {/* Background Blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-60 -mr-10 -mt-10"></div>
                
                {/* Info */}
                <div className="flex-1 flex items-center gap-4 w-full relative z-10">
                    <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0 border border-purple-100 shadow-inner">
                        <Clock className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200">
                                Active
                            </span>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Since {format(todayLog.checkInTime!, 'HH:mm')}</p>
                        </div>
                        <h3 className="text-lg font-black text-gray-700 flex items-center gap-2">
                            Working ({todayLog?.workType})
                        </h3>
                    </div>
                </div>

                {/* Clock Out Button */}
                <button 
                    onClick={() => checkOut()}
                    className="w-full md:w-auto px-6 py-3.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border-2 border-red-100 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                    <span>เลิกงาน (Out)</span>
                </button>
            </div>
        );
    }

    // 3. START WORK (Vibrant Pastel)
    return (
        <>
            <div className="bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-[2.5rem] p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden group border border-white/20">
                {/* Background Decor */}
                <div className="absolute -right-4 -top-4 w-40 h-40 bg-white opacity-20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="bg-white/25 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black border border-white/30 tracking-wider">
                                {format(time, 'd MMM yyyy')}
                            </span>
                            {isDriveReady && (
                                <span className="bg-emerald-400/30 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-200/40 text-emerald-50 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full mr-1 animate-pulse"></span> Cloud Ready
                                </span>
                            )}
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mt-1 drop-shadow-sm">
                            พร้อมลุยไหม? ✌️
                        </h3>
                        <p className="text-purple-50 text-sm mt-1 font-medium opacity-90">
                            ได้เวลาสร้างสรรค์ผลงานแล้ว (Check-in)
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsCheckInModalOpen(true)}
                        className="group/btn relative px-8 py-4 bg-white text-purple-600 rounded-2xl font-black shadow-lg shadow-purple-900/10 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden w-full md:w-auto justify-center"
                    >
                        <div className="absolute inset-0 bg-purple-50 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <Camera className="w-6 h-6 relative z-10" />
                        <span className="relative z-10 text-base">ถ่ายรูปเข้างาน</span>
                    </button>
                </div>
            </div>

            <CheckInModal 
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
                availableLocations={availableLocations}
            />
        </>
    );
};

export default SmartAttendance;
