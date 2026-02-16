
import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { useMasterData } from '../../hooks/useMasterData';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { useLeaveRequests } from '../../hooks/useLeaveRequests';
import { User } from '../../types';
import { WorkLocation, LeaveType, LeaveRequest } from '../../types/attendance';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

// Sub Components
import LiveClock from './widget/LiveClock';
import StatusCard from './widget/StatusCard';
import CheckInModal from './CheckInModal';
import LeaveRequestModal from './LeaveRequestModal';

interface AttendanceWidgetProps {
    user: User;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ user }) => {
    // Hooks
    const { todayLog, isLoading, checkIn, checkOut, refresh, stats } = useAttendance(user.id);
    const { masterOptions } = useMasterData(); 
    const { submitRequest, leaveUsage, requests } = useLeaveRequests(user); // Get requests
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();

    // UI State
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    // Logic: Check if there is a PENDING leave request for TODAY
    const todayPendingLeave = useMemo(() => {
        const today = new Date();
        return requests.find(req => {
            if (req.status !== 'PENDING') return false;
            
            // Check if today falls within start and end date
            const start = startOfDay(new Date(req.startDate));
            const end = endOfDay(new Date(req.endDate));
            return isWithinInterval(today, { start, end });
        }) || null;
    }, [requests]);

    // Logic: Prepare Locations
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
        }).filter(Boolean) as { id: string, name: string, lat: number, lng: number, radiusMeters: number }[];

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
        return await submitRequest(type, start, end, reason, file);
    };

    if (isLoading) return <div className="h-28 bg-gray-100 rounded-[2.5rem] animate-pulse w-full"></div>;

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-indigo-50 p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${todayLog ? 'bg-green-400' : 'bg-orange-400'}`}></div>

            {/* 1. Clock Header */}
            <LiveClock />

            {/* 2. Status Card (Handles UI States) */}
            <StatusCard 
                user={user}
                todayLog={todayLog}
                stats={stats} // Pass Stats
                todayPendingLeave={todayPendingLeave} // NEW: Pass pending leave
                onCheckOut={checkOut}
                onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                onOpenLeave={() => setIsLeaveModalOpen(true)}
                isDriveReady={isDriveReady}
                onRefresh={refresh}
                availableLocations={availableLocations}
            />

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
        </div>
    );
};

export default AttendanceWidget;
