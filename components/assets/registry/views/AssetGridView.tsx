
import React from 'react';
import { PresentationAsset } from '../../../../types/assets-ui';
import { Layers, Box, Check, Copy } from 'lucide-react';

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
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => {
                // STACK CARD
                if (asset.isStack) {
                    return (
                        <div 
                            key={asset.id} 
                            onClick={() => onExpandStack(asset.name)}
                            className="relative group cursor-pointer"
                        >
                            {/* Stack Effect Layers */}
                            <div className="absolute top-0 left-2 right-2 bottom-2 bg-indigo-100 rounded-2xl transform translate-y-2 scale-[0.95] z-0 border border-indigo-200"></div>
                            <div className="absolute top-0 left-1 right-1 bottom-1 bg-white rounded-2xl transform translate-y-1 scale-[0.98] z-0 border border-gray-200 shadow-sm"></div>
                            
                            {/* Main Card */}
                            <div className="bg-gradient-to-br from-white to-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-200 shadow-md relative z-10 hover:-translate-y-1 transition-transform flex flex-col items-center justify-center gap-3 h-full min-h-[220px]">
                                
                                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white z-20">
                                    x{asset.stackCount}
                                </div>

                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-inner border border-indigo-100 text-indigo-400">
                                    <Layers className="w-10 h-10" />
                                </div>
                                
                                <div className="text-center">
                                    <h4 className="font-black text-indigo-900 text-lg leading-tight line-clamp-2">
                                        {asset.name}
                                    </h4>
                                    <p className="text-xs text-indigo-500 font-bold mt-1 uppercase tracking-wide">Group Bundle</p>
                                </div>
                                
                                <button 
                                    className="mt-2 text-xs font-bold text-indigo-600 bg-white border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onExpandStack(asset.name);
                                    }}
                                >
                                    View Items
                                </button>
                            </div>
                        </div>
                    )
                }
                
                const isSelected = selectedIds.includes(asset.id);

                // NORMAL CARD
                return (
                    <div 
                        key={asset.id} 
                        // Smart Click: Toggle selection if in mode, else edit
                        onClick={() => isSelectionMode ? onToggleSelection(asset.id) : onEdit(asset)} 
                        className={`
                            bg-white p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col gap-3 relative h-full
                            ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md bg-indigo-50/10' : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1'}
                        `}
                    >
                        {/* Selection Circle (Only in Selection Mode) */}
                        {isSelectionMode && (
                            <div className="absolute top-3 right-3 z-20 animate-in zoom-in duration-200">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white/80 border-gray-300'}`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />}
                                </div>
                            </div>
                        )}

                        <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100">
                            {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Box className="w-10 h-10"/></div>}
                            {asset.condition !== 'GOOD' && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-white">
                                    {asset.condition}
                                </div>
                            )}
                            
                            {/* Clone Button Overlay (Only when NOT selecting) */}
                            {!isSelectionMode && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onClone(e, asset); }}
                                    className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur text-indigo-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                                    title="Clone"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm truncate" title={asset.name}>{asset.name}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {(asset.tags || []).slice(0, 2).map((t: string, i: number) => (
                                    <span key={i} className="text-[8px] bg-pink-50 text-pink-600 px-1.5 rounded border border-pink-100 truncate max-w-[60px]">#{t}</span>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                <span className="text-[10px] text-gray-400">{asset.assetGroup?.substring(0,3)}</span>
                                <span className="text-xs font-bold text-indigo-600">฿{asset.purchasePrice?.toLocaleString() || '-'}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AssetGridView;
