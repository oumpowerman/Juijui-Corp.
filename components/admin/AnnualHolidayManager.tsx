
import React, { useState } from 'react';
import { MasterOption } from '../../types';
import { useAnnualHolidays } from '../../hooks/useAnnualHolidays';
import { Calendar, Plus, Trash2, CalendarDays, Loader2 } from 'lucide-react';

interface AnnualHolidayManagerProps {
    masterOptions: MasterOption[];
}

const MONTHS = [
    { num: 1, name: 'มกราคม' }, { num: 2, name: 'กุมภาพันธ์' }, { num: 3, name: 'มีนาคม' },
    { num: 4, name: 'เมษายน' }, { num: 5, name: 'พฤษภาคม' }, { num: 6, name: 'มิถุนายน' },
    { num: 7, name: 'กรกฎาคม' }, { num: 8, name: 'สิงหาคม' }, { num: 9, name: 'กันยายน' },
    { num: 10, name: 'ตุลาคม' }, { num: 11, name: 'พฤศจิกายน' }, { num: 12, name: 'ธันวาคม' }
];

const AnnualHolidayManager: React.FC<AnnualHolidayManagerProps> = ({ masterOptions }) => {
    const { annualHolidays, isLoading, addHoliday, deleteHoliday } = useAnnualHolidays();
    
    // Form State
    const [newName, setNewName] = useState('');
    const [newDay, setNewDay] = useState(1);
    const [newMonth, setNewMonth] = useState(1);
    const [newTypeKey, setNewTypeKey] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eventTypeOptions = masterOptions.filter(o => o.type === 'EVENT_TYPE' && o.isActive);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newTypeKey) {
            alert('กรุณากรอกชื่อและเลือกประเภท');
            return;
        }
        setIsSubmitting(true);
        await addHoliday(newName, newDay, newMonth, newTypeKey);
        setNewName('');
        setIsSubmitting(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
            
            {/* Add Form */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-indigo-600" /> เพิ่มวันหยุดประจำปี
                </h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อวันหยุด</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="เช่น วันปีใหม่, วันแรงงาน"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">วันที่</label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newDay}
                                onChange={e => setNewDay(parseInt(e.target.value))}
                            >
                                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เดือน</label>
                            <select 
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={newMonth}
                                onChange={e => setNewMonth(parseInt(e.target.value))}
                            >
                                {MONTHS.map(m => (
                                    <option key={m.num} value={m.num}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ประเภท (Type)</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            value={newTypeKey}
                            onChange={e => setNewTypeKey(e.target.value)}
                            required
                        >
                            <option value="">-- เลือก --</option>
                            {eventTypeOptions.length > 0 ? (
                                eventTypeOptions.map(o => (
                                    <option key={o.key} value={o.key}>{o.label}</option>
                                ))
                            ) : (
                                <option disabled>กรุณาเพิ่ม Master Option 'EVENT_TYPE' ก่อน</option>
                            )}
                        </select>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitting || eventTypeOptions.length === 0}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'บันทึก'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <CalendarDays className="w-4 h-4 mr-2" /> รายการวันหยุด ({annualHolidays.length})
                    </h3>
                </div>
                
                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : annualHolidays.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">ยังไม่มีข้อมูลวันหยุดประจำปี</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {annualHolidays.map(holiday => {
                            const typeOption = eventTypeOptions.find(o => o.key === holiday.typeKey);
                            const colorClass = typeOption?.color || 'bg-gray-100 text-gray-500';

                            return (
                                <div key={holiday.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex flex-col items-center justify-center border border-gray-200 shrink-0">
                                            <span className="text-[10px] font-bold text-red-500 uppercase">{MONTHS.find(m => m.num === holiday.month)?.name.substring(0,3)}</span>
                                            <span className="text-lg font-black text-gray-800">{holiday.day}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{holiday.name}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold mt-1 inline-block ${colorClass}`}>
                                                {typeOption?.label || holiday.typeKey}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => deleteHoliday(holiday.id)} 
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnualHolidayManager;
