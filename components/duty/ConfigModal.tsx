
import React, { useState } from 'react';
import { X, Settings, Save, ArchiveRestore, Users, Sparkles, AlertTriangle, Calendar } from 'lucide-react';
import { DutyConfig } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

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
    { num: 1, label: 'Mon', full: 'วันจันทร์', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { num: 2, label: 'Tue', full: 'วันอังคาร', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { num: 3, label: 'Wed', full: 'วันพุธ', color: 'bg-green-100 text-green-700 border-green-200' },
    { num: 4, label: 'Thu', full: 'วันพฤหัสบดี', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { num: 5, label: 'Fri', full: 'วันศุกร์', color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

const ConfigModal: React.FC<ConfigModalProps> = ({ 
    isOpen, onClose, configs, onUpdateConfig, onUpdateTitle, onSave, onCleanup 
}) => {
    const { showConfirm } = useGlobalDialog();
    const [activeDay, setActiveDay] = useState(1); // Default to Monday

    if (!isOpen) return null;

    const handleCleanupClick = async () => {
        const confirmed = await showConfirm(
            'ระบบจะลบประวัติเวรที่เก่ากว่า 180 วันทิ้งถาวร เพื่อคืนพื้นที่ Database ยืนยันหรือไม่?',
            '⚠️ เขตอันตราย (Danger Zone)'
        );
        if (confirmed) {
            onCleanup();
        }
    };

    // Get current active config
    const currentConfig = configs.find(c => c.dayOfWeek === activeDay) || { 
        dayOfWeek: activeDay, requiredPeople: 1, taskTitles: [''] 
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-sans">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] scale-100 animate-in zoom-in-95 relative border-4 border-white ring-1 ring-gray-100">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">
                                ตั้งค่ากติกาเวร (Duty Rules)
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">
                                กำหนดจำนวนคนและหน้าที่ในแต่ละวัน
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#f8fafc]">
                    
                    {/* LEFT: Sidebar / Day Tabs */}
                    <div className="w-full md:w-64 bg-white border-r border-gray-100 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0 scrollbar-hide">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-2 hidden md:block">
                            Select Day
                        </p>
                        {WEEK_DAYS_MAP.map((day) => {
                            const isActive = activeDay === day.num;
                            // Check info from config to show summary badge
                            const dayConf = configs.find(c => c.dayOfWeek === day.num);
                            
                            return (
                                <button
                                    key={day.num}
                                    onClick={() => setActiveDay(day.num)}
                                    className={`
                                        flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 w-full relative overflow-hidden group min-w-[100px] md:min-w-0
                                        ${isActive 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 translate-x-1' 
                                            : 'bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <span className={`text-sm font-bold w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-white border border-gray-200'}`}>
                                            {day.label.charAt(0)}
                                        </span>
                                        <span className="text-sm font-bold">{day.label}</span>
                                    </div>
                                    <span className={`text-[10px] font-medium relative z-10 ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>
                                        {dayConf?.requiredPeople || 1} คน
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* RIGHT: Config Area */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col">
                        <div className="mb-6 flex items-center gap-3">
                            <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${WEEK_DAYS_MAP[activeDay-1].color}`}>
                                {WEEK_DAYS_MAP[activeDay-1].label}
                            </span>
                            <h2 className="text-2xl font-black text-gray-800">
                                {WEEK_DAYS_MAP[activeDay-1].full}
                            </h2>
                        </div>

                        {/* Section 1: Number of People */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <Users className="w-4 h-4 mr-2" /> จำนวนคนเวร (Required People)
                            </label>
                            
                            <div className="flex items-center gap-3">
                                {[1, 2, 3, 4, 5].map(num => {
                                    const isSelected = currentConfig.requiredPeople === num;
                                    return (
                                        <button
                                            key={num}
                                            onClick={() => onUpdateConfig(activeDay, 'requiredPeople', num)}
                                            className={`
                                                w-12 h-12 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center border-2
                                                ${isSelected 
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-110' 
                                                    : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-300 hover:text-indigo-500'
                                                }
                                            `}
                                        >
                                            {num}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 2: Tasks Definition */}
                        <div className="flex-1">
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                                <Sparkles className="w-4 h-4 mr-2" /> หน้าที่รับผิดชอบ (Duties)
                            </label>

                            <div className="space-y-3">
                                {Array.from({ length: currentConfig.requiredPeople }).map((_, idx) => (
                                    <div key={idx} className="group flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 relative">
                                            <input 
                                                type="text"
                                                className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300"
                                                placeholder={`ระบุหน้าที่ของคนที่ ${idx + 1} (เช่น กวาดพื้น, ทิ้งขยะ)`}
                                                value={currentConfig.taskTitles[idx] || ''}
                                                onChange={(e) => onUpdateTitle(activeDay, idx, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                             <div className="flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-xl text-red-500 shadow-sm">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-red-800">ล้างข้อมูลเก่า (Maintenance)</h5>
                                        <p className="text-xs text-red-600 opacity-80">ลบประวัติเวรที่เก่ากว่า 6 เดือน</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCleanupClick}
                                    className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <ArchiveRestore className="w-4 h-4 mr-1.5 inline-block" />
                                    Cleanup
                                </button>
                             </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0 relative z-20">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-colors text-sm"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={onSave} 
                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <Save className="w-5 h-5" /> บันทึกทั้งหมด
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
