
import React, { useState, useMemo } from 'react';
import { User } from '../../../types';
import { WorkLocation } from '../../../types/attendance';
import { useAttendanceStatus } from '../../../hooks/attendance/useAttendanceStatus';
import { useAttendanceActions } from '../../../hooks/attendance/useAttendanceActions';
import { useMasterData } from '../../../hooks/useMasterData';
import { useGoogleDrive } from '../../../hooks/useGoogleDrive';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { format } from 'date-fns';
import StatusCard from '../widget/StatusCard';
import CheckInModal from '../CheckInModal';
import LiveClock from '../widget/LiveClock';

interface AttendanceControlProps {
    user: User;
    todayActiveLeave: any;
    onLeaveSubmit: any;
    onOpenLeave: () => void;
}

const AttendanceControl: React.FC<AttendanceControlProps> = ({ user, todayActiveLeave, onLeaveSubmit, onOpenLeave }) => {
    const { todayLog, outdatedLog, isLoading, refresh } = useAttendanceStatus(user.id);
    const { checkIn, checkOut } = useAttendanceActions(user.id);
    const { masterOptions } = useMasterData();
    const { uploadFileToDrive, isReady: isDriveReady } = useGoogleDrive();
    const { showAlert, showConfirm } = useGlobalDialog();

    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

    const availableLocations = useMemo(() => {
        const locs = masterOptions.filter(o => o.type === 'WORK_LOCATION');
        return locs.map(l => {
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
    }, [masterOptions]);

    const startTime = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME')?.label || '10:00';
    const lateBuffer = parseInt(masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER')?.label || '15');

    const handleConfirmCheckIn = async (type: WorkLocation, file: File, location: { lat: number, lng: number }, locationName?: string) => {
        let proofUrl: string | null = null;
        let shouldProceed = true;

        if (isDriveReady) {
            try {
                const currentMonthFolder = format(new Date(), 'yyyy-MM');
                const result = await uploadFileToDrive(file, ['Attendance', currentMonthFolder]);
                proofUrl = result.thumbnailUrl || result.url;
            } catch (err) {
                const choice = await showConfirm(
                    "ไม่สามารถอัปโหลดรูปภาพลง Google Drive ได้ คุณต้องการบันทึกข้อมูลต่อไปโดยไม่มีรูปภาพ หรือจะตรวจสอบ Drive ก่อนครับ?",
                    "เกิดข้อผิดพลาดในการอัปโหลด"
                );
                if (choice) proofUrl = null;
                else shouldProceed = false;
            }
        }

        if (shouldProceed) {
            const isAppeal = todayActiveLeave?.type === 'LATE_ENTRY';
            const success = await checkIn(type, file, location, locationName, undefined, undefined, isAppeal, proofUrl);
            if (success) {
                showAlert("บันทึกข้อมูลการเข้างานเรียบร้อยแล้วครับ", "สำเร็จ");
                refresh();
                setIsCheckInModalOpen(false);
            }
        }
    };

    const handleCheckOut = async (location?: any, locationName?: string, reason?: string) => {
        if (!todayLog) return;
        const success = await checkOut(todayLog, location, locationName, reason);
        if (success) refresh();
    };

    if (isLoading) return <div className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>;

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-indigo-50 p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${todayLog ? 'bg-green-400' : 'bg-orange-400'}`}></div>
            
            <LiveClock />

            <StatusCard 
                user={user}
                todayLog={todayLog}
                outdatedLog={outdatedLog}
                stats={{ totalDays: 0, lateDays: 0, onTimeDays: 0, absentDays: 0, totalHours: 0, currentStreak: 0 }} // Stats handled separately
                todayActiveLeave={todayActiveLeave}
                onCheckOut={handleCheckOut}
                onCheckOutRequest={onLeaveSubmit}
                onOpenCheckIn={() => setIsCheckInModalOpen(true)}
                onOpenLeave={onOpenLeave}
                isDriveReady={isDriveReady}
                onRefresh={refresh}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
            />

            <CheckInModal 
                isOpen={isCheckInModalOpen} 
                onClose={() => setIsCheckInModalOpen(false)}
                onConfirm={handleConfirmCheckIn}
                availableLocations={availableLocations}
                startTime={startTime}
                lateBuffer={lateBuffer}
                onSwitchToLeave={() => { setIsCheckInModalOpen(false); onOpenLeave(); }} // Handled by parent
                approvedWFH={todayActiveLeave?.type === 'WFH' && todayActiveLeave.status === 'APPROVED'}
                hasLateRequest={todayActiveLeave?.type === 'LATE_ENTRY'}
            />
        </div>
    );
};

export default AttendanceControl;
