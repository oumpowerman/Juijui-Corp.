import React from 'react';
import { X, Printer, FileText } from 'lucide-react';

interface ReportHeaderProps {
    dateRange: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR';
    setDateRange: (range: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR') => void;
    onPrint: () => void;
    onClose: () => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ dateRange, setDateRange, onPrint, onClose }) => {
    return (
        <div className="bg-white/60 backdrop-blur-md border-b border-white/40 p-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 print:hidden">
            <div className="flex items-center gap-5">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl text-white shadow-xl shadow-indigo-200/50">
                    <FileText className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Smart Performance Insight</h2>
                    <p className="text-xs text-indigo-500 font-black uppercase tracking-[0.2em]">รายงานสรุปผลงานระดับพรีเมียม</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-white/60 backdrop-blur-sm">
                     {(['THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR'] as const).map(r => (
                         <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                                dateRange === r 
                                ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100 scale-105' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                            }`}
                         >
                             {r === 'THIS_MONTH' ? 'เดือนนี้' : r === 'LAST_MONTH' ? 'เดือนก่อน' : 'รายปี'}
                         </button>
                     ))}
                </div>

                <button 
                    onClick={onPrint}
                    className="flex items-center gap-2 px-7 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
                >
                    <Printer className="w-4 h-4" /> พิมพ์รายงาน
                </button>
                
                <button 
                    onClick={onClose} 
                    className="p-3 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 rounded-full transition-all shadow-sm"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default ReportHeader;
