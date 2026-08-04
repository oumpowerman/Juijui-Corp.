import React from 'react';
import { motion } from 'framer-motion';
import { Tags, X, Plus } from 'lucide-react';

interface TagSuggestionsDropdownProps {
    filterKeyword: string;
    filteredTags: { name: string; count: number }[];
    isSearchingTags: boolean;
    searchSpeedMs: string;
    onSelectTag: (tagName: string) => void;
    onClose: () => void;
    currentTagTypeMatch: RegExpMatchArray | null;
    dataSource: 'SERVER' | 'LOCAL';
}

export const TagSuggestionsDropdown: React.FC<TagSuggestionsDropdownProps> = ({
    filterKeyword,
    filteredTags,
    isSearchingTags,
    searchSpeedMs,
    onSelectTag,
    onClose,
    currentTagTypeMatch,
    dataSource
}) => {
    return (
        <>
            {/* Mobile Background Backdrop Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-transparent z-[90] md:hidden"
            />
            <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="absolute top-full left-0 right-0 mt-2 w-full md:max-w-[420px] bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 p-4 md:p-5 z-[100] overflow-hidden text-left origin-top"
            >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-black text-indigo-500 uppercase tracking-widest">
                        <Tags className="w-3.5 h-3.5" />
                        <span>คำอธิบายค้นหาด้วย # (Hashtags)</span>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                <p className="text-[11px] text-gray-500 font-medium mb-4 leading-relaxed">
                    💡 <span className="font-extrabold text-indigo-600">ทิปค้นหาด้วย #:</span> เพียงพิมพ์เครื่องหมาย <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">#</code> ตามด้วยข้อความ (เช่น <code className="bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-mono font-bold">#Vlog</code>) เพื่อเจาะจงค้นหาแท็ก หรือสามารถคลิกเลือกจากแท็กยอดนิยมด้านล่างนี้ได้เลย!
                </p>

                {filterKeyword && !filteredTags.some(t => t.name.toLowerCase() === filterKeyword) && (
                    <button
                        type="button"
                        onClick={() => {
                            onSelectTag(filterKeyword);
                        }}
                        className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-dashed border-indigo-200 text-left transition-all mb-2.5 active:scale-95 text-xs font-bold text-indigo-600"
                    >
                        <Plus className="w-4 h-4 text-indigo-500 animate-pulse" />
                        <span>สร้างและค้นหาแท็กใหม่: <span className="font-extrabold underline">#{filterKeyword}</span></span>
                    </button>
                )}

                {isSearchingTags ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-[10px] text-gray-400 font-bold">กำลังประมวลผลดัชนีเซิร์ฟเวอร์...</p>
                    </div>
                ) : filteredTags.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-gray-400 uppercase">
                            <span>{currentTagTypeMatch ? 'แท็กที่ตรงกับการค้นหา' : 'แท็กยอดนิยมในระบบ'}</span>
                            {dataSource === 'SERVER' ? (
                                <span className="text-emerald-500 font-mono text-[9px] bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100/50 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                                    ⚡ Database Live: {searchSpeedMs}
                                </span>
                            ) : (
                                <span className="text-amber-500 font-mono text-[9px] bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-100/50 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    📦 Local Context: {searchSpeedMs}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {filteredTags.map((tag, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onSelectTag(tag.name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100/60 font-black text-xs transition-all duration-200 active:scale-95 group/btn"
                                >
                                    <span>#{tag.name}</span>
                                    <span className="text-[10px] font-bold text-indigo-400 group-hover/btn:text-indigo-200 bg-white/70 group-hover/btn:bg-white/20 px-1.5 py-0.5 rounded-md">
                                        {tag.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400 font-bold">ไม่พบแท็กที่ค้นหา</p>
                        <p className="text-[10px] text-gray-400 mt-1">ลองพิมพ์สัญลักษณ์ # เพื่อดูรายการแท็กทั้งหมด</p>
                    </div>
                )}
            </motion.div>
        </>
    );
};
