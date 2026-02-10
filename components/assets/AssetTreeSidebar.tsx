
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
        <div className="w-full lg:w-64 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px] lg:h-auto shrink-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-700 flex items-center text-sm">
                    <FolderOpen className="w-4 h-4 mr-2 text-indigo-500" /> Asset Browser
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                
                {/* ROOT ALL */}
                <div 
                    onClick={() => onSelect('ALL', 'ALL')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all ${selectedGroup === 'ALL' ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-xs">ทรัพย์สินทั้งหมด (All)</span>
                </div>

                <div className="h-px bg-gray-100 my-2 mx-2"></div>

                {/* DYNAMIC GROUPS */}
                {treeData.map(group => {
                    const isGroupExpanded = expandedNodes[group.key];
                    // Logic check: Is this group currently selected?
                    const isGroupSelected = selectedGroup === group.key;
                    
                    return (
                        <div key={group.key}>
                            <div 
                                className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all group ${isGroupSelected && selectedCategory === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => {
                                    onSelect(group.key as AssetGroup, 'ALL');
                                    toggleNode(group.key);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {/* Default Box icon, can add logic to map specific icons later based on key */}
                                    <Box className={`w-4 h-4 ${isGroupSelected ? 'text-indigo-500' : 'text-gray-400'}`} />
                                    <span className="text-xs truncate max-w-[120px]" title={group.label}>{group.label}</span>
                                </div>
                                <div onClick={(e) => { e.stopPropagation(); toggleNode(group.key); }} className="p-1 rounded hover:bg-gray-200/50">
                                    {isGroupExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                </div>
                            </div>

                            {/* Children Categories */}
                            {isGroupExpanded && group.children.length > 0 && (
                                <div className="ml-4 pl-3 border-l border-gray-100 space-y-0.5 mt-1 relative animate-in slide-in-from-left-1 duration-200">
                                    {group.children.map(cat => (
                                        <div 
                                            key={`${group.key}-${cat.key}`}
                                            onClick={() => onSelect(group.key as AssetGroup, cat.key)}
                                            className={`
                                                flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-xs
                                                ${selectedCategory === cat.key && selectedGroup === group.key
                                                    ? 'bg-white border border-indigo-100 text-indigo-600 font-bold shadow-sm' 
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'}
                                            `}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${cat.color ? cat.color.replace('text-', 'bg-') : 'bg-gray-300'}`}></div>
                                            <span className="truncate">{cat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {treeData.length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-400">
                        ยังไม่มีกลุ่มทรัพย์สิน <br/> (ไปที่ Admin ▶ Master Data)
                    </div>
                )}

            </div>
        </div>
    );
};

export default AssetTreeSidebar;
