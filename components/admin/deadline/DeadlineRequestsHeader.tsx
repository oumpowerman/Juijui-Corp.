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
        <div className="bg-white border-b border-slate-200 px-4 py-3 sm:p-5 md:px-8 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <span className="p-2 sm:p-2.5 bg-indigo-500 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-indigo-500/20 shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <div className="text-left min-w-0 flex-1">
                    <h2 className="text-sm sm:text-lg text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1 font-bold leading-snug">
                        <span className="sm:hidden truncate">ศูนย์พิจารณาเดดไลน์</span>
                        <span className="hidden sm:inline">
                            ศูนย์พิจารณาเดดไลน์ขั้นผู้ควบคุมสุด
                        </span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full animate-pulse font-bold whitespace-nowrap shrink-0">
                            {requestsCount} คำรอดำเนินการ
                        </span>
                    </h2>
                    <p className="hidden sm:block text-[11px] text-slate-400 font-medium mt-0.5">
                        ตรวจสอบระดับพลังประมวณผลทีม ส่องสถิติงานหล่นค้าง และยืนอนุมัติ/ปัดกลุ่มในเสี้ยววินาที
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="bg-slate-50 border px-3 py-1.5 rounded-xl text-center shadow-xs hidden sm:block">
                    <p className="text-[9px] tracking-wider text-rose-500 uppercase font-bold">⚠️ ยื่นฉุกเฉิน</p>
                    <p className="text-xs text-slate-800 font-bold">{metrics.urgent} ราย</p>
                </div>
                <div className="bg-slate-50 border px-3 py-1.5 rounded-xl text-center shadow-xs hidden sm:block">
                    <p className="text-[9px] tracking-wider text-amber-500 uppercase font-bold">📅 สัญญายาว &gt;= 7 วัน</p>
                    <p className="text-xs text-slate-800 font-bold">{metrics.longExtensions} ราย</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center shrink-0"
                    aria-label="ปิดหน้าต่าง"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
                </button>
            </div>
        </div>
    );
};

export default DeadlineRequestsHeader;

