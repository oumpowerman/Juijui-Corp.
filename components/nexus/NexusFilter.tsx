
import React from 'react';
import { LayoutGrid, Youtube, FileSpreadsheet, Globe, Palette, Tag as TagIcon, X, Sparkles, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NexusFilterProps {
    activeTab: 'ALL' | 'SOCIAL' | 'PRODUCTIVITY' | 'DESIGN' | 'WEB';
    onTabChange: (tab: 'ALL' | 'SOCIAL' | 'PRODUCTIVITY' | 'DESIGN' | 'WEB') => void;
    availableTags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    onClearTags: () => void;
}

const NexusFilter: React.FC<NexusFilterProps> = ({ 
    activeTab, 
    onTabChange, 
    availableTags, 
    selectedTags, 
    onToggleTag,
    onClearTags
}) => {
    const categories = [
        { id: 'ALL', label: 'ทั้งหมด', icon: LayoutGrid, color: 'bg-slate-400', glow: 'shadow-slate-200' },
        { id: 'SOCIAL', label: 'Social Media', icon: Youtube, color: 'bg-pink-300', glow: 'shadow-pink-200' },
        { id: 'PRODUCTIVITY', label: 'Productivity', icon: FileSpreadsheet, color: 'bg-emerald-300', glow: 'shadow-emerald-200' },
        { id: 'DESIGN', label: 'Design', icon: Palette, color: 'bg-cyan-300', glow: 'shadow-cyan-200' },
        { id: 'WEB', label: 'Web Links', icon: Globe, color: 'bg-indigo-300', glow: 'shadow-indigo-200' },
    ];

    return (
        <div className="space-y-6 mb-10 font-kanit">
            {/* Category Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pt-4 pb-6 -mb-4 scrollbar-hide px-2">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    
                    return (
                        <motion.button
                            key={cat.id}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onTabChange(cat.id as any)}
                            className={`
                                relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border
                                ${isActive 
                                    ? `${cat.color} text-white border-transparent shadow-lg z-10` 
                                    : 'bg-white/40 backdrop-blur-md text-slate-500 border-white/60 hover:border-slate-300 hover:bg-white/80 shadow-sm'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="relative z-10">{cat.label}</span>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabGlow"
                                    className={`absolute inset-0 ${cat.glow} opacity-40 blur-xl -z-10`}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Tags Section */}
            <AnimatePresence>
                {availableTags.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-wrap items-center gap-3 p-4 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/40 shadow-sm"
                    >
                        <div className="flex items-center gap-2 py-1.5 px-3 bg-white/60 rounded-xl shadow-sm border border-white/80 shrink-0">
                            <TagIcon className="w-3 h-3 text-indigo-400" />
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Tags</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <motion.button
                                        key={tag}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onToggleTag(tag)}
                                        className={`
                                            px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all border flex items-center gap-1.5
                                            ${isSelected 
                                                ? 'bg-indigo-400 text-white border-indigo-300 shadow-md' 
                                                : 'bg-white/60 text-slate-600 border-white/80 hover:border-indigo-200 hover:bg-white'
                                            }
                                        `}
                                    >
                                        <Hash className={`w-2.5 h-2.5 ${isSelected ? 'text-white' : 'text-indigo-300'}`} />
                                        {tag}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {selectedTags.length > 0 && (
                            <motion.button 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClearTags}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all border border-rose-100 shadow-sm ml-auto"
                            >
                                <X className="w-3 h-3" />
                                Clear
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NexusFilter;
