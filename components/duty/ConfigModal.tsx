
import React from 'react';
import { X, Settings, Save, ArchiveRestore } from 'lucide-react';
import { DutyConfig } from '../../types';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    configs: DutyConfig[];
    onUpdateConfig: (dayNum: number, field: keyof DutyConfig, value: any) => void;
    onUpdateTitle: (dayNum: number, index: number, value: string) => void;
    onSave: () => void;
    onCleanup: () => void;
}

const WEEK_DAYS_MAP = [
    { num: 1, label: 'วันจันทร์ (Mon)' },
    { num: 2, label: 'วันอังคาร (Tue)' },
    { num: 3, label: 'วันพุธ (Wed)' },
    { num: 4, label: 'วันพฤหัส (Thu)' },
    { num: 5, label: 'วันศุกร์ (Fri)' },
];

const ConfigModal: React.FC<ConfigModalProps> = ({ 
    isOpen, onClose, configs, onUpdateConfig, onUpdateTitle, onSave, onCleanup 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 relative border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 flex items-center">
                            <Settings className="w-5 h-5 mr-2 text-indigo-600" /> จัดการกติกาเวร (Rules)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">กำหนดจำนวนคนและหน้าที่ในแต่ละวัน</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {WEEK_DAYS_MAP.map((dayMap) => {
                        const config = configs.find(c => c.dayOfWeek === dayMap.num) || { dayOfWeek: dayMap.num, requiredPeople: 1, taskTitles: [''] };
                        
                        return (
                            <div key={dayMap.num} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-indigo-700">{dayMap.label}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">จำนวนคน:</span>
                                        <select 
                                            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:border-indigo-500 outline-none"
                                            value={config.requiredPeople}
                                            onChange={(e) => onUpdateConfig(dayMap.num, 'requiredPeople', parseInt(e.target.value))}
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} คน</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    {Array.from({ length: config.requiredPeople }).map((_, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-400 w-6 text-center">{idx + 1}.</span>
                                            <input 
                                                type="text"
                                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 outline-none"
                                                placeholder={`หน้าที่ของคนที่ ${idx + 1}`}
                                                value={config.taskTitles[idx] || ''}
                                                onChange={(e) => onUpdateTitle(dayMap.num, idx, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <div className="pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => {
                                if(confirm('คุณแน่ใจนะว่าจะลบประวัติเวรที่เก่ากว่า 180 วัน?')) onCleanup();
                            }}
                            className="flex items-center text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-2 rounded-lg transition-colors w-fit"
                        >
                            <ArchiveRestore className="w-4 h-4 mr-2" />
                            ล้างประวัติเก่า (Cleanup History)
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                    <button onClick={onSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center">
                        <Save className="w-4 h-4 mr-2" /> บันทึกกติกา
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
