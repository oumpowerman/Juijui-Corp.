import React, { useMemo } from 'react';
import { Edit2, CalendarPlus, X, Loader2, Check, Plus, Sparkles, AlertTriangle } from 'lucide-react';
import { MasterOption } from '../../../types';
import { MONTHS, HOLIDAY_TYPES, Holiday, getHolidayTypeInfo } from './holidayTypes';
import FilterDropdown from '../../common/FilterDropdown';

interface HolidayFormProps {
    editingId: string | null;
    newName: string;
    setNewName: (val: string) => void;
    newDay: number;
    setNewDay: (val: number) => void;
    newMonth: number;
    setNewMonth: (val: number) => void;
    newTypeKey: string;
    setNewTypeKey: (val: string) => void;
    onCancelEdit: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    eventTypeOptions: MasterOption[];
    annualHolidays: Holiday[];
}

const HolidayForm: React.FC<HolidayFormProps> = ({
    editingId, newName, setNewName, newDay, setNewDay, newMonth, setNewMonth, newTypeKey, setNewTypeKey,
    onCancelEdit, onSubmit, isSubmitting, eventTypeOptions, annualHolidays
}) => {
    
    // Check if the current selected date has an existing holiday configured
    const duplicateHoliday = useMemo(() => {
        return (annualHolidays || []).find(h => h.day === newDay && h.month === newMonth && h.id !== editingId);
    }, [annualHolidays, newDay, newMonth, editingId]);

    const duplicateTypeInfo = useMemo(() => {
        if (!duplicateHoliday) return null;
        return getHolidayTypeInfo(duplicateHoliday.typeKey || duplicateHoliday.type_key || 'ANNUAL', eventTypeOptions);
    }, [duplicateHoliday, eventTypeOptions]);

    // Dynamic day options according to selected month
    const dayOptions = useMemo(() => {
        const daysMap: Record<number, number> = {
            1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
            7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
        };
        const maxDays = daysMap[newMonth] || 31;
        return Array.from({ length: maxDays }, (_, i) => ({
            key: String(i + 1),
            label: String(i + 1)
        }));
    }, [newMonth]);

    const monthOptions = useMemo(() => {
        return MONTHS.map(m => ({
            key: String(m.num),
            label: m.name
        }));
    }, []);

    const typeOptions = useMemo(() => {
        // Use custom choices primarily
        const base = HOLIDAY_TYPES.map(t => ({
            key: t.key,
            label: t.label
        }));

        // Append any other master EVENT_TYPEs not represented
        eventTypeOptions.forEach(opt => {
            if (!base.some(b => b.key === opt.key)) {
                base.push({
                    key: opt.key,
                    label: opt.label
                });
            }
        });

        return base;
    }, [eventTypeOptions]);

    return (
        <div id="holiday-form" className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-200/80 p-6 transition-all duration-300 ${editingId ? 'ring-2 ring-emerald-500/20 bg-emerald-50/5' : ''}`}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
                    {editingId ? (
                        <>
                            <Edit2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span>แก้ไขข้อมูลวันหยุด</span>
                        </>
                    ) : (
                        <>
                            <CalendarPlus className="w-5 h-5 text-indigo-600" />
                            <span>เพิ่มวันหยุดประจำปี</span>
                        </>
                    )}
                </h3>
                {editingId && (
                    <button 
                        type="button"
                        onClick={onCancelEdit}
                        className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold transition-all duration-200"
                    >
                        <X className="w-3 h-3" /> ยกเลิก
                    </button>
                )}
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">ชื่อวันหยุดประจำปี</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-500 bg-slate-50/50"
                        placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">วันที่</label>
                        <FilterDropdown
                            label="วันที่"
                            options={dayOptions}
                            value={String(newDay)}
                            onChange={(val) => setNewDay(parseInt(val))}
                            showAllOption={false}
                            clearable={false}
                            align="left"
                            activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">เดือน</label>
                        <FilterDropdown
                            label="เดือน"
                            options={monthOptions}
                            value={String(newMonth)}
                            onChange={(val) => {
                                setNewMonth(parseInt(val));
                                // Adjust selected day if it exceeds the new month's days
                                const daysMap: Record<number, number> = {
                                    1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
                                    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
                                };
                                const maxDays = daysMap[parseInt(val)] || 31;
                                if (newDay > maxDays) {
                                    setNewDay(maxDays);
                                }
                            }}
                            showAllOption={false}
                            clearable={false}
                            align="left"
                            activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">ประเภทวันหยุด</label>
                        <FilterDropdown
                            label="เลือกประเภทวันหยุด"
                            options={typeOptions}
                            value={newTypeKey}
                            onChange={setNewTypeKey}
                            showAllOption={false}
                            clearable={false}
                            align="left"
                            activeColorClass="bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold"
                        />
                    </div>

                    {duplicateHoliday && duplicateTypeInfo && (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 shadow-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs leading-relaxed text-amber-800 font-medium">
                                <span className="font-extrabold text-amber-950">วันที่ระบุมีวันหยุดอยู่แล้ว:</span>{' '}
                                <span className="font-extrabold text-amber-900 underline">{duplicateHoliday.name}</span>{' '}
                                ({duplicateTypeInfo.label})
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full py-3.5 rounded-2xl font-extrabold text-white shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 cursor-pointer ${
                        editingId 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                    }`}
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : editingId ? (
                        <>
                            <Check className="w-4 h-4" /> บันทึกการแก้ไข
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" /> บันทึกวันหยุดใหม่
                        </>
                    )}
                </button>
            </form>
            
            {!editingId && (
                <div className="mt-5 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[11px] text-indigo-700 leading-relaxed font-bold">
                        ข้อมูลที่กำหนดไว้ที่นี่จะถูกแสดงบนปฏิทินกลาง และช่วยคำนวณวันทำงานของฝ่ายบุคคลอย่างถูกต้องร้อยเปอร์เซ็นต์ครับ ✨
                    </p>
                </div>
            )}
        </div>
    );
};

export default HolidayForm;
