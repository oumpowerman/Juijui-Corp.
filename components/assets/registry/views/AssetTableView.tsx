
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
        <div className="bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm transition-all duration-500">
            <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-100 text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                        {/* 1. Checkbox (Dynamic Width) */}
                        <th className={`py-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSelectionMode ? 'w-14 px-4 opacity-100' : 'w-0 px-0 opacity-0 overflow-hidden'}`}>
                            <div className="w-6 overflow-hidden">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer border-2 border-gray-300 hover:border-indigo-400 transition-colors" 
                                    onChange={onSelectAll} 
                                    checked={assets.length > 0 && selectedIds.length === assets.filter(a => !a.isStack).length} 
                                />
                            </div>
                        </th>
                        
                        {/* 2. Name (Main) */}
                        <th className="px-6 py-4 w-[30%] text-indigo-900">
                            <div className="flex items-center gap-1.5"><Package className="w-4 h-4 text-indigo-500" /> 📦 ไอเทมตัวตึง (Item)</div>
                        </th>

                        {/* 3. Group */}
                        <th className="px-6 py-4 w-[12%] text-center hidden md:table-cell text-pink-900">
                            <div className="flex items-center justify-center gap-1.5"><Layers className="w-4 h-4 text-pink-500" /> 📂 แก๊งไหน</div>
                        </th>

                        {/* 4. Tags */}
                        <th className="px-6 py-4 w-[15%] text-left hidden lg:table-cell text-blue-900">
                             <div className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-blue-500" /> 🏷️ แปะป้าย</div>
                        </th>

                        {/* 5. Value */}
                        <th className="px-6 py-4 w-[12%] text-right hidden sm:table-cell text-emerald-900">
                             <div className="flex items-center justify-end gap-1.5"><DollarSign className="w-4 h-4 text-emerald-500" /> 💎 ค่าตัว</div>
                        </th>

                        {/* 6. Condition */}
                        <th className="px-6 py-4 w-[12%] text-center text-orange-900">
                             <div className="flex items-center justify-center gap-1.5"><HeartPulse className="w-4 h-4 text-orange-500" /> 🩺 สภาพน้อง</div>
                        </th>

                        {/* 7. Holder */}
                        <th className="px-6 py-4 w-[15%] hidden lg:table-cell text-purple-900">
                             <div className="flex items-center gap-1.5"><User className="w-4 h-4 text-purple-500" /> 🏠 อยู่ที่ใคร</div>
                        </th>

                        {/* 8. Actions */}
                        <th className="px-6 py-4 w-[10%] text-right text-slate-500">
                            ⚡️
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                    {assets.map((asset) => {
                        // Handle Stack Item Logic
                        if (asset.isStack) {
                            return (
                                <tr 
                                    key={asset.id} 
                                    onClick={() => onExpandStack(asset.name)}
                                    className="bg-indigo-50/20 hover:bg-indigo-50 cursor-pointer transition-colors group border-b-2 border-indigo-50/50"
                                >
                                     {/* 1. Checkbox Placeholder (Matches Header 1) */}
                                     <td className={`py-4 transition-all duration-500 ${isSelectionMode ? 'w-14 px-4' : 'w-0 px-0 overflow-hidden'}`}></td>
                                    
                                    {/* 2. Name Column (Merged Content Here) */}
                                    <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border-2 border-indigo-100 text-indigo-600 shadow-sm relative group-hover:scale-110 transition-transform">
                                                <Layers className="w-5 h-5" />
                                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                    {asset.stackCount}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-black text-indigo-900 flex items-center gap-2 text-base">
                                                    {asset.name}
                                                </p>
                                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">Stacked Bundle</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 3-8. Span remaining columns */}
                                    <td colSpan={6} className="text-right px-6 align-middle">
                                         <div className="inline-flex items-center justify-end text-indigo-500 gap-1 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-full group-hover:bg-indigo-100 transition-colors">
                                             เปิดดูในกอง <ChevronRight className="w-4 h-4" />
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
                                    cursor-pointer transition-all duration-200 group relative
                                    ${isSelected ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}
                                `}
                                style={{
                                    // Use box-shadow for selection indicator instead of a separate td
                                    boxShadow: isSelected ? 'inset 4px 0 0 0 #6366f1' : 'none' 
                                }}
                            >
                                {/* 1. Checkbox Column */}
                                <td className={`py-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSelectionMode ? 'w-14 px-4 opacity-100' : 'w-0 px-0 opacity-0 overflow-hidden'}`} onClick={e => e.stopPropagation()}>
                                    <div className="w-6 overflow-hidden flex justify-center">
                                        <input 
                                            type="checkbox" 
                                            className={`w-5 h-5 rounded-md accent-indigo-600 cursor-pointer transition-transform ${isSelected ? 'scale-110' : 'scale-100'}`}
                                            checked={isSelected}
                                            onChange={() => onToggleSelection(asset.id)}
                                        />
                                    </div>
                                </td>

                                {/* 2. Name */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-100 relative shadow-sm group-hover:shadow-md transition-shadow">
                                            {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover" /> : <Box className="w-5 h-5 text-gray-300" />}
                                            {isMissingInfo && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white"></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`font-bold text-sm transition-colors ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                                                {asset.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-mono tracking-wide truncate">{asset.serialNumber || '-'}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* 3. Group */}
                                <td className="px-6 py-4 text-center hidden md:table-cell">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold border border-slate-200 uppercase tracking-tight">
                                        {asset.assetGroup}
                                    </span>
                                </td>

                                {/* 4. Tags */}
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex flex-wrap gap-1.5">
                                        {asset.tags?.slice(0, 2).map((t: string, i: number) => (
                                            <span key={i} className="text-[9px] bg-white text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 font-medium shadow-sm">
                                                #{t}
                                            </span>
                                        ))}
                                        {(asset.tags?.length || 0) > 2 && <span className="text-[9px] text-gray-400 font-medium">+{asset.tags!.length - 2}</span>}
                                    </div>
                                </td>

                                {/* 5. Value */}
                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-600 hidden sm:table-cell">
                                    {asset.purchasePrice ? `฿${asset.purchasePrice.toLocaleString()}` : '-'}
                                </td>

                                {/* 6. Condition */}
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                        asset.condition === 'GOOD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        asset.condition === 'DAMAGED' ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-orange-50 text-orange-600 border-orange-100'
                                    }`}>
                                        {asset.condition}
                                    </span>
                                </td>

                                {/* 7. Holder */}
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    {asset.holder ? (
                                        <div className="flex items-center gap-2">
                                            <img src={asset.holder.avatarUrl} className="w-6 h-6 rounded-full border border-white shadow-sm object-cover" />
                                            <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">{asset.holder.name.split(' ')[0]}</span>
                                        </div>
                                    ) : <span className="text-gray-300 text-xs">-</span>}
                                </td>

                                {/* 8. Actions */}
                                <td className="px-6 py-4 text-right">
                                    <div className={`transition-all duration-300 ${isSelectionMode ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); onClone(e, asset); }}
                                            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                            title="Clone Asset"
                                         >
                                            <Copy className="w-4 h-4" />
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
