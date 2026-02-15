
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, MasterOption, AssetGroup, InventoryItem, InventoryType } from '../../types';
import { useAssets } from '../../hooks/useAssets';
import MentorTip from '../MentorTip';
import { Box, Plus, Search, Filter, LayoutGrid, List, ChevronLeft, ChevronRight, Loader2, Copy, AlertTriangle, Upload, Download, Hash, Check, Monitor, Package } from 'lucide-react';
import AssetFormModal from './AssetFormModal';
import AssetDashboardStats from './AssetDashboardStats';
import AssetTreeSidebar from './AssetTreeSidebar';
import AssetCloneModal from './AssetCloneModal';
import ConsumableCard from './ConsumableCard'; // NEW
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useToast } from '../../context/ToastContext';

interface AssetRegistryViewProps {
    users: User[];
    masterOptions: MasterOption[];
}

const ITEMS_PER_PAGE = 20;

const AssetRegistryView: React.FC<AssetRegistryViewProps> = ({ users, masterOptions }) => {
    const { assets, totalCount, stats, saveAsset, deleteAsset, cloneAsset, importAssets, fetchAssets, isLoading, allTags, updateStock } = useAssets();
    const { showConfirm } = useGlobalDialog();
    const { showToast } = useToast();
    
    // Tab State
    const [activeTab, setActiveTab] = useState<InventoryType>('FIXED');

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
    
    // Tag Filter
    const [filterTag, setFilterTag] = useState('');
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
    const [tempTagInput, setTempTagInput] = useState('');

    // Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Sync Data
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAssets({
                page: currentPage,
                pageSize: ITEMS_PER_PAGE,
                search,
                group: filterGroup,
                categoryId: filterCategory,
                showIncomplete: showIncompleteOnly,
                tag: filterTag || undefined,
                itemType: activeTab // Filter by Tab
            });
        }, 300); // Debounce
        
        return () => clearTimeout(timer);
    }, [currentPage, search, filterGroup, filterCategory, showIncompleteOnly, filterTag, fetchAssets, activeTab]);

    // Reset filters on tab change
    const handleTabChange = (type: InventoryType) => {
        setActiveTab(type);
        setCurrentPage(1);
        setFilterGroup('ALL');
        setFilterCategory('ALL');
        setSearch('');
    };

    // ... (Keep existing handlers: Tag Suggestions, Tree Select, Edit, Create, Delete, Clone, CSV) ...
    // Handle Tag Search Filter Suggestions
    const tagSuggestions = useMemo(() => {
        if (!tempTagInput) return allTags.slice(0, 5);
        return allTags.filter(t => t.toLowerCase().includes(tempTagInput.toLowerCase())).slice(0, 5);
    }, [allTags, tempTagInput]);

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
                // Refresh list
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
                setIsModalOpen(false);
            }
        }
    };

    const handleCloneClick = (e: React.MouseEvent, asset: InventoryItem) => {
        e.stopPropagation();
        setCloningAsset(asset);
        setIsCloneModalOpen(true);
    };
    
    const handleSetTagFilter = (val?: string) => {
        setFilterTag(val || tempTagInput.trim());
        setIsTagFilterOpen(false);
        setTempTagInput('');
    };

    // CSV Parsing Helper
    const parseCSVLine = (text: string) => {
        const result = [];
        let cell = '';
        let quote = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; } 
            else if (char === '"') { quote = !quote; } 
            else if (char === ',' && !quote) { result.push(cell); cell = ''; } 
            else { cell += char; }
        }
        result.push(cell);
        return result;
    };

    const handleDownloadTemplate = () => {
        const headers = ["Name (ชื่อทรัพย์สิน)", "Description (รายละเอียด)", "Group (กลุ่ม: PRODUCTION/OFFICE/IT)", "Category (หมวดหมู่)"];
        const example1 = [`"กล้อง Sony A7IV"`, `"มีแบต 2 ก้อน"`, `"PRODUCTION"`, `"CAMERA"`];
        const example2 = [`"โต๊ะทำงานขาขาว"`, `"สภาพดี"`, `"OFFICE"`, `"FURNITURE"`];
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
            [headers.join(","), example1.join(","), example2.join(",")].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `asset_import_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split(/\r\n|\n/);
                
                if (rows.length < 2) { 
                    showToast('ไฟล์ไม่มีข้อมูล', 'warning'); 
                    return; 
                }

                const itemsToImport: any[] = [];
                
                // Start from 1 to skip header
                for (let i = 1; i < rows.length; i++) {
                    const rowStr = rows[i].trim();
                    if (!rowStr) continue;
                    
                    const cols = parseCSVLine(rowStr);
                    const name = cols[0]?.trim();
                    const desc = cols[1]?.trim();
                    const group = cols[2]?.trim().toUpperCase();
                    const category = cols[3]?.trim().toUpperCase();

                    if (!name) continue;

                    itemsToImport.push({
                        name: name,
                        description: desc || '',
                        assetGroup: group || 'OFFICE', 
                        categoryId: category || 'GENERAL' 
                    });
                }

                if (itemsToImport.length > 0) {
                    const success = await importAssets(itemsToImport);
                    if (success) {
                        // Refresh with current filters
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
                    }
                } else {
                    showToast('ไม่พบข้อมูลที่ถูกต้องในไฟล์', 'warning');
                }

            } catch (err: any) {
                console.error(err);
                showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="blue" messages={[
                "Tip: ใช้ปุ่ม Import เพื่อนำเข้าข้อมูลจาก Excel/Google Sheet ได้เลย",
                "ใช้ Tag Filter เพื่อหากลุ่มของที่จัดไว้ เช่น #SetVlog, #StudioA",
                "ถ้าไม่ระบุ Group/Category ระบบจะใส่ค่า Default ให้ก่อน ค่อยมาแก้ทีหลังได้ครับ"
            ]} />

            {/* Top Stats */}
            <AssetDashboardStats stats={stats} />
            
            {/* Tab Switcher */}
            <div className="flex justify-center mb-2">
                <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200">
                     <button
                        onClick={() => handleTabChange('FIXED')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'FIXED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                         <Monitor className="w-4 h-4" /> ทรัพย์สินถาวร (Fixed)
                     </button>
                     <button
                        onClick={() => handleTabChange('CONSUMABLE')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'CONSUMABLE' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                         <Package className="w-4 h-4" /> วัสดุสิ้นเปลือง (Supplies)
                     </button>
                </div>
            </div>

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
                        
                        {/* Search & Tag Filter */}
                        <div className="relative flex-1 w-full flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ค้นหาชื่อ, S/N..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                            
                            {/* Tag Filter Button */}
                            <div className="relative">
                                <button 
                                    onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all whitespace-nowrap ${filterTag ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    title="Filter by Tag"
                                >
                                    <Hash className="w-4 h-4" /> {filterTag ? filterTag : 'Tags'}
                                </button>
                                
                                {isTagFilterOpen && (
                                    <div className="absolute top-full right-0 mt-2 bg-white p-3 rounded-xl shadow-xl border border-gray-200 z-50 w-64 animate-in fade-in zoom-in-95">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Filter by Tag</label>
                                        <div className="flex gap-2 mb-2">
                                            <input 
                                                type="text" 
                                                autoFocus
                                                placeholder="Enter tag..."
                                                className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                                                value={tempTagInput}
                                                onChange={e => setTempTagInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSetTagFilter()}
                                            />
                                            <button onClick={() => handleSetTagFilter()} className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        {/* Suggestions */}
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {tagSuggestions.length > 0 ? (
                                                tagSuggestions.map(tag => (
                                                    <button 
                                                        key={tag}
                                                        onClick={() => handleSetTagFilter(tag)}
                                                        className="w-full text-left px-2 py-1.5 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors flex items-center gap-2"
                                                    >
                                                        <Hash className="w-3 h-3 opacity-50" /> {tag}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-gray-300 text-center py-2">ไม่พบ Tag ที่ตรงกัน</p>
                                            )}
                                        </div>

                                        {filterTag && (
                                            <button onClick={() => { setFilterTag(''); setTempTagInput(''); setIsTagFilterOpen(false); }} className="w-full mt-2 text-xs text-red-500 hover:bg-red-50 py-1.5 rounded-lg border border-transparent hover:border-red-100">
                                                Clear Filter
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Import / Export / Create */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Import Group */}
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 hidden sm:flex">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isImporting}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg flex items-center transition-colors disabled:opacity-50 shadow-sm"
                                    title="Import CSV"
                                >
                                    {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/> : <Upload className="w-3.5 h-3.5 mr-1" />} 
                                    Import
                                </button>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <button 
                                    onClick={handleDownloadTemplate}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg flex items-center transition-colors shadow-sm"
                                    title="Download Template"
                                >
                                    <Download className="w-3.5 h-3.5 mr-1" /> Template
                                </button>
                            </div>

                            <button 
                                onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${showIncompleteOnly ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                title="แสดงเฉพาะที่ข้อมูลไม่ครบ"
                            >
                                <AlertTriangle className="w-4 h-4" />
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
                    {(filterGroup !== 'ALL' || filterCategory !== 'ALL' || filterTag) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 w-fit">
                            <Filter className="w-3 h-3" />
                            <span>Filtering by:</span>
                            {filterGroup !== 'ALL' && <span className="font-bold bg-white px-2 py-0.5 rounded border">{filterGroup}</span>}
                            {filterCategory !== 'ALL' && <span className="font-bold bg-white px-2 py-0.5 rounded border">{masterOptions.find(o => o.key === filterCategory)?.label || filterCategory}</span>}
                            {filterTag && <span className="font-bold bg-pink-50 text-pink-600 border-pink-200 px-2 py-0.5 rounded border flex items-center gap-1"><Hash className="w-3 h-3"/> {filterTag}</span>}
                            <button onClick={() => { handleTreeSelect('ALL', 'ALL'); setFilterTag(''); }} className="ml-2 text-indigo-600 hover:underline">Clear</button>
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
                            <p className="text-gray-500 font-bold">ไม่พบทรัพย์สินในเงื่อนไขนี้</p>
                            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* CONSUMABLE GRID VIEW */}
                            {activeTab === 'CONSUMABLE' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {assets.map(asset => (
                                        <ConsumableCard 
                                            key={asset.id}
                                            item={asset}
                                            onUpdateStock={updateStock}
                                            onEdit={handleEdit}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* FIXED ASSET VIEW (List/Grid) */}
                            {activeTab === 'FIXED' && (
                                <>
                                {viewMode === 'LIST' ? (
                                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-bold uppercase">
                                                <tr>
                                                    <th className="px-6 py-4">Asset Name</th>
                                                    <th className="px-6 py-4 text-center hidden md:table-cell">Group</th>
                                                    <th className="px-6 py-4 text-left hidden lg:table-cell">Tags</th>
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
                                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {asset.tags?.slice(0, 3).map((t, i) => (
                                                                        <span key={i} className="text-[9px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded border border-pink-100 font-medium">#{t}</span>
                                                                    ))}
                                                                    {(asset.tags?.length || 0) > 3 && <span className="text-[9px] text-gray-400">+{asset.tags!.length - 3}</span>}
                                                                </div>
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
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(asset.tags || []).slice(0, 2).map((t, i) => (
                                                            <span key={i} className="text-[8px] bg-pink-50 text-pink-600 px-1.5 rounded border border-pink-100 truncate max-w-[60px]">#{t}</span>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                                        <span className="text-[10px] text-gray-400">{asset.assetGroup?.substring(0,3)}</span>
                                                        <span className="text-xs font-bold text-indigo-600">฿{asset.purchasePrice?.toLocaleString() || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                </>
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
                existingTags={allTags} // Pass all tags for suggestions
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
