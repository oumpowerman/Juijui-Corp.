
import React, { useRef, useMemo, useState } from 'react';
import { Search, Hash, Check, Upload, Download, Loader2, AlertTriangle, List, LayoutGrid, Plus, ChevronLeft, CheckSquare, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

interface AssetHeaderControlsProps {
    search: string;
    setSearch: (val: string) => void;
    filterTag: string;
    setFilterTag: (val: string) => void;
    allTags: string[];
    showIncompleteOnly: boolean;
    setShowIncompleteOnly: (val: boolean) => void;
    viewMode: 'GRID' | 'LIST';
    setViewMode: (val: 'GRID' | 'LIST') => void;
    expandedStack: string | null;
    setExpandedStack: (val: string | null) => void;
    onImport: (items: any[]) => Promise<boolean>;
    onCreate: () => void;
    isSelectionMode: boolean; 
    setIsSelectionMode: (val: boolean) => void; 
}

const AssetHeaderControls: React.FC<AssetHeaderControlsProps> = ({
    search, setSearch,
    filterTag, setFilterTag, allTags,
    showIncompleteOnly, setShowIncompleteOnly,
    viewMode, setViewMode,
    expandedStack, setExpandedStack,
    onImport, onCreate,
    isSelectionMode, setIsSelectionMode
}) => {
    const { showToast } = useToast();
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false);
    const [tempTagInput, setTempTagInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tag Suggestions
    const tagSuggestions = useMemo(() => {
        if (!tempTagInput) return allTags.slice(0, 5);
        return allTags.filter(t => t.toLowerCase().includes(tempTagInput.toLowerCase())).slice(0, 5);
    }, [allTags, tempTagInput]);

    const handleSetTagFilter = (val?: string) => {
        setFilterTag(val || tempTagInput.trim());
        setIsTagFilterOpen(false);
        setTempTagInput('');
    };

    // CSV Parsing
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
                    await onImport(itemsToImport);
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

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-gray-200 shadow-sm sticky top-2 z-30 transition-all duration-300">
            
            {/* Search & Tag Filter */}
            <div className="relative flex-1 w-full flex items-center gap-2">
                {expandedStack && (
                    <button 
                        onClick={() => setExpandedStack(null)}
                        className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center gap-1 font-bold text-xs whitespace-nowrap"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                )}
                
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={expandedStack ? `ค้นหาในกลุ่ม ${expandedStack}...` : "ค้นหาชื่อ, S/N, กลุ่ม..."}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                
                {/* Tag Filter Button */}
                {!expandedStack && (
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
                )}
            </div>

            {/* Import / Export / Create */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Import Group */}
                {!expandedStack && (
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
                )}

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
                
                {/* Selection Mode Toggle with Animation */}
                 <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`
                        px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95
                        ${isSelectionMode 
                            ? 'bg-red-50 border-red-200 text-red-600 ring-2 ring-red-100 ring-offset-1' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'}
                    `}
                    title="เลือกรายการ (Selection Mode)"
                >
                    {isSelectionMode ? (
                        <>
                            <X className="w-4 h-4" /> Cancel
                        </>
                    ) : (
                        <>
                            <CheckSquare className="w-4 h-4" /> Select
                        </>
                    )}
                </button>

                <button 
                    onClick={onCreate}
                    className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> เพิ่มของใหม่
                </button>
            </div>
        </div>
    );
};

export default AssetHeaderControls;
