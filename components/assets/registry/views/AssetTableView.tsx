
import React from 'react';
import { PresentationAsset } from '../../../../types/assets-ui';
import { Layers, ChevronRight, Box, Copy, Package, Tag, DollarSign, HeartPulse, User } from 'lucide-react';

interface AssetTableViewProps {
    assets: PresentationAsset[];
    selectedIds: string[];
    onToggleSelection: (id: string) => void;
    onSelectAll: () => void;
    onEdit: (asset: PresentationAsset) => void;
    onClone: (e: React.MouseEvent, asset: PresentationAsset) => void;
    onExpandStack: (label: string) => void;
    isSelectionMode: boolean; // NEW
}

const AssetTableView: React.FC<AssetTableViewProps> = ({ 
    assets, selectedIds, onToggleSelection, onSelectAll, onEdit, onClone, onExpandStack, isSelectionMode 
}) => {
    return (
        <div className="pastel-glass-cute rounded-[2.5rem] overflow-hidden transition-all duration-500">
            <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-white/40 backdrop-blur-md border-b-2 border-pink-100 text-md text-purple-500 font-kanit font-bold uppercase tracking-wider">
                    <tr>
                        {/* 1. Checkbox (Dynamic Width) */}
                        <th className={`py-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSelectionMode ? 'w-14 px-4 opacity-100' : 'w-0 px-0 opacity-0 overflow-hidden'}`}>
                            <div className="w-6 overflow-hidden">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded-lg accent-pink-500 cursor-pointer border-2 border-purple-200 hover:border-pink-400 transition-colors shadow-sm" 
                                    onChange={onSelectAll} 
                                    checked={assets.length > 0 && selectedIds.length === assets.filter(a => !a.isStack).length} 
                                />
                            </div>
                        </th>
                        
                        {/* 2. Name (Main) */}
                        <th className="px-6 py-5 w-[30%] text-purple-800">
                            <div className="flex items-center gap-2"><Package className="w-5 h-5 text-pink-500" /> ไอเทมตัวตึง (Item)</div>
                        </th>

                        {/* 3. Group */}
                        <th className="px-6 py-5 w-[12%] text-center hidden md:table-cell text-pink-800">
                            <div className="flex items-center justify-center gap-2"><Layers className="w-5 h-5 text-purple-500" />แก๊งไหน</div>
                        </th>

                        {/* 4. Tags */}
                        <th className="px-6 py-5 w-[15%] text-left hidden lg:table-cell text-indigo-800">
                             <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-500" />แปะป้าย</div>
                        </th>

                        {/* 5. Value */}
                        <th className="px-6 py-5 w-[12%] text-right hidden sm:table-cell text-emerald-800">
                             <div className="flex items-center justify-end gap-2"><DollarSign className="w-5 h-5 text-emerald-500" />ค่าตัว</div>
                        </th>

                        {/* 6. Condition */}
                        <th className="px-6 py-5 w-[12%] text-center text-orange-800">
                             <div className="flex items-center justify-center gap-2"><HeartPulse className="w-5 h-5 text-orange-500" />สภาพน้อง</div>
                        </th>

                        {/* 7. Holder */}
                        <th className="px-6 py-5 w-[15%] hidden lg:table-cell text-blue-800">
                             <div className="flex items-center gap-2"><User className="w-5 h-5 text-blue-500" />อยู่ที่ใคร</div>
                        </th>

                        {/* 8. Actions */}
                        <th className="px-6 py-5 w-[10%] text-right text-slate-500">
                            ⚡️
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y-2 divide-pink-50/50 text-sm">
                    {assets.map((asset) => {
                        // Handle Stack Item Logic
                        if (asset.isStack) {
                            return (
                                <tr 
                                    key={asset.id} 
                                    onClick={() => onExpandStack(asset.name)}
                                    className="bg-purple-50/30 hover:bg-pink-50/50 cursor-pointer transition-colors group border-b-2 border-purple-100/50 animate-wiggle-hover"
                                >
                                     {/* 1. Checkbox Placeholder (Matches Header 1) */}
                                     <td className={`py-4 transition-all duration-500 ${isSelectionMode ? 'w-14 px-4' : 'w-0 px-0 overflow-hidden'}`}></td>
                                    
                                    {/* 2. Name Column (Merged Content Here) */}
                                    <td className="px-6 py-4">
                                         <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border-2 border-purple-200 text-purple-600 shadow-md relative group-hover:scale-110 group-hover:rotate-3 transition-all">
                                                <Layers className="w-6 h-6" />
                                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                                                    {asset.stackCount}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-purple-900 flex items-center gap-2 text-lg">
                                                    {asset.name}
                                                </p>
                                                <p className="text-xs text-pink-400 font-bold uppercase tracking-wide">Stacked Bundle 📚</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 3-8. Span remaining columns */}
                                    <td colSpan={6} className="text-right px-6 align-middle">
                                         <div className="inline-flex items-center justify-end text-pink-500 gap-1 text-sm font-black bg-pink-100 px-4 py-2 rounded-2xl group-hover:bg-pink-200 transition-colors cute-3d-button">
                                             เปิดดูในกอง <ChevronRight className="w-5 h-5" />
                                         </div>
                                    </td>
                                </tr>
                            )
                        }

                        const isMissingInfo = !asset.purchasePrice || asset.purchasePrice === 0 || !asset.purchaseDate;
                        const isSelected = selectedIds.includes(asset.id);

                        return (
                            <tr 
                                key={asset.id} 
                                onClick={() => isSelectionMode ? onToggleSelection(asset.id) : onEdit(asset)} 
                                className={`
                                    cursor-pointer transition-all duration-300 group relative hover:scale-[1.01]
                                    ${isSelected ? 'bg-pink-50/80' : 'hover:bg-white/60'}
                                `}
                                style={{
                                    // Use box-shadow for selection indicator instead of a separate td
                                    boxShadow: isSelected ? 'inset 6px 0 0 0 #ec4899' : 'none' 
                                }}
                            >
                                {/* 1. Checkbox Column */}
                                <td className={`py-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSelectionMode ? 'w-14 px-4 opacity-100' : 'w-0 px-0 opacity-0 overflow-hidden'}`} onClick={e => e.stopPropagation()}>
                                    <div className="w-6 overflow-hidden flex justify-center">
                                        <input 
                                            type="checkbox" 
                                            className={`w-5 h-5 rounded-lg accent-pink-500 cursor-pointer transition-transform border-2 border-purple-200 ${isSelected ? 'scale-125' : 'scale-100 hover:scale-110'}`}
                                            checked={isSelected}
                                            onChange={() => onToggleSelection(asset.id)}
                                        />
                                    </div>
                                </td>

                                {/* 2. Name */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border-2 border-purple-100 relative shadow-sm group-hover:shadow-md transition-all group-hover:-rotate-3">
                                            {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover" /> : <Box className="w-6 h-6 text-purple-300" />}
                                            {isMissingInfo && <div className="absolute top-0 right-0 w-3 h-3 bg-orange-400 rounded-full border-2 border-white animate-ping"></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-black text-base transition-colors ${isSelected ? 'text-pink-700' : 'text-purple-800'}`}>
                                                {asset.name}
                                            </p>
                                            <p className="text-xs text-purple-400 font-mono tracking-wide truncate">{asset.serialNumber || '-'}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* 3. Group */}
                                <td className="px-6 py-4 text-center hidden md:table-cell">
                                    <span className="text-xs bg-purple-100 text-purple-600 px-3 py-1.5 rounded-xl font-black border-2 border-purple-200 uppercase tracking-tight shadow-sm">
                                        {asset.assetGroup}
                                    </span>
                                </td>

                                {/* 4. Tags */}
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex flex-wrap gap-2">
                                        {asset.tags?.slice(0, 2).map((t: string, i: number) => (
                                            <span key={i} className="text-[10px] bg-white text-indigo-500 px-2.5 py-1 rounded-lg border-2 border-indigo-100 font-bold shadow-sm">
                                                #{t}
                                            </span>
                                        ))}
                                        {(asset.tags?.length || 0) > 2 && <span className="text-[10px] text-indigo-400 font-black bg-indigo-50 px-2 py-1 rounded-lg border-2 border-indigo-100">+{asset.tags!.length - 2}</span>}
                                    </div>
                                </td>

                                {/* 5. Value */}
                                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600 hidden sm:table-cell text-base">
                                    {asset.purchasePrice ? `฿${asset.purchasePrice.toLocaleString()}` : '-'}
                                </td>

                                {/* 6. Condition */}
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border-2 shadow-sm ${
                                        asset.condition === 'GOOD' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                        asset.condition === 'DAMAGED' ? 'bg-red-100 text-red-600 border-red-200' :
                                        'bg-orange-100 text-orange-600 border-orange-200'
                                    }`}>
                                        {asset.condition}
                                    </span>
                                </td>

                                {/* 7. Holder */}
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    {asset.holder ? (
                                        <div className="flex items-center gap-3 bg-white/50 px-3 py-1.5 rounded-2xl border-2 border-blue-100 w-max">
                                            <img src={asset.holder.avatarUrl} className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" />
                                            <span className="text-sm text-blue-700 font-black truncate max-w-[80px]">{asset.holder.name.split(' ')[0]}</span>
                                        </div>
                                    ) : <span className="text-purple-300 text-sm font-bold">-</span>}
                                </td>

                                {/* 8. Actions */}
                                <td className="px-6 py-4 text-right">
                                    <div className={`transition-all duration-300 ${isSelectionMode ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); onClone(e, asset); }}
                                            className="p-2.5 text-purple-300 hover:text-pink-500 hover:bg-pink-100 rounded-2xl transition-all cute-3d-button"
                                            title="Clone Asset"
                                         >
                                            <Copy className="w-5 h-5" />
                                         </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AssetTableView;
