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
        <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                    <Gavel className="w-5 h-5 animate-pulse" />
                </span>
                <div className="text-left">
                    <h2 className="text-lg text-slate-900 flex items-center gap-2 font-bold">
                        ศูนย์พิจารณาและตรวจสอบพฤติกรรมกลุ่มเวร (Tribunal Executive Panel)
                        <span className="bg-indigo-100 text-indigo-700 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                            {reportsCount} คดีรอดำเนินการ
                        </span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-medium">
                        รักษาความสะอาด ความรับผิดชอบ และระเบียบวินัยในออฟฟิศ สนับสนุนคำตัดสินเพื่อปรับสมดุลค่าพลังทีมให้ยุติธรรมที่สุด
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
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
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                    <X className="w-5 h-5 pointer-events-none" />
                </button>
            </div>
        </div>
    );
};

export default TribunalRequestsHeader;
