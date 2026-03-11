
import { LayoutGrid, Youtube, FileSpreadsheet, HardDrive, FileText, Globe, Sparkles, Video, Facebook, Instagram, Palette, Hash, Tag as TagIcon, X } from 'lucide-react';
import { NexusPlatform } from '../../types';

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
        { id: 'ALL', label: 'ทั้งหมด', icon: LayoutGrid, color: 'bg-slate-900' },
        { id: 'SOCIAL', label: 'Social Media', icon: Youtube, color: 'bg-rose-500' },
        { id: 'PRODUCTIVITY', label: 'Productivity', icon: FileSpreadsheet, color: 'bg-emerald-500' },
        { id: 'DESIGN', label: 'Design', icon: Palette, color: 'bg-cyan-500' },
        { id: 'WEB', label: 'Web Links', icon: Globe, color: 'bg-indigo-500' },
    ];

    return (
        <div className="space-y-6 mb-12">
            {/* Category Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onTabChange(cat.id as any)}
                            className={`
                                relative flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                ${isActive 
                                    ? `${cat.color} text-white border-transparent shadow-xl scale-105 z-10` 
                                    : 'bg-white/50 backdrop-blur-md text-slate-500 border-white/50 hover:border-slate-300 hover:bg-white shadow-sm'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Tags Section */}
            {availableTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 mr-2 py-1.5 px-3 bg-slate-100 rounded-xl">
                        <TagIcon className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tags</span>
                    </div>
                    
                    {availableTags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => onToggleTag(tag)}
                                className={`
                                    px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border
                                    ${isSelected 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' 
                                        : 'bg-white/50 text-slate-600 border-white/50 hover:border-indigo-200 hover:bg-white'
                                    }
                                `}
                            >
                                #{tag}
                            </button>
                        );
                    })}

                    {selectedTags.length > 0 && (
                        <button 
                            onClick={onClearTags}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            ล้างทั้งหมด
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default NexusFilter;
