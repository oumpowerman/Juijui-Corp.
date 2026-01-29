
import React from 'react';
import { Search, Menu, Plus, Pin, Book, Clock, Star, Zap, Shield, HelpCircle, Layers } from 'lucide-react';
import { WikiArticle, MasterOption } from '../../types';
import { format } from 'date-fns';

interface WikiListProps {
    articles: WikiArticle[];
    categories: MasterOption[];
    selectedCategory: string;
    onSelectCategory: (key: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    viewingArticleId: string | undefined;
    onSelectArticle: (article: WikiArticle) => void;
    onCreate: () => void;
    isSidebarOpen: boolean;
    onOpenSidebar: () => void;
    isMobileListVisible: boolean;
}

// Playful Icons Map
const CATEGORY_ICONS: Record<string, any> = {
    'GENERAL': Star,
    'RULES': Shield,
    'TOOLS': Zap,
    'ONBOARDING': HelpCircle,
    'WORKFLOW': Layers,
};

const WikiList: React.FC<WikiListProps> = ({
    articles, categories, selectedCategory, onSelectCategory,
    searchQuery, setSearchQuery, viewingArticleId, onSelectArticle, onCreate,
    isSidebarOpen, onOpenSidebar, isMobileListVisible
}) => {
    return (
        <div className={`
            flex-col bg-white border-r border-slate-100 min-w-0 transition-all duration-300 h-full w-full
        `}>
            {/* Header Area */}
            <div className="p-5 border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-20 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         {!isSidebarOpen && (
                             <button onClick={onOpenSidebar} className="hidden lg:flex p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"><Menu className="w-5 h-5" /></button>
                         )}
                         <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            📚 บทความ <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{articles.length}</span>
                         </h2>
                    </div>
                     <button 
                        onClick={onCreate} 
                        className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 stroke-[3px]" />
                    </button>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหา..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl text-sm outline-none transition-all font-bold text-slate-700 placeholder:font-normal"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Mobile Category Dropdown (Sticker Style) */}
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 py-1">
                    <button 
                        onClick={() => onSelectCategory('ALL')} 
                        className={`
                            px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border-2 transition-all transform active:scale-95
                            ${selectedCategory === 'ALL' 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md rotate-1' 
                                : 'bg-white border-slate-200 text-slate-500 hover:rotate-1'}
                        `}
                    >
                        ALL
                    </button>
                    {categories.map(c => {
                         const colorKey = c.color?.split(' ')[0].replace('bg-', '') || 'indigo';
                         const isActive = selectedCategory === c.key;
                         return (
                            <button 
                                key={c.key} 
                                onClick={() => onSelectCategory(c.key)} 
                                className={`
                                    px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border-2 transition-all transform active:scale-95
                                    ${isActive 
                                        ? `bg-${colorKey}-100 text-${colorKey}-600 border-${colorKey}-200 shadow-md -rotate-1` 
                                        : 'bg-white border-slate-200 text-slate-500 hover:-rotate-1'}
                                `}
                            >
                                {c.label.split('(')[0]}
                            </button>
                         );
                    })}
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
                {articles.map(article => {
                     const isActive = viewingArticleId === article.id;
                     const category = categories.find(c => c.key === article.category);
                     const colorKey = category?.color?.split(' ')[0].replace('bg-', '') || 'slate';
                     const Icon = CATEGORY_ICONS[article.category] || Book;

                     return (
                        <div 
                            key={article.id}
                            onClick={() => onSelectArticle(article)}
                            className={`
                                p-5 rounded-3xl border-2 cursor-pointer transition-all duration-300 group relative flex flex-col gap-3 overflow-hidden
                                ${isActive 
                                    ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 ring-2 ring-indigo-50 z-10 transform scale-[1.02]' 
                                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'}
                            `}
                        >
                            {/* Sticker Header */}
                            <div className="flex justify-between items-start">
                                <div className={`
                                    flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border-2
                                    bg-${colorKey}-50 text-${colorKey}-600 border-${colorKey}-100
                                `}>
                                    <Icon className="w-3 h-3" />
                                    {category?.label.split('(')[0] || article.category}
                                </div>
                                {article.isPinned && (
                                    <div className="bg-yellow-100 p-1.5 rounded-full text-yellow-600 border-2 border-yellow-200 rotate-12 shadow-sm">
                                        <Pin className="w-3 h-3 fill-yellow-600" />
                                    </div>
                                )}
                            </div>

                            <h3 className={`font-black text-base leading-snug line-clamp-2 ${isActive ? 'text-indigo-900' : 'text-slate-700 group-hover:text-indigo-700 transition-colors'}`}>
                                {article.title}
                            </h3>
                            
                            <div className="flex items-center justify-between mt-1 pt-3 border-t border-dashed border-slate-100">
                                <div className="flex items-center gap-2">
                                    {article.lastEditor?.avatarUrl ? (
                                        <img src={article.lastEditor.avatarUrl} className="w-5 h-5 rounded-full border border-white shadow-sm" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">?</div>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[80px]">
                                        {article.lastEditor?.name.split(' ')[0] || 'Unknown'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center font-medium bg-slate-50 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3 mr-1" /> {format(article.lastUpdated, 'd MMM')}
                                </span>
                            </div>
                        </div>
                     );
                })}
                
                {articles.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 relative">
                            <Book className="w-10 h-10 opacity-20 text-slate-500" />
                            <div className="absolute top-0 right-0 w-6 h-6 bg-red-400 rounded-full border-2 border-white"></div>
                        </div>
                        <p className="text-base font-black text-slate-600">ไม่พบบทความ</p>
                        <p className="text-xs mt-1 text-slate-400">ลองค้นหาคำอื่น หรือสร้างใหม่เลย</p>
                    </div>
                )}
                
                {/* Spacer */}
                <div className="h-10"></div>
            </div>
        </div>
    );
};

export default WikiList;
