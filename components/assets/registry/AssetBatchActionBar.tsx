
import React from 'react';
import { Layers, Box, X, Trash2, Archive } from 'lucide-react';

interface AssetBatchActionBarProps {
    selectedCount: number;
    onGroup: () => void;
    onUngroup: () => void;
    onClear: () => void;
}

const AssetBatchActionBar: React.FC<AssetBatchActionBarProps> = ({ selectedCount, onGroup, onUngroup, onClear }) => {
    // We don't return null anymore. We control visibility via CSS classes for smooth transition.
    const isActive = selectedCount > 0;

    return (
        <div 
            className={`
                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden
                ${isActive ? 'max-h-24 opacity-100 translate-y-0 mb-4' : 'max-h-0 opacity-0 -translate-y-4 mb-0'}
            `}
        >
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-200 border border-indigo-500 flex items-center justify-between mx-1">
                <div className="flex items-center gap-3">
                    <div className="bg-white text-indigo-700 px-3 py-1 rounded-xl text-sm font-black shadow-sm flex items-center gap-2 animate-in zoom-in duration-300">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        {selectedCount} Selected
                    </div>
                    <span className="text-xs font-medium text-indigo-100 hidden sm:inline">จัดการรายการที่เลือก</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onGroup} 
                        className="px-4 py-2 bg-white/10 hover:bg-white/25 rounded-xl text-xs font-bold flex items-center transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/10"
                        title="รวมเป็นกองเดียว (Stack)"
                    >
                        <Layers className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Group</span>
                    </button>
                    
                    <button 
                        onClick={onUngroup} 
                        className="px-4 py-2 bg-white/10 hover:bg-white/25 rounded-xl text-xs font-bold flex items-center transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/10"
                        title="แยกออกจากกัน"
                    >
                        <Box className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Ungroup</span>
                    </button>
                    
                    <div className="h-6 w-px bg-white/20 mx-1"></div>

                    <button 
                        onClick={onClear} 
                        className="p-2 hover:bg-white/20 rounded-full transition-all hover:rotate-90 active:scale-90"
                        title="ยกเลิกการเลือก"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetBatchActionBar;
