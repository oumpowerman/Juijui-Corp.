
import React from 'react';
import { MasterOption } from '../../../../types';
import { Briefcase, Plus, User, Edit2, Trash2, Award, X } from 'lucide-react';

interface PositionMasterViewProps {
    masterOptions: MasterOption[];
    onEdit: (option: MasterOption) => void;
    onCreate: (type: string, parentKey?: string) => void;
    onDelete: (id: string) => void;
    setSelectedParentId: (id: string | null) => void;
}

const PositionMasterView: React.FC<PositionMasterViewProps> = ({ 
    masterOptions, onEdit, onCreate, onDelete, setSelectedParentId 
}) => {
    const positions = masterOptions.filter(o => o.type === 'POSITION').sort((a,b) => a.sortOrder - b.sortOrder);
    const responsibilities = masterOptions.filter(o => o.type === 'RESPONSIBILITY').sort((a,b) => a.sortOrder - b.sortOrder);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="col-span-full mb-2 flex justify-between items-center bg-teal-50 p-4 rounded-xl border border-teal-100">
                <div><h3 className="text-lg font-black text-teal-800 flex items-center"><Briefcase className="w-6 h-6 mr-2" /> ผังตำแหน่ง & หน้าที่</h3><p className="text-xs text-teal-600 mt-1">กำหนดตำแหน่งและหน้าที่ (Responsibility)</p></div>
                <button onClick={() => { setSelectedParentId(null); onCreate('POSITION'); }} className="text-sm bg-teal-600 text-white px-4 py-2.5 rounded-xl hover:bg-teal-700 transition-colors font-bold flex items-center shadow-md active:scale-95"><Plus className="w-4 h-4 mr-2" /> สร้างตำแหน่งใหม่</button>
            </div>
            {positions.map(pos => {
                const tasks = responsibilities.filter(r => r.parentKey === pos.key);
                return (
                    <div key={pos.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden group">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/20">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-white"><User className="w-6 h-6 text-gray-600" /></div><div><h4 className="font-black text-lg text-gray-800">{pos.label}</h4><span className="text-[10px] uppercase font-bold text-gray-400">{pos.key}</span></div></div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEdit(pos)} className="p-1.5 text-gray-500 hover:text-indigo-600 rounded"><Edit2 className="w-4 h-4" /></button><button onClick={() => { if(confirm('ลบ?')) onDelete(pos.id); }} className="p-1.5 text-gray-500 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button></div>
                        </div>
                        <div className="p-4 flex-1 bg-gray-50/30">
                            <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-gray-400 uppercase flex items-center"><Award className="w-3 h-3 mr-1" /> หน้าที่ ({tasks.length})</span><button onClick={() => { setSelectedParentId(pos.key); onCreate('RESPONSIBILITY', pos.key); }} className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่ม</button></div>
                            {tasks.length === 0 ? <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl"><p className="text-xs text-gray-400">ว่างเปล่า</p></div> : <div className="space-y-2">{tasks.map(task => (<div key={task.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group/item"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div><span className="text-sm font-medium text-gray-700">{task.label}</span></div><div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity"><button onClick={() => onEdit(task)} className="text-gray-400 hover:text-indigo-600 p-1"><Edit2 className="w-3 h-3" /></button><button onClick={() => onDelete(task.id)} className="text-gray-400 hover:text-red-600 p-1"><X className="w-3 h-3" /></button></div></div>))}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PositionMasterView;
