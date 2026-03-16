
import React, { useState, useEffect, useMemo } from 'react';
import { User, Channel, MasterOption, ScriptSummary } from '../../../types';
import { useScripts } from '../../../hooks/useScripts';
import { Search, Filter, Plus, FileText, User as UserIcon, Calendar, Hash, Loader2, X, Check, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useRef } from 'react';
import { ChevronDown } from "lucide-react";

interface LabSidebarProps {
    currentUser: User;
    users: User[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onAddScript: (script: ScriptSummary) => void;
}

const LabSidebar: React.FC<LabSidebarProps> = ({ 
    currentUser, users, channels, masterOptions, onAddScript 
}) => {
    const { scripts, isLoading, fetchScripts, totalCount } = useScripts(currentUser);
    
    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterChannel, setFilterChannel] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterOwner, setFilterOwner] = useState<string[]>([]);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [allTags, setAllTags] = useState<{ name: string; count: number }[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isLoadingTags, setIsLoadingTags] = useState(false);
    const tagContainerRef = useRef<HTMLDivElement>(null);

    // Fetch tag statistics
    useEffect(() => {
        const fetchTagStats = async () => {
            setIsLoadingTags(true);
            try {
                const { data, error } = await supabase
                    .from('scripts')
                    .select('tags')
                    .order('created_at', { ascending: false })
                    .limit(1000);

                if (error) throw error;

                if (data) {
                    const tagCounts: Record<string, number> = {};
                    data.forEach(row => {
                        if (Array.isArray(row.tags)) {
                            row.tags.forEach((tag: string) => {
                                const normalized = tag.trim();
                                if (normalized) {
                                    tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
                                }
                            });
                        }
                    });

                    const sortedTags = Object.entries(tagCounts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);

                    setAllTags(sortedTags);
                }
            } catch (err) {
                console.error('Failed to fetch tag stats:', err);
            } finally {
                setIsLoadingTags(false);
            }
        };

        fetchTagStats();
    }, []);

    // Handle click outside for tag suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tagContainerRef.current && !tagContainerRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter suggestions
    const tagSuggestions = useMemo(() => {
        const query = tagInput.toLowerCase().trim();
        if (!query) {
            return allTags
                .filter(t => !filterTags.includes(t.name))
                .slice(0, 10);
        }
        return allTags
            .filter(t => 
                t.name.toLowerCase().includes(query) && 
                !filterTags.includes(t.name)
            )
            .slice(0, 10);
    }, [tagInput, allTags, filterTags]);

    useEffect(() => {
        fetchScripts({
            page: 1,
            pageSize: 50, // Load more for sidebar
            searchQuery,
            filterChannel,
            filterCategory,
            filterOwner,
            filterTags,
            viewTab: 'LIBRARY',
            isPersonal: false // Show all public scripts
        });
    }, [searchQuery, filterChannel, filterCategory, filterOwner, filterTags, fetchScripts]);

    const categories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive);

    const handleAddTag = (tagName: string) => {
        const cleanTag = tagName.trim();
        if (cleanTag && !filterTags.includes(cleanTag)) {
            setFilterTags(prev => [...prev, cleanTag]);
        }
        setTagInput('');
        setIsSuggestionsOpen(false);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.trim()) {
                handleAddTag(tagInput);
            }
        } else if (e.key === 'Backspace' && !tagInput && filterTags.length > 0) {
            setFilterTags(prev => prev.slice(0, -1));
        }
    };

    return (
        <div className="h-full border-r border-white/10 bg-white/[0.02] flex flex-col shrink-0 font-kanit font-bold">
            {/* Search & Filter Header */}
            <div className="p-4 space-y-3 border-b border-white/10">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="ค้นหาสคริปต์..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-kanit font-bold"
                    />
                </div>
                
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold transition-all ${showFilters ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        ตัวกรองขั้นสูง
                    </div>
                    {(filterChannel.length > 0 || filterCategory !== 'ALL' || filterOwner.length > 0 || filterTags.length > 0) && (
                        <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
                    )}
                </button>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ 
                                height: 'auto', 
                                opacity: 1,
                                transitionEnd: { overflow: showFilters ? 'visible' : 'hidden' }
                            }}
                            exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                            className="space-y-4 pt-2"
                        >
                            {/* Creator Filter */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Creator</p>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => {
                                                setFilterOwner(prev => 
                                                    prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                                                );
                                            }}
                                            className={`px-2 py-1 rounded-lg text-[12px] font-medium border transition-all flex items-center gap-1.5 ${
                                                filterOwner.includes(u.id) 
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                                                : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'
                                            }`}
                                        >
                                            <img src={u.avatarUrl} className="w-3 h-3 rounded-full" referrerPolicy="no-referrer" />
                                            {u.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Channel Filter */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Channel</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {channels.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => {
                                                setFilterChannel(prev => 
                                                    prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                                );
                                            }}
                                            className={`px-2 py-1 rounded-lg text-[12px] font-medium border transition-all ${
                                                filterChannel.includes(c.id) 
                                                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' 
                                                : 'bg-white/5 border-white/5 text-white/30 hover:border-white/20'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">
                                    Category
                                </p>

                                <div className="relative group">
                                    <select
                                        value={filterCategory}
                                        onChange={e => setFilterCategory(e.target.value)}
                                        className="
                                            w-full appearance-none
                                            color-scheme-dark
                                            bg-white/5 backdrop-blur-sm
                                            border border-white/10
                                            rounded-xl
                                            pl-3 pr-8 py-2
                                            text-xs font-medium text-white/80
                                            font-kanit
                                            outline-none
                                            cursor-pointer
                                            transition-all duration-200
                                            hover:bg-white/10 hover:border-white/20
                                            focus:bg-white/10 focus:border-white/30
                                        "
                                    >
                                        <option value="ALL" className="bg-neutral-900 text-white text-sm">ทุกหมวดหมู่</option>
                                        {categories.map(cat => (
                                            <option key={cat.key} value={cat.key} className="bg-neutral-900 text-white text-sm">
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Arrow Icon */}
                                    <ChevronDown
                                        size={14}
                                        className="
                                            absolute right-2 top-1/2 -translate-y-1/2
                                            text-white/40
                                            pointer-events-none
                                            transition-all duration-200
                                            group-hover:text-white/70
                                            group-focus-within:text-white
                                        "
                                    />
                                </div>
                            </div>

                            {/* Tags Filter */}
                            <div className="space-y-1.5 relative" ref={tagContainerRef}>
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Tags</p>
                                <div className="relative">
                                    <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                                    <input 
                                        type="text"
                                        placeholder="พิมพ์ Tag แล้วกด Enter..."
                                        value={tagInput}
                                        onChange={e => {
                                            setTagInput(e.target.value);
                                            setIsSuggestionsOpen(true);
                                        }}
                                        onKeyDown={handleTagKeyDown}
                                        onFocus={() => setIsSuggestionsOpen(true)}
                                        className="w-full pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold outline-none focus:border-indigo-500/50 transition-all font-kanit"
                                    />
                                </div>

                                {/* Tag Suggestions Dropdown */}
                                {isSuggestionsOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="p-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest px-2 flex items-center gap-1.5">
                                                {tagInput ? <Search className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                                                {tagInput ? 'ผลการค้นหา' : 'แท็กยอดนิยม'}
                                            </span>
                                            {isLoadingTags && <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400 mr-2" />}
                                        </div>
                                        
                                        <div className="p-1 max-h-48 overflow-y-auto scrollbar-thin">
                                            {tagInput.trim() && !tagSuggestions.find(s => s.name.toLowerCase() === tagInput.toLowerCase().trim()) && (
                                                <button
                                                    onClick={() => handleAddTag(tagInput)}
                                                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-left group transition-all"
                                                >
                                                    <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                        <Plus className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-[10px] font-bold text-white/70 truncate">เพิ่ม: <span className="text-indigo-400">"{tagInput.trim()}"</span></div>
                                                    </div>
                                                </button>
                                            )}

                                            {tagSuggestions.map((tag) => (
                                                <button
                                                    key={tag.name}
                                                    onClick={() => handleAddTag(tag.name)}
                                                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-left group transition-all"
                                                >
                                                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-white/30 shrink-0 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                                        <Hash className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-[10px] font-bold text-white/70 group-hover:text-white truncate">{tag.name}</div>
                                                        <div className="text-[8px] text-white/20 font-medium">ใช้แล้ว {tag.count} ครั้ง</div>
                                                    </div>
                                                    <Check className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}

                                            {tagSuggestions.length === 0 && !tagInput.trim() && (
                                                <div className="py-6 px-4 text-center">
                                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                        {isLoadingTags ? 'กำลังโหลดแท็ก...' : 'ไม่พบแท็กในคลัง'}
                                                    </p>
                                                </div>
                                            )}

                                            {tagSuggestions.length === 0 && tagInput.trim() && tagSuggestions.find(s => s.name.toLowerCase() === tagInput.toLowerCase().trim()) && (
                                                <div className="py-4 px-4 text-center">
                                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                        แท็กนี้ถูกเลือกแล้ว
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {filterTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {filterTags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold">
                                                {tag}
                                                <X 
                                                    className="w-2 h-2 cursor-pointer hover:text-white" 
                                                    onClick={() => setFilterTags(prev => prev.filter(t => t !== tag))}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Script List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-xs font-black">กำลังโหลดคลังสคริปต์...</p>
                    </div>
                ) : scripts.length > 0 ? (
                    scripts.map(script => (
                        <div 
                            key={script.id}
                            className="group p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
                            onClick={() => onAddScript(script)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 overflow-hidden">
                                    <h4 className="text-md font-medium text-white truncate group-hover:text-indigo-400 transition-colors">{script.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-white/50">
                                        <UserIcon className="w-3 h-3" />
                                        <span className="truncate">{script.author?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                                <button className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Tags/Meta */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {script.channelId && (
                                    <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[8px] font-black uppercase">
                                        {channels.find(c => c.id === script.channelId)?.name || 'Unknown Channel'}
                                    </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[8px] font-black uppercase">
                                    {script.category}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 opacity-20">
                        <FileText className="w-12 h-12 mx-auto mb-3" />
                        <p className="text-xs font-black uppercase tracking-widest">ไม่พบสคริปต์</p>
                    </div>
                )}
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest text-center">
                    Found {totalCount} scripts in library
                </p>
            </div>
        </div>
    );
};

export default LabSidebar;
