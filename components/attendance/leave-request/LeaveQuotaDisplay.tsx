
import React from 'react';
import { CalendarCheck } from 'lucide-react';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { DEFAULT_QUOTAS, LEAVE_THEMES } from './constants';

interface Props {
    type: string;
    usage?: LeaveUsage;
}

const LeaveQuotaDisplay: React.FC<Props> = ({ type, usage }) => {
    const limit = DEFAULT_QUOTAS[type];
    if (!limit || !usage) return null;

    const used = usage[type as LeaveType] || 0;
    const remaining = Math.max(0, limit - used);
    const percent = Math.min(100, (remaining / limit) * 100);
    const theme = LEAVE_THEMES[type] || LEAVE_THEMES['DEFAULT'];

    return (
        <div className={`p-5 rounded-3xl border-2 mb-6 animate-in slide-in-from-top-2 ${theme.bg} ${theme.border}`}>
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 bg-white rounded-lg shadow-sm ${theme.text}`}>
                        <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase opacity-70 ${theme.text}`}>สิทธิ์คงเหลือ (Remaining)</p>
                        <p className={`text-2xl font-black leading-none ${theme.text}`}>{remaining} <span className="text-sm font-medium">/ {limit} วัน</span></p>
                    </div>
                </div>
                <div className={`text-xs font-bold bg-white px-2 py-1 rounded-lg ${theme.text}`}>
                    ใช้ไปแล้ว {used} วัน
                </div>
            </div>
            
            <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-white/50 shadow-inner">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${theme.bar}`} 
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

export default LeaveQuotaDisplay;
