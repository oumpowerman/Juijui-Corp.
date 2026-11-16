import React from 'react';
import { Clock, X } from 'lucide-react';

interface DeadlineRequestsHeaderProps {
    requestsCount: number;
    metrics: {
        total: number;
        urgent: number;
        longExtensions: number;
        topRequester: string;
    };
    onClose: () => void;
}

const DeadlineRequestsHeader: React.FC<DeadlineRequestsHeaderProps> = ({
    requestsCount,
    metrics,
    onClose
}) => {
    return (
        <div className="bg-gradient-to-r from-indigo-50/70 via-white to-rose-50/40 border-b border-slate-200/80 px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-indigo-100/80 border border-indigo-200/70 text-indigo-700 rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                </div>
                <div className="text-left min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h2 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                            ศูนย์พิจารณาคำขอเลื่อนกำหนดส่ง
                        </h2>
                        <span className="text-xs font-semibold text-indigo-700 tabular-nums whitespace-nowrap">
                            · รอพิจารณา {requestsCount} รายการ
                        </span>
                    </div>
                    <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                        ตรวจสอบภาระงาน กำหนดวันที่อนุมัติ และส่งเหตุผลประกอบการพิจารณาให้ผู้รับผิดชอบทราบ
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 pr-2 border-r border-slate-200/80 tabular-nums">
                    <div>
                        <span className="text-slate-400">เร่งด่วน 24 ชม.: </span>
                        <span className={`font-bold ${metrics.urgent > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {metrics.urgent}
                        </span>
                    </div>
                    <div>
                        <span className="text-slate-400">ขอเลื่อน ≥ 7 วัน: </span>
                        <span className={`font-bold ${metrics.longExtensions > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                            {metrics.longExtensions}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-500 hover:text-slate-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                    aria-label="ปิดหน้าต่าง"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                </button>
            </div>
        </div>
    );
};

export default DeadlineRequestsHeader;
