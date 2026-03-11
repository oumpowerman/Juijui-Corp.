
import React, { useState } from 'react';
import { Search, Menu, Plus, Pin, Book, Clock, Star, Zap, Shield, HelpCircle, Layers, LayoutList, LayoutGrid, User } from 'lucide-react';
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
    // Density State
    const [viewDensity, setViewDensity] = useState<'COMFORTABLE' | 'COMPACT'>('COMFORTABLE');

    return (
        <div className="flex flex-col h-full w-full bg-white/20 backdrop-blur-sm">
            {/* Header Area */}
            <div className="p-5 border-b border-white/40 bg-white/30 backdrop-blur-md sticky top-0 z-20 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         {!isSidebarOpen && (
                             <button onClick={onOpenSidebar} className="hidden lg:flex p-2.5 hover:bg-white/60 rounded-2xl text-slate-500 transition-all active:scale-90 border border-white/60 shadow-sm"><Menu className="w-5 h-5" /></button>
                         )}
                         <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            บทความ <span className="bg-white/60 backdrop-blur-md text-slate-500 text-[16px] font-bold px-2.5 py-1 rounded-full border border-white/60 shadow-sm">{articles.length}</span>
                         </h2>
                    </div>
                    <div className="flex items-center gap-2">
                         {/* Density Toggle */}
                         <div className="hidden md:flex bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-inner">
                             <button 
                                 onClick={() => setViewDensity('COMFORTABLE')}
                                 className={`p-2 rounded-xl transition-all duration-300 ${viewDensity === 'COMFORTABLE' ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                 title="Card View"
                             >
                                 <LayoutGrid className="w-4 h-4" />
                             </button>
                             <button 
                                 onClick={() => setViewDensity('COMPACT')}
                                 className={`p-2 rounded-xl transition-all duration-300 ${viewDensity === 'COMPACT' ? 'bg-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                 title="Compact View"
                             >
                                 <LayoutList className="w-4 h-4" />
                             </button>
                         </div>
                         
                         <button 
                            onClick={onCreate} 
                            className="p-2.5 bg-indigo-400 text-white rounded-2xl shadow-[0_12px_24px_-8px_rgba(99,102,241,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(99,102,241,0.5)] hover:-translate-y-1 transition-all active:scale-90"
                        >
                            <Plus className="w-5 h-5 stroke-[3px]" />
                        </button>
                    </div>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหา..." 
                        className="w-full pl-11 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/60 focus:bg-white focus:border-indigo-200 focus:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] rounded-2xl text-sm outline-none transition-all font-bold text-slate-700 placeholder:font-normal"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Mobile Category Dropdown (Sticker Style) */}
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                    <button onClick={() => onSelectCategory('ALL')} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white/60 border-white/80 text-slate-500'}`}>ALL</button>
                    {categories.map(c => (
                        <button key={c.key} onClick={() => onSelectCategory(c.key)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-300 ${selectedCategory === c.key ? 'bg-indigo-100/80 text-indigo-600 border-indigo-200 shadow-md' : 'bg-white/60 border-white/80 text-slate-500'}`}>{c.label.split('(')[0]}</button>
                    ))}
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto bg-transparent scrollbar-thin scrollbar-thumb-slate-200/50">
                <div className={`p-5 ${viewDensity === 'COMPACT' ? 'space-y-2' : 'space-y-4'}`}>
                    {articles.map(article => {
                         const isActive = viewingArticleId === article.id;
                         const category = categories.find(c => c.key === article.category);
                         const colorKey = category?.color?.split(' ')[0].replace('bg-', '') || 'slate';
                         const Icon = CATEGORY_ICONS[article.category] || Book;

                         if (viewDensity === 'COMPACT') {
                             return (
                                <div 
                                    key={article.id}
                                    onClick={() => onSelectArticle(article)}
                                    className={`
                                        flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 group
                                        ${isActive 
                                            ? 'bg-white shadow-[0_12px_24px_-8px_rgba(99,102,241,0.2)] border-indigo-200 ring-1 ring-white/60 translate-x-1' 
                                            : 'bg-white/40 backdrop-blur-sm border-white/60 hover:bg-white/60 hover:border-indigo-100 hover:shadow-md hover:translate-x-1'}
                                    `}
                                >
                                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-${colorKey}-100/80 text-${colorKey}-600 border border-white/60 shadow-sm`}>
                                        <Icon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {article.isPinned && <Pin className="w-3 h-3 text-orange-400 fill-orange-400" />}
                                            <h4 className={`text-xs font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{article.title}</h4>
                                        </div>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-medium">
                                            <span>{format(article.lastUpdated, 'd MMM')}</span>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                            <span>{article.lastEditor?.name || 'Unknown'}</span>
                                        </p>
                                    </div>
                                </div>
                             );
                         }

                         // COMFORTABLE VIEW
                         return (
                            <div 
                                key={article.id}
                                onClick={() => onSelectArticle(article)}
                                className={`
                                    p-6 rounded-[2.5rem] border border-white/60 cursor-pointer transition-all duration-500 group relative flex flex-col gap-4 overflow-hidden isolate
                                    ${isActive 
                                        ? 'bg-white shadow-[0_32px_64px_-16px_rgba(99,102,241,0.15)] border-indigo-200 ring-4 ring-indigo-50/50 z-10 transform scale-[1.03] -translate-y-1' 
                                        : 'bg-white/60 backdrop-blur-md hover:bg-white/80 hover:border-indigo-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-2'}
                                `}
                            >
                                {/* Decorative Background Glow */}
                                {isActive && (
                                    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${colorKey}-200/20 rounded-full blur-2xl pointer-events-none animate-pulse`}></div>
                                )}

                                {/* Sticker Header */}
                                <div className="flex justify-between items-start">
                                    <div className={`
                                        flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                        bg-${colorKey}-100/80 text-${colorKey}-600 border-white/60 shadow-sm backdrop-blur-sm
                                    `}>
                                        <Icon className="w-3.5 h-3.5" />
                                        {category?.label.split('(')[0] || article.category}
                                    </div>
                                    {article.isPinned && (
                                        <div className="bg-yellow-100/80 backdrop-blur-sm p-2 rounded-2xl text-yellow-600 border border-white/60 rotate-12 shadow-md">
                                            <Pin className="w-3.5 h-3.5 fill-yellow-600" />
                                        </div>
                                    )}
                                </div>

                                <h3 className={`font-bold text-lg leading-tight line-clamp-2 transition-all duration-300 ${isActive ? 'text-indigo-900' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                                    {article.title}
                                </h3>
                                
                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-dashed border-slate-100/60">
                                    <div className="flex items-center gap-2.5">
                                        {article.lastEditor?.avatarUrl ? (
                                            <img src={article.lastEditor.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400 border border-white/60"><User className="w-3.5 h-3.5"/></div>
                                        )}
                                        <span className="text-[10px] text-slate-400 font-bold tracking-tight truncate max-w-[90px]">
                                            {article.lastEditor?.name.split(' ')[0] || 'Unknown'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 flex items-center font-bold bg-white/60 px-2.5 py-1 rounded-xl border border-white/60 shadow-sm">
                                        <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-300" /> {format(article.lastUpdated, 'd MMM')}
                                    </span>
                                </div>
                            </div>
                         );
                    })}
                    
                    {articles.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-slate-400 animate-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-white/60 backdrop-blur-md rounded-[2rem] flex items-center justify-center mb-6 relative shadow-lg border border-white/80 rotate-3">
                                <Book className="w-12 h-12 opacity-20 text-indigo-500" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-300 rounded-full border-4 border-white shadow-md animate-bounce"></div>
                            </div>
                            <p className="text-lg font-bold text-slate-600">ไม่พบบทความ</p>
                            <p className="text-xs mt-2 text-slate-400 font-medium">ลองค้นหาคำอื่น หรือสร้างใหม่เลย ✨</p>
                        </div>
                    )}
                    <div className="h-10"></div>
                </div>
            </div>
        </div>
    );
};

export default WikiList;
