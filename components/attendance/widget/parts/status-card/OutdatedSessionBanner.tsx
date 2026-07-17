import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { AlertCircle } from 'lucide-react';
import { AttendanceLog } from '../../../../../types/attendance';

interface OutdatedSessionBannerProps {
    outdatedLogs: AttendanceLog[];
    onRecoveryClick: (date: string) => void;
}

export const OutdatedSessionBanner: React.FC<OutdatedSessionBannerProps> = ({
    outdatedLogs,
    onRecoveryClick
}) => {
    const isSessionOutdated = outdatedLogs && outdatedLogs.length > 0;

    if (!isSessionOutdated) return null;

    return (
        <>
            {outdatedLogs.map(log => (
                <div key={log.id} className="bg-orange-100 border border-orange-200 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-2 mb-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-orange-800">ลืมตอกบัตรออก!</p>
                            <p className="text-[10px] text-orange-600">วันที่ {format(new Date(log.date), 'd MMM yyyy', { locale: th })}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onRecoveryClick(log.date)}
                        className="bg-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm hover:bg-orange-600 transition-colors"
                    >
                        แจ้งเวลาออก
                    </button>
                </div>
            ))}
        </>
    );
};
