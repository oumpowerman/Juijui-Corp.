
import React, { useState } from 'react';
import { KPIConfig } from '../../types';
import { X, Save, Scale, AlertTriangle, Percent } from 'lucide-react';

interface KPIConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: KPIConfig;
    onSave: (config: Partial<KPIConfig>) => void;
}

const KPIConfigModal: React.FC<KPIConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
    const [form, setForm] = useState<KPIConfig>(config);

    if (!isOpen) return null;

    const totalWeight = Number(form.weightOkr) + Number(form.weightBehavior) + Number(form.weightAttendance);
    const isWeightValid = totalWeight === 100;

    const handleSave = () => {
        if (!isWeightValid) {
            alert('ผลรวมน้ำหนักต้องเท่ากับ 100% ครับ');
            return;
        }
        onSave(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border-4 border-indigo-50 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="px-6 py-5 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                    <h3 className="font-black text-indigo-900 flex items-center gap-2 text-lg">
                        <Scale className="w-5 h-5" /> ตั้งค่าเกณฑ์การประเมิน
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {/* 1. Weights */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center text-sm uppercase tracking-wide">
                            <Percent className="w-4 h-4 mr-2 text-indigo-500" /> สัดส่วนคะแนน (Weights)
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: 'ผลงาน (OKRs)', key: 'weightOkr', color: 'text-blue-600' },
                                { label: 'พฤติกรรม (Behavior)', key: 'weightBehavior', color: 'text-pink-600' },
                                { label: 'วินัย (Attendance/Duty)', key: 'weightAttendance', color: 'text-orange-600' },
                            ].map((field) => (
                                <div key={field.key} className="flex items-center justify-between">
                                    <span className={`text-sm font-bold ${field.color}`}>{field.label}</span>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            className="w-16 p-2 rounded-lg border border-gray-300 text-center font-bold focus:ring-2 focus:ring-indigo-200 outline-none"
                                            value={form[field.key as keyof KPIConfig] as number}
                                            onChange={e => setForm({...form, [field.key]: Number(e.target.value)})}
                                        />
                                        <span className="text-gray-400 text-xs">%</span>
                                    </div>
                                </div>
                            ))}
                            <div className={`mt-2 pt-2 border-t flex justify-between font-black ${isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                                <span>รวมทั้งหมด</span>
                                <span>{totalWeight}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Penalties */}
                    <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
                        <h4 className="font-bold text-red-800 mb-3 flex items-center text-sm uppercase tracking-wide">
                            <AlertTriangle className="w-4 h-4 mr-2" /> บทลงโทษ (Deductions)
                        </h4>
                        <div className="space-y-3">
                             {[
                                { label: 'มาสาย (ต่อครั้ง)', key: 'penaltyLate' },
                                { label: 'ขาดเวร (ต่อครั้ง)', key: 'penaltyMissedDuty' },
                                { label: 'ขาดงาน (ต่อวัน)', key: 'penaltyAbsent' },
                            ].map((field) => (
                                <div key={field.key} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-red-700">{field.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-red-400 font-bold">-</span>
                                        <input 
                                            type="number" 
                                            className="w-16 p-2 rounded-lg border border-red-200 text-center font-bold text-red-600 focus:ring-2 focus:ring-red-200 outline-none"
                                            value={form[field.key as keyof KPIConfig] as number}
                                            onChange={e => setForm({...form, [field.key]: Number(e.target.value)})}
                                        />
                                        <span className="text-red-400 text-xs">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-red-500 mt-3 text-center">* หักลบจากคะแนนในส่วนของวินัย (Attendance Weight)</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                    <button 
                        onClick={handleSave} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center w-full"
                    >
                        <Save className="w-5 h-5 mr-2" /> บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KPIConfigModal;
