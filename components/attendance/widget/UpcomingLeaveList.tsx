
import React from 'react';
import { LeaveRequest } from '../../../types/attendance';
import { format, isToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar, Clock, ChevronRight, Palmtree, Coffee, Briefcase, AlertCircle } from 'lucide-react';

interface UpcomingLeaveListProps {
    requests: LeaveRequest[];
}

const UpcomingLeaveList: React.FC<UpcomingLeaveListProps> = ({ requests }) => {
    if (requests.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'VACATION': return <Palmtree className="w-4 h-4" />;
            case 'SICK': return <AlertCircle className="w-4 h-4" />;
            case 'WFH': return <Briefcase className="w-4 h-4" />;
            default: return <Coffee className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    แผนการลาล่วงหน้า
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    {requests.length} รายการ
                </span>
            </div>

            <div className="space-y-3">
                {requests.map((req) => (
                    <div 
                        key={req.id}
                        className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getStatusColor(req.status)}`}>
                            {getIcon(req.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-700 truncate">
                                    {req.type}
                                </h4>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${getStatusColor(req.status)}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(req.startDate), 'd MMM', { locale: th })}
                                    {req.startDate !== req.endDate && ` - ${format(new Date(req.endDate), 'd MMM', { locale: th })}`}
                                </p>
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UpcomingLeaveList;
