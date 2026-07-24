import React from 'react';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';
import { MasterOption } from '../../../types';
import { MONTHS, getHolidayTypeInfo, Holiday } from './holidayTypes';

interface HolidayListViewProps {
    holidays: Holiday[];
    onEdit: (h: Holiday) => void;
    onDelete: (id: string) => void;
    editingId: string | null;
    eventTypeOptions: MasterOption[];
}

const HolidayListView: React.FC<HolidayListViewProps> = ({ 
    holidays, onEdit, onDelete, editingId, eventTypeOptions 
}) => {
    
    if (holidays.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <AlertCircle className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-500">ไม่พบรายการวันหยุด</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200/70 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
                {holidays.map(holiday => {
                    const typeInfo = getHolidayTypeInfo(holiday.typeKey || holiday.type_key || '', eventTypeOptions);
                    const monthObj = MONTHS.find(m => m.num === holiday.month);
                    const isEditingThis = editingId === holiday.id;

                    return (
                        <div 
                            key={holiday.id} 
                            className={`p-4 flex items-center justify-between hover:bg-slate-50/60 transition-all group duration-150 ${
                                isEditingThis ? 'bg-emerald-50/20 border-l-4 border-l-emerald-500 pl-3' : ''
                            }`}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 inset-x-0 h-3.5 bg-rose-500 flex items-center justify-center">
                                        <span className="text-[8px] font-black text-white tracking-widest">{monthObj?.short}</span>
                                    </div>
                                    <span className="text-base font-black text-slate-800 leading-none mt-2.5">{holiday.day}</span>
                                </div>
                                
                                <div className="min-w-0">
                                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                                        <span className="truncate">{holiday.name}</span>
                                        {isEditingThis && (
                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">กำลังแก้ไข</span>
                                        )}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold shrink-0 ${typeInfo.color}`}>
                                            {typeInfo.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold truncate">
                                            {holiday.day} {monthObj?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 pl-2">
                                <button 
                                    onClick={() => onEdit(holiday)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    title="แก้ไขข้อมูล"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onDelete(holiday.id)} 
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title="ลบข้อมูล"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HolidayListView;
