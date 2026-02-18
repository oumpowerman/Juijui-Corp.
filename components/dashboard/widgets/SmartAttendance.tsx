
import React, { useState, useMemo, useEffect } from 'react';
import { useAttendance } from '../../../hooks/useAttendance';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests'; // New Import
import { User, MasterOption, ViewMode } from '../../../types';
import { WorkLocation, LeaveType } from '../../../types/attendance'; // Import Types
import { MapPin, Clock, LogIn, LogOut, Camera, CheckCircle2, Cloud, Sparkles, Coffee, Calendar, Flame, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import CheckInModal from '../../attendance/CheckInModal';
import LeaveRequestModal from '../../attendance/LeaveRequestModal'; // New Import
import StatusCard from '../../../components/attendance/widget/StatusCard';

interface SmartAttendanceProps {
    user: User;
    masterOptions: MasterOption[]; // Receive from parent
    onNavigate: (view: ViewMode) => void;
}

const SmartAttendance: React.FC<SmartAttendanceProps> = ({ user, masterOptions, onNavigate }) => {
    const { todayLog, isLoading, checkIn, checkOut, stats, refresh } = useAttendance(user.id);
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    const { submitRequest, leaveUsage } = useLeaveRequests(user); // New Hook
    
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false); // New State
    const [time, setTime] = useState(new Date());

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date()), 1000;
        });
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
    
    // Configs for Late Check
    const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15');

    const handleConfirmCheckIn = async (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => {
        const note = undefined;
        
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

        await checkIn(type, file, location, locationName, note, googleDriveUploader);
    };

    // Handler: Leave Request
    const handleLeaveSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        const result = await submitRequest(type, start, end, reason, file);
        if (result) {
            refresh(); // Refresh attendance state immediately to show updates
        }
        return result;
    };

    if (isLoading) return <div className="h-28 bg-gray-100 rounded-[2.5rem] animate-pulse w-full"></div>;

    const isCheckedIn = !!todayLog;
    const isCheckedOut = !!todayLog?.checkOutTime;
    
    // Safety check for Leave logs that have no time
    const isLeaveLog = todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE';

    // --- RENDER STATES ---

    // 0. ON LEAVE / WFH (Approved without Time)
    if (isLeaveLog) {
        return (
            <div className="bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden w-full">
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                        <Briefcase className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-blue-800 flex items-center gap-2">
                            อนุมัติแล้ว (On Leave/WFH)
                        </h3>
                        <p className="text-sm text-blue-600 mt-0.5 font-medium">
                            {todayLog?.note ? todayLog.note.replace(/\[.*?\]/g, '').trim() : 'ได้รับอนุญาตวันนี้'}
                        </p>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 relative z-10">
                    <span className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">
                        ไม่ต้องลงเวลา
                    </span>
                </div>
            </div>
        );
    }

    // 1. FINISHED WORK (Pastel Green)
    if (isCheckedOut) {
        return (
            <div 
                onClick={() => onNavigate('ATTENDANCE')}
                className="bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] p-6 flex flex-col md:flex-row items-center justify-between shadow-sm relative overflow-hidden group gap-4 w-full cursor-pointer hover:bg-emerald-100 transition-all"
            >
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                    <CheckCircle2 className="w-32 h-32 text-emerald-500" />
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                        <Coffee className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-emerald-800 flex items-center gap-2">
                            เลิกงานแล้ว! 🎉
                        </h3>
                        <p className="text-sm text-emerald-600 mt-0.5 font-medium">พักผ่อนให้เต็มที่ เจอกันพรุ่งนี้ครับ</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="text-right">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide mb-0.5">เข้างาน</p>
                        <p className="text-sm font-bold text-emerald-700 font-mono bg-white/50 px-2 py-1 rounded-lg">
                            {todayLog?.checkInTime ? format(todayLog.checkInTime, 'HH:mm') : '--:--'}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-emerald-200"></div>
                    <div className="text-right">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide mb-0.5">ออกงาน</p>
                        <p className="text-xl font-black text-emerald-700 font-mono bg-white/80 px-3 py-1 rounded-xl shadow-sm">
                            {todayLog?.checkOutTime ? format(todayLog.checkOutTime, 'HH:mm') : '--:--'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 2. WORKING NOW (Gradient Border + Glow)
    if (isCheckedIn) {
        return (
            <div className="relative p-[2px] rounded-[2.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-100/50 w-full">
                <div className="bg-white rounded-[2.4rem] p-5 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden h-full w-full">
                    
                    {/* Pulsing Dot */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                         <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Active</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex items-center gap-5 w-full relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-inner">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                Check-in at {todayLog?.checkInTime ? format(todayLog.checkInTime, 'HH:mm') : '--:--'}
                            </p>
                            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                กำลังทำงาน 👨‍💻
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" /> {todayLog?.workType}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Clock Out Button - Redirects to Attendance View */}
                    <button 
                        onClick={() => onNavigate('ATTENDANCE')}
                        className="group w-full md:w-auto px-6 py-3.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border-2 border-red-100 hover:border-red-500 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10 overflow-hidden"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>เลิกงาน (Clock Out)</span>
                    </button>
                </div>
            </div>
        );
    }

    // 3. START WORK (Vibrant Gradient Card)
    return (
        <div className="w-full">
            <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group border-4 border-white/20 w-full">
                {/* Dynamic Background */}
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>
                
                {/* NEW: STREAK INDICATOR */}
                {stats.currentStreak > 0 && (
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-3 py-1 flex items-center gap-1.5 animate-pulse">
                        <Flame className="w-3.5 h-3.5 text-orange-300 fill-orange-300" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">
                            {stats.currentStreak} Day Streak!
                        </span>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 tracking-wider flex items-center shadow-sm">
                                <Calendar className="w-3 h-3 mr-1.5" />
                                {format(time, 'EEEE, d MMM')}
                            </span>
                            {isDriveReady && (
                                <span className="bg-emerald-400/20 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-200/30 text-emerald-100 flex items-center">
                                    <Cloud className="w-3 h-3 mr-1" /> Cloud Ready
                                </span>
                            )}
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mt-1 drop-shadow-md flex items-center justify-center md:justify-start gap-2">
                            พร้อมลุยไหม? <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                        </h3>
                        <p className="text-indigo-100 text-sm mt-1.5 font-medium opacity-90 max-w-md">
                            เริ่มต้นวันใหม่ด้วยพลัง! อย่าลืมถ่ายรูปเช็คอินนะ
                        </p>
                    </div>

                    <button 
                        onClick={() => onNavigate('ATTENDANCE')}
                        className="group/btn relative px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden w-full md:w-auto justify-center"
                    >
                        <div className="absolute inset-0 bg-indigo-50 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <Camera className="w-6 h-6 relative z-10 group-hover/btn:rotate-12 transition-transform" />
                        <span className="relative z-10 text-base">ถ่ายรูปเข้างาน</span>
                    </button>
                </div>
            </div>
            
            {/* Modals */}
            <CheckInModal 
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
                onSwitchToLeave={() => { setIsCheckInModalOpen(false); setIsLeaveModalOpen(true); }}
            />
            
            <LeaveRequestModal 
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                onSubmit={handleLeaveSubmit}
                masterOptions={masterOptions}
                leaveUsage={leaveUsage} // PASS QUOTA
            />
            
            {/* Status Card is used internally by AttendanceWidget usually, but we expose it here if needed for direct embedding.
                In this case, SmartAttendance is the widget wrapper. StatusCard is rendered via SmartAttendance.
                We need to pass onNavigateToHistory here.
            */}
             <StatusCard 
                user={user}
                todayLog={todayLog}
                stats={stats}
                todayActiveLeave={null} // Simplified for this view, or pass if needed
                onCheckOut={checkOut}
                onCheckOutRequest={handleLeaveSubmit}
                onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                onOpenLeave={() => setIsLeaveModalOpen(true)}
                isDriveReady={isDriveReady}
                onRefresh={refresh}
                availableLocations={availableLocations}
                onNavigateToHistory={() => onNavigate('ATTENDANCE')}
            />
        </div>
    );
};

export default SmartAttendance;
