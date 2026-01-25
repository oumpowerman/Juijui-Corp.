
import React, { useState, useMemo } from 'react';
import { Camera, Mic, Box, Plus, Trash2, Lightbulb, Layout, CheckCircle2, Archive, RotateCcw, PackageOpen, PlusCircle, Compass, Info } from 'lucide-react';
import { ChecklistItem, ChecklistPreset, MasterOption } from '../types';
import MentorTip from './MentorTip';
import { useChecklist } from '../hooks/useChecklist';
import InventoryModal from './checklist/InventoryModal';
import PresetModal from './checklist/PresetModal';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import InfoModal from './ui/InfoModal'; // Import InfoModal
import ChecklistGuide from './checklist/ChecklistGuide'; // Import Guide

interface ShootChecklistProps {
    items: ChecklistItem[]; // From Hook/Parent
    onToggle: (id: string, currentStatus: boolean) => void;
    onAdd: (text: string, categoryId: string) => void;
    onDelete: (id: string) => void;
    onReset: () => void;
    
    presets: ChecklistPreset[];
    onLoadPreset: (id: string, clearFirst?: boolean) => void; // Updated signature
    onAddPreset: (name: string, inventoryIds?: string[]) => void;
    onDeletePreset: (id: string) => void;

    onOpenSettings: () => void;
    masterOptions?: MasterOption[];
}

