
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
        <div className="space-y-8 mb-12 font-kanit">
            {/* Category Tabs */}
            <div className="flex items-center gap-4 overflow-x-auto pt-10 pb-12 -mb-8 scrollbar-hide px-4">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    
                    return (
                        <motion.button
                            key={cat.id}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onTabChange(cat.id as any)}
                            className={`
                                relative flex items-center gap-3 px-7 py-3.5 rounded-[2rem] text-[13px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border
                                ${isActive 
                                    ? `${cat.color} text-white border-transparent shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15),0_0_20px_rgba(255,255,255,0.4)] z-10` 
                                    : 'bg-white/40 backdrop-blur-xl text-slate-500 border-white/60 hover:border-slate-300 hover:bg-white/80 shadow-sm'
                                }
                            `}
                        >
                            {/* Shimmer Effect for Active Tab */}
                            {isActive && (
                                <motion.div 
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded-[2rem]"
                                />
                            )}
                            
                            <Icon className={`w-4.5 h-4.5 relative z-10 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <span className="relative z-10">{cat.label}</span>
                            
                            {isActive && (
                                <motion.div 
                                    layoutId="activeTabGlow"
                                    className={`absolute inset-0 ${cat.glow} opacity-50 blur-2xl -z-10`}
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-4 p-6 bg-white/30 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-inner"
                    >
                        <div className="flex items-center gap-2.5 mr-3 py-2.5 px-4 bg-white/60 rounded-2xl shadow-sm border border-white/80 shrink-0">
                            <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Filter Tags</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            {availableTags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <motion.button
                                        key={tag}
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => onToggleTag(tag)}
                                        className={`
                                            px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all border flex items-center gap-2
                                            ${isSelected 
                                                ? 'bg-indigo-400 text-white border-indigo-300 shadow-[0_10px_20px_-5px_rgba(99,102,241,0.4)]' 
                                                : 'bg-white/60 text-slate-600 border-white/80 hover:border-indigo-200 hover:bg-white'
                                            }
                                        `}
                                    >
                                        <Hash className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-indigo-300'}`} />
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
                                className="flex items-center gap-2 px-4 py-2 bg-rose-100/80 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-rose-200 transition-all border border-rose-200 shadow-sm ml-auto"
                            >
                                <X className="w-3.5 h-3.5" />
                                ล้างทั้งหมด
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NexusFilter;
