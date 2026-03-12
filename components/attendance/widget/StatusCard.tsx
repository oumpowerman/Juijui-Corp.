
import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceLog, LeaveType, LocationDef, AttendanceStats, LeaveRequest } from '../../../types/attendance';
import { User } from '../../../types';
import { MapPin, LogOut, LogIn, CheckCircle2, Cloud, CloudOff, Sparkles, Coffee, Calendar, Flame, Briefcase, AlertTriangle, Palmtree, Hourglass, AlertCircle, ShieldCheck, ArrowRight, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { format, isToday } from 'date-fns';
import th from 'date-fns/locale/th';
import LeaveRequestModal from '../LeaveRequestModal';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../context/ToastContext';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { CheckOutModal } from '../CheckOutModal';
import ForgotCheckInControl from './ForgotCheckInControl';
import { useCalendarExceptions } from '../../../hooks/useCalendarExceptions';
import { useAnnualHolidays } from '../../../hooks/useAnnualHolidays';

interface StatusCardProps {
    user: User;
    todayLog: AttendanceLog | null;
    outdatedLog: AttendanceLog | null; // NEW
    stats: AttendanceStats;
    todayActiveLeave: LeaveRequest | null;
    onCheckOut: (location?: { lat: number, lng: number }, locationName?: string, reason?: string) => Promise<void>; 
    onCheckOutRequest: (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => Promise<boolean>; 
    onOpenCheckIn: () => void;
    onOpenLeave: () => void;
    isDriveReady: boolean;
    isAuthenticated?: boolean;
    onConnectDrive?: () => void;
    onRetryDrive?: () => void;
    onRefresh?: () => void;
    availableLocations: LocationDef[];
    onNavigateToHistory?: () => void;
    // New Props for Time Fencing
    startTime: string;
    lateBuffer: number;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
    user, todayLog, outdatedLog, stats, todayActiveLeave, onCheckOut, onCheckOutRequest, onOpenCheckIn, onOpenLeave, isDriveReady, isAuthenticated, onConnectDrive, onRetryDrive, onRefresh, availableLocations, onNavigateToHistory,
    startTime, lateBuffer
}) => {
    const { showAlert } = useGlobalDialog(); 
    const { showToast } = useToast();

    // --- DRIVE LOADING TIMER ---
    const [loadingTime, setLoadingTime] = useState(0);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        let interval: any;
        if (!isDriveReady && !isTimeout) {
            interval = setInterval(() => {
                setLoadingTime(prev => {
                    if (prev >= 20) {
                        setIsTimeout(true);
                        clearInterval(interval);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else if (isDriveReady) {
            setLoadingTime(0);
            setIsTimeout(false);
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isDriveReady, isTimeout]);

    const handleRetry = () => {
        setLoadingTime(0);
        setIsTimeout(false);
        if (onRetryDrive) onRetryDrive();
    };

    // --- HOLIDAY LOGIC HOOKS ---
    const { exceptions } = useCalendarExceptions();
    const { annualHolidays } = useAnnualHolidays();
    const [time, setTime] = useState(new Date());

    // Live Clock for accurate day check
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- CHECK HOLIDAY & SPECIAL WORK STATUS ---
    const dayStatus = useMemo(() => {
        const currentCheckDate = time; 
        const todayStr = format(currentCheckDate, 'yyyy-MM-dd');
        const dayOfWeek = currentCheckDate.getDay(); // 0 = Sun, 6 = Sat
        
        // 1. Check Exception (Highest Priority)
        const exception = exceptions.find(e => e.date === todayStr);
        if (exception) {
            if (exception.type === 'HOLIDAY') {
                return { mode: 'HOLIDAY', name: exception.description || 'วันหยุดพิเศษ' };
            }
            if (exception.type === 'WORK_DAY') {
                return { mode: 'SPECIAL_WORK', name: exception.description || 'วันทำงานพิเศษ' };
            }
        }

        // 2. Check Annual Holiday
        const annual = annualHolidays.find(h => h.isActive && h.day === currentCheckDate.getDate() && h.month === (currentCheckDate.getMonth() + 1));
        if (annual) {
            return { mode: 'HOLIDAY', name: annual.name };
        }

        // 3. Check Weekend (Sat/Sun)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return { mode: 'HOLIDAY', name: dayOfWeek === 0 ? 'วันอาทิตย์' : 'วันเสาร์' };
        }

        return { mode: 'NORMAL', name: '' };
    }, [exceptions, annualHolidays, time]);

    // Check if user is checked in AND not on leave
    const isLeaveLog = todayLog?.status === 'LEAVE' || todayLog?.workType === 'LEAVE';
    const isApprovedLeaveToday = todayActiveLeave?.status === 'APPROVED';

    const isCheckedOut = !!todayLog?.checkOutTime;
    const isCheckedIn = !!todayLog && !isLeaveLog; 
    
    // --- OUTDATED SESSION CHECK ---
    const isSessionOutdated = !!outdatedLog;

    const isAdmin = user.role === 'ADMIN';
    
    // Recovery Logic
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    // Check-out Verification Logic
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

    const { leaveUsage } = useLeaveRequests(user); 

    const handleRecoverySubmit = async (type: LeaveType, start: Date, end: Date, reason: string, file?: File) => {
        if (isAdmin && outdatedLog) {
            try {
                const timeMatch = reason.match(/\[TIME:(\d{2}:\d{2})\]/);
                const timeStr = timeMatch ? timeMatch[1] : '18:00'; 
                
                const logDate = format(new Date(outdatedLog.date), 'yyyy-MM-dd');
                const fullDateTimeStr = `${logDate}T${timeStr}:00`;
                
                const { error } = await supabase.from('attendance_logs')
                    .update({
                        check_out_time: new Date(fullDateTimeStr).toISOString(),
                        status: 'COMPLETED',
                        note: `${outdatedLog.note || ''} [ADMIN FIXED: ${reason}]`.trim()
                    })
                    .eq('id', outdatedLog.id);

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
        const formattedReason = `[TIME:${timeStr}] ${reason} (Location Mismatch)`;
        return await onCheckOutRequest('FORGOT_CHECKOUT', now, now, formattedReason);
    };

    // --- STATE MACHINE UI ---

    return (
        <div className="space-y-3 relative z-10">
            {/* OUTDATED SESSION BANNER (Persistent) */}
            {isSessionOutdated && (
                <div className="bg-orange-100 border border-orange-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-orange-800">ลืมตอกบัตรออกเมื่อวาน!</p>
                            <p className="text-[10px] text-orange-600">กรุณาแจ้งเวลาออกย้อนหลังด้วยครับ</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsRecoveryModalOpen(true)}
                        className="bg-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm hover:bg-orange-600 transition-colors"
                    >
                        แจ้งเวลาออก
                    </button>
                    
                    <LeaveRequestModal 
                        isOpen={isRecoveryModalOpen}
                        onClose={() => setIsRecoveryModalOpen(false)}
                        onSubmit={handleRecoverySubmit}
                        leaveUsage={leaveUsage}
                        fixedType="FORGOT_CHECKOUT"
                        initialDate={new Date(outdatedLog!.date)}
                    />
                </div>
            )}

            {/* State 4: Finished Work Today */}
            {isCheckedOut ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
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
            ) : isCheckedIn ? (
                /* State 5: Working Now */
                <div className="flex flex-col gap-3">
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
                    {todayLog?.status === 'PENDING_VERIFY' && (
                         <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 animate-pulse" />
                            <span className="text-xs text-yellow-700 font-bold">รายการนี้รอตรวจสอบ (Manual Entry)</span>
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
            ) : (
                /* State 6: Not Checked In (Idle) - Default */
                <>
                    {/* HOLIDAY WARNING BANNER */}
                    {dayStatus.mode === 'HOLIDAY' && (
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3 flex items-center justify-between animate-pulse-slow mb-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-1.5 rounded-full shadow-sm text-pink-500">
                                    <Palmtree className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-pink-700">วันนี้ {dayStatus.name}</h4>
                                    <p className="text-[10px] text-pink-600 font-medium">วันหยุดพักผ่อน ไม่ต้องลงเวลาก็ได้นะ</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ON LEAVE BANNER (Non-Blocking) */}
                    {(isLeaveLog || isApprovedLeaveToday) && todayActiveLeave?.type !== 'WFH' && todayActiveLeave?.type !== 'LATE_ENTRY' && (
                        <div className="bg-blue-100 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <Palmtree className="w-4 h-4 text-blue-600" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-blue-800">วันนี้คุณลางาน: {todayActiveLeave?.type || 'Leave'}</p>
                                    <p className="text-[10px] text-blue-600">หากต้องการทำงาน สามารถ Check-in ได้ปกติ</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Late Entry Approved Banner */}
                    {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'APPROVED' && !todayLog && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between mb-2 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-green-800">อนุมัติการเข้าสายแล้ว ✅</p>
                                    <p className="text-[10px] text-green-600">คุณสามารถกด Check-in เพื่อเริ่มงานได้เลย</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Appeal Pending Banner */}
                    {todayActiveLeave?.type === 'LATE_ENTRY' && todayActiveLeave.status === 'PENDING' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2 flex items-center justify-center gap-2 mb-2 animate-in slide-in-from-top-2">
                             <Hourglass className="w-4 h-4 text-orange-500" />
                             <span className="text-xs font-bold text-orange-700">รออนุมัติ: ขอเข้าสาย (Late Entry)</span>
                        </div>
                    )}

                    {/* General Pending Leave Banner (Non-Blocking) */}
                    {todayActiveLeave && todayActiveLeave.status === 'PENDING' && todayActiveLeave.type !== 'LATE_ENTRY' && todayActiveLeave.type !== 'FORGOT_CHECKIN' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between gap-2 mb-2 animate-in slide-in-from-top-2">
                             <div className="flex items-center gap-2">
                                <Hourglass className="w-4 h-4 text-yellow-600 animate-pulse" />
                                <div className="text-left">
                                    <p className="text-xs font-bold text-yellow-800">รออนุมัติ: {todayActiveLeave.type}</p>
                                    <p className="text-[10px] text-yellow-600">คุณสามารถ Check-in เพื่อยกเลิกการลาได้</p>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {/* Streak */}
                    {stats.currentStreak > 0 && (
                        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 py-1.5 rounded-xl border border-orange-200/50 mb-2 animate-pulse-slow">
                            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                            <span className="text-xs font-black uppercase tracking-wide">
                                {stats.currentStreak} Day Streak!
                            </span>
                        </div>
                    )}

                    <div className={`rounded-xl p-4 text-center border-2 border-dashed ${dayStatus.mode === 'HOLIDAY' ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-sm font-medium mb-3 ${dayStatus.mode === 'HOLIDAY' ? 'text-pink-600' : 'text-gray-500'}`}>
                            {dayStatus.mode === 'HOLIDAY' ? 'แต่ถ้าจะทำงาน ก็กดได้เลย!' : 'พร้อมเริ่มงานรึยัง?'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={onOpenCheckIn}
                                className={`col-span-2 py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                                    ${dayStatus.mode === 'HOLIDAY' 
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-pink-200' 
                                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200'
                                    }
                                `}
                            >
                                <LogIn className="w-5 h-5" /> {dayStatus.mode === 'HOLIDAY' ? 'ยืนยันลงเวลา (วันหยุด)' : 'กดเพื่อลงเวลา (Check-in)'}
                            </button>
                            
                            <button 
                                onClick={onOpenLeave}
                                className="py-2 bg-white border border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" /> แจ้งลา / สาย
                            </button>
                            
                            {/* NEW: Forgot Check-in Component (Auto Logic) */}
                            <ForgotCheckInControl 
                                startTime={startTime}
                                lateBuffer={lateBuffer}
                                isCheckedIn={!!todayLog}
                                onSubmit={onCheckOutRequest}
                                leaveUsage={leaveUsage}
                            />
                        </div>
                    </div>
                </>
            )}
            
            {/* Google Drive Status & Connection */}
            <div className="mt-4 pt-3 border-t border-gray-50">
                {!isDriveReady ? (
                    <div className="flex flex-col items-center gap-2">
                        {isTimeout ? (
                            <>
                                <div className="flex items-center gap-1.5 text-[12px] text-red-500 font-bold">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>การเชื่อมต่อ Drive ล้มเหลว (Timeout)</span>
                                </div>
                                <button 
                                    onClick={handleRetry}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-[12px] font-bold transition-all active:scale-95"
                                >
                                    <RefreshCw className="w-3 h-3" /> ลองเชื่อมต่อใหม่อีกครั้ง
                                </button>
                                <p className="text-[9px] text-gray-400 text-center px-4">
                                    คุณยังสามารถลงเวลาได้ปกติ รูปภาพจะถูกเก็บในระบบสำรอง
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-2 text-[12px] text-orange-400 font-bold">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>
                                        {loadingTime > 10 
                                            ? 'การเชื่อมต่อช้า... กำลังพยายามอีกครั้ง' 
                                            : 'กำลังโหลดระบบ Google Drive...'}
                                    </span>
                                </div>
                                <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-orange-400 transition-all duration-1000 ease-linear"
                                        style={{ width: `${(loadingTime / 20) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : !isAuthenticated ? (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[12px] text-gray-400 flex items-center gap-1">
                            <CloudOff className="w-3 h-3" /> ยังไม่ได้เชื่อมต่อ Google Drive
                        </p>
                        <button 
                            onClick={onConnectDrive}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-full text-[14px] font-black uppercase tracking-wider transition-all active:scale-95"
                        >
                            <Cloud className="w-3 h-3" /> เชื่อมต่อเพื่อสำรองรูปภาพ
                        </button>
                    </div>
                ) : (
                    <p className="text-[10px] text-emerald-500 font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 
                        เชื่อมต่อ Google Drive แล้ว (สำรองรูปภาพอัตโนมัติ)
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatusCard;
