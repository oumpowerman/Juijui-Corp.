
import React, { useState, useEffect, useCallback } from 'react';
import { User, MasterOption, AssetGroup, InventoryItem, InventoryType } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import MentorTip from '../MentorTip';
import { Box, Monitor, Package, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AssetFormModal from './AssetFormModal';
import AssetDashboardStats from './AssetDashboardStats';
import AssetTreeSidebar from './AssetTreeSidebar';
import AssetCloneModal from './AssetCloneModal';
import ConsumableCard from './ConsumableCard';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
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
        const success = await saveAsset(data, file);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "Tip: ใช้ปุ่ม Import เพื่อนำเข้าข้อมูลจาก Excel/Google Sheet ได้เลย",
                "ใช้ Tag Filter เพื่อหากลุ่มของที่จัดไว้ เช่น #SetVlog, #StudioA",
                "ใหม่! กดปุ่ม 'Select' เพื่อเริ่มเลือกหลายรายการแล้วกด 'รวมกลุ่ม' (Stack) เพื่อจัดระเบียบของที่เหมือนกัน"
            ]} />

            <AssetDashboardStats stats={stats} />

            {/* Tab Switcher */}
            <div className="flex justify-center mb-2">
                <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
                     <button onClick={() => handleTabChange('FIXED')} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'FIXED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                         <Monitor className="w-4 h-4" /> ทรัพย์สินถาวร (Fixed)
                     </button>
                     <button onClick={() => handleTabChange('CONSUMABLE')} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'CONSUMABLE' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                         <Package className="w-4 h-4" /> วัสดุสิ้นเปลือง (Supplies)
                     </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <AssetTreeSidebar 
                    masterOptions={masterOptions}
                    selectedGroup={filterGroup}
                    selectedCategory={filterCategory}
                    onSelect={handleTreeSelect}
                />

                <div className="flex-1 min-w-0 w-full space-y-6">
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
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-100">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                            <p className="font-bold text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : displayAssets.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <Box className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-500 font-bold">ไม่พบทรัพย์สินในเงื่อนไขนี้</p>
                            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Consumable View */}
                            {activeTab === 'CONSUMABLE' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {displayAssets.map((asset) => (
                                        <ConsumableCard 
                                            key={asset.id}
                                            item={asset}
                                            onUpdateStock={updateStock}
                                            onEdit={(a) => { setEditingAsset(a); setIsModalOpen(true); }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Fixed Asset View */}
                            {activeTab === 'FIXED' && (
                                <>
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
                                </>
                            )}

                            {/* Pagination */}
                            {!expandedStack && (
                                <div className="flex flex-col md:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-200 gap-4 shadow-sm sticky bottom-0">
                                    <div className="text-sm font-bold text-gray-500">
                                        Showing <span className="text-indigo-600">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="text-indigo-600">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> of <span className="text-gray-900">{totalCount}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                                        </button>
                                        <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100">Page {currentPage}</span>
                                        <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount/ITEMS_PER_PAGE), p + 1))} disabled={currentPage * ITEMS_PER_PAGE >= totalCount || isLoading} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
