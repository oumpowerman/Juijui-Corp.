import React from 'react';
import { User, Role, MasterOption } from '../../../types';
import { Calendar, DollarSign, Loader2, Check } from 'lucide-react';
import { WEEK_DAYS } from '../constants';

interface MemberEditFormProps {
    user: User;
    editForm: {
        name: string;
        position: string;
        role: Role;
        baseSalary: number;
        bankAccount: string;
        bankName: string;
        ssoIncluded: boolean;
        taxType: string;
        workDays: number[];
    };
    setEditForm: React.Dispatch<React.SetStateAction<any>>;
    positionOptions: MasterOption[];
    isSaving: boolean;
    onCancel: () => void;
    onSave: (userId: string) => void;
    toggleWorkDay: (dayNum: number) => void;
}

export const MemberEditForm: React.FC<MemberEditFormProps> = ({
    user,
    editForm,
    setEditForm,
    positionOptions,
    isSaving,
    onCancel,
    onSave,
    toggleWorkDay
}) => {
    return (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">ชื่อเรียก</label>
                    <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none font-bold" />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">ตำแหน่ง</label>
                    <select 
                        value={editForm.position} 
                        onChange={e => setEditForm({...editForm, position: e.target.value})} 
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none cursor-pointer"
                    >
                        {positionOptions.map(p => (
                            <option key={p.key} value={p.label}>{p.label}</option>
                        ))}
                        {!positionOptions.find(p => p.label === editForm.position) && editForm.position && (
                            <option value={editForm.position}>{editForm.position}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">สิทธิ์ (Role)</label>
                    <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as Role})} className="w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 outline-none bg-white font-bold">
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
            </div>
            
            {/* Work Days Config */}
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <h5 className="text-xs font-bold text-orange-700 uppercase mb-3 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" /> Work Schedule (วันทำงาน)
                </h5>
                <div className="flex gap-2">
                    {WEEK_DAYS.map((day) => {
                        const isWorkDay = editForm.workDays.includes(day.num);
                        return (
                            <button
                                key={day.num}
                                type="button"
                                onClick={() => toggleWorkDay(day.num)}
                                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center border transition-all ${
                                    isWorkDay 
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm' 
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-orange-300'
                                }`}
                            >
                                {day.label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-[9px] text-orange-400 mt-2">* ระบบจะนับวันขาด/ลา ตามวันที่เลือกเท่านั้น</p>
            </div>
            
            {/* Payroll Info */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h5 className="text-xs font-bold text-indigo-700 uppercase mb-3 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" /> ข้อมูลการเงิน (Payroll Info)
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold text-indigo-400 block mb-1">ฐานเงินเดือน</label>
                        <input type="number" value={editForm.baseSalary} onChange={e => setEditForm({...editForm, baseSalary: Number(e.target.value)})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold text-indigo-400 block mb-1">ธนาคาร</label>
                        <input type="text" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm" placeholder="KBank, SCB" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="text-[9px] font-bold text-indigo-400 block mb-1">เลขบัญชี</label>
                        <input type="text" value={editForm.bankAccount} onChange={e => setEditForm({...editForm, bankAccount: e.target.value})} className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm font-mono" placeholder="xxx-x-xxxxx-x" />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                         <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" checked={editForm.ssoIncluded} onChange={e => setEditForm({...editForm, ssoIncluded: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            <span className="text-xs text-gray-600">หักประกันสังคม (750)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onCancel} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors">ยกเลิก</button>
                <button onClick={() => onSave(user.id)} disabled={isSaving} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200 transition-all active:scale-95">
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />} บันทึก
                </button>
            </div>
        </div>
    );
};
