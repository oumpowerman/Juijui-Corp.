
import React, { useState, useMemo } from 'react';
import { Info, X, ChevronRight, ChevronDown, Folder, FolderOpen, BookOpen, Hash } from 'lucide-react';
import { MasterOption } from '../../types';
import { useDroppable } from '@dnd-kit/core';

interface WikiSidebarProps {
    categories: MasterOption[];
    selectedCategory: string;
    onSelectCategory: (key: string) => void;
    isOpen: boolean;
    onClose: () => void;
    onOpenGuide: () => void;
}

// Droppable Wrapper Component
const DroppableCategory: React.FC<{ 
    id: string; 
    children: React.ReactNode;
    isActive: boolean;
    isRoot?: boolean;
}> = ({ id, children, isActive, isRoot }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div 
            ref={setNodeRef} 
            className={`
                transition-all duration-300 rounded-2xl
                ${isOver ? 'bg-indigo-100/80 scale-[1.05] ring-2 ring-indigo-400 ring-offset-2 z-20 shadow-xl' : ''}
                ${isRoot ? 'mb-1' : ''}
            `}
        >
            {children}
        </div>
    );
};

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
            <div className="p-5 border-b border-white/40 flex items-center justify-between shrink-0 bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3 text-slate-800">
                    <div className="p-2.5 bg-indigo-100/80 backdrop-blur-md rounded-2xl text-indigo-600 shadow-[0_8px_16px_-4px_rgba(99,102,241,0.2)] border border-white/60">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700">Library</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Knowledge Base</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/40 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-90">
                    <X className="w-4 h-4"/>
                </button>
            </div>
            
            {/* Navigation Tree */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                
                {/* ALL Button */}
                <button 
                    onClick={() => onSelectCategory('ALL')}
                    className={`
                        w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center group relative overflow-hidden
                        ${selectedCategory === 'ALL' 
                            ? 'bg-white shadow-[0_12px_24px_-8px_rgba(99,102,241,0.2)] text-indigo-600 ring-1 ring-white/60 translate-x-2' 
                            : 'text-slate-500 hover:bg-white/40 hover:text-slate-700 hover:translate-x-1'}
                    `}
                >
                    <Hash className={`w-4 h-4 mr-3 transition-all duration-300 ${selectedCategory === 'ALL' ? 'text-indigo-500 scale-110' : 'text-slate-400 group-hover:text-slate-600'}`} /> 
                    ทั้งหมด (All Articles)
                </button>

                <div className="h-px bg-white/40 mx-3 my-3"></div>

                <p className="px-4 text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest opacity-70">Folders</p>

                {categoryTree.map(node => {
                    const hasChildren = node.children.length > 0;
                    const isExpanded = expandedFolders[node.key] || selectedCategory === node.key || node.children.some(c => c.key === selectedCategory);
                    const isActive = selectedCategory === node.key;
                    const colorClass = node.color ? node.color.split(' ')[0].replace('bg-', 'text-') : 'text-slate-500';

                    return (
                        <DroppableCategory key={node.id} id={node.key} isActive={isActive} isRoot={true}>
                            {/* Root Item */}
                            <div className="flex items-center group">
                                <button
                                    onClick={() => {
                                        onSelectCategory(node.key);
                                        if (hasChildren && !isExpanded) {
                                            toggleFolder(node.key);
                                        }
                                    }}
                                    className={`
                                        flex-1 text-left px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 flex items-center relative group/item
                                        ${isActive 
                                            ? 'bg-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.05)] text-slate-800 ring-1 ring-white/60' 
                                            : 'text-slate-500 hover:bg-white/30 hover:text-slate-700 hover:translate-x-1'}
                                    `}
                                >
                                    <span className={`mr-3 transition-transform duration-300 group-hover/item:scale-110 ${isActive ? colorClass : 'text-slate-400 group-hover/item:text-slate-500'}`}>
                                        {hasChildren ? (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />) : <Hash className="w-4 h-4" />}
                                    </span>
                                    <span className="truncate">{node.label}</span>
                                    
                                    {hasChildren && (
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFolder(node.key);
                                            }}
                                            className="ml-auto p-1 hover:bg-slate-100 rounded-lg text-slate-300 transition-all duration-300 group-hover/item:text-slate-400"
                                        >
                                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                        </div>
                                    )}
                                    {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-indigo-400 shadow-[2px_0_8px_rgba(99,102,241,0.4)]`}></div>}
                                </button>
                            </div>

                            {/* Children */}
                            {hasChildren && isExpanded && (
                                <div className="ml-4 pl-3 border-l border-slate-200 space-y-0.5 mt-0.5 relative animate-in slide-in-from-left-2 duration-200">
                                    {node.children.map(child => {
                                        const isChildActive = selectedCategory === child.key;
                                        return (
                                            <DroppableCategory key={child.id} id={child.key} isActive={isChildActive}>
                                                <button
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
                                            </DroppableCategory>
                                        );
                                    })}
                                </div>
                            )}
                        </DroppableCategory>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/40 bg-white/20 backdrop-blur-sm">
                <button 
                    onClick={onOpenGuide} 
                    className="flex items-center justify-center text-xs text-slate-500 font-bold bg-white/60 backdrop-blur-md border border-white/80 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-300 w-full px-4 py-3.5 rounded-2xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 active:scale-95"
                >
                    <Info className="w-4 h-4 mr-2 text-indigo-400" /> คู่มือการใช้งาน
                </button>
            </div>
        </div>
    );
};

export default WikiSidebar;
