import React from 'react';
import { Gavel, X, AlertTriangle, ShieldAlert } from 'lucide-react';

interface TribunalRequestsHeaderProps {
    reportsCount: number;
    metrics: {
        total: number;
        critical: number;
        warning: number;
        mostCommonCategory: string;
    };
    onClose: () => void;
}

const TribunalRequestsHeader: React.FC<TribunalRequestsHeaderProps> = ({
    reportsCount,
    metrics,
    onClose
}) => {
    return (
        <div className="bg-white border-b border-slate-200 px-4 py-3 sm:p-5 md:px-8 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <span className="p-2 sm:p-2.5 bg-indigo-500 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-indigo-500/20 shrink-0">
                    <Gavel className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </span>
                <div className="text-left min-w-0 flex-1">
                    <h2 className="text-sm sm:text-lg text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1 font-bold leading-snug">
                        <span className="sm:hidden truncate">ศูนย์พิจารณาพฤติกรรมกลุ่มเวร</span>
                        <span className="hidden sm:inline">
                            ศูนย์พิจารณาและตรวจสอบพฤติกรรมกลุ่มเวร (Tribunal Executive Panel)
                        </span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
                            {reportsCount} คดีรอดำเนินการ
                        </span>
                    </h2>
                    <p className="hidden sm:block text-[11px] text-slate-400 font-medium mt-0.5">
                        รักษาความสะอาด ความรับผิดชอบ และระเบียบวินัยในออฟฟิศ สนับสนุนคำตัดสินเพื่อปรับสมดุลค่าพลังทีมให้ยุติธรรมที่สุด
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="bg-slate-50 border px-3 py-1.5 rounded-xl text-center shadow-xs hidden sm:block">
                    <p className="text-[9px] tracking-wider text-rose-500 uppercase font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" /> ร้ายแรงสูง
                    </p>
                    <p className="text-xs text-slate-800 font-bold">{metrics.critical} เรื่อง</p>
                </div>
                <div className="bg-slate-50 border px-3 py-1.5 rounded-xl text-center shadow-xs hidden sm:block">
                    <p className="text-[9px] tracking-wider text-amber-500 uppercase font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" /> เรื่องทั่วไป
                    </p>
                    <p className="text-xs text-slate-800 font-bold">{metrics.warning} เรื่อง</p>
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

export default TribunalRequestsHeader;

