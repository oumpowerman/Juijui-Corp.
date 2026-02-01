
import React, { useState, useMemo } from 'react';
import { Info, X, ChevronRight, ChevronDown, Folder, FolderOpen, BookOpen, Hash } from 'lucide-react';
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
    // State for expanded folders (Root categories)
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = (key: string) => {
        setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // --- Build Tree Structure ---
    const categoryTree = useMemo(() => {
        const roots = categories.filter(c => !c.parentKey);
        const childrenMap: Record<string, MasterOption[]> = {};
        
        categories.forEach(c => {
            if (c.parentKey) {
                if (!childrenMap[c.parentKey]) childrenMap[c.parentKey] = [];
                childrenMap[c.parentKey].push(c);
            }
        });

        return roots.map(root => ({
            ...root,
            children: childrenMap[root.key] || []
        }));
    }, [categories]);

    return (
        <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Library</h3>
                        <p className="text-[10px] text-slate-400 font-bold">Knowledge Base</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors">
                    <X className="w-4 h-4"/>
                </button>
            </div>
            
            {/* Navigation Tree */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                
                {/* ALL Button */}
                <button 
                    onClick={() => onSelectCategory('ALL')}
                    className={`
                        w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center group
                        ${selectedCategory === 'ALL' 
                            ? 'bg-white shadow-md text-indigo-600 ring-1 ring-indigo-50 translate-x-1' 
                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}
                    `}
                >
                    <Hash className={`w-4 h-4 mr-3 transition-colors ${selectedCategory === 'ALL' ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-600'}`} /> 
                    ทั้งหมด (All Articles)
                </button>

                <div className="h-px bg-slate-200/60 mx-3 my-2"></div>

                <p className="px-3 text-[10px] font-black text-slate-400 uppercase mb-2 tracking-wider">Folders</p>

                {categoryTree.map(node => {
                    const hasChildren = node.children.length > 0;
                    const isExpanded = expandedFolders[node.key] || selectedCategory === node.key || node.children.some(c => c.key === selectedCategory);
                    const isActive = selectedCategory === node.key;
                    const colorClass = node.color ? node.color.split(' ')[0].replace('bg-', 'text-') : 'text-slate-500';

                    return (
                        <div key={node.id} className="mb-1">
                            {/* Root Item */}
                            <div className="flex items-center group">
                                <button
                                    onClick={() => {
                                        if (hasChildren) toggleFolder(node.key);
                                        else onSelectCategory(node.key);
                                    }}
                                    className={`
                                        flex-1 text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center relative
                                        ${isActive 
                                            ? 'bg-white shadow-sm text-slate-800' 
                                            : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'}
                                    `}
                                >
                                    <span className={`mr-2.5 ${isActive ? colorClass : 'text-slate-400 group-hover:text-slate-500'}`}>
                                        {hasChildren ? (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />) : <Hash className="w-4 h-4" />}
                                    </span>
                                    <span className="truncate">{node.label}</span>
                                    
                                    {hasChildren && (
                                        <div className="ml-auto text-slate-300">
                                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </div>
                                    )}
                                    {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-indigo-500`}></div>}
                                </button>
                            </div>

                            {/* Children */}
                            {hasChildren && isExpanded && (
                                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 mt-0.5 relative animate-in slide-in-from-left-2 duration-200">
                                    {node.children.map(child => {
                                        const isChildActive = selectedCategory === child.key;
                                        return (
                                            <button
                                                key={child.id}
                                                onClick={() => onSelectCategory(child.key)}
                                                className={`
                                                    w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center
                                                    ${isChildActive 
                                                        ? 'bg-indigo-50 text-indigo-700 font-bold' 
                                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'}
                                                `}
                                            >
                                                {isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></div>}
                                                {child.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200/60 bg-slate-50">
                <button 
                    onClick={onOpenGuide} 
                    className="flex items-center justify-center text-xs text-slate-500 font-bold bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all w-full px-4 py-3 rounded-xl shadow-sm hover:shadow-md active:scale-95"
                >
                    <Info className="w-4 h-4 mr-2" /> คู่มือการใช้งาน
                </button>
            </div>
        </div>
    );
};

export default WikiSidebar;
