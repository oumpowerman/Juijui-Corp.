
import React, { useState, useEffect } from 'react';
import { User, MasterOption, AssetGroup, InventoryItem } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import MentorTip from '../MentorTip';
import { Box, Plus, Search, Filter, LayoutGrid, List, ChevronLeft, ChevronRight, Loader2, Copy, MoreHorizontal, AlertCircle, AlertTriangle } from 'lucide-react';
import AssetFormModal from './AssetFormModal';
import AssetDashboardStats from './AssetDashboardStats';
import AssetTreeSidebar from './AssetTreeSidebar';
import AssetCloneModal from './AssetCloneModal';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface AssetRegistryViewProps {
    users: User[];
    masterOptions: MasterOption[];
}

const ITEMS_PER_PAGE = 20;

const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({ users, masterOptions }) => {
    const { assets, totalCount, stats, saveAsset, deleteAsset, cloneAsset, fetchAssets, isLoading } = useAssets();
    const { showConfirm } = useGlobalDialog();
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);
    const [cloningAsset, setCloningAsset] = useState<InventoryItem | null>(null);
    
    // Filter & View States
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState<AssetGroup | 'ALL'>('ALL');
    const [filterCategory, setFilterCategory] = useState<string | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Sync Data
    useEffect(() => {
        fetchAssets({
            page: currentPage,
            pageSize: ITEMS_PER_PAGE,
            search,
            group: filterGroup,
            categoryId: filterCategory,
            showIncomplete: showIncompleteOnly
        });
    }, [currentPage, search, filterGroup, filterCategory, showIncompleteOnly, fetchAssets]);

    const handleTreeSelect = (group: AssetGroup | 'ALL', category: string | 'ALL') => {
        setFilterGroup(group);
        setFilterCategory(category);
        setCurrentPage(1);
    };

    const handleEdit = (asset: any) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingAsset(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('คุณต้องการลบรายการทรัพย์สินนี้ใช่หรือไม่?', 'ยืนยันการลบ');
        if (confirmed) {
            const success = await deleteAsset(id);
            if (success) {
                // Refresh list if needed (though realtime might handle it, explicitly refreshing is safer)
                fetchAssets({
                    page: currentPage,
                    pageSize: ITEMS_PER_PAGE,
                    search,
                    group: filterGroup,
                    categoryId: filterCategory,
                    showIncomplete: showIncompleteOnly
                });
                setIsModalOpen(false);
            }
        }
    };

    const handleCloneClick = (e: React.MouseEvent, asset: InventoryItem) => {
        e.stopPropagation();
        setCloningAsset(asset);
        setIsCloneModalOpen(true);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "ใหม่! มุมมองแบบ Folder Tree ด้านซ้าย ช่วยให้หาของง่ายขึ้นเยอะเลย",
                "Tip: ใช้ปุ่ม Clone เพื่อก๊อปปี้รายการทรัพย์สินที่เหมือนกัน (เช่น เก้าอี้ 10 ตัว)",
                "อย่าลืมเช็คกราฟสุขภาพทรัพย์สินด้านบน เพื่อดูว่ามีของเสียเยอะแค่ไหนนะครับ"
            ]} />

            {/* Top Stats */}
            <AssetDashboardStats stats={stats} />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* LEFT: Tree Sidebar */}
                <AssetTreeSidebar 
                    masterOptions={masterOptions}
                    selectedGroup={filterGroup}
                    selectedCategory={filterCategory}
                    onSelect={handleTreeSelect}
                />

                {/* RIGHT: Main Content */}
                <div className="flex-1 min-w-0 w-full space-y-6">
                    
                    {/* Header Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-gray-200 shadow-sm sticky top-2 z-30">
                        
                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ, S/N..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button 
                                onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${showIncompleteOnly ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                title="แสดงเฉพาะที่ข้อมูลไม่ครบ"
                            >
                                <AlertTriangle className="w-4 h-4" /> <span className="hidden md:inline">Fix Data</span>
                            </button>

                            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0 border border-gray-200">
                                <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}><List className="w-4 h-4"/></button>
                                <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4"/></button>
                            </div>

                            <button 
                                onClick={handleCreate}
                                className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> เพิ่มของใหม่
                            </button>
                        </div>
                    </div>

                    {/* Filter Context Badge */}
                    {(filterGroup !== 'ALL' || filterCategory !== 'ALL') && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-fit">
                            <Filter className="w-3 h-3" />
                            <span>Filtering by:</span>
                            {filterGroup !== 'ALL' && <span className="font-bold bg-white px-2 py-0.5 rounded border">{filterGroup}</span>}
                            {filterCategory !== 'ALL' && <span className="font-bold bg-white px-2 py-0.5 rounded border">{masterOptions.find(o => o.key === filterCategory)?.label || filterCategory}</span>}
                            <button onClick={() => handleTreeSelect('ALL', 'ALL')} className="ml-2 text-indigo-600 hover:underline">Clear</button>
                        </div>
                    )}

                    {/* Loading & Content */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-100">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                            <p className="font-bold text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : totalCount === 0 ? (
                        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <Box className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">ไม่พบทรัพย์สินในหมวดนี้</p>
                            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {viewMode === 'LIST' ? (
                                <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-bold uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Asset Name</th>
                                                <th className="px-6 py-4 text-center hidden md:table-cell">Group</th>
                                                <th className="px-6 py-4 text-right hidden sm:table-cell">Value</th>
                                                <th className="px-6 py-4 text-center">Condition</th>
                                                <th className="px-6 py-4 hidden lg:table-cell">Holder</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-sm">
                                            {assets.map(asset => {
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
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-mono">{asset.serialNumber || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center hidden md:table-cell">
                                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">{asset.assetGroup}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-600 hidden sm:table-cell">
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
                                                        <td className="px-6 py-4 hidden lg:table-cell">
                                                            {asset.holder ? (
                                                                <div className="flex items-center gap-2">
                                                                    <img src={asset.holder.avatarUrl} className="w-6 h-6 rounded-full border border-white shadow-sm" />
                                                                    <span className="text-xs text-gray-600">{asset.holder.name}</span>
                                                                </div>
                                                            ) : <span className="text-gray-300 text-xs">-</span>}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                             <button 
                                                                onClick={(e) => handleCloneClick(e, asset)}
                                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                title="Clone Asset"
                                                             >
                                                                <Copy className="w-4 h-4" />
                                                             </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {assets.map(asset => (
                                        <div key={asset.id} onClick={() => handleEdit(asset)} className="bg-white p-3 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col gap-3 relative">
                                            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100">
                                                {asset.imageUrl ? <img src={asset.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Box className="w-10 h-10"/></div>}
                                                {asset.condition !== 'GOOD' && (
                                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-white">
                                                        {asset.condition}
                                                    </div>
                                                )}
                                                
                                                {/* Clone Button Overlay */}
                                                <button 
                                                    onClick={(e) => handleCloneClick(e, asset)}
                                                    className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur text-indigo-600 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-600 hover:text-white"
                                                    title="Clone"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm truncate" title={asset.name}>{asset.name}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-gray-400">{asset.assetGroup?.substring(0,3)}</span>
                                                    <span className="text-xs font-bold text-indigo-600">฿{asset.purchasePrice?.toLocaleString() || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination Footer */}
                            <div className="flex flex-col md:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-200 gap-4 shadow-sm sticky bottom-0">
                                <div className="text-sm font-bold text-gray-500">
                                    Showing <span className="text-indigo-600">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-indigo-600">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="text-gray-900">{totalCount}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1 || isLoading}
                                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            // Sliding window for page numbers
                                            let pageNum = i + 1;
                                            if (totalPages > 5) {
                                                if (currentPage > 3) {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                if (pageNum > totalPages) {
                                                    pageNum = totalPages - (4 - i);
                                                }
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-all border ${currentPage === pageNum ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AssetFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingAsset}
                onSave={saveAsset}
                onDelete={handleDelete} // Pass delete handler
                masterOptions={masterOptions}
                users={users}
            />

            {cloningAsset && (
                <AssetCloneModal 
                    isOpen={isCloneModalOpen}
                    onClose={() => setIsCloneModalOpen(false)}
                    asset={cloningAsset}
                    onClone={cloneAsset}
                />
            )}
        </div>
    );
};

export default AssetRegistryView;
