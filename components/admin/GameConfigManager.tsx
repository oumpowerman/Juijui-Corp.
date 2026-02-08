
import React, { useState } from 'react';
import { useGameConfig } from '../../context/GameConfigContext';
import { Save, RefreshCw, Trophy, Heart, Clock, AlertTriangle, Edit2, Check, X, ShieldAlert, Award } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const GameConfigManager: React.FC = () => {
    const { config, updateConfigValue, refreshConfig, isLoading } = useGameConfig();
    const { showToast } = useToast();
    
    // Local editing state
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = (key: string, value: any) => {
        setEditingKey(key);
        setEditValues(JSON.parse(JSON.stringify(value))); // Deep copy
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValues(null);
    };

    const handleSave = async (key: string) => {
        setIsSaving(true);
        const success = await updateConfigValue(key, editValues);
        setIsSaving(false);
        if (success) {
            showToast('บันทึกการตั้งค่าเกมเรียบร้อย 🎮', 'success');
            setEditingKey(null);
        } else {
            showToast('บันทึกไม่สำเร็จ', 'error');
        }
    };

    const handleInputChange = (path: string[], value: string) => {
        const val = parseInt(value) || 0;
        setEditValues((prev: any) => {
            const newState = { ...prev };
            let current = newState;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = val;
            return newState;
        });
    };

    // Helper to render input fields recursively or flat
    const renderConfigEditor = (key: string, data: any) => {
        // Flatten simple objects for easier editing
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {Object.entries(data).map(([subKey, val]: [string, any]) => {
                    // Special handling for nested structures (e.g. ATTENDANCE_RULES, KPI_REWARDS)
                    if (typeof val === 'object' && val !== null) {
                        return (
                            <div key={subKey} className="col-span-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h5 className="font-bold text-slate-700 mb-2 flex items-center">{subKey}</h5>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(val).map(([nestedKey, nestedVal]: [string, any]) => (
                                        <div key={nestedKey}>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{nestedKey}</label>
                                            <input 
                                                type="number"
                                                className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={editValues?.[subKey]?.[nestedKey] ?? nestedVal}
                                                onChange={(e) => handleInputChange([subKey, nestedKey], e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    // Standard Flat Key-Value
                    return (
                        <div key={subKey}>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{subKey.replace(/_/g, ' ')}</label>
                            <input 
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editValues?.[subKey] ?? val}
                                onChange={(e) => handleInputChange([subKey], e.target.value)}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    const ConfigCard = ({ confKey, title, icon: Icon, color }: any) => {
        const isEditingThis = editingKey === confKey;
        const currentData = config[confKey] || {};

        return (
            <div className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${isEditingThis ? 'border-indigo-500 ring-2 ring-indigo-50 shadow-lg' : 'border-gray-200 hover:border-indigo-200'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${color}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
                            <p className="text-xs text-gray-400 font-mono">{confKey}</p>
                        </div>
                    </div>
                    {isEditingThis ? (
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5"/></button>
                            <button onClick={() => handleSave(confKey)} disabled={isSaving} className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm">
                                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Check className="w-5 h-5"/>}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => handleEdit(confKey, currentData)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                            <Edit2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {isEditingThis ? (
                    renderConfigEditor(confKey, currentData)
                ) : (
                    // Read-only View
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(currentData).map(([k, v]: [string, any]) => {
                             if (typeof v === 'object') return null; // Skip complex objects in summary
                             return (
                                <div key={k} className="bg-gray-50 px-3 py-2 rounded-lg">
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase">{k.replace(/_/g, ' ')}</span>
                                    <span className="font-bold text-gray-700">{v}</span>
                                </div>
                             )
                        })}
                        {/* Summary for complex objects like Attendance/KPI */}
                        {typeof Object.values(currentData)[0] === 'object' && (
                            <div className="col-span-full text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg text-center">
                                รายละเอียดการตั้งค่าซับซ้อน (คลิกแก้ไขเพื่อดู)
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    คำเตือน: การปรับค่าจะมีผลทันทีกับทุกการกระทำถัดไป
                </div>
                <button onClick={() => refreshConfig()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors" title="Reload Config">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <ConfigCard 
                    confKey="GLOBAL_MULTIPLIERS" 
                    title="ตัวคูณ & โบนัส (Global Multipliers)" 
                    icon={Trophy} 
                    color="bg-yellow-100 text-yellow-600" 
                />
                
                <ConfigCard 
                    confKey="DIFFICULTY_XP" 
                    title="ค่าประสบการณ์ (Base XP)" 
                    icon={Trophy} 
                    color="bg-purple-100 text-purple-600" 
                />
                
                <ConfigCard 
                    confKey="PENALTY_RATES" 
                    title="บทลงโทษ (Penalties)" 
                    icon={ShieldAlert} 
                    color="bg-red-100 text-red-600" 
                />

                <ConfigCard 
                    confKey="ATTENDANCE_RULES" 
                    title="กฎการเข้างาน (Attendance Rules)" 
                    icon={Clock} 
                    color="bg-blue-100 text-blue-600" 
                />

                <ConfigCard 
                    confKey="KPI_REWARDS" 
                    title="รางวัลเกรด (KPI Rewards)" 
                    icon={Award} 
                    color="bg-green-100 text-green-600" 
                />
            </div>
        </div>
    );
};

export default GameConfigManager;
