import React from 'react';
import { Tag, Plus, Edit2, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { MasterOption, Channel } from '../../types';

interface PillarCardProps {
    pillar: MasterOption;
    categories: MasterOption[];
    channel: Channel | null;
    isInlineAdding: boolean;
    currentInput: string;
    onToggleActive: (pillar: MasterOption) => void;
    onOpenEditPillar: (pillar: MasterOption) => void;
    onDeleteOption: (option: MasterOption) => void;
    onOpenEditCategory: (cat: MasterOption) => void;
    onStartInlineAdd: (pillarKey: string) => void;
    onCancelInlineAdd: () => void;
    onInputChange: (val: string) => void;
    onInlineSubmit: () => void;
}

export const PillarCard: React.FC<PillarCardProps> = ({
    pillar,
    categories,
    channel,
    isInlineAdding,
    currentInput,
    onToggleActive,
    onOpenEditPillar,
    onDeleteOption,
    onOpenEditCategory,
    onStartInlineAdd,
    onCancelInlineAdd,
    onInputChange,
    onInlineSubmit
}) => {
    return (
        <div 
            className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-2xs group hover:shadow-md ${
                pillar.isActive ? 'border-gray-200 hover:border-indigo-300' : 'border-gray-200 bg-gray-50/60 opacity-75'
            }`}
        >
            <div>
                {/* Card Top: Color Badge, Title, Active Dot, Actions */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${pillar.color || 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                {pillar.label}
                            </span>
                            {!pillar.isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-red-100 text-red-600 rounded font-bold">
                                    ปิดใช้งาน
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 block mt-1">{pillar.key}</span>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onToggleActive(pillar)}
                            className={`p-1.5 rounded-lg transition-colors ${
                                pillar.isActive 
                                    ? 'text-emerald-600 hover:bg-emerald-50' 
                                    : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={pillar.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                        >
                            {pillar.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                            onClick={() => onOpenEditPillar(pillar)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="แก้ไข Pillar"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onDeleteOption(pillar)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ Pillar"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Description */}
                {pillar.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                        {pillar.description}
                    </p>
                )}

                {/* Subcategories (Tags List) */}
                <div className="mt-3.5 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-3 h-3 text-purple-500" /> หมวดหมู่ย่อย ({categories.length})
                        </span>
                        {!isInlineAdding && (
                            <button
                                onClick={() => onStartInlineAdd(pillar.key)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors flex items-center gap-0.5"
                            >
                                <Plus className="w-2.5 h-2.5" /> เพิ่มย่อยด่วน
                            </button>
                        )}
                    </div>

                    {/* Tags / Pills Display */}
                    <div className="flex flex-wrap gap-1.5">
                        {categories.length === 0 && !isInlineAdding && (
                            <span className="text-[11px] text-gray-400 italic">ยังไม่มีหมวดหมู่ย่อย</span>
                        )}
                        {categories.map(cat => (
                            <div
                                key={cat.id}
                                className={`group/cat inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                                    cat.isActive 
                                        ? 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50' 
                                        : 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-60'
                                }`}
                            >
                                <span>{cat.label}</span>
                                <div className="hidden group-hover/cat:flex items-center gap-0.5 ml-1">
                                    <button
                                        onClick={() => onOpenEditCategory(cat)}
                                        className="p-0.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                        title="แก้ไขหมวดหมู่ย่อย"
                                    >
                                        <Edit2 className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteOption(cat)}
                                        className="p-0.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                                        title="ลบหมวดหมู่ย่อย"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Inline Quick-Add Category Form */}
                    {isInlineAdding && (
                        <div className="mt-2 p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5">
                                <input 
                                    type="text"
                                    autoFocus
                                    placeholder="พิมพ์ชื่อ Category แล้วกด Enter..."
                                    value={currentInput}
                                    onChange={(e) => onInputChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            onInlineSubmit();
                                        } else if (e.key === 'Escape') {
                                            onCancelInlineAdd();
                                        }
                                    }}
                                    className="flex-1 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    type="button"
                                    onClick={onInlineSubmit}
                                    disabled={!currentInput.trim()}
                                    className="bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    เพิ่ม
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancelInlineAdd}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default PillarCard;
