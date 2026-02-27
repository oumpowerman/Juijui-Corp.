
import React from 'react';
import { useAttendanceAlerts } from '../../../hooks/attendance/useAttendanceAlerts';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface AttendanceAlertsProps {
    userId: string;
    onAction?: () => void;
}

const AttendanceAlerts: React.FC<AttendanceAlertsProps> = ({ userId, onAction }) => {
    const { actionRequiredLog, isAlertsLoading } = useAttendanceAlerts(userId);

    if (isAlertsLoading || !actionRequiredLog) return null;

    return (
        <div 
            onClick={onAction}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-500 cursor-pointer hover:bg-amber-100 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900">ต้องดำเนินการแก้ไข</h4>
                    <p className="text-xs text-amber-700">คุณลืมลงเวลาออกของวันที่ {actionRequiredLog.date}</p>
                </div>
            </div>
            <button className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                แก้ไขตอนนี้ <ArrowRight className="w-3 h-3" />
            </button>
        </div>
    );
};

export default AttendanceAlerts;
