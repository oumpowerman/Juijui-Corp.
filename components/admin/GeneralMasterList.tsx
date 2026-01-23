
import React from 'react';
import { MasterOption } from '../../types';
import { Edit2, Trash2, Database, Plus, Loader2 } from 'lucide-react';

interface GeneralMasterListProps {
    typeLabel: string;
    options: MasterOption[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
}

const GeneralMasterList: React.FC<GeneralMasterListProps> = ({ typeLabel, options, loading, onAdd, onEdit, onDelete }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center"><Database className="w-4 h-4 mr-2" /> รายการ {typeLabel}</h3>
                    <button onClick={onAdd} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center"><Plus className="w-3 h-3 mr-1" /> เพิ่มใหม่</button>
                </div>
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {options.length === 0 && <div className="p-8 text-center text-gray-400">ยังไม่มีข้อมูล</div>}
                        {options.map(option => (
                            <div key={option.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${option.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div className={`px-3 py-1 rounded-md text-sm font-bold border border-transparent ${option.color}`}>{option.label}</div>
                                    <span className="text-xs text-gray-400 font-mono hidden md:block">{option.key}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEdit(option)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-white rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => { if(confirm('ลบข้อมูลนี้?')) onDelete(option.id); }} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralMasterList;
