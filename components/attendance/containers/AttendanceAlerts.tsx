
import React from 'react';
import { useAttendanceAlerts } from '../../../hooks/attendance/useAttendanceAlerts';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface AttendanceAlertsProps {
    userId: string;
    onAction?: () => void;
}

const AttendanceAlerts: React.FC<AttendanceAlertsProps> = ({ userId, onAction }) => {
    const { actionRequiredLogs, isAlertsLoading } = useAttendanceAlerts(userId);

    if (isAlertsLoading || !actionRequiredLogs || actionRequiredLogs.length === 0) return null;

    const displayLogs = actionRequiredLogs.slice(0, 3);
    const remainingCount = actionRequiredLogs.length - 3;

    return (
        <div className="space-y-3">
            {displayLogs.map((log, index) => (
                <div 
                    key={log.id}
                    onClick={onAction}
                    className={`bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-500 cursor-pointer hover:bg-amber-100 transition-colors ${
                        index > 0 ? 'opacity-80 scale-95' : ''
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">
                                {(log as any).isLate ? 'บันทึกเวลาที่ตกหล่น (เกินกำหนด)' : 'ต้องดำเนินการแก้ไข'}
                            </h4>
                            <p className="text-xs text-amber-700">คุณลืมลงเวลาออกของวันที่ {log.date}</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                        แก้ไขตอนนี้ <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            ))}
            
            {remainingCount > 0 && (
                <button 
                    onClick={onAction}
                    className="w-full py-2 text-[10px] font-bold text-amber-600 bg-amber-50/50 border border-dashed border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                >
                    และอีก {remainingCount} รายการที่ต้องตรวจสอบ...
                </button>
            )}
        </div>
    );
};

export default AttendanceAlerts;
