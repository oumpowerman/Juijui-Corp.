
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
            <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white p-3 rounded-3xl shadow-xl shadow-pink-200/50 border-2 border-white/50 flex items-center justify-between mx-1 backdrop-blur-md animate-float-cute">
                <div className="flex items-center gap-3">
                    <div className="bg-white text-pink-600 px-4 py-2 rounded-2xl text-sm font-black shadow-inner flex items-center gap-2 animate-in zoom-in duration-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping"></span>
                        เลือกแล้ว {selectedCount} ชิ้น
                    </div>
                    <span className="text-xs font-bold text-pink-50 hidden sm:inline tracking-wide">กำลังจัดการรายการ...</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onGroup} 
                        className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-black flex items-center transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border-2 border-white/30 shadow-sm cute-3d-button"
                        title="รวมเป็นกองเดียว (Stack)"
                    >
                        <Layers className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">จัดกลุ่ม</span>
                    </button>
                    
                    <button 
                        onClick={onUngroup} 
                        className="px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-black flex items-center transition-all hover:scale-105 active:scale-95 backdrop-blur-sm border-2 border-white/30 shadow-sm cute-3d-button"
                        title="แยกออกจากกัน"
                    >
                        <Box className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">แยกกลุ่ม</span>
                    </button>
                    
                    <div className="h-8 w-1 rounded-full bg-white/30 mx-2"></div>

                    <button 
                        onClick={onClear} 
                        className="p-2.5 bg-white/10 hover:bg-red-400/80 rounded-2xl transition-all hover:rotate-90 active:scale-90 border-2 border-transparent hover:border-white/50 cute-3d-button"
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
