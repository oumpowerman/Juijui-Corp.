
import React from 'react';
import { LeaveUsage, LeaveType } from '../../../types/attendance';
import { DEFAULT_QUOTAS, LEAVE_THEMES } from '../../attendance/leave-request/constants';
import { Palmtree, HeartPulse, Briefcase, ChevronRight, PieChart } from 'lucide-react';

interface LeaveQuotaWidgetProps {
    leaveUsage: LeaveUsage;
    onHistoryClick?: () => void;
}

const LeaveQuotaWidget: React.FC<LeaveQuotaWidgetProps> = ({ leaveUsage, onHistoryClick }) => {
    
    // Define which types to show in the widget
    const displayTypes: LeaveType[] = ['VACATION', 'SICK', 'PERSONAL'];

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <PieChart className="w-5 h-5" />
                    </span>
                    วันลาคงเหลือ (My Quota)
                </h3>
                {onHistoryClick && (
                    <button 
                        onClick={onHistoryClick}
                        className="text-xs font-bold text-gray-400 hover:text-indigo-600 flex items-center transition-colors"
                    >
                        ประวัติ <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                )}
            </div>

            {/* Quota Bars */}
            <div className="space-y-5 relative z-10">
                {displayTypes.map((type) => {
                    const limit = DEFAULT_QUOTAS[type] || 0;
                    const used = leaveUsage[type] || 0;
                    const remaining = Math.max(0, limit - used);
                    const percentUsed = Math.min(100, (used / limit) * 100);
                    
                    const theme = LEAVE_THEMES[type] || LEAVE_THEMES['DEFAULT'];
                    const Icon = theme.icon;

                    return (
                        <div key={type} className="group">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${theme.text} opacity-70`} />
                                    <span className="text-xs font-bold text-gray-600">{type === 'VACATION' ? 'พักร้อน' : type === 'SICK' ? 'ลาป่วย' : 'ลากิจ'}</span>
                                </div>
                                <div className="text-xs font-medium text-gray-500">
                                    เหลือ <span className={`font-black text-sm ${remaining === 0 ? 'text-red-500' : 'text-gray-800'}`}>{remaining}</span> / {limit} วัน
                                </div>
                            </div>
                            
                            {/* Progress Track */}
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner relative">
                                {/* Bar */}
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${theme.bar}`} 
                                    style={{ width: `${percentUsed}%` }}
                                >
                                    {/* Shimmer Effect on Bar */}
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};

export default LeaveQuotaWidget;
