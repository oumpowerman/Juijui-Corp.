
import React, { useState, useEffect, useCallback } from 'react';
import { User, MasterOption, AssetGroup, InventoryItem, InventoryType } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import { Box, Monitor, Package, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import AssetFormModal from './AssetFormModal';
import AssetDashboardStats from './AssetDashboardStats';
import AssetTreeSidebar from './AssetTreeSidebar';
import AssetCloneModal from './AssetCloneModal';
import ConsumableCard from './ConsumableCard';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useGoogleDriveContext } from '../../context/GoogleDriveContext';
import { PresentationAsset } from '../../types/assets-ui';

// New Modular Components
import AssetHeaderControls from './registry/AssetHeaderControls';
import AssetBatchActionBar from './registry/AssetBatchActionBar';
import AssetTableView from './registry/views/AssetTableView';
import AssetGridView from './registry/views/AssetGridView';
import { useAssetGrouping } from './registry/hooks/useAssetGrouping';
import { useAssetSelection } from './registry/hooks/useAssetSelection';

interface AssetRegistryViewProps {
    users: User[];
    masterOptions: MasterOption[];
}

const ITEMS_PER_PAGE = 20;

const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({ users, masterOptions }) => {
    // Core Hook
    const { 
        assets, totalCount, stats, 
        saveAsset, deleteAsset, cloneAsset, importAssets, fetchAssets, updateStock, 
        batchGroupAssets, batchUngroupAssets,
        isLoading, allTags 
    } = useAssets();
    
    const { showConfirm } = useGlobalDialog();
    const { isReady: isDriveReady, uploadFileToDrive } = useGoogleDriveContext();

    // --- Local State ---
    const [activeTab, setActiveTab] = useState<InventoryType>('FIXED');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Filters
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState<AssetGroup | 'ALL'>('ALL');
    const [filterCategory, setFilterCategory] = useState<string | 'ALL'>('ALL');
    const [filterTag, setFilterTag] = useState('');
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
    
    // View
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
    const [expandedStack, setExpandedStack] = useState<string | null>(null);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);
    const [cloningAsset, setCloningAsset] = useState<InventoryItem | null>(null);

    // --- Data Fetching Wrapper (Instant UI Refresh) ---
    const refreshList = useCallback(() => {
        fetchAssets({
            page: currentPage,
            pageSize: ITEMS_PER_PAGE,
            search,
            group: filterGroup,
            categoryId: filterCategory,
            showIncomplete: showIncompleteOnly,
            tag: filterTag || undefined,
            itemType: activeTab
        });
    }, [currentPage, search, filterGroup, filterCategory, showIncompleteOnly, filterTag, activeTab, fetchAssets]);

    // --- Custom Hooks (Logic Extraction) ---
    // 1. Grouping & Stacking Logic
    const { displayAssets } = useAssetGrouping(assets, expandedStack);

    // 2. Selection Logic (Updated to expose isSelectionMode)
    const { 
        selectedIds, 
        toggleSelection, 
        handleSelectAll, 
        handleBatchGroup, 
        handleBatchUngroup, 
        clearSelection,
        isSelectionMode, // NEW
        setIsSelectionMode // NEW
    } = useAssetSelection({ 
        batchGroupAssets: async (ids, label) => {
            const success = await batchGroupAssets(ids, label);
            if (success) refreshList();
            return success;
        }, 
        batchUngroupAssets: async (ids) => {
            const success = await batchUngroupAssets(ids);
            if (success) refreshList();
            return success;
        }
    });

    // Initial Fetch & Filter Changes
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshList();
        }, 300);
        return () => clearTimeout(timer);
    }, [refreshList]);

    // Handlers
    const handleTabChange = (type: InventoryType) => {
        setActiveTab(type);
        setCurrentPage(1);
        setFilterGroup('ALL');
        setFilterCategory('ALL');
        setSearch('');
        setExpandedStack(null);
        clearSelection();
    };

    const handleTreeSelect = (group: AssetGroup | 'ALL', category: string | 'ALL') => {
        setFilterGroup(group);
        setFilterCategory(category);
        setCurrentPage(1);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm('คุณต้องการลบรายการทรัพย์สินนี้ใช่หรือไม่?', 'ยืนยันการลบ');
        if (confirmed) {
            const success = await deleteAsset(id);
            if (success) {
                refreshList();
                setIsModalOpen(false);
            }
        }
    };
    
    // Wrappers to ensure Refresh is called
    const handleSaveWrapper = async (data: Partial<InventoryItem>, file?: File) => {
        const success = await saveAsset(data, file, { isDriveReady, uploadFileToDrive });
        if (success) refreshList();
        return success;
    };

    const handleImportWrapper = async (items: any[]) => {
        const success = await importAssets(items);
        if (success) refreshList();
        return success;
    };
    
    const handleCloneWrapper = async (asset: InventoryItem, amount: number) => {
        const success = await cloneAsset(asset, amount);
        if (success) refreshList();
        return success;
    };

    // Extract unique groups for form dropdown
    const uniqueGroupLabels = React.useMemo(() => {
        const labels = new Set<string>();
        assets.forEach(a => { if (a.groupLabel) labels.add(a.groupLabel); });
        return Array.from(labels).sort();
    }, [assets]);

    const customStyles = (
        <style>{`
            @keyframes float-cute {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-6px) rotate(1deg); }
                100% { transform: translateY(0px) rotate(0deg); }
            }
            @keyframes wiggle-cute {
                0%, 100% { transform: rotate(-3deg) scale(1.02); }
                50% { transform: rotate(3deg) scale(1.02); }
            }
            @keyframes rainbow-bg {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .pastel-glass-cute {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 12px 32px 0 rgba(255, 182, 193, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.5);
                border-radius: 2rem;
            }
            .cute-3d-button {
                transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 4px 0 0 rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.05);
                border: 2px solid white;
            }
            .cute-3d-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 0 0 rgba(0,0,0,0.08), 0 12px 20px rgba(0,0,0,0.08);
            }
            .cute-3d-button:active {
                transform: translateY(4px);
                box-shadow: 0 0 0 0 rgba(0,0,0,0.08);
            }
            .rainbow-gradient-bg {
                background: linear-gradient(120deg, #ffecd2, #fcb69f, #ffc3a0, #ffafbd, #ffc3a0);
                background-size: 300% 300%;
                animation: rainbow-bg 8s ease infinite;
            }
            .animate-float-cute {
                animation: float-cute 3s ease-in-out infinite;
            }
            .animate-wiggle-hover:hover {
                animation: wiggle-cute 0.4s ease-in-out infinite;
            }
        `}</style>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 rainbow-gradient-bg min-h-screen p-6 rounded-[3rem] shadow-inner relative overflow-hidden">
            {customStyles}
            
            {/* Decorative floating elements */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float-cute" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-40 right-20 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float-cute" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float-cute" style={{ animationDelay: '2s' }}></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-pink-500 animate-pulse" />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">ระบบจัดการทรัพย์สินสุดคิวท์ 💖</h1>
                </div>

                <AssetDashboardStats stats={stats} />

                {/* Tab Switcher */}
                <div className="flex justify-center mb-6 mt-6">
                    <div className="flex p-2 pastel-glass-cute gap-2">
                         <button onClick={() => handleTabChange('FIXED')} className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 cute-3d-button ${activeTab === 'FIXED' ? 'bg-gradient-to-r from-indigo-400 to-purple-400 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}>
                             <Monitor className="w-5 h-5" /> ทรัพย์สินถาวร (Fixed)
                         </button>
                         <button onClick={() => handleTabChange('CONSUMABLE')} className={`px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 cute-3d-button ${activeTab === 'CONSUMABLE' ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}>
                             <Package className="w-5 h-5" /> วัสดุสิ้นเปลือง (Supplies)
                         </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="w-full lg:w-64 shrink-0 pastel-glass-cute p-4 animate-float-cute" style={{ animationDuration: '6s' }}>
                        <AssetTreeSidebar 
                            masterOptions={masterOptions}
                            selectedGroup={filterGroup}
                            selectedCategory={filterCategory}
                            onSelect={handleTreeSelect}
                        />
                    </div>

                    <div className="flex-1 min-w-0 w-full space-y-6 pastel-glass-cute p-6">
                        {/* Header Controls */}
                        <AssetHeaderControls 
                            search={search} setSearch={setSearch}
                            filterTag={filterTag} setFilterTag={setFilterTag} allTags={allTags}
                            showIncompleteOnly={showIncompleteOnly} setShowIncompleteOnly={setShowIncompleteOnly}
                            viewMode={viewMode} setViewMode={setViewMode}
                            expandedStack={expandedStack} setExpandedStack={setExpandedStack}
                            onImport={handleImportWrapper}
                            onCreate={() => { setEditingAsset(null); setIsModalOpen(true); }}
                            isSelectionMode={isSelectionMode} // NEW
                            setIsSelectionMode={setIsSelectionMode} // NEW
                        />

                        {/* Batch Action Bar */}
                        <AssetBatchActionBar 
                            selectedCount={selectedIds.length}
                            onGroup={handleBatchGroup}
                            onUngroup={handleBatchUngroup}
                            onClear={clearSelection}
                        />

                        {/* Loading & Content */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white/50 rounded-3xl border-2 border-dashed border-pink-200">
                                <Loader2 className="w-12 h-12 animate-spin text-pink-400 mb-4" />
                                <p className="font-black text-sm text-pink-500 animate-pulse">กำลังโหลดข้อมูลดุ๊กดิ๊กๆ...</p>
                            </div>
                        ) : displayAssets.length === 0 ? (
                            <div className="text-center py-24 bg-white/50 rounded-3xl border-2 border-dashed border-pink-200 animate-float-cute">
                                <Box className="w-20 h-20 text-pink-300 mx-auto mb-4 animate-wiggle-hover" />
                                <p className="text-pink-500 font-kanit font-medium text-lg">ไม่พบทรัพย์สินในเงื่อนไขนี้เลยงับ 🥺</p>
                                <p className="text-sm text-pink-400 mt-2 font-medium">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่ดูน้า</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Consumable View */}
                                {activeTab === 'CONSUMABLE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {displayAssets.map((asset) => (
                                            <div key={asset.id} className="animate-wiggle-hover">
                                                <ConsumableCard 
                                                    item={asset}
                                                    onUpdateStock={updateStock}
                                                    onEdit={(a) => { setEditingAsset(a); setIsModalOpen(true); }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Fixed Asset View */}
                                {activeTab === 'FIXED' && (
                                    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-2 border-2 border-white shadow-sm">
                                        {viewMode === 'LIST' ? (
                                            <AssetTableView 
                                                assets={displayAssets}
                                                selectedIds={selectedIds}
                                                onToggleSelection={toggleSelection}
                                                onSelectAll={() => handleSelectAll(displayAssets)}
                                                onEdit={(a) => { setEditingAsset(a); setIsModalOpen(true); }}
                                                onClone={(e, a) => { e.stopPropagation(); setCloningAsset(a); setIsCloneModalOpen(true); }}
                                                onExpandStack={setExpandedStack}
                                                isSelectionMode={isSelectionMode} // NEW
                                            />
                                        ) : (
                                            <AssetGridView 
                                                assets={displayAssets}
                                                selectedIds={selectedIds}
                                                onToggleSelection={toggleSelection}
                                                onEdit={(a) => { setEditingAsset(a); setIsModalOpen(true); }}
                                                onClone={(e, a) => { e.stopPropagation(); setCloningAsset(a); setIsCloneModalOpen(true); }}
                                                onExpandStack={setExpandedStack}
                                                isSelectionMode={isSelectionMode} // NEW
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Pagination */}
                                {!expandedStack && (
                                    <div className="flex flex-col md:flex-row items-center justify-between bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-white gap-4 shadow-lg sticky bottom-4 cute-3d-button">
                                        <div className="text-sm font-black text-gray-500">
                                            กำลังแสดง <span className="text-pink-500">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-pink-500">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> จากทั้งหมด <span className="text-purple-600 text-lg">{totalCount}</span> รายการ
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} className="p-2.5 rounded-xl border-2 border-pink-100 bg-white hover:bg-pink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cute-3d-button text-pink-500">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <span className="text-sm font-black bg-gradient-to-r from-pink-100 to-purple-100 text-purple-600 px-4 py-2 rounded-xl border-2 border-white shadow-inner">หน้าที่ {currentPage}</span>
                                            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount/ITEMS_PER_PAGE), p + 1))} disabled={currentPage * ITEMS_PER_PAGE >= totalCount || isLoading} className="p-2.5 rounded-xl border-2 border-pink-100 bg-white hover:bg-pink-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cute-3d-button text-pink-500">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AssetFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingAsset}
                onSave={handleSaveWrapper}
                onDelete={handleDelete}
                masterOptions={masterOptions}
                users={users}
                existingTags={allTags}
                existingGroups={uniqueGroupLabels}
            />

            {cloningAsset && (
                <AssetCloneModal 
                    isOpen={isCloneModalOpen}
                    onClose={() => setIsCloneModalOpen(false)}
                    asset={cloningAsset}
                    onClone={handleCloneWrapper}
                />
            )}
        </div>
    );
};

export default AssetRegistryView;
