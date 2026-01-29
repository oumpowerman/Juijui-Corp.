
import React from 'react';
import { Search, Menu, Plus, Pin, Book, Clock } from 'lucide-react';
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

const WikiList: React.FC<WikiListProps> = ({
    articles, categories, selectedCategory, onSelectCategory,
    searchQuery, setSearchQuery, viewingArticleId, onSelectArticle, onCreate,
    isSidebarOpen, onOpenSidebar, isMobileListVisible
}) => {
    return (
        <div className={`
            flex-col bg-white border-r border-slate-100 min-w-0 transition-all duration-300 absolute inset-0 z-10 lg:static lg:flex lg:w-96 shadow-sm
            ${isMobileListVisible ? 'flex w-full' : 'hidden'}
        `}>
            {/* Header Area */}
            <div className="p-5 border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-20 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         {!isSidebarOpen && (
                             <button onClick={onOpenSidebar} className="hidden lg:flex p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"><Menu className="w-5 h-5" /></button>
                         )}
                         <h2 className="text-xl font-black text-slate-800 tracking-tight">บทความ</h2>
                         <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{articles.length}</span>
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

                {/* Mobile Category Dropdown */}
                <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    <button 
                        onClick={() => onSelectCategory('ALL')} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === 'ALL' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                        All
                    </button>
                    {categories.map(c => (
                        <button 
                            key={c.key} 
                            onClick={() => onSelectCategory(c.key)} 
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${selectedCategory === c.key ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            {c.label.split('(')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
                {articles.map(article => {
                     const isActive = viewingArticleId === article.id;
                     const category = categories.find(c => c.key === article.category);
                     const catColor = category?.color || 'text-slate-500 bg-slate-100';

                     return (
                        <div 
                            key={article.id}
                            onClick={() => onSelectArticle(article)}
                            className={`
                                p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-lg group relative flex flex-col gap-2
                                ${isActive 
                                    ? 'bg-white border-indigo-500 shadow-md ring-4 ring-indigo-50 z-10' 
                                    : 'bg-white border-slate-200 hover:border-indigo-200'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border border-transparent uppercase tracking-wide ${catColor.replace('text-', 'bg-').replace('bg-', 'text-opacity-80 text-').replace('border-', '')} bg-opacity-10`}>
                                    {category?.label.split('(')[0] || article.category}
                                </span>
                                {article.isPinned && <Pin className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 rotate-45" />}
                            </div>

                            <h3 className={`font-bold text-sm leading-snug line-clamp-2 ${isActive ? 'text-indigo-900' : 'text-slate-700 group-hover:text-indigo-700'}`}>
                                {article.title}
                            </h3>
                            
                            <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-1.5">
                                    {article.lastEditor?.avatarUrl ? (
                                        <img src={article.lastEditor.avatarUrl} className="w-4 h-4 rounded-full" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
                                        {article.lastEditor?.name.split(' ')[0] || 'Unknown'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> {format(article.lastUpdated, 'd MMM')}
                                </span>
                            </div>
                        </div>
                     );
                })}
                
                {articles.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Book className="w-8 h-8 opacity-20 text-slate-500" />
                        </div>
                        <p className="text-sm font-bold">ไม่พบบทความ</p>
                        <p className="text-xs mt-1">ลองค้นหาคำอื่น หรือสร้างใหม่เลย</p>
                    </div>
                )}
                
                {/* Spacer */}
                <div className="h-10"></div>
            </div>
        </div>
    );
};

export default WikiList;
