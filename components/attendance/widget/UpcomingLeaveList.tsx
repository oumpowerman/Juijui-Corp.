
import React from 'react';
import { LeaveRequest } from '../../../types/attendance';
import { format, differenceInDays } from 'date-fns';
import th from 'date-fns/locale/th';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface UpcomingLeaveListProps {
    requests: LeaveRequest[];
}

const UpcomingLeaveList: React.FC<UpcomingLeaveListProps> = ({ requests }) => {
    if (requests.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-sm animate-in slide-in-from-bottom-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" /> แผนการลาล่วงหน้า (Upcoming)
            </h4>
            <div className="space-y-2">
                {requests.map((req) => {
                    const days = differenceInDays(new Date(req.endDate), new Date(req.startDate)) + 1;
                    const isApproved = req.status === 'APPROVED';
                    const isPending = req.status === 'PENDING';
                    
                    return (
                        <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 relative overflow-hidden group">
                            {/* Status Strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isApproved ? 'bg-green-500' : isPending ? 'bg-orange-400' : 'bg-red-500'}`}></div>
                            
                            <div className="flex items-center gap-3 pl-2">
                                <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${isApproved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    <span className="text-[10px] font-bold uppercase">{format(req.startDate, 'MMM')}</span>
                                    <span className="text-sm font-black">{format(req.startDate, 'd')}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-700">{req.type}</p>
                                    <p className="text-xs text-gray-500">
                                        {days > 1 ? `${days} วัน • ถึง ${format(req.endDate, 'd MMM')}` : 'ลา 1 วัน'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isApproved ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                        <CheckCircle2 className="w-3 h-3" /> อนุมัติแล้ว
                                    </span>
                                ) : isPending ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                                        <Clock className="w-3 h-3" /> รออนุมัติ
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                        <AlertCircle className="w-3 h-3" /> ไม่ผ่าน
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingLeaveList;
