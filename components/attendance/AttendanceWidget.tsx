
import React, { useState, useMemo } from 'react';
import { useAttendance } from '../../hooks/useAttendance';
import { useMasterData } from '../../hooks/useMasterData';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { useLeaveRequests } from '../../hooks/useLeaveRequests';
import { User } from '../../types';
import { WorkLocation, LeaveType, LeaveRequest } from '../../types/attendance';
import { format, isWithinInterval, startOfDay, endOfDay, isFuture, isSameDay } from 'date-fns';

// Sub Components
import LiveClock from './widget/LiveClock';
import StatusCard from './widget/StatusCard';
import UpcomingLeaveList from './widget/UpcomingLeaveList'; // New Component
import CheckInModal from './CheckInModal';
import LeaveRequestModal from './LeaveRequestModal';

interface AttendanceWidgetProps {
    user: User;
}

const AttendanceWidget: React.FC<AttendanceWidgetProps> = ({ user }) => {
    // Hooks
    const { todayLog, isLoading, checkIn, checkOut, refresh, stats } = useAttendance(user.id);
    const { masterOptions } = useMasterData(); 
    const { submitRequest, leaveUsage, requests } = useLeaveRequests(user);
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();

    // UI State
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

    // --- TIME-SCOPED LOGIC V12 (The Fix) ---
    const today = new Date();

    // 1. "Today's Active Leave" (Affects Current Status)
    // Only considers requests that *overlap* with NOW.
    const todayActiveLeave = useMemo(() => {
        return requests.find(req => {
            // Must be PENDING or APPROVED
            if (req.status === 'REJECTED') return false;
            
            const start = startOfDay(new Date(req.startDate));
            const end = endOfDay(new Date(req.endDate));
            
            // STRICT CHECK: Is today inside the range?
            return isWithinInterval(today, { start, end });
        }) || null;
    }, [requests]);

    // 2. "Future Requests" (For Upcoming UI - Non-blocking)
    // Requests that start *after* today
    const upcomingRequests = useMemo(() => {
        return requests
            .filter(req => {
                const start = startOfDay(new Date(req.startDate));
                return isFuture(start) && !isSameDay(start, today) && req.status !== 'REJECTED';
            })
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Sort nearest first
            .slice(0, 3); // Show top 3
    }, [requests]);

    // 3. Approved WFH Check (Specific for Check-in Modal logic)
    const todayApprovedWFH = useMemo(() => {
        return todayActiveLeave?.type === 'WFH' && todayActiveLeave.status === 'APPROVED';
    }, [todayActiveLeave]);

    // --- Configs ---
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
    
    const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15');

    // --- Handlers ---
    const handleConfirmCheckIn = async (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => {
        const note = undefined; 
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
        
        const isAppeal = todayActiveLeave?.type === 'LATE_ENTRY'; // Use active leave for appeal check

        await checkIn(type, file, location, locationName, note, googleDriveUploader, isAppeal);
    };
    
    const handleLeaveSubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File): Promise<boolean> => {
        const result = await submitRequest(type, start, end, reason, file);
        if (result) {
            refresh(); 
        }
        return !!result;
    };

    if (isLoading) return <div className="h-28 bg-gray-100 rounded-[2.5rem] animate-pulse w-full"></div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg border border-indigo-50 p-6 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${todayLog ? 'bg-green-400' : 'bg-orange-400'}`}></div>

                <LiveClock />

                {/* Status Card receives ONLY Today's context */}
                <StatusCard 
                    user={user}
                    todayLog={todayLog}
                    stats={stats}
                    todayActiveLeave={todayActiveLeave} // RENAMED: Covers Pending & Approved for TODAY
                    onCheckOut={checkOut}
                    onCheckOutRequest={handleLeaveSubmit}
                    onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                    onOpenLeave={() => setIsLeaveModalOpen(true)}
                    isDriveReady={isDriveReady}
                    onRefresh={refresh}
                    availableLocations={availableLocations}
                />
            </div>

            {/* Separate Component for Future Requests */}
            <UpcomingLeaveList requests={upcomingRequests} />

            {/* Modals */}
            <CheckInModal 
                isOpen={isCheckInModalOpen} 
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
                onSwitchToLeave={() => { setIsCheckInModalOpen(false); setIsLeaveModalOpen(true); }}
                approvedWFH={todayApprovedWFH}
                hasLateRequest={todayActiveLeave?.type === 'LATE_ENTRY'}
            />
            
            <LeaveRequestModal 
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                onSubmit={handleLeaveSubmit}
                masterOptions={masterOptions}
                leaveUsage={leaveUsage}
                requests={requests} 
            />
        </div>
    );
};

export default AttendanceWidget;
