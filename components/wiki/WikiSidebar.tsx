
import React from 'react';
import { Layout, Info, X, ChevronRight, BookOpen } from 'lucide-react';
import { MasterOption } from '../../types';

interface WikiSidebarProps {
    categories: MasterOption[];
    selectedCategory: string;
    onSelectCategory: (key: string) => void;
    isOpen: boolean;
    onClose: () => void;
    onOpenGuide: () => void;
}

const WikiSidebar: React.FC<WikiSidebarProps> = ({ 
    categories, selectedCategory, onSelectCategory, isOpen, onClose, onOpenGuide 
}) => {
    return (
        <div className={`
            hidden lg:flex flex-col border-r border-slate-100 bg-slate-50/50 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
            ${isOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}
        `}>
            <div className="p-4 flex flex-col gap-2 h-full">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pl-2 pt-2">
                    <div className="flex items-center gap-2 text-indigo-900">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Library</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                        <X className="w-4 h-4"/>
                    </button>
                </div>
                
                {/* All Button */}
                <button 
                    onClick={() => onSelectCategory('ALL')}
                    className={`
                        text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center group
                        ${selectedCategory === 'ALL' 
                            ? 'bg-white shadow-md text-indigo-600 ring-1 ring-indigo-50 translate-x-1' 
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}
                    `}
                >
                    <Layout className={`w-4 h-4 mr-3 transition-colors ${selectedCategory === 'ALL' ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} /> 
                    ทั้งหมด (All)
                    {selectedCategory === 'ALL' && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />}
                </button>

                {/* Divider */}
                <div className="h-px bg-slate-200/60 mx-2 my-1"></div>

                {/* Categories */}
                <div className="space-y-1 overflow-y-auto flex-1 scrollbar-hide pr-1">
                    <p className="px-4 text-[10px] font-bold text-slate-400 uppercase mb-2 mt-1">Categories</p>
                    {categories.map(cat => {
                        const isActive = selectedCategory === cat.key;
                        const colorClass = cat.color ? cat.color.split(' ')[0].replace('bg-', 'bg-').replace('text-', 'text-') : 'bg-slate-400';
                        
                        return (
                            <button
                                key={cat.key}
                                onClick={() => onSelectCategory(cat.key)}
                                className={`
                                    w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center group relative
                                    ${isActive 
                                        ? 'bg-white shadow-sm text-slate-800' 
                                        : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                                `}
                            >
                                <span className={`w-2 h-2 rounded-full mr-3 ${colorClass} group-hover:scale-125 transition-transform`}></span>
                                <span className="truncate">{cat.label}</span>
                                {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${colorClass}`}></div>}
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-slate-200/50">
                    <button 
                        onClick={onOpenGuide} 
                        className="flex items-center justify-center text-xs text-slate-500 font-bold bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all w-full px-4 py-3 rounded-xl shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Info className="w-4 h-4 mr-2" /> คู่มือการใช้งาน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WikiSidebar;
