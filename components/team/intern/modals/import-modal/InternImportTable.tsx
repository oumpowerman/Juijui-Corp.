import React from 'react';
import { ParsedInternItemPreview } from '../../../../../services/internImportValidator';
import { InternImportDataRow } from './InternImportDataRow';
import { Users2, Search } from 'lucide-react';

interface InternImportTableProps {
    items: ParsedInternItemPreview[];
    onEdit: (item: ParsedInternItemPreview) => void;
}

export const InternImportTable: React.FC<InternImportTableProps> = ({ items, onEdit }) => {
    return (
        <div className="flex-1 overflow-y-auto bg-white border-b border-slate-200/80">
            {items.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                        <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนแท็บตัวกรองหรือล้างคำค้นหา</p>
                </div>
            ) : (
                <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/90 text-slate-600 text-[11px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                            <th className="py-3 px-3 text-center w-12">สถานะ</th>
                            <th className="py-3 px-2 text-center w-12">#</th>
                            <th className="py-3 px-3">ชื่อ-นามสกุล / ติดต่อ</th>
                            <th className="py-3 px-3">ตำแหน่ง</th>
                            <th className="py-3 px-3">สถาบันการศึกษา</th>
                            <th className="py-3 px-3">ระยะเวลาฝึกงาน</th>
                            <th className="py-3 px-3">สถานะผล</th>
                            <th className="py-3 px-3">ข้อสังเกต</th>
                            <th className="py-3 px-3 text-right w-16">แก้ไข</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <InternImportDataRow
                                key={`intern-row-${item.index}`}
                                item={item}
                                onEdit={onEdit}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
