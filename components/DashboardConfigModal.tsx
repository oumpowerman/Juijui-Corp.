
import React, { useState, useEffect } from 'react';
import { DashboardConfig, MasterOption, FilterType } from '../types';
import { X, Check, Save, CheckSquare, Square, AlertCircle, Filter, ChevronDown } from 'lucide-react';
import { STATUS_LABELS } from '../constants';

interface DashboardConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: DashboardConfig | null;
    masterOptions: MasterOption[];
    onSave: (id: string, updates: Partial<DashboardConfig>) => void;
}

const DashboardConfigModal: React.FC<DashboardConfigModalProps> = ({ 
    isOpen, 
    onClose, 
    config, 
    masterOptions = [], 
    onSave 
}) => {
    const [label, setLabel] = useState('');
    const [selectedType, setSelectedType] = useState<FilterType>('STATUS');
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    useEffect(() => {
        if (config) {
            setLabel(config.label);
            setSelectedType(config.filterType || 'STATUS');
            setSelectedKeys(config.statusKeys || []);
        }
    }, [config]);

    if (!isOpen || !config) return null;

    // --- STEP 1: Filter Master Options by Selected Type ---
    // User logic: "Go to table master_options, search field name 'type'..."
    let availableOptions = masterOptions
        .filter(o => o.type === selectedType && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // Fallback specific for STATUS if DB is empty (Legacy support)
    if (selectedType === 'STATUS' && availableOptions.length === 0) {
        availableOptions = Object.entries(STATUS_LABELS).map(([key, label], idx) => ({
            id: key,
            key: key,
            label: label as string,
            type: 'STATUS' as const,
            color: 'bg-gray-100 text-gray-600',
            sortOrder: idx,
            isActive: true
        }));
    }

    const toggleSelection = (key: string) => {
        setSelectedKeys(prev => 
            prev.includes(key) 
            ? prev.filter(k => k !== key) 
            : [...prev, key]
        );
    };

    const handleSave = () => {
        onSave(config.id, {
            label,
            filterType: selectedType,
            statusKeys: selectedKeys // Although named statusKeys in DB, it holds keys for the selectedType
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh] animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">ตั้งค่าการ์ด: {config.key}</h3>
                        <p className="text-xs text-gray-500">เลือกประเภทและข้อมูลที่จะแสดงในการ์ดนี้</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อการ์ด (Label)</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                        />
                    </div>

                    {/* --- TYPE SELECTOR --- */}
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <label className="block text-xs font-bold text-indigo-900 uppercase mb-2 flex items-center">
                            <Filter className="w-3 h-3 mr-1" /> 1. เลือกประเภทข้อมูล (Group By)
                        </label>
                        <div className="relative">
                            <select 
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value as FilterType);
                                    setSelectedKeys([]); // Reset selection when type changes
                                }}
                                className="w-full pl-3 pr-8 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value="STATUS">สถานะงาน (Status)</option>
                                <option value="FORMAT">รูปแบบงาน (Format)</option>
                                <option value="PILLAR">แกนเนื้อหา (Pillar)</option>
                                <option value="CATEGORY">หมวดหมู่ (Category)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-indigo-500 mt-2">
                            * เมื่อเปลี่ยนประเภท การเลือกข้อมูลด้านล่างจะถูกรีเซ็ต
                        </p>
                    </div>

                    {/* --- OPTION PICKER --- */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            2. เลือกข้อมูลที่จะรวม ({selectedType})
                        </label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {availableOptions.length === 0 && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <p className="text-xs text-red-600 font-bold">ไม่พบข้อมูล {selectedType}</p>
                                    <p className="text-[10px] text-red-500 mt-1">กรุณาเพิ่มข้อมูลในเมนู Admin ▶ ตั้งค่าระบบ</p>
                                </div>
                            )}
                            
                            {availableOptions.map(opt => {
                                const isSelected = selectedKeys.includes(opt.key);
                                return (
                                    <div 
                                        key={opt.key}
                                        onClick={() => toggleSelection(opt.key)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${opt.color ? opt.color.replace('text-', 'bg-').split(' ')[0] : 'bg-gray-300'}`}></div>
                                            <div>
                                                <p className={`text-sm ${isSelected ? 'font-bold text-indigo-900' : 'text-gray-600'}`}>{opt.label}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{opt.key}</p>
                                            </div>
                                        </div>
                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-gray-300" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm">ยกเลิก</button>
                    <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center text-sm">
                        <Save className="w-4 h-4 mr-2" /> บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardConfigModal;
