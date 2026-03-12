
import React, { useMemo, useState } from 'react';
import { MasterOption, AssetGroup } from '../../types';
import { FolderOpen, ChevronRight, ChevronDown, LayoutGrid, Box } from 'lucide-react';

interface AssetTreeSidebarProps {
    masterOptions: MasterOption[];
    selectedGroup: AssetGroup | 'ALL';
    selectedCategory: string | 'ALL';
    onSelect: (group: AssetGroup | 'ALL', category: string | 'ALL') => void;
}

const AssetTreeSidebar: React.FC<AssetTreeSidebarProps> = ({ 
    masterOptions, selectedGroup, selectedCategory, onSelect 
}) => {
    
    // --- BUILD TREE FROM MASTER DATA ---
    const treeData = useMemo(() => {
        // 1. Get L1 Roots
        const l1 = masterOptions.filter(o => o.type === 'INV_CAT_L1').sort((a,b) => a.sortOrder - b.sortOrder);
        // 2. Get L2 Children
        const l2 = masterOptions.filter(o => o.type === 'INV_CAT_L2').sort((a,b) => a.sortOrder - b.sortOrder);

        // 3. Map Children to Parents
        return l1.map(root => ({
            ...root,
            children: l2.filter(child => child.parentKey === root.key)
        }));
    }, [masterOptions]);

    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    // Auto-expand active node on load/change
    React.useEffect(() => {
        if (selectedGroup !== 'ALL') {
            setExpandedNodes(prev => ({ ...prev, [selectedGroup]: true }));
        }
    }, [selectedGroup]);

    const toggleNode = (key: string) => {
        setExpandedNodes(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="w-full lg:w-64 pastel-glass-cute overflow-hidden flex flex-col h-[500px] lg:h-auto shrink-0 transition-all duration-500">
            <div className="p-5 border-b-2 border-pink-100 bg-white/40 backdrop-blur-md">
                <h3 className="font-bold text-purple-800 flex items-center text-[20px] tracking-wide">
                    <FolderOpen className="w-5 h-5 mr-2 text-pink-500 animate-bounce" /> Asset Browser ✨
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                
                {/* ROOT ALL */}
                <div 
                    onClick={() => onSelect('ALL', 'ALL')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 cute-3d-button ${selectedGroup === 'ALL' ? 'bg-pink-500 text-white font-black shadow-lg scale-[1.02]' : 'bg-white/60 text-purple-700 hover:bg-pink-50 hover:text-pink-600 font-bold'}`}
                >
                    <LayoutGrid className={`w-5 h-5 ${selectedGroup === 'ALL' ? 'text-white' : 'text-purple-400'}`} />
                    <span className="text-sm">ทรัพย์สินทั้งหมด (All)</span>
                </div>

                <div className="h-0.5 bg-gradient-to-r from-transparent via-pink-200 to-transparent my-4 mx-2"></div>

                {/* DYNAMIC GROUPS */}
                {treeData.map(group => {
                    const isGroupExpanded = expandedNodes[group.key];
                    // Logic check: Is this group currently selected?
                    const isGroupSelected = selectedGroup === group.key;
                    
                    return (
                        <div key={group.key} className="mb-2">
                            <div 
                                className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group cute-3d-button ${isGroupSelected && selectedCategory === 'ALL' ? 'bg-purple-100 border-2 border-purple-300 text-purple-800 font-black shadow-md scale-[1.02]' : 'bg-white/40 border-2 border-transparent text-purple-600 hover:bg-white/80 hover:border-pink-200 font-bold'}`}
                                onClick={() => {
                                    onSelect(group.key as AssetGroup, 'ALL');
                                    toggleNode(group.key);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Default Box icon, can add logic to map specific icons later based on key */}
                                    <Box className={`w-5 h-5 transition-transform duration-300 group-hover:rotate-12 ${isGroupSelected ? 'text-purple-600' : 'text-pink-400'}`} />
                                    <span className="text-sm truncate max-w-[120px]" title={group.label}>{group.label}</span>
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); toggleNode(group.key); }} className={`p-1.5 rounded-xl transition-colors ${isGroupSelected ? 'bg-purple-200 hover:bg-purple-300' : 'hover:bg-pink-100'}`}>
                                    {isGroupExpanded ? <ChevronDown className={`w-4 h-4 ${isGroupSelected ? 'text-purple-700' : 'text-pink-500'}`} /> : <ChevronRight className={`w-4 h-4 ${isGroupSelected ? 'text-purple-700' : 'text-pink-500'}`} />}
                                </div>
                            </div>

                            {/* Children Categories */}
                            {isGroupExpanded && group.children.length > 0 && (
                                <div className="ml-6 pl-4 border-l-2 border-pink-200 space-y-1.5 mt-2 relative animate-in slide-in-from-left-2 duration-300">
                                    {group.children.map(cat => (
                                        <div 
                                            key={`${group.key}-${cat.key}`}
                                            onClick={() => onSelect(group.key as AssetGroup, cat.key)}
                                            className={`
                                                flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 text-sm cute-3d-button
                                                ${selectedCategory === cat.key && selectedGroup === group.key
                                                    ? 'bg-white border-2 border-pink-300 text-pink-600 font-black shadow-md scale-[1.02] translate-x-1' 
                                                    : 'bg-white/30 border-2 border-transparent text-purple-600 hover:bg-white/80 hover:border-pink-200 hover:text-pink-500 font-bold hover:translate-x-1'
                                                }
                                            `}
                                        >
                                            <div className={`w-2 h-2 rounded-full transition-colors shadow-sm ${selectedCategory === cat.key ? 'bg-pink-500 animate-pulse' : (cat.color ? cat.color.replace('text-', 'bg-') : 'bg-purple-300')}`}></div>
                                            <span className="truncate">{cat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {treeData.length === 0 && (
                    <div className="text-center py-6 text-sm font-bold text-purple-400 bg-white/50 rounded-2xl border-2 border-dashed border-purple-200">
                        ยังไม่มีกลุ่มทรัพย์สิน 🥺<br/> <span className="text-xs text-pink-400 mt-1 block">(ไปที่ Admin ▶ Master Data)</span>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AssetTreeSidebar;
