
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Hash, X, Check, TrendingUp, Search, Tag as TagIcon, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface TagFilterProps {
    selectedTags: string[];
    onToggle: (tag: string) => void;
    onClear: () => void;
    // Context for smart counting
    filterOwner?: string[];
    filterChannel?: string[];
    filterCategory?: string;
    filterStatus?: string;
    searchQuery?: string;
}

const TagFilter: React.FC<TagFilterProps> = ({ 
    selectedTags, onToggle, onClear,
    filterOwner, filterChannel, filterCategory, filterStatus, searchQuery
}) => {
    const [inputValue, setInputValue] = useState('');
    const [trendingTags, setTrendingTags] = useState<{ name: string; count: number }[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch trending tags on mount and when filters change
    useEffect(() => {
        const fetchTrendingTags = async () => {
            setIsLoading(true);
            try {
                // Build a smart query that respects current filters
                let query = supabase.from('scripts').select('tags');

                if (filterOwner && filterOwner.length > 0) {
                    query = query.in('owner_id', filterOwner);
                }
                if (filterChannel && filterChannel.length > 0) {
                    query = query.in('channel_id', filterChannel);
                }
                if (filterCategory && filterCategory !== 'ALL') {
                    query = query.eq('category', filterCategory);
                }
                if (filterStatus && filterStatus !== 'ALL') {
                    query = query.eq('status', filterStatus);
                }
                if (searchQuery) {
                    query = query.ilike('title', `%${searchQuery}%`);
                }

                const { data, error } = await query
                    .order('created_at', { ascending: false })
                    .limit(2000);

                if (error) throw error;
                if (data) {
                    const counts: Record<string, number> = {};
                    data.forEach(row => {
                        if (Array.isArray(row.tags)) {
                            row.tags.forEach((t: string) => {
                                const clean = t.trim();
                                if (clean) counts[clean] = (counts[clean] || 0) + 1;
                            });
                        }
                    });
                    const sorted = Object.entries(counts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 15); // Show top 15 trending
                    setTrendingTags(sorted);
                }
            } catch (err) {
                console.error("Failed to fetch trending tags", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrendingTags();
    }, [filterOwner, filterChannel, filterCategory, filterStatus, searchQuery]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsSuggestionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter suggestions based on input
    // In a real "tens of thousands" scenario, we might want to query the DB for matching tags
    // But for now, we can filter from the trending list or just allow free-text search
    const suggestions = useMemo(() => {
        const query = inputValue.toLowerCase().trim();
        if (!query) return trendingTags.filter(t => !selectedTags.includes(t.name));
        
        return trendingTags.filter(t => 
            t.name.toLowerCase().includes(query) && 
            !selectedTags.includes(t.name)
        );
    }, [inputValue, trendingTags, selectedTags]);

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const tag = inputValue.trim().replace(/^#/, '');
            if (!selectedTags.includes(tag)) {
                onToggle(tag);
            }
            setInputValue('');
            setIsSuggestionsOpen(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 px-1 relative" ref={containerRef}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    <TagIcon className="w-3 h-3" /> Smart Tag Filter
                    {isLoading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                </div>
                {selectedTags.length > 0 && (
                    <button 
                        onClick={onClear}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3 h-3" /> ล้างทั้งหมด
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                {/* Selected Tags as Chips */}
                {selectedTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => onToggle(tag)}
                        className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-indigo-500 animate-in zoom-in duration-200 group"
                    >
                        <Hash className="w-2.5 h-2.5 opacity-70" />
                        {tag}
                        <X className="w-2.5 h-2.5 group-hover:scale-125 transition-transform" />
                    </button>
                ))}

                {/* Search Input for Tags */}
                <div className="relative flex-1 min-w-[150px]">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-3 h-3" />
                    </div>
                    <input 
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setIsSuggestionsOpen(true);
                        }}
                        onFocus={() => setIsSuggestionsOpen(true)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="ค้นหาหรือพิมพ์แท็ก..."
                        className="w-full pl-7 pr-3 py-1 bg-white/40 border border-slate-200/60 rounded-lg text-[10px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all"
                    />

                    {/* Suggestions Dropdown */}
                    {isSuggestionsOpen && (suggestions.length > 0 || inputValue.trim()) && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="p-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                                {inputValue.trim() && !suggestions.find(s => s.name.toLowerCase() === inputValue.toLowerCase().trim()) && (
                                    <button
                                        onClick={() => {
                                            onToggle(inputValue.trim().replace(/^#/, ''));
                                            setInputValue('');
                                            setIsSuggestionsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-50 text-left group transition-all"
                                    >
                                        <Plus className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-bold text-slate-600">ค้นหา: <span className="text-indigo-600">#{inputValue.trim()}</span></span>
                                    </button>
                                )}
                                {suggestions.map(tag => (
                                    <button
                                        key={tag.name}
                                        onClick={() => {
                                            onToggle(tag.name);
                                            setInputValue('');
                                            setIsSuggestionsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left group transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                                            <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600">{tag.name}</span>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-300 bg-slate-50 px-1 rounded group-hover:bg-indigo-100 group-hover:text-indigo-500">{tag.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Trending Suggestions (when not searching) */}
                {!inputValue && trendingTags
                    .filter(t => !selectedTags.includes(t.name))
                    .slice(0, 5) // Show only first 5 as quick chips
                    .map(tag => (
                        <button
                            key={tag.name}
                            onClick={() => onToggle(tag.name)}
                            className="bg-white/60 hover:bg-white text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-slate-200/60 hover:border-indigo-200 transition-all shadow-sm group"
                        >
                            <Hash className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                            {tag.name}
                            <span className="text-[8px] opacity-40 group-hover:opacity-100 bg-slate-100 px-1 rounded-sm">{tag.count}</span>
                        </button>
                    ))
                }
            </div>
        </div>
    );
};

export default TagFilter;
