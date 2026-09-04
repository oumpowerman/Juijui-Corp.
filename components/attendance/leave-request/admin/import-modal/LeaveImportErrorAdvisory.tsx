import React from 'react';
import { AlertTriangle, Lightbulb, Download, Filter, Sparkles } from 'lucide-react';
import { LeaveImportViewFilter } from './useLeaveImportModal';

interface LeaveImportErrorAdvisoryProps {
    errorRowsCount: number;
    warningRowsCount: number;
    totalRows: number;
    onDownloadTemplate: () => void;
    onSelectFilter: (filter: LeaveImportViewFilter) => void;
    activeFilter: LeaveImportViewFilter;
}

export const LeaveImportErrorAdvisory: React.FC<LeaveImportErrorAdvisoryProps> = ({
    errorRowsCount,
    warningRowsCount,
    totalRows,
    onDownloadTemplate,
    onSelectFilter,
    activeFilter
}) => {
    if (errorRowsCount === 0 && warningRowsCount === 0) {
        return null;
    }

    // Case 1: Error rows > 5 -> Strongly advise fixing in CSV/Excel file first
    if (errorRowsCount > 5) {
        return (
            <div className="mx-4 sm:mx-6 my-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-50 border border-rose-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-rose-600/20 mt-0.5 md:mt-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs font-black text-rose-950">
                                ตรวจพบข้อผิดพลาด {errorRowsCount} แถว (จากทั้งหมด {totalRows} แถว)
                            </h5>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wide">
                                แนะนำแก้ไขในไฟล์ต้นฉบับ
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            เนื่องจากมีรายการที่ไม่ผ่านการตรวจสอบ<strong>มากกว่า 5 รายการ</strong> (เช่น อีเมลพนักงานไม่ตรง หรือรูปแบบวันที่ผิด) ขอแนะนำให้เปิดไฟล์ Excel/CSV ต้นฉบับแก้ไขแล้วอัปโหลดใหม่อีกครั้งเพื่อความสะดวกรวดเร็ว — หรือหากต้องการ คุณสามารถกดปุ่ม <span className="font-bold text-slate-800">"แก้ไข"</span> ที่ตารางเพื่อเลือกพนักงานหรือแก้วันที่รายแถวได้เช่นกัน
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center w-full md:w-auto justify-end">
                    <button
                        type="button"
                        onClick={onDownloadTemplate}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>โหลด Template</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelectFilter(activeFilter === 'ERROR' ? 'ALL' : 'ERROR')}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span>{activeFilter === 'ERROR' ? 'ดูทั้งหมด' : `กรองดู Error (${errorRowsCount})`}</span>
                    </button>
                </div>
            </div>
        );
    }

    // Case 2: Error rows between 1 and 5 -> Quick-fix friendly
    if (errorRowsCount > 0 && errorRowsCount <= 5) {
        return (
            <div className="mx-4 sm:mx-6 my-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-blue-50/60 to-emerald-50/40 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-amber-500/20 mt-0.5 md:mt-0">
                        <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs font-black text-amber-950">
                                พบรายการที่ต้องแก้ไขเพียง {errorRowsCount} แถว (สามารถแก้ไขด่วนได้ทันที)
                            </h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Quick Edit Ready
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            คุณสามารถกดปุ่ม <span className="font-bold text-blue-700">✏️ "แก้ไข"</span> ที่แถวในตารางเพื่อเลือกพนักงาน หรือปรับวันที่ให้ถูกต้อง เมื่อบันทึกแล้วรายการจะเปลี่ยนเป็น <span className="text-emerald-600 font-bold">"พร้อมบันทึก"</span> ทันที
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onSelectFilter(activeFilter === 'ERROR' ? 'ALL' : 'ERROR')}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer self-end md:self-center active:scale-95"
                >
                    <Filter className="w-3.5 h-3.5" />
                    <span>{activeFilter === 'ERROR' ? 'ดูทั้งหมด' : `ไปแถวที่มี Error (${errorRowsCount})`}</span>
                </button>
            </div>
        );
    }

    // Case 3: Only warnings (errors = 0)
    return (
        <div className="mx-4 sm:mx-6 my-2 p-2.5 sm:p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                    ข้อมูลพนักงานถูกต้องทั้งหมด มีเพียงข้อสังเกตเรื่องช่วงเวลาทับซ้อนหรือการตั้งค่าอัตโนมัติ {warningRowsCount} รายการ (ระบบสามารถนำเข้าและคำนวณโควตาได้ทันที)
                </span>
            </div>
            <button
                type="button"
                onClick={() => onSelectFilter(activeFilter === 'WARNING' ? 'ALL' : 'WARNING')}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0 cursor-pointer"
            >
                {activeFilter === 'WARNING' ? 'แสดงทั้งหมด' : 'ดูข้อสังเกต'}
            </button>
        </div>
    );
};
