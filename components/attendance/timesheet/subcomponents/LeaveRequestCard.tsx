import React from 'react';
import { format } from 'date-fns';
import { Clock, Info } from 'lucide-react';
import { formatSpecialTypeName, parseReason } from '../../leave-request/request-detail/utils';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';

interface LeaveRequestCardProps {
    leaveRequest: any;
}

const getCardLabels = (category: string) => {
    switch (category) {
        case 'CORRECTION':
            return {
                cardTitle: 'คำขอปรับปรุงเวลา',
                timeLabel: 'วันที่ขอปรับปรุงเวลา',
                typeLabel: 'ประเภทคำขอปรับปรุงเวลา',
                reasonLabel: 'เหตุผล / หมายเหตุ',
            };
        case 'SPECIAL':
            return {
                cardTitle: 'คำขอปฏิบัติงาน',
                timeLabel: 'ช่วงเวลาปฏิบัติงาน',
                typeLabel: 'รูปแบบการปฏิบัติงาน',
                reasonLabel: 'วัตถุประสงค์ / หมายเหตุ',
            };
        case 'LEAVE':
        default:
            return {
                cardTitle: 'คำขอลา',
                timeLabel: 'ช่วงเวลาการลา',
                typeLabel: 'ประเภทการลา',
                reasonLabel: 'เหตุผลการขอลา',
            };
    }
};

const LeaveRequestCard: React.FC<LeaveRequestCardProps> = ({ leaveRequest }) => {
    const parsed = parseReason(leaveRequest.reason || '');
    const cleanReason = parsed.cleanReason;

    const registryItem = getRegistryItem(leaveRequest.type);
    const category = registryItem?.category || 'LEAVE';
    const labels = getCardLabels(category);

    return (
        <div className="bg-sky-50/50 p-5 md:p-6 rounded-[2rem] border border-sky-100/80 shrink-0 text-left">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-600">{labels.timeLabel}</span>
                </div>
                <span className="text-xs font-bold text-sky-700 font-mono">
                    {format(new Date(leaveRequest.start_date), 'd MMM')} - {format(new Date(leaveRequest.end_date), 'd MMM')}
                </span>
            </div>
            <div className="h-[1px] bg-sky-100/60 w-full mb-4"></div>
            
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-600">{labels.typeLabel}</span>
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                    {(() => {
                        const isHalf = leaveRequest.is_half_day || leaveRequest.isHalfDay;
                        const session = leaveRequest.half_day_session || leaveRequest.halfDaySession;
                        if (isHalf) {
                            return `${formatSpecialTypeName(leaveRequest.type)} ครึ่งวัน (${session === 'AM' ? 'ครึ่งเช้า' : 'ครึ่งบ่าย'})`;
                        }
                        return formatSpecialTypeName(leaveRequest.type);
                    })()}
                </span>
            </div>

            {cleanReason && (
                <>
                    <div className="h-[1px] bg-sky-100/60 w-full mb-4"></div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{labels.reasonLabel}</p>
                        <p className="text-xs font-medium text-slate-700 bg-white/60 p-2.5 rounded-xl border border-sky-100/40 italic">
                            "{cleanReason}"
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaveRequestCard;
