import React from 'react';
import { Filter } from 'lucide-react';
import { ParsedLeaveItemPreview } from '../../../../../services/leaveImportValidator';
import { LeaveImportDataRow } from './LeaveImportDataRow';

interface LeaveImportTableProps {
    items: ParsedLeaveItemPreview[];
    onEdit: (item: ParsedLeaveItemPreview) => void;
}

export const LeaveImportTable: React.FC<LeaveImportTableProps> = ({ items, onEdit }) => {
    if (items.length === 0) {
        return (
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center text-center text-slate-400 space-y-3 min-h-[260px] bg-slate-50/50">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    <Filter className="w-6 h-6 text-slate-300" />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-700">ไม่มีรายการในหมวดหมู่นี้</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        ลองเปลี่ยนตัวกรองสถานะ หรือล้างคำค้นหาเพื่อดูข้อมูลทั้งหมด
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto p-3 sm:p-5 min-h-0 bg-slate-50/50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
                        <tr className="border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                            <th className="py-3 px-3 w-12 text-center">#</th>
                            <th className="py-3 px-3 w-28">สถานะการตรวจ</th>
                            <th className="py-3 px-4 min-w-[200px]">พนักงาน (Employee)</th>
                            <th className="py-3 px-3 w-36">ประเภทการลา</th>
                            <th className="py-3 px-3 w-40">ช่วงวันที่ลา</th>
                            <th className="py-3 px-3 w-24">จำนวนวัน</th>
                            <th className="py-3 px-3 min-w-[150px]">เหตุผลการลา</th>
                            <th className="py-3 px-3 w-20 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <LeaveImportDataRow key={item.index} item={item} onEdit={onEdit} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
