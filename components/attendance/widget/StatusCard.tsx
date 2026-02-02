
import React, { useState } from 'react';
import { AttendanceLog } from '../../../types/attendance';
import { LogIn, LogOut, MapPin, CheckCircle2, Clock, Cloud, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { format, isToday } from 'date-fns';
import th from 'date-fns/locale/th';
import LeaveRequestModal from '../LeaveRequestModal';
import { useLeaveRequests } from '../../../hooks/useLeaveRequests';

interface StatusCardProps {
    todayLog: AttendanceLog | null;
    onCheckOut: () => void;
    onOpenCheckIn: () => void;
    onOpenLeave: () => void;
    isDriveReady: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
    todayLog, onCheckOut, onOpenCheckIn, onOpenLeave, isDriveReady 
}) => {
    const isCheckedOut = !!todayLog?.checkOutTime;
    const isCheckedIn = !!todayLog;

    // Logic: Detect if the log is from a previous day (Forgot Checkout)
    const isSessionOutdated = todayLog && todayLog.status === 'WORKING' && !isToday(new Date(todayLog.date));
    
    // Recovery Logic
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [isForgotCheckInModalOpen, setIsForgotCheckInModalOpen] = useState(false);
    const { submitRequest } = useLeaveRequests({ id: 'temp' }); // Temp user, actual user injected via context in hook typically, but here we just need the function

    const handleForgotRequest = async (type: any, start: Date, end: Date, reason: string, file?: File) => {
        // This connects to the same hook logic
        // We will pass this handler up or use context in real app, but here we invoke the passed logic
        // For simplicity, we assume LeaveRequestModal uses the correct submit function passed from parent
        // Actually, StatusCard is a child of AttendanceWidget which handles submission.
        // We should trigger a specific mode in parent or handle it here if we bring the hook.
        // Let's delegate to parent via specific event or reuse onOpenLeave with a type hint?
        // Better: StatusCard handles the UI state for specific modals if they differ significantly,
        // OR we reuse the LeaveRequestModal with pre-filled type.
        return false; 
    };

    // State 1: Forgot Check-out (Prioritized)
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
                        แจ้งเวลาออก <ArrowRight className="w-4 h-4" />
                    </button>
                    {/* Force Close Button (Void) - Optional, maybe just let them checkout now as late checkout? 
                        Let's stick to "Request Correction" via Modal for now 
                    */}
                </div>

                {/* Reusing LeaveRequestModal logic but simpler to just trigger parent with specific type */}
                {/* 
                   Ideally, we emit an event to parent `onForgotCheckout(date)`.
                   But since we don't have that prop, we can use a local state hack or 
                   just reuse the onOpenLeave and let user pick "Forgot Checkout" type if we add it to the modal.
                   
                   Better UX: Show a specific button "Fix Record".
                */}
            </div>
        );
    }

    // State 2: Finished Work Today
    if (isCheckedOut) {
        return (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center relative z-10">
                <p className="text-green-700 font-bold text-lg">🎉 เลิกงานแล้ว!</p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-green-600">
                    <div>
                        <span className="block opacity-70">เข้างาน</span>
                        <span className="font-mono font-bold">{format(todayLog!.checkInTime!, 'HH:mm')}</span>
                    </div>
                    <div>
                        <span className="block opacity-70">ออกงาน</span>
                        <span className="font-mono font-bold">{format(todayLog!.checkOutTime!, 'HH:mm')}</span>
                    </div>
                </div>
            </div>
        );
    }

    // State 3: Working Now
    if (isCheckedIn) {
        return (
            <div className="flex flex-col gap-3 relative z-10">
                <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {todayLog?.workType}
                    </span>
                    <span className="text-xs text-indigo-400">
                        เข้าเมื่อ: <span className="font-mono font-bold text-indigo-600">{format(todayLog!.checkInTime!, 'HH:mm')}</span>
                    </span>
                </div>
                <button 
                    onClick={onCheckOut}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" /> ตอกบัตรออก (Check Out)
                </button>
            </div>
        );
    }

    // State 4: Not Checked In (Idle)
    return (
        <div className="space-y-3 relative z-10">
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
