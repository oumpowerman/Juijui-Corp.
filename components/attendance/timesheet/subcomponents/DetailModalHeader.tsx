import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Info, Clock } from 'lucide-react';
import { AttendanceLog } from '../../../../types/attendance';
import { formatSpecialTypeName } from '../../leave-request/request-detail/utils';
import { AttendanceConditionBadges } from '../../shared/AttendanceBadges';

interface DetailModalHeaderProps {
    user?: any | null;
    log?: AttendanceLog | null;
    leaveRequest?: any | null;
    otRequest?: any | null;
    combinedParsed: any;
    displayDate: Date;
    onClose: () => void;
}

const DetailModalHeader: React.FC<DetailModalHeaderProps> = ({
    user,
    log,
    leaveRequest,
    otRequest,
    combinedParsed,
    displayDate,
    onClose
}) => {
    return (
        <div className="space-y-4">
            {/* Employee Profile Header Block (Optional but highly immersive) */}
            {user && (
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 p-4 rounded-3xl border border-slate-100/80 flex items-center justify-between shrink-0 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <img 
                                src={user.avatarUrl} 
                                className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" 
                                alt={user.name}
                                referrerPolicy="no-referrer"
                            />
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.workStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{user.name}</h4>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                                Lv.{user.level} · {user.position || 'พนักงาน'}
                            </p>
                        </div>
                    </div>
                    {user.department && (
                        <span className="bg-indigo-100/85 text-indigo-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-200/50 uppercase tracking-widest">
                            {user.department}
                        </span>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start shrink-0">
                <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">
                        {log ? 'Time Analysis Log' : (leaveRequest ? 'Leave Request Detail' : 'Overtime Request Detail')}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800">
                        {format(displayDate, 'EEEE d MMMM', { locale: th })}
                    </h3>
                    
                    {leaveRequest && (
                        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border shrink-0
                        ${leaveRequest.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                          leaveRequest.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          'bg-red-100 text-red-700 border-red-200'}`}>
                            {leaveRequest.status === 'APPROVED' ? 'อนุมัติแล้ว' : leaveRequest.status === 'PENDING' ? 'รออนุมัติ' : 'ปฏิเสธ'} · {(() => {
                                const isHalf = leaveRequest.is_half_day || leaveRequest.isHalfDay;
                                const session = leaveRequest.half_day_session || leaveRequest.halfDaySession;
                                if (isHalf) {
                                    return `${formatSpecialTypeName(leaveRequest.type)}ครึ่ง${session === 'AM' ? 'เช้า (AM 0.5)' : 'บ่าย (PM 0.5)'}`;
                                }
                                return formatSpecialTypeName(leaveRequest.type);
                            })()}
                        </div>
                    )}
                    
                    {otRequest && (
                        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border shrink-0
                        ${otRequest.status === 'APPROVED' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                          otRequest.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                          'bg-red-100 text-red-700 border-red-200'}`}>
                            {otRequest.status === 'APPROVED' ? 'อนุมัติแล้ว' : otRequest.status === 'PENDING' ? 'รออนุมัติ' : 'ปฏิเสธ'} · {otRequest.is_fixed ? 'OT แบบเหมาจ่าย' : 'OT รายชั่วโมง'}
                        </div>
                    )}
                    
                    {log && !leaveRequest && (() => {
                        const leaveMatch = log.note?.match(/\[APPROVED LEAVE: (.*?)\]/);
                        if (leaveMatch) {
                            const isAM = log.note?.includes('AM') || log.note?.includes('ครึ่งเช้า');
                            const isPM = log.note?.includes('PM') || log.note?.includes('ครึ่งบ่าย');
                            let sessionText = '';
                            if (isAM) sessionText = 'ครึ่งเช้า (AM 0.5)';
                            else if (isPM) sessionText = 'ครึ่งบ่าย (PM 0.5)';
                            return (
                                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold uppercase tracking-widest border border-sky-200 shrink-0">
                                    {formatSpecialTypeName(leaveMatch[1])}{sessionText ? ` · ${sessionText}` : ''}
                                </div>
                            );
                        }
                        return null;
                    })()}
                    
                    <div className="mt-2.5">
                        <AttendanceConditionBadges parsed={combinedParsed} status={log?.status} size="sm" hideProvisional={true} />
                    </div>
                </div>
                
                <div className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-[1.25rem] md:rounded-[1.5rem] shadow-inner shrink-0">
                    {leaveRequest || otRequest ? <Info className="w-6 h-6 md:w-8 md:h-8" /> : <Clock className="w-6 h-6 md:w-8 md:h-8" />}
                </div>
            </div>
        </div>
    );
};

export default DetailModalHeader;
