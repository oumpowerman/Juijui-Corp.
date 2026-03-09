
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Hash, X, Check, TrendingUp, Search, Plus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SmartTagInputProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
}

const SmartTagInput: React.FC<SmartTagInputProps> = ({ selectedTags, onTagsChange, placeholder }) => {
    const [inputValue, setInputValue] = useState('');
    const [allTags, setAllTags] = useState<{ name: string; count: number }[]>([]);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch tags and calculate frequency
    useEffect(() => {
        const fetchTagStats = async () => {
            setIsLoading(true);
            try {
                // Fetch only the tags column from scripts
                // We limit to 1000 recent scripts to keep it performant
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

                    // Convert to array and sort by frequency
                    const sortedTags = Object.entries(tagCounts)
                        .map(([name, count]) => ({ name, count }))
                        .sort((a, b) => b.count - a.count);

                    setAllTags(sortedTags);
                }
            } catch (err) {
                console.error('Failed to fetch tag stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTagStats();
    }, []);

    // Handle click outside to close suggestions
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
    const suggestions = useMemo(() => {
        const query = inputValue.toLowerCase().trim();
        
        // If no input, show top 10 trending tags that aren't already selected
        if (!query) {
            return allTags
                .filter(t => !selectedTags.includes(t.name))
                .slice(0, 10);
        }

        // Filter tags that match query and aren't already selected
        return allTags
            .filter(t => 
                t.name.toLowerCase().includes(query) && 
                !selectedTags.includes(t.name)
            )
            .slice(0, 10);
    }, [inputValue, allTags, selectedTags]);

    const handleAddTag = (tagName: string) => {
        const cleanTag = tagName.trim();
        if (cleanTag && !selectedTags.includes(cleanTag)) {
            onTagsChange([...selectedTags, cleanTag]);
        }
        setInputValue('');
        setIsSuggestionsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                handleAddTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            // Remove last tag if backspace is pressed on empty input
            onTagsChange(selectedTags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onTagsChange(selectedTags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <div 
                className={`
                    bg-white p-2 rounded-xl border-2 transition-all flex flex-wrap gap-2 items-center min-h-[52px]
                    ${isSuggestionsOpen ? 'border-purple-300 ring-4 ring-purple-50' : 'border-slate-50 focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-50'}
                `}
                onClick={() => setIsSuggestionsOpen(true)}
            >
                {selectedTags.map(tag => (
                    <span 
                        key={tag} 
                        className="bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center border border-purple-100 group animate-in zoom-in duration-200"
                    >
                        <Hash className="w-3 h-3 mr-1 opacity-50" />
                        {tag}
                        <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); removeTag(tag); }} 
                            className="ml-1.5 hover:text-purple-800 bg-purple-100 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                ))}
                
                <input 
                    type="text" 
                    className="bg-transparent text-sm font-bold text-slate-700 outline-none flex-1 min-w-[140px] placeholder:text-slate-200 py-1"
                    placeholder={selectedTags.length === 0 ? placeholder || "พิมพ์แท็กแล้วกด Enter..." : ""}
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value);
                        setIsSuggestionsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsSuggestionsOpen(true)}
                />
            </div>

            {/* Suggestions Dropdown */}
            {isSuggestionsOpen && (suggestions.length > 0 || (inputValue.trim() && !selectedTags.includes(inputValue.trim()))) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1.5">
                            {inputValue ? <Search className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {inputValue ? 'ผลการค้นหา' : 'แท็กยอดนิยม'}
                        </span>
                        {isLoading && <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />}
                    </div>
                    
                    <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                        <style>{`
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 6px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #E2E8F0;
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #CBD5E1;
                            }
                        `}</style>
                        {/* Option to add the current typing value if it's not in suggestions */}
                        {inputValue.trim() && !suggestions.find(s => s.name.toLowerCase() === inputValue.toLowerCase().trim()) && (
                            <button
                                type="button"
                                onClick={() => handleAddTag(inputValue)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 text-left group transition-all"
                            >
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 group-hover:bg-purple-200 transition-colors">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-700">เพิ่มแท็กใหม่: <span className="text-purple-600">"{inputValue.trim()}"</span></div>
                                    <div className="text-[10px] text-slate-400 font-medium">กด Enter เพื่อเพิ่ม</div>
                                </div>
                            </button>
                        )}

                        {suggestions.map((tag) => (
                            <button
                                key={tag.name}
                                type="button"
                                onClick={() => handleAddTag(tag.name)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 text-left group transition-all"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                    <Hash className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-700 group-hover:text-purple-700">{tag.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">ใช้แล้ว {tag.count} ครั้ง</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Check className="w-4 h-4 text-purple-500" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartTagInput;
