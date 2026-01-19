
import React, { useState, useEffect } from 'react';
import { Camera, Mic, Box, Plus, Trash2, X, Lightbulb, Settings, List, RotateCcw, Layout, CheckCircle2, Save, FilePlus, ChevronDown, Bell, Download, PackageOpen } from 'lucide-react';
import { ChecklistItem, ChecklistCategory, ChecklistPreset } from '../types';
import MentorTip from './MentorTip';

interface ShootChecklistProps {
    items: ChecklistItem[];
    onToggle: (id: string, currentStatus: boolean) => void;
    onAdd: (text: string, categoryId: string) => void;
    onDelete: (id: string) => void;
    onReset: () => void;
    
    presets: ChecklistPreset[];
    onLoadPreset: (id: string) => void;
    onAddPreset: (name: string) => void;
    onDeletePreset: (id: string) => void;

    categories: ChecklistCategory[];
    onAddCategory: (title: string, color: string) => void;
    onDeleteCategory: (id: string) => void;
    onOpenSettings: () => void;
}

const ShootChecklist: React.FC<ShootChecklistProps> = ({ 
    items, 
    onToggle, 
    onAdd, 
    onDelete, 
    onReset,
    presets,
    onLoadPreset,
    onAddPreset,
    onDeletePreset,
    categories,
    onAddCategory,
    onDeleteCategory,
    onOpenSettings
}) => {
    const [viewMode, setViewMode] = useState<'CATEGORIZED' | 'MASTER'>('CATEGORIZED');
    const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
    const [isManagePresetsOpen, setIsManagePresetsOpen] = useState(false); // New Modal State
    
    const [addingCategory, setAddingCategory] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState('');

    const [newCatTitle, setNewCatTitle] = useState('');

    const [newPresetName, setNewPresetName] = useState('');
    const [selectedPresetId, setSelectedPresetId] = useState<string>(''); 

    const totalItems = items.length;
    const checkedItems = items.filter(i => i.isChecked).length;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    const getIcon = (name: string) => {
        switch(name) {
            case 'camera': return <Camera className="w-5 h-5" />;
            case 'mic': return <Mic className="w-5 h-5" />;
            case 'light': return <Lightbulb className="w-5 h-5" />;
            default: return <Box className="w-5 h-5" />;
        }
    };

    const handleAddItem = (catId: string) => {
        if(newItemText.trim()) {
            onAdd(newItemText, catId);
            setNewItemText('');
        }
    };

    const handleSavePreset = () => {
        if (newPresetName.trim()) {
            onAddPreset(newPresetName);
            setNewPresetName('');
        }
    };

    const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val) {
            setSelectedPresetId(val);
            onLoadPreset(val);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="pink" messages={["เช็คของให้ครบก่อนออกกอง ดีกว่าต้องวนรถกลับมาเอา!", "ทำ Preset ไว้หลายๆ แบบ เช่น 'Vlog', 'Interview' ช่วยประหยัดเวลาได้เยอะ"]} />

            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">จัดเป๋าออกกอง 🎒</h1>
                    <p className="text-gray-500 mt-1">Advanced Checklist System</p>
                </div>

                <div className="flex flex-col gap-3 w-full xl:w-auto">
                    {/* Top Row: Presets & Tools */}
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                         
                         {/* 1. Load Preset Dropdown (Selection Only) */}
                         <div className="relative group z-20 flex-1 w-full md:w-auto">
                             <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm hover:border-indigo-300 transition-colors w-full">
                                <Download className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs font-bold text-gray-500 uppercase mr-2 whitespace-nowrap hidden sm:inline">โหลดชุด (Load):</span>
                                <select 
                                    className="bg-transparent font-bold text-gray-800 text-sm outline-none cursor-pointer py-1 pr-6 w-full md:w-48 appearance-none truncate"
                                    onChange={handlePresetSelect}
                                    value={selectedPresetId}
                                >
                                    <option value="" disabled>เลือกชุดอุปกรณ์...</option>
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                             </div>
                         </div>

                        {/* 2. Manage Presets Button */}
                        <button 
                            onClick={() => setIsManagePresetsOpen(true)}
                            className="w-full md:w-auto px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 rounded-xl text-sm font-bold flex items-center justify-center transition-all"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            จัดการ Preset
                        </button>
                        
                        {/* Notification Button */}
                        <button 
                            onClick={onOpenSettings}
                            className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95"
                        >
                            <Bell className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Bottom Row: View Modes & Categories */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('CATEGORIZED')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'CATEGORIZED' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                                title="แยกหมวดหมู่"
                            >
                                <Layout className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('MASTER')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'MASTER' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                                title="รวมทุกรายการ"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setIsManageCatsOpen(!isManageCatsOpen)}
                            className={`px-4 py-2 rounded-xl border font-bold text-sm transition-all flex items-center ${isManageCatsOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                            <PackageOpen className="w-4 h-4 mr-2" /> หมวดหมู่
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            ความพร้อม
                            {progress === 100 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">พร้อมออกกอง! 🚗</span>}
                        </span>
                        <span className="font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        if(confirm('รีเซ็ตสถานะเช็คลิสต์ทั้งหมด?')) onReset();
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                    title="รีเซ็ตสถานะ (เอาเช็คถูกออก)"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Expanded Settings Panel (Categories) */}
            {isManageCatsOpen && (
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-indigo-900 mb-3 flex items-center"><PackageOpen className="w-4 h-4 mr-2"/> จัดการหมวดหมู่ (Categories)</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                                <span className="text-sm font-medium mr-2">{cat.title}</span>
                                <button 
                                    onClick={() => {
                                        if(confirm(`ลบหมวดหมู่ "${cat.title}"? รายการข้างในจะหายไปด้วยนะ`)) onDeleteCategory(cat.id);
                                    }} 
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-md">
                        <input 
                            type="text" 
                            value={newCatTitle} 
                            onChange={e => setNewCatTitle(e.target.value)}
                            placeholder="ชื่อหมวดหมู่ใหม่..." 
                            className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                            onClick={() => {
                                if(newCatTitle) {
                                    onAddCategory(newCatTitle, 'bg-gray-50 text-gray-600 border-gray-200');
                                    setNewCatTitle('');
                                }
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700"
                        >
                            เพิ่ม
                        </button>
                    </div>
                </div>
            )}

            {/* --- Manage Presets Modal --- */}
            {isManagePresetsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                                จัดการ Preset
                            </h3>
                            <button onClick={() => setIsManagePresetsOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Section 1: Save Current */}
                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center">
                                    <Save className="w-4 h-4 mr-2" /> บันทึกรายการปัจจุบันเป็น Preset
                                </h4>
                                <p className="text-xs text-indigo-600 mb-3 opacity-80">
                                    รายการที่มีอยู่ในเช็คลิสต์ตอนนี้ จะถูกบันทึกเป็นชุดใหม่
                                </p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="ตั้งชื่อชุดอุปกรณ์..." 
                                        className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={newPresetName}
                                        onChange={e => setNewPresetName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                                    />
                                    <button 
                                        onClick={handleSavePreset}
                                        disabled={!newPresetName.trim()}
                                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        บันทึก
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Existing List */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                                    <List className="w-4 h-4 mr-2" /> รายการที่บันทึกไว้ ({presets.length})
                                </h4>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {presets.length === 0 && <p className="text-sm text-gray-400 italic">ยังไม่มี Preset</p>}
                                    {presets.map(p => (
                                        <div key={p.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-xl hover:border-gray-300 transition-colors">
                                            <span className="text-sm font-medium text-gray-800">{p.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{p.items.length} ชิ้น</span>
                                                <button 
                                                    onClick={() => {
                                                        if(confirm(`ลบ Preset "${p.name}"?`)) onDeletePreset(p.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Clear All */}
                            <div className="pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => {
                                        if(confirm('ต้องการล้างรายการทั้งหมดในหน้าจอเช็คลิสต์?')) {
                                            onLoadPreset('CLEAR');
                                            setIsManagePresetsOpen(false);
                                            setSelectedPresetId('');
                                        }
                                    }}
                                    className="w-full py-2.5 text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors flex items-center justify-center"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> ล้างกระเป๋า (Clear All Items)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {viewMode === 'MASTER' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase text-xs tracking-wider flex justify-between">
                       <span>Master List ({items.length} Items)</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {items.length === 0 && <div className="p-8 text-center text-gray-400">ว่างเปล่า... ลองโหลด Preset ดูสิ</div>}
                        {items.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => onToggle(item.id, item.isChecked)}
                                className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${item.isChecked ? 'bg-gray-50/50' : ''}`}
                            >
                                <div className={`w-6 h-6 rounded-lg border mr-4 flex items-center justify-center transition-all ${item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                    {item.isChecked && <CheckCircle2 className="w-4 h-4 text-white" />} 
                                </div>
                                <span className={`flex-1 font-medium ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.text}</span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {categories.find(c => c.id === item.categoryId)?.title || 'Unknown'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map(cat => {
                        const catItems = items.filter(i => i.categoryId === cat.id);
                        return (
                            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className={`px-5 py-3 border-b border-gray-50 flex items-center justify-between ${cat.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ')}`}>
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-1.5 rounded-lg bg-white/50 ${cat.color}`}>
                                            {getIcon(cat.iconName)}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{cat.title}</h3>
                                    </div>
                                    <span className="text-xs font-bold bg-white/60 px-2 py-1 rounded-full text-gray-500 border border-black/5">
                                        {catItems.filter(i => i.isChecked).length} / {catItems.length}
                                    </span>
                                </div>
                                
                                <div className="p-2 flex-1 space-y-1">
                                    {catItems.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => onToggle(item.id, item.isChecked)}
                                            className={`flex items-center p-2 rounded-lg cursor-pointer transition-all group ${item.isChecked ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${item.isChecked ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'}`}>
                                                {item.isChecked && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className={`flex-1 text-sm ${item.isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.text}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="mt-2 pt-2 border-t border-gray-50 px-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="เพิ่มรายการ..." 
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 py-1"
                                                value={addingCategory === cat.id ? newItemText : ''}
                                                onChange={e => {
                                                    setAddingCategory(cat.id);
                                                    setNewItemText(e.target.value);
                                                }}
                                                onKeyDown={e => {
                                                    if(e.key === 'Enter') handleAddItem(cat.id);
                                                }}
                                            />
                                            <button 
                                                onClick={() => handleAddItem(cat.id)}
                                                className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ShootChecklist;