const ShootChecklist: React.FC<ShootChecklistProps> = ({ 
    items, onToggle, onAdd, onDelete, onReset,
    presets, onLoadPreset, onAddPreset, onDeletePreset,
    masterOptions = []
}) => {
    // Inventory Hook Logic reused from useChecklist but we need to pass functions to Modal
    const { inventoryItems, handleAddInventoryItem, handleUpdateInventoryItem, handleDeleteInventoryItem } = useChecklist();
    const { showConfirm } = useGlobalDialog();

    // Modals State
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Info Modal State
    
    // UI State
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [quickAddText, setQuickAddText] = useState('');
    const [activeCategoryForQuickAdd, setActiveCategoryForQuickAdd] = useState<string | null>(null);

    // Filtered Master Options
    const mainCats = masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder);
    const subCats = masterOptions.filter(o => o.type === 'INV_CAT_L2').sort((a,b) => a.sortOrder - b.sortOrder);

    // Calculations
    const totalItems = items.length;
    const checkedItems = items.filter(i => i.isChecked).length;
    const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    // Smart Filter Chip Logic (Exclusive Load)
    const handlePresetClick = async (presetId: string) => {
        if (presetId === 'CLEAR') {
            const confirmed = await showConfirm('ต้องการลบรายการทั้งหมดหน้าจอใช่หรือไม่?', 'ยืนยันการล้างกระเป๋า 🗑️');
            if (confirmed) {
                onLoadPreset('CLEAR');
                setActivePresetId(null);
            }
        } else {
            // Exclusive Load: Clear first then load
            setActivePresetId(presetId);
            onLoadPreset(presetId, true); // true = clearFirst
        }
    };

    // Helper: Find Parent L1 Key from an L2 Key
    const findParentL1 = (l2Key: string) => {
        const l2 = subCats.find(s => s.key === l2Key);
        if (l2 && l2.parentKey) {
            const l1 = mainCats.find(m => m.key === l2.parentKey);
            return l1 ? l1 : null;
        }
        return null;
    };

    // Group Items by L1
    const groupedActiveItems = useMemo(() => {
        const groups: Record<string, ChecklistItem[]> = {};
        mainCats.forEach(cat => { groups[cat.key] = []; });
        groups['MISC'] = [];

        items.forEach(item => {
            const l1 = findParentL1(item.categoryId);
            if (l1) {
                if (!groups[l1.key]) groups[l1.key] = [];
                groups[l1.key].push(item);
            } else {
                if (groups[item.categoryId]) groups[item.categoryId].push(item);
                else groups['MISC'].push(item);
            }
        });
        return groups;
    }, [items, mainCats, subCats]);

    const handleQuickAdd = (l1Key: string) => {
        if(quickAddText.trim()) {
            onAdd(quickAddText, l1Key);
            setQuickAddText('');
        }
    };

    const getIcon = (key: string) => {
        if (key.includes('CAMERA')) return <Camera className="w-5 h-5" />;
        if (key.includes('AUDIO')) return <Mic className="w-5 h-5" />;
        if (key.includes('LIGHT')) return <Lightbulb className="w-5 h-5" />;
        if (key.includes('GRIP')) return <Layout className="w-5 h-5" />;
        return <Box className="w-5 h-5" />;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="pink" messages={["ใหม่! Smart Filters กดเลือกชุดปุ๊บ ของมาปั๊บ (กดซ้ำเพื่อสลับชุด)", "ปุ่ม 'คลังอุปกรณ์' ดูอลังการขึ้น พร้อมให้คุณค้นหาของเล่นใหม่ๆ"]} />

            {/* Header & Controls */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
                    <div className="flex items-start gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                จัดเป๋าออกกอง 🎒 <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Realtime</span>
                            </h1>
                            <p className="text-gray-500 mt-1">Realtime Checklist & Inventory System</p>
                        </div>
                        <button 
                            onClick={() => setIsInfoOpen(true)}
                            className="p-1.5 bg-white text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-full transition-colors shadow-sm border border-gray-100 mt-1"
                            title="คู่มือการใช้งาน"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-stretch">
                        <button onClick={() => setIsInventoryModalOpen(true)} className="
                            relative group overflow-hidden px-6 py-2.5 rounded-xl
                            bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600
                            text-white font-bold text-sm tracking-wide
                            shadow-lg shadow-indigo-500/30 border border-indigo-400/30
                            hover:scale-[1.02] hover:shadow-indigo-500/50 active:scale-95 active:shadow-sm
                            transition-all duration-300 flex items-center justify-center gap-2
                        ">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="relative flex items-center gap-2 z-20">
                                <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                                    <Archive className="w-4 h-4 text-white" />
                                </div>
                                <span>คลังอุปกรณ์</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* --- Smart Chips (Exclusive Load) --- */}
                <div className="overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-2 w-max">
                        {presets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handlePresetClick(p.id)}
                                className={`
                                    px-4 py-2 rounded-full border text-xs font-bold transition-all flex items-center gap-2 active:scale-95
                                    ${activePresetId === p.id 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}
                                `}
                            >
                                {p.name}
                                <span className={`px-1.5 rounded-full text-[9px] min-w-[16px] text-center ${activePresetId === p.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{p.items.length}</span>
                            </button>
                        ))}
                        
                        <div className="w-px h-6 bg-gray-200 mx-2"></div>
                        
                        <button onClick={() => setIsPresetModalOpen(true)} className="px-3 py-2 bg-gray-100 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all text-xs font-bold flex items-center">
                            <PlusCircle className="w-3.5 h-3.5 mr-1" /> จัดการ
                        </button>
                        
                        <button 
                            onClick={() => handlePresetClick('CLEAR')}
                            className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors text-xs font-bold flex items-center"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
                        </button>
                    </div>
                </div>
            </div>

            {/* Adventure Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 sticky top-0 z-30">
                <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-gray-700 flex items-center gap-2">
                            <Compass className={`w-4 h-4 ${progress === 100 ? 'text-green-500 animate-spin-slow' : 'text-orange-500'}`} />
                            Readiness Level
                            {progress === 100 && totalItems > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse border border-green-200">Ready to Go! 🚀</span>}
                        </span>
                        <span className="font-black text-gray-800">{checkedItems}/{totalItems}</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} 
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full"></div>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={async () => { 
                        // @ts-ignore
                        if(await window.confirm('รีเซ็ตสถานะเช็คลิสต์ทั้งหมด?')) onReset(); 
                    }}
                    className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-200" 
                    title="รีเซ็ตสถานะการเช็ค"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Active List (Grouped by L1) */}
            {items.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center group hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setIsInventoryModalOpen(true)}>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-500">
                        <PackageOpen className="w-10 h-10 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-700 mb-2">ได้เวลาจุ๊ย! 🍹</h3>
                    <p className="text-gray-400 mb-8 max-w-xs mx-auto leading-relaxed">
                        กระเป๋ายังว่างอยู่เลย...<br/>
                        เลือก <b>Smart Chips</b> ด้านบน หรือกดที่นี่เพื่อเปิดคลัง
                    </p>
                    <button className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center">
                        <Plus className="w-5 h-5 mr-2" /> เปิดคลังอุปกรณ์
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Render groups based on Master Data L1 */}
                    {mainCats.map(cat => {
                        const catItems = groupedActiveItems[cat.key] || [];
                        if (catItems.length === 0 && activeCategoryForQuickAdd !== cat.key) return null;

                        return (
                            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                                <div className={`px-5 py-3 border-b border-gray-50 flex items-center justify-between ${cat.color ? cat.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-10 ') : 'bg-gray-50'}`}>
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-1.5 rounded-lg bg-white/50 ${cat.color}`}>
                                            {getIcon(cat.key)}
                                        </div>
                                        <h3 className="font-bold text-gray-800">{cat.label}</h3>
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
                                            className={`flex items-center p-2 rounded-lg cursor-pointer transition-all group ${item.isChecked ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                                {item.isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
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

                                    {/* Quick Add */}
                                    <div className="mt-2 pt-2 border-t border-gray-50 px-2">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="พิมพ์เพิ่มด่วน..." 
                                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-300 py-1"
                                                value={activeCategoryForQuickAdd === cat.key ? quickAddText : ''}
                                                onChange={e => {
                                                    setActiveCategoryForQuickAdd(cat.key);
                                                    setQuickAddText(e.target.value);
                                                }}
                                                onKeyDown={e => {
                                                    if(e.key === 'Enter') handleQuickAdd(cat.key);
                                                }}
                                            />
                                            <button onClick={() => handleQuickAdd(cat.key)} className="text-gray-400 hover:text-indigo-600 p-1">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Render Misc Group if not empty */}
                    {groupedActiveItems['MISC']?.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h3 className="font-bold text-gray-500 mb-2">อื่นๆ (Misc)</h3>
                            {groupedActiveItems['MISC'].map(item => (
                                <div key={item.id} onClick={() => onToggle(item.id, item.isChecked)} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                    <div className={`w-4 h-4 border rounded mr-2 ${item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                                    <span className={`text-sm ${item.isChecked ? 'text-gray-400 line-through' : ''}`}>{item.text}</span>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="ml-auto text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- Modals --- */}
            <InventoryModal 
                isOpen={isInventoryModalOpen}
                onClose={() => setIsInventoryModalOpen(false)}
                inventoryItems={inventoryItems}
                onAdd={onAdd}
                onAddItem={handleAddInventoryItem}
                onUpdateItem={handleUpdateInventoryItem}
                onDeleteItem={handleDeleteInventoryItem}
                masterOptions={masterOptions}
            />

            <PresetModal 
                isOpen={isPresetModalOpen}
                onClose={() => setIsPresetModalOpen(false)}
                presets={presets}
                inventoryItems={inventoryItems}
                onAddPreset={onAddPreset}
                onDeletePreset={onDeletePreset}
            />

             {/* INFO GUIDE MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือจัดเป๋าออกกอง (Shoot Checklist)"
            >
                <ChecklistGuide />
            </InfoModal>
        </div>
    );
};

export default ShootChecklist;
