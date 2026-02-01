
import React, { useState } from 'react';
import { MasterOption } from '../../../../types';
import { Package, Plus, CornerDownRight, Edit2, Trash2 } from 'lucide-react';

interface InventoryMasterViewProps {
    masterOptions: MasterOption[];
    onEdit: (option: MasterOption) => void;
    onCreate: (type: string, parentKey?: string) => void;
    onDelete: (id: string) => void;
    setSelectedParentId: (id: string | null) => void;
    selectedParentId: string | null;
    setIsEditing: (is: boolean) => void;
}

const InventoryMasterView: React.FC<InventoryMasterViewProps> = ({ 
    masterOptions, onEdit, onCreate, onDelete, 
    setSelectedParentId, selectedParentId, setIsEditing 
}) => {
    
    const l1Options = masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder);
    const l2Options = selectedParentId 
        ? masterOptions.filter(o => o.type === 'INV_CAT_L2' && o.parentKey === selectedParentId).sort((a,b) => a.sortOrder - b.sortOrder)
        : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center"><Package className="w-4 h-4 mr-2" /> หมวดหมู่หลัก (Main)</h3>
                    <button onClick={() => { setSelectedParentId(null); onCreate('INV_CAT_L1'); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่มหมวด</button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {l1Options.map(l1 => (
                        <div key={l1.id} onClick={() => { setSelectedParentId(l1.key); setIsEditing(false); }} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${selectedParentId === l1.key ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${l1.color?.split(' ')[0] || 'bg-gray-300'}`}></div><span className={`text-sm font-bold ${selectedParentId === l1.key ? 'text-indigo-800' : 'text-gray-700'}`}>{l1.label}</span></div>
                            <div className="flex items-center gap-1"><button onClick={(e) => { e.stopPropagation(); onEdit(l1); }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-3 h-3" /></button><button onClick={(e) => { e.stopPropagation(); onDelete(l1.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center"><CornerDownRight className="w-4 h-4 mr-2" /> ชนิดย่อย (Sub)</h3>
                    <button onClick={() => selectedParentId ? onCreate('INV_CAT_L2', selectedParentId) : alert('กรุณาเลือกหมวดหมู่หลักก่อน')} className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center ${selectedParentId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400'}`}><Plus className="w-3 h-3 mr-1" /> เพิ่มชนิด</button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 relative">
                    {!selectedParentId ? <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 text-center"><Package className="w-12 h-12 mb-3 opacity-20" /><p>เลือกหมวดหมู่หลักทางซ้าย<br/>เพื่อจัดการชนิดย่อย</p></div> : 
                    l2Options.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีข้อมูลในหมวดนี้</div> : 
                    <div className="space-y-2">{l2Options.map(l2 => <div key={l2.id} className="p-3 rounded-xl border border-gray-100 bg-white flex justify-between items-center group"><span className="text-sm font-medium text-gray-700 pl-2 border-l-4 border-gray-200 group-hover:border-indigo-400 transition-colors">{l2.label}</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEdit(l2)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-3 h-3" /></button><button onClick={() => onDelete(l2.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3 h-3" /></button></div></div>)}</div>}
                </div>
            </div>
        </div>
    );
};

export default InventoryMasterView;
