
import React from 'react';
import { useAttendanceAlerts } from '../../../hooks/attendance/useAttendanceAlerts';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { LeaveType } from '../../../types/attendance';

interface AttendanceAlertsProps {
    userId: string;
    onAction?: (date?: string, requestType?: LeaveType) => void;
}

const AttendanceAlerts: React.FC<AttendanceAlertsProps> = ({ userId, onAction }) => {
    const { actionRequiredLogs, isAlertsLoading } = useAttendanceAlerts(userId);

    if (isAlertsLoading || !actionRequiredLogs || actionRequiredLogs.length === 0) return null;

    const displayLogs = actionRequiredLogs.slice(0, 3);
    const remainingCount = actionRequiredLogs.length - 3;

    return (
        <div className="space-y-3">
            {displayLogs.map((log, index) => {
                const isGpsRejected = log.requestType === 'GPS_SPOOF_APPEAL';
                return (
                    <div 
                        key={log.id}
                        onClick={() => onAction?.(log.date, log.requestType)}
                        className={`border rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-500 cursor-pointer transition-colors ${
                            isGpsRejected 
                                ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                                : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                        } ${
                            index > 0 ? 'opacity-80 scale-95' : ''
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isGpsRejected ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold ${isGpsRejected ? 'text-red-900' : 'text-amber-900'}`}>
                                    {log.title}
                                </h4>
                                <p className={`text-xs ${isGpsRejected ? 'text-red-700' : 'text-amber-700'}`}>{log.message}</p>
                            </div>
                        </div>
                        <button className={`flex items-center gap-1 text-xs font-bold transition-colors ${isGpsRejected ? 'text-red-600 hover:text-red-700' : 'text-amber-600 hover:text-amber-700'}`}>
                            แก้ไขตอนนี้ <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                );
            })}
            
            {remainingCount > 0 && (
                <button 
                    onClick={() => onAction?.()}
                    className="w-full py-2 text-[10px] font-bold text-amber-600 bg-amber-50/50 border border-dashed border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                >
                    และอีก {remainingCount} รายการที่ต้องตรวจสอบ...
                </button>
            )}
        </div>
    );
};

export default AttendanceAlerts;

