
import React, { useState, useEffect } from 'react';
import { PresentationAsset } from '../../../../types/assets-ui';
import { Layers, Box, Check, Copy, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssetGridViewProps {
    assets: PresentationAsset[];
    selectedIds: string[];
    onToggleSelection: (id: string) => void;
    onEdit: (asset: PresentationAsset) => void;
    onClone: (e: React.MouseEvent, asset: PresentationAsset) => void;
    onExpandStack: (label: string) => void;
    isSelectionMode: boolean; // NEW
}

const AssetGridView: React.FC<AssetGridViewProps> = ({
    assets, selectedIds, onToggleSelection, onEdit, onClone, onExpandStack, isSelectionMode
}) => {
    // Persistent Zoom Level
    const [zoomLevel, setZoomLevel] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('asset_grid_zoom');
            return saved ? parseInt(saved) : 3;
        }
        return 3;
    });

    useEffect(() => {
        localStorage.setItem('asset_grid_zoom', zoomLevel.toString());
    }, [zoomLevel]);

    const config = {
        1: { 
            grid: "grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2", 
            card: "p-1.5 rounded-xl gap-1 aspect-square", 
            img: "w-full aspect-square", 
            title: "text-[8px]", 
            hideDetails: true,
            stackBadge: "top-0.5 right-0.5 text-[7px] px-1 py-0",
            stackIcon: "w-full h-full p-2",
            stackIconInner: "w-4 h-4"
        },
        2: { 
            grid: "grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3", 
            card: "p-3 rounded-2xl gap-2 aspect-square", 
            img: "w-full aspect-square", 
            title: "text-[10px]", 
            hideDetails: true,
            stackBadge: "top-1.5 right-1.5 text-[9px] px-1.5 py-0.5",
            stackIcon: "w-full h-full p-4",
            stackIconInner: "w-6 h-6"
        },
        3: { 
            grid: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", 
            card: "p-5 rounded-[2rem] gap-4 aspect-square", 
            img: "w-full aspect-square", 
            title: "text-xl", 
            hideDetails: false,
            stackBadge: "top-4 right-4 text-sm px-3 py-1",
            stackIcon: "w-24 h-24",
            stackIconInner: "w-12 h-12"
        },
        4: { 
            grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8", 
            card: "p-8 rounded-[3rem] gap-6 aspect-square", 
            img: "w-full aspect-square", 
            title: "text-3xl", 
            hideDetails: false,
            stackBadge: "top-6 right-6 text-lg px-5 py-2",
            stackIcon: "w-32 h-32",
            stackIconInner: "w-16 h-16"
        }
    }[zoomLevel as 1|2|3|4];

    return (
        <div className="space-y-6">
            {/* Zoom Slider Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/40 backdrop-blur-md p-4 rounded-3xl border-2 border-white shadow-sm sticky top-0 z-30 gap-4">
                <div className="flex items-center gap-3 text-purple-500 font-black text-xs uppercase tracking-widest">
                    <div className="p-2 bg-purple-100 rounded-xl">
                        <Maximize2 className="w-4 h-4" />
                    </div>
                    <span>Grid Size: <span className="text-pink-500">{['Tiny', 'Compact', 'Normal', 'Large'][zoomLevel-1]}</span></span>
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-64">
                    <ZoomOut className={`w-5 h-5 transition-colors ${zoomLevel === 1 ? 'text-purple-200' : 'text-purple-400'}`} />
                    <div className="relative flex-1 h-8 flex items-center">
                        {/* Custom Slider Track */}
                        <div className="absolute w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                                initial={false}
                                animate={{ width: `${((zoomLevel - 1) / 3) * 100}%` }}
                            />
                        </div>
                        {/* Invisible Input for Interaction */}
                        <input 
                            type="range"
                            min="1"
                            max="4"
                            step="1"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {/* Visual Thumb */}
                        <motion.div 
                            className="absolute w-6 h-6 bg-white border-4 border-pink-500 rounded-full shadow-md pointer-events-none z-0"
                            initial={false}
                            animate={{ left: `calc(${((zoomLevel - 1) / 3) * 100}% - 12px)` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        {/* Tick Marks */}
                        <div className="absolute w-full flex justify-between px-0.5 pointer-events-none">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-1 h-1 rounded-full ${zoomLevel >= i ? 'bg-white/50' : 'bg-purple-300'}`} />
                            ))}
                        </div>
                    </div>
                    <ZoomIn className={`w-5 h-5 transition-colors ${zoomLevel === 4 ? 'text-purple-200' : 'text-purple-400'}`} />
                </div>
            </div>

            <motion.div 
                layout
                className={`grid ${config.grid}`}
            >
                {assets.map((asset) => {
                    // STACK CARD
                    if (asset.isStack) {
                        return (
                            <motion.div 
                                layout
                                key={asset.id} 
                                onClick={() => onExpandStack(asset.name)}
                                className="relative group cursor-pointer animate-float-cute"
                            >
                                {/* Stack Effect Layers */}
                                <div className="absolute top-0 left-2 right-2 bottom-2 bg-pink-200 rounded-[2rem] transform translate-y-3 scale-[0.95] z-0 border-2 border-pink-300 shadow-sm transition-all duration-300 group-hover:translate-y-4"></div>
                                <div className="absolute top-0 left-1 right-1 bottom-1 bg-purple-100 rounded-[2rem] transform translate-y-1.5 scale-[0.98] z-0 border-2 border-purple-200 shadow-sm transition-all duration-300 group-hover:translate-y-2"></div>
                                
                                {/* Main Card */}
                                <div className={`pastel-glass-cute ${config.card} border-2 border-white shadow-md relative z-10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center justify-center group-hover:shadow-xl h-full overflow-hidden`}>
                                    
                                    <div className={`absolute ${config.stackBadge} bg-pink-500 text-white font-black rounded-full shadow-md border-2 border-white z-20 animate-bounce`}>
                                        x{asset.stackCount}
                                    </div>

                                    <div className={`${zoomLevel <= 2 ? 'w-full h-full' : config.stackIcon} bg-white/80 rounded-[1.5rem] flex items-center justify-center shadow-inner border-2 border-purple-100 text-purple-500 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                        <Layers className={config.stackIconInner} />
                                    </div>
                                    
                                    {zoomLevel > 1 && (
                                        <div className="text-center">
                                            <h4 className={`font-black text-purple-900 ${config.title} leading-tight line-clamp-2`}>
                                                {asset.name}
                                            </h4>
                                            {!config.hideDetails && <p className="text-xs text-pink-500 font-bold mt-1.5 uppercase tracking-wide">Group Bundle 📚</p>}
                                        </div>
                                    )}
                                    
                                    {!config.hideDetails && (
                                        <button 
                                            className="mt-2 text-sm font-black text-white bg-pink-400 border-2 border-white px-5 py-2.5 rounded-2xl hover:bg-pink-500 transition-colors shadow-sm cute-3d-button w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onExpandStack(asset.name);
                                            }}
                                        >
                                            เปิดดูในกอง ✨
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )
                    }
                    
                    const isSelected = selectedIds.includes(asset.id);

                    // NORMAL CARD
                    return (
                        <motion.div 
                            layout
                            key={asset.id} 
                            // Smart Click: Toggle selection if in mode, else edit
                            onClick={() => isSelectionMode ? onToggleSelection(asset.id) : onEdit(asset)} 
                            className={`
                                pastel-glass-cute ${config.card} border-2 transition-all duration-300 cursor-pointer group flex flex-col relative h-full
                                ${isSelected ? 'border-pink-400 ring-4 ring-pink-200 shadow-lg bg-pink-50/50 scale-[1.02]' : 'border-white hover:border-purple-300 hover:shadow-xl hover:-translate-y-2'}
                            `}
                        >
                            {/* Selection Circle (Only in Selection Mode) */}
                            {isSelectionMode && (
                                <div className="absolute top-4 right-4 z-20 animate-in zoom-in duration-300">
                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm ${isSelected ? 'bg-pink-500 border-white scale-110 animate-bounce' : 'bg-white/90 border-purple-200 hover:scale-110'}`}>
                                        {isSelected && <Check className="w-5 h-5 text-white stroke-[4px]" />}
                                    </div>
                                </div>
                            )}

                            <div className={`${config.img} bg-white/60 rounded-[1.5rem] overflow-hidden relative border-2 border-purple-100 group-hover:shadow-inner transition-all shrink-0`}>
                                {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-purple-200"><Box className={`${zoomLevel <= 2 ? 'w-6 h-6' : 'w-12 h-12'} group-hover:rotate-12 transition-transform duration-300`}/></div>}
                                {asset.condition !== 'GOOD' && !config.hideDetails && (
                                    <div className={`absolute top-3 left-3 text-white text-[10px] px-3 py-1 rounded-xl font-black shadow-sm border-2 border-white animate-pulse ${asset.condition === 'DAMAGED' ? 'bg-red-400' : 'bg-orange-400'}`}>
                                        {asset.condition}
                                    </div>
                                )}
                                
                                {/* Clone Button Overlay (Only when NOT selecting) */}
                                {!isSelectionMode && !config.hideDetails && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onClone(e, asset); }}
                                        className="absolute bottom-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm text-purple-500 rounded-2xl shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-pink-100 hover:text-pink-600 cute-3d-button translate-y-4 group-hover:translate-y-0"
                                        title="Clone"
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            {zoomLevel > 1 && (
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className={`font-black ${config.title} leading-tight line-clamp-2 transition-colors ${isSelected ? 'text-pink-700' : 'text-purple-900 group-hover:text-pink-600'}`} title={asset.name}>{asset.name}</h4>
                                        {!config.hideDetails && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(asset.tags || []).slice(0, 2).map((t: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-white text-indigo-500 px-2.5 py-1 rounded-lg border-2 border-indigo-100 font-bold shadow-sm truncate max-w-[60px]">#{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {!config.hideDetails && (
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-purple-100/50">
                                            <span className="text-[10px] bg-purple-100 text-purple-600 px-3 py-1.5 rounded-xl font-black border-2 border-purple-200 uppercase tracking-tight shadow-sm">{asset.assetGroup?.substring(0,3)}</span>
                                            <span className={`${zoomLevel === 4 ? 'text-xl' : 'text-sm'} font-black text-emerald-500`}>฿{asset.purchasePrice?.toLocaleString() || '-'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default AssetGridView;
