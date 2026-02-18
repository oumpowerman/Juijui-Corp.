import React, { useState } from 'react';
import { AttendanceLog, LeaveType, LocationDef, AttendanceStats, LeaveRequest } from '../../../types/attendance';
import { User } from '../../../types';
import { MapPin, Clock, LogIn, LogOut, Camera, CheckCircle2, Cloud, Sparkles, Coffee, Calendar, Flame, Briefcase, AlertTriangle, Palmtree, Hourglass, AlertCircle, ShieldCheck, ArrowRight, ArrowUpRight } from 'lucide-react';
import { format, isToday } from 'date-fns';
import th from 'date-fns/locale/th';
import LeaveRequestModal from '../LeaveRequestModal';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { CheckOutModal } from '../CheckOutModal';
import { useAttendance } from '../../../hooks/useAttendance'; 

interface StatusCardProps {
    user: User;
    todayLog: AttendanceLog | null;
    stats: AttendanceStats;
    todayActiveLeave: LeaveRequest | null; // RENAMED from todayPendingLeave
    onCheckOut: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>; 
    onCheckOutRequest: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>; 
    onOpenCheckIn: () => void;
    onOpenLeave: () => void;
    isDriveReady: boolean;
    onRefresh?: () => void;
    availableLocations: LocationDef[];
    onNavigateToHistory?: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
    user, todayLog, stats, todayActiveLeave, onCheckOut, onCheckOutRequest, onOpenCheckIn, onOpenLeave, isDriveReady, onRefresh, availableLocations, onNavigateToHistory
}) => {
    const { actionRequiredLog } = useAttendance(user.id);
    const { showAlert } = useGlobalDialog(); 
    const { showToast } = useToast();

    // Check if user is checked in AND not on leave
    // 1. Is there a log saying LEAVE?
    const isLeaveLog = todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE';
    
    // 2. Is there an APPROVED request for TODAY? (Fallback if log not created yet)
    const isApprovedLeaveToday = todayActiveLeave?.status === 'APPROVED';

    const isCheckedOut = !!todayLog?.checkOutTime;
    const isCheckedIn = !!todayLog && !isLeaveLog; 
    
    // --- OVERNIGHT LOGIC FIX ---
    const checkInTime = todayLog?.checkInTime ? new Date(todayLog.checkInTime) : null;
    const hoursSinceCheckIn = checkInTime ? (new Date().getTime() - checkInTime.getTime()) / (1000 * 60 * 60) : 0;
    
    const isSessionOutdated = todayLog && todayLog.status === 'WORKING' && 
                              !isToday(new Date(todayLog.date)) && 
                              hoursSinceCheckIn > 18;

    const isAdmin = user.role === 'ADMIN';
    
    // Recovery Logic
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    // Check-out Verification Logic
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

    const { leaveUsage } = useLeaveRequests(user); 

    const handleRecoverySubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        if (isAdmin && todayLog) {
            try {
                const timeMatch = reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '18:00'; 
                
                const logDate = format(new Date(todayLog.date), 'yyyy-MM-dd');
                const fullDateTimeStr = `${logDate}T${timeStr}:00`;
                
                const { error } = await supabase.from('attendance_logs')
                    .update({
                        check_out_time: new Date(fullDateTimeStr).toISOString(),
                        status: 'COMPLETED',
                        note: `${todayLog.note || ''} [ADMIN FIXED: ${reason}]`.trim()
                    })
                    .eq('id', todayLog.id);

                if (error) throw error;
                
                showToast('แก้ไขเวลาออกเรียบร้อย (Admin Override) ✅', 'success');
                if (onRefresh) onRefresh();
                return true;

            } catch (err: any) {
                console.error(err);
                showToast('แก้ไขไม่สำเร็จ: ' + err.message, 'error');
                return false;
            }
        } else {
            const success = await onCheckOutRequest('FORGOT_CHECKOUT', start, end, reason, file);
            if (success) {
                setIsRecoveryModalOpen(false); 
                await showAlert(
                    'ระบบได้รับข้อมูลเวลาออกงานของคุณแล้ว สถานะของวันนี้จะเปลี่ยนเป็น "รอตรวจสอบ (Pending)" กรุณารอ Admin อนุมัติครับ',
                    'ส่งคำขอเรียบร้อยแล้ว! ✅'
                );
                if (onRefresh) onRefresh();
            }
            return success;
        }
    };

    const handleCheckOutRequest = async (timeStr: string, reason: string) => {
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const checkoutDate = new Date(now);
        checkoutDate.setHours(hours, minutes, 0, 0);
        
        const formattedReason = `[TIME:${timeStr}] ${reason} (Location Mismatch)`;
        return await onCheckOutRequest('FORGOT_CHECKOUT', now, now, formattedReason);
    };

    // --- STATE MACHINE UI ---

    // State 1: ON LEAVE (Verified by Log OR Approved Request)
    // Note: WFH is technically a leave request but user still needs to check in, so we exclude WFH from blocking unless logic demands
    if ((isLeaveLog || isApprovedLeaveToday) && todayActiveLeave?.type !== 'WFH') {
         // If approved but no log yet, use request data
         const leaveTitle = todayLog?.note 
            ? todayLog.note.replace(/\[.*?\]/g, '').trim().substring(0, 30) 
            : (todayActiveLeave ? todayActiveLeave.type : 'ลางาน (Leave)');

         return (
            <div className={`
                p-5 rounded-2xl border-2 relative z-10 animate-in slide-in-from-bottom-2 text-center
                ${todayActiveLeave?.type === 'SICK' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-blue-50 border-blue-200 text-blue-800'}
            `}>
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm ${todayActiveLeave?.type === 'SICK' ? 'bg-orange-100 text-orange-500' : 'bg-blue-100 text-blue-500'}`}>
                    {todayActiveLeave?.type === 'SICK' ? <AlertTriangle className="w-8 h-8" /> : <Palmtree className="w-8 h-8" />}
                </div>
                <h3 className="font-bold text-lg">{leaveTitle}</h3>
                <p className="text-sm opacity-80 mt-1 mb-4">
                    วันนี้ได้รับอนุมัติให้ลาแล้ว พักผ่อนให้เต็มที่!
                </p>
                {/* Only show cancel option if it's based on a request and not a hard log */}
                {!todayLog && (
                     <p className="text-xs opacity-60">* ระบบจะสร้างประวัติการลาให้อัตโนมัติ</p>
                )}
            </div>
         );
    }
    
    // State 2: PENDING LEAVE FOR TODAY (Blocking)
    if (todayActiveLeave && todayActiveLeave.status === 'PENDING' && !todayLog && todayActiveLeave.type !== 'LATE_ENTRY') {
        return (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 relative z-10 animate-in slide-in-from-bottom-2 text-center">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3 text-yellow-600 shadow-sm animate-pulse">
                    <Hourglass className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-yellow-900">รออนุมัติการลา...</h3>
                <p className="text-sm text-yellow-700 mt-1 mb-2">
                    คุณได้ส่งคำขอ "{todayActiveLeave.type}" สำหรับวันนี้
                </p>
                <div className="text-xs text-yellow-600/70 italic bg-white/50 px-3 py-2 rounded-lg border border-yellow-100">
                    "{todayActiveLeave.reason}"
                </div>
                <p className="text-[10px] text-yellow-500 mt-3 font-bold">
                    * กรุณารอหัวหน้าอนุมัติก่อน (หรือกด Check-in เพื่อยกเลิกการลา)
                </p>
                <button onClick={onOpenCheckIn} className="mt-2 text-xs underline text-yellow-600 hover:text-yellow-800">
                    เปลี่ยนใจ? กด Check-in เพื่อมาทำงาน
                </button>
            </div>
        );
    }

    // State 3: Session Outdated (Blocking)
    if (isSessionOutdated) {
        return (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 relative z-10 animate-in slide-in-from-bottom-2">
                <div className="flex items-start gap-3 mb-3">
                    <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-orange-900 text-lg">ลืมตอกบัตรออก? 😱</h3>
                        <p className="text-sm text-orange-700">
                            ดูเหมือนคุณลืม Check-out เมื่อ <span className="font-bold underline">{format(new Date(todayLog!.date), 'd MMM', { locale: th })}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsRecoveryModalOpen(true)}
                        className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                    >
                        {isAdmin ? <ShieldCheck className="w-4 h-4"/> : <ArrowRight className="w-4 h-4" />}
                        {isAdmin ? 'บันทึกเวลาออกทันที' : 'แจ้งเวลาออก'}
                    </button>
                </div>

                <LeaveRequestModal 
                    isOpen={isRecoveryModalOpen}
                    onClose={() => setIsRecoveryModalOpen(false)}
                    onSubmit={handleRecoverySubmit}
                    leaveUsage={leaveUsage}
                    fixedType="FORGOT_CHECKOUT"
                    initialDate={new Date(todayLog!.date)}
                />
            </div>
        );
    }

    // State 4: Finished Work Today
    if (isCheckedOut) {
        return (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center relative z-10">
                <p className="text-green-700 font-bold text-lg">🎉 เลิกงานแล้ว!</p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-green-600">
                    <div>
                        <span className="block opacity-70">เข้างาน</span>
                        <span className="font-mono font-bold">{todayLog?.checkInTime ? format(todayLog.checkInTime, 'HH:mm') : '--:--'}</span>
                    </div>
                    <div>
                        <span className="block opacity-70">ออกงาน</span>
                        <span className="font-mono font-bold">{todayLog?.checkOutTime ? format(todayLog.checkOutTime, 'HH:mm') : '--:--'}</span>
                    </div>
                </div>
            </div>
        );
    }

    // State 5: Working Now
    if (isCheckedIn) {
        return (
            <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {todayLog?.workType}
                    </span>
                    <span className="text-xs text-indigo-400">
                        เข้าเมื่อ: <span className="font-mono font-bold text-indigo-600">{todayLog?.checkInTime ? format(todayLog.checkInTime, 'HH:mm') : '--:--'}</span>
                    </span>
                </div>
                {todayLog?.note?.includes('[APPEAL_PENDING]') && (
                     <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 flex items-center gap-2">
                        <Hourglass className="w-4 h-4 text-orange-500 animate-pulse" />
                        <span className="text-xs text-orange-700 font-bold">รออนุมัติการเข้าสาย (Appeal Pending)</span>
                    </div>
                )}
                <button 
                    onClick={() => setIsCheckOutModalOpen(true)}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" /> ตอกบัตรออก (Check Out)
                </button>

                <CheckOutModal 
                    isOpen={isCheckOutModalOpen}
                    onClose={() => setIsCheckOutModalOpen(false)}
                    onConfirm={onCheckOut}
                    onRequest={handleCheckOutRequest}
                    availableLocations={availableLocations}
                    checkInTime={todayLog!.checkInTime || new Date()} 
                />
            </div>
        );
    }

    // State 6: Not Checked In (Idle) - Default
    return (
        <div className="space-y-3 relative z-10">
            {/* ACTION REQUIRED ALERT */}
            {actionRequiredLog && (
                <div 
                    onClick={onNavigateToHistory}
                    className="bg-red-100 border border-red-200 rounded-xl p-3 flex items-center justify-between text-red-800 cursor-pointer hover:bg-red-200 transition-colors animate-pulse"
                >
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-bold">มีรายการถูกปฏิเสธ! แก้ไขด่วน</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4" />
                </div>
            )}

            {/* Appeal Pending Banner (For when waiting to check in but request exists) */}
            {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'PENDING' && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 flex items-center justify-center gap-2 mb-2 animate-in slide-in-from-top-2">
                     <Hourglass className="w-4 h-4 text-orange-500" />
                     <span className="text-xs font-bold text-orange-700">รออนุมัติ: ขอเข้าสาย (Late Entry)</span>
                </div>
            )}
            
            {stats.currentStreak > 0 && (
                <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 py-1.5 rounded-xl border border-orange-200/50 mb-2 animate-pulse-slow">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-wide">
                        {stats.currentStreak} Day Streak!
                    </span>
                </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 text-center border-2 border-dashed border-gray-200">
                <p className="text-sm text-gray-500 font-medium mb-3">พร้อมเริ่มงานรึยัง?</p>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={onOpenCheckIn}
                        className="col-span-2 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-5 h-5" /> กดเพื่อลงเวลา
                    </button>
                    <button 
                        onClick={onOpenLeave}
                        className="col-span-2 py-2 bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" /> แจ้งลา / ลืมลงเวลา
                    </button>
                </div>
            </div>
            {isDriveReady && (
                <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
                    <Cloud className="w-3 h-3" /> เชื่อมต่อ Google Drive แล้ว (ประหยัดพื้นที่)
                </p>
            )}
        </div>
    );
};

export default StatusCard;