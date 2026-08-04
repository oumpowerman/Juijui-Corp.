import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface PopularTagsHoverTooltipProps {
    top10Tags: { name: string; count: number }[];
    localSearch: string;
    onSelectTag: (tagName: string) => void;
    dataSource: 'SERVER' | 'LOCAL';
}

export const PopularTagsHoverTooltip: React.FC<PopularTagsHoverTooltipProps> = ({
    top10Tags,
    localSearch,
    onSelectTag,
    dataSource
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-[95] overflow-hidden text-left origin-top"
        >
            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-gray-50 text-xs uppercase tracking-widest font-black text-indigo-500">
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>💡 พิมพ์ # เพื่อค้นหาแท็กด่วน (แท็กยอดนิยม)</span>
                </div>
                {dataSource === 'SERVER' ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-black text-emerald-500 bg-emerald-50/80 px-1.5 py-0.5 rounded border border-emerald-100/30">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                        Server
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-black text-amber-500 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-100/30">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        Local
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin pr-1">
                {top10Tags.map((tag) => {
                    const isSelected = localSearch.includes(`#${tag.name}`);
                    return (
                        <button
                            key={tag.name}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectTag(tag.name);
                            }}
                            className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 whitespace-nowrap border
                                ${isSelected 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                    : 'bg-indigo-50/40 hover:bg-indigo-100 text-indigo-600 border-indigo-100/60 hover:border-indigo-200'}
                            `}
                        >
                            <span>#{tag.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isSelected ? 'bg-white/20 text-indigo-100' : 'bg-white text-indigo-400 border border-indigo-100/40 shadow-sm'}`}>
                                {tag.count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};
