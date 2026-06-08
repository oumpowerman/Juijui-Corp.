import React from 'react';
import { Tags, Plus, X } from 'lucide-react';

interface TagSelectorProps {
    tags: string[];
    presetTags: string[];
    handleTogglePresetTag: (tag: string) => void;
    customTagInput: string;
    setCustomTagInput: (val: string) => void;
    handleAddCustomTag: () => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
    tags,
    presetTags,
    handleTogglePresetTag,
    customTagInput,
    setCustomTagInput,
    handleAddCustomTag,
}) => {
    return (
        <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold font-kanit text-sm mb-2 flex items-center gap-2">
                <Tags className="w-4 h-4 text-emerald-500" />
                ติดแท็กไอเดียที่เกี่ยวข้อง
            </label>
            
            {/* Preset tags badge layout */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                {presetTags.map(presetTag => {
                    const isSelected = tags.includes(presetTag);
                    return (
                        <button
                            type="button"
                            key={presetTag}
                            onClick={() => handleTogglePresetTag(presetTag)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border-b-2 active:border-b-0 ${
                                isSelected 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800' 
                                    : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-500 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                            }`}
                        >
                            {presetTag}
                        </button>
                    );
                })}
            </div>

            {/* Custom tags addition row */}
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomTag();
                        }
                    }}
                    placeholder="ระบุแท็กที่เจาะจงเอง (เช่น #มุมกล้องเฉียง) กด Enter"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border bg-white dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white"
                />
                <button 
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl text-xs font-black transition shrink-0 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Selected custom tags indicator */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 items-center">
                    <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500">แท็กที่เตรียมไว้:</span>
                    {tags.map(t => (
                        <div 
                            key={t}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                        >
                            <span>{t}</span>
                            <button 
                                type="button"
                                onClick={() => handleTogglePresetTag(t)}
                                className="hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-full p-0.5 text-emerald-400 hover:text-emerald-700 transition dark:text-emerald-300"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
