
import React from 'react';
import { MasterOption } from '../../../../types';
import { BookOpen, Plus, CornerDownRight, Edit2, Trash2, Layers, Info, FolderOpen } from 'lucide-react';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface WikiCategoryMasterViewProps {
    masterOptions: MasterOption[];
    onEdit: (option: MasterOption) => void;
    onCreate: (type: string, parentKey?: string) => void;
    onDelete: (id: string) => void;
    setSelectedParentId: (id: string | null) => void;
    selectedParentId: string | null;
    setIsEditing: (is: boolean) => void;
}

const WikiCategoryMasterView: React.FC<WikiCategoryMasterViewProps> = ({ 
    masterOptions, onEdit, onCreate, onDelete, 
    setSelectedParentId, selectedParentId, setIsEditing 
}) => {
    const { showConfirm } = useGlobalDialog();
    
    // Level 1: Root Wiki Categories (No parentKey)
    const rootCategories = masterOptions
        .filter(o => o.type === 'WIKI_CATEGORY' && !o.parentKey)
        .sort((a,b) => a.sortOrder - b.sortOrder);
    
    // Level 2: Sub Wiki Categories - Filtered by selected Root
    const subCategories = selectedParentId 
        ? masterOptions
            .filter(o => o.type === 'WIKI_CATEGORY' && o.parentKey === selectedParentId)
            .sort((a,b) => a.sortOrder - b.sortOrder)
        : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* LEFT COLUMN: Main Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                <div className="px-5 py-4 border-b border-gray-100 bg-indigo-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-indigo-900 flex items-center text-sm">
                            <BookOpen className="w-4 h-4 mr-2" /> หมวดหมู่หลัก (Root)
                        </h3>
                        <p className="text-[10px] text-indigo-500">ระดับที่ 1 (Level 1)</p>
                    </div>
                    <button 
                        onClick={() => { setSelectedParentId(null); onCreate('WIKI_CATEGORY'); }} 
                        className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 font-bold flex items-center shadow-sm"
                    >
                        <Plus className="w-3 h-3 mr-1" /> เพิ่มหมวดหลัก
                    </button>
                </div>
                
                <div className="overflow-y-auto flex-1 p-3 space-y-2">
                    {rootCategories.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-xs">
                            ยังไม่มีหมวดหมู่หลัก
                        </div>
                    )}
                    
                    {rootCategories.map(cat => (
                        <div 
                            key={cat.id} 
                            onClick={() => { setSelectedParentId(cat.key); setIsEditing(false); }} 
                            className={`
                                p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all group
                                ${selectedParentId === cat.key 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]' 
                                    : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedParentId === cat.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <FolderOpen className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className={`text-sm font-bold block ${selectedParentId === cat.key ? 'text-white' : 'text-gray-700'}`}>
                                        {cat.label}
                                    </span>
                                    <span className={`text-[10px] font-mono ${selectedParentId === cat.key ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {cat.key}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEdit(cat); }} 
                                    className={`p-1.5 rounded-lg transition-colors ${selectedParentId === cat.key ? 'text-indigo-200 hover:text-white hover:bg-white/20' : 'text-gray-400 hover:text-indigo-600 hover:bg-white'}`}
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        if(await showConfirm('ลบหมวดหมู่นี้? (หัวข้อย่อยจะยังคงอยู่แต่จะไม่แสดงผล)')) onDelete(cat.id); 
                                    }} 
                                    className={`p-1.5 rounded-lg transition-colors ${selectedParentId === cat.key ? 'text-indigo-200 hover:text-red-300 hover:bg-white/20' : 'text-gray-400 hover:text-red-600 hover:bg-white'}`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: Sub Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px] relative">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-700 flex items-center text-sm">
                            <CornerDownRight className="w-4 h-4 mr-2 text-gray-400" /> หัวข้อย่อย (Sub-categories)
                        </h3>
                        <p className="text-[10px] text-gray-400">ระดับที่ 2 (Level 2)</p>
                    </div>
                    <button 
                        onClick={() => selectedParentId ? onCreate('WIKI_CATEGORY', selectedParentId) : null} 
                        className={`text-xs px-3 py-2 rounded-lg font-bold flex items-center transition-all ${selectedParentId ? 'bg-white border border-gray-200 hover:border-indigo-300 text-indigo-600 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        disabled={!selectedParentId}
                    >
                        <Plus className="w-3 h-3 mr-1" /> เพิ่มหัวข้อย่อย
                    </button>
                </div>
                
                {/* Body */}
                <div className="overflow-y-auto flex-1 p-4 bg-[#f8fafc]">
                    {!selectedParentId ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-sm font-bold">เลือกหมวดหมู่หลักทางซ้ายก่อน</p>
                            <p className="text-xs">เพื่อจัดการหัวข้อย่อยภายในกลุ่มนั้น</p>
                        </div>
                    ) : subCategories.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Info className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">ยังไม่มีหัวข้อย่อยในหมวดนี้</p>
                            <button onClick={() => onCreate('WIKI_CATEGORY', selectedParentId)} className="mt-2 text-xs text-indigo-500 font-bold hover:underline">+ เพิ่มรายการแรก</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {subCategories.map(sub => (
                                <div key={sub.id} className="p-3 rounded-xl border border-gray-200 bg-white flex justify-between items-center group hover:border-indigo-300 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-8 rounded-full ${sub.color?.replace('text-', 'bg-').split(' ')[0] || 'bg-gray-200'}`}></div>
                                        <div>
                                            <span className="text-sm font-bold text-gray-700 block">{sub.label}</span>
                                            <span className="text-[10px] font-mono text-gray-400">{sub.key}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(sub)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={async () => { 
                                                if(await showConfirm('ลบหัวข้อย่อยนี้?')) onDelete(sub.id); 
                                            }} 
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WikiCategoryMasterView;
