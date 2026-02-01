
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
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header Area */}
            <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-20 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         {!isSidebarOpen && (
                             <button onClick={onOpenSidebar} className="hidden lg:flex p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"><Menu className="w-5 h-5" /></button>
                         )}
                         <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                            บทความ <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{articles.length}</span>
                         </h2>
                    </div>
                    <div className="flex items-center gap-2">
                         {/* Density Toggle */}
                         <div className="hidden md:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                             <button 
                                onClick={() => setViewDensity('COMFORTABLE')}
                                className={`p-1.5 rounded-md transition-all ${viewDensity === 'COMFORTABLE' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Card View"
                             >
                                 <LayoutGrid className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => setViewDensity('COMPACT')}
                                className={`p-1.5 rounded-md transition-all ${viewDensity === 'COMPACT' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Compact View"
                             >
                                 <LayoutList className="w-4 h-4" />
                             </button>
                         </div>
                         
                         <button 
                            onClick={onCreate} 
                            className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4 stroke-[3px]" />
                        </button>
                    </div>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหา..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-xl text-sm outline-none transition-all font-bold text-slate-700 placeholder:font-normal"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Mobile Category Dropdown (Sticker Style) */}
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                    <button onClick={() => onSelectCategory('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500'}`}>ALL</button>
                    {categories.map(c => (
                        <button key={c.key} onClick={() => onSelectCategory(c.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === c.key ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-white border-slate-200 text-slate-500'}`}>{c.label.split('(')[0]}</button>
                    ))}
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto bg-[#f8fafc] scrollbar-thin scrollbar-thumb-slate-200">
                <div className={`p-4 ${viewDensity === 'COMPACT' ? 'space-y-1' : 'space-y-3'}`}>
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
                                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group
                                        ${isActive 
                                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                                            : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm'}
                                    `}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-${colorKey}-50 text-${colorKey}-600`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {article.isPinned && <Pin className="w-3 h-3 text-orange-500 fill-orange-500" />}
                                            <h4 className={`text-xs font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{article.title}</h4>
                                        </div>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                            <span>{format(article.lastUpdated, 'd MMM')}</span>
                                            <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
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
                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500"><User className="w-3 h-3"/></div>
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
                    <div className="h-10"></div>
                </div>
            </div>
        </div>
    );
};

export default WikiList;
