
import React, { useState, useMemo } from 'react';
import { User, MasterOption, AssetGroup } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import MentorTip from '../MentorTip';
import { Box, Plus, Search, Filter, Monitor, LayoutGrid, List, AlertCircle } from 'lucide-react';
import AssetFormModal from './AssetFormModal';
import { format } from 'date-fns';

interface AssetRegistryViewProps {
    users: User[];
    masterOptions: MasterOption[];
}

const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({ users, masterOptions }) => {
    const { assets, stats, saveAsset, isLoading } = useAssets();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);
    
    // Filters
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState<AssetGroup | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false); // NEW FILTER

    // Compute Incomplete Count
    const incompleteCount = useMemo(() => 
        assets.filter(a => !a.purchasePrice || a.purchasePrice === 0 || !a.purchaseDate).length
    , [assets]);

    const filteredAssets = assets.filter(a => {
        const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || (a.serialNumber || '').toLowerCase().includes(search.toLowerCase());
        const matchGroup = filterGroup === 'ALL' || a.assetGroup === filterGroup;
        
        // Filter Incomplete: Check if price is 0 or date is missing
        const isDataMissing = !a.purchasePrice || a.purchasePrice === 0 || !a.purchaseDate;
        const matchIncomplete = showIncompleteOnly ? isDataMissing : true;

        return matchSearch && matchGroup && matchIncomplete;
    });

    const handleEdit = (asset: any) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "ระบบทะเบียนทรัพย์สินใหม่! ช่วยคุมของบริษัทไม่ให้หาย",
                "Tip: ของที่เพิ่มมาจากหน้า 'จัดเป๋า' ข้อมูลอาจจะไม่ครบ ให้กดตัวกรอง '⚠️ ข้อมูลไม่ครบ' เพื่อตามเก็บรายละเอียดนะ",
                "ถ้าของชิ้นไหนเสีย อย่าลืมเปลี่ยนสถานะเป็น 'REPAIR' หรือ 'DAMAGED' นะ"
            ]} />

            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                        <span className="text-4xl mr-2">🏢</span>
                        ทะเบียนทรัพย์สิน (Asset Registry)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">จัดการอุปกรณ์ ทรัพย์สิน และการเบิกจ่าย</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> ลงทะเบียนเพิ่ม
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">มูลค่ารวม (Total Value)</p>
                    <h3 className="text-2xl font-black text-indigo-700 mt-1">฿ {stats.totalValue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">จำนวนชิ้น (Count)</p>
                    <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.count}</h3>
                </div>
                <div 
                    onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                    className={`p-5 rounded-2xl border shadow-sm cursor-pointer transition-all ${showIncompleteOnly ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100' : 'bg-white border-gray-100 hover:border-orange-200'}`}
                >
                    <p className="text-xs text-gray-400 font-bold uppercase flex items-center gap-1">
                         <AlertCircle className="w-3 h-3 text-orange-500" /> ข้อมูลไม่ครบ
                    </p>
                    <h3 className="text-2xl font-black text-orange-600 mt-1">{incompleteCount}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-400 font-bold uppercase">ประกันใกล้หมด (30 วัน)</p>
                    <h3 className={`text-2xl font-black mt-1 ${stats.warrantyAlert > 0 ? 'text-orange-500' : 'text-gray-400'}`}>{stats.warrantyAlert}</h3>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ, S/N..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {(['ALL', 'PRODUCTION', 'OFFICE', 'IT'] as const).map(g => (
                        <button
                            key={g}
                            onClick={() => setFilterGroup(g)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${filterGroup === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {g === 'ALL' ? 'ทั้งหมด' : g}
                        </button>
                    ))}
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                    <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}><List className="w-4 h-4"/></button>
                    <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4"/></button>
                </div>
            </div>

            {/* Content List */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-400">Loading Assets...</div>
            ) : filteredAssets.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-bold">ไม่พบทรัพย์สิน</p>
                </div>
            ) : viewMode === 'LIST' ? (
                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">Asset Name</th>
                                <th className="px-6 py-4 text-center">Group</th>
                                <th className="px-6 py-4 text-right">Value</th>
                                <th className="px-6 py-4 text-center">Condition</th>
                                <th className="px-6 py-4">Holder</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredAssets.map(asset => {
                                const isMissingInfo = !asset.purchasePrice || asset.purchasePrice === 0 || !asset.purchaseDate;
                                return (
                                    <tr key={asset.id} onClick={() => handleEdit(asset)} className="hover:bg-indigo-50/30 cursor-pointer transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 relative">
                                                    {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover" /> : <Box className="w-5 h-5 text-gray-400" />}
                                                    {isMissingInfo && <div className="absolute top-0 right-0 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 flex items-center gap-2">
                                                        {asset.name}
                                                        {isMissingInfo && <span className="text-[9px] text-orange-600 bg-orange-50 px-1.5 rounded border border-orange-100 font-bold">Need Info</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-mono">{asset.serialNumber || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{asset.assetGroup}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-600">
                                            {asset.purchasePrice ? asset.purchasePrice.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                asset.condition === 'GOOD' ? 'bg-green-100 text-green-700' :
                                                asset.condition === 'DAMAGED' ? 'bg-red-100 text-red-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {asset.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {asset.holder ? (
                                                <div className="flex items-center gap-2">
                                                    <img src={asset.holder.avatarUrl} className="w-6 h-6 rounded-full" />
                                                    <span className="text-xs text-gray-600">{asset.holder.name}</span>
                                                </div>
                                            ) : <span className="text-gray-300 text-xs">-</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredAssets.map(asset => {
                        const isMissingInfo = !asset.purchasePrice || asset.purchasePrice === 0 || !asset.purchaseDate;
                        return (
                            <div key={asset.id} onClick={() => handleEdit(asset)} className="bg-white p-3 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2 relative">
                                {isMissingInfo && (
                                    <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                                        Need Info
                                    </div>
                                )}
                                <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative">
                                    {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Box className="w-8 h-8"/></div>}
                                    {asset.condition !== 'GOOD' && (
                                        <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                                            {asset.condition}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{asset.name}</h4>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{asset.assetGroup?.substring(0,3)}</span>
                                        <span className="text-xs font-bold text-indigo-600">฿{asset.purchasePrice?.toLocaleString() || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <AssetFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingAsset}
                onSave={saveAsset}
                masterOptions={masterOptions}
                users={users}
            />
        </div>
    );
};

export default AssetRegistryView;
