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
        <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                    <Clock className="w-5 h-5" />
                </span>
                <div className="text-left">
                    <h2 className="text-lg text-slate-900 flex items-center gap-2 font-bold">
                        ศูนย์พิจารณาเดดไลน์ขั้นผู้ควบคุมสุด
                        <span className="bg-indigo-100 text-indigo-700 text-[11px] px-2.5 py-0.5 rounded-full animate-pulse font-bold">
                            {requestsCount} คำรอดำเนินการ
                        </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                        ตรวจสอบระดับพลังประมวณผลทีม ส่องสถิติงานหล่นค้าง และยืนอนุมัติ/ปัดกลุ่มในเสี้ยววินาที
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
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
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default DeadlineRequestsHeader;
