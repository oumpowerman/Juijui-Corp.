
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
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pastel-glass-cute p-3 rounded-3xl sticky top-2 z-30 transition-all duration-300">
            
            {/* Search & Tag Filter */}
            <div className="relative flex-1 w-full flex items-center gap-3">
                {expandedStack && (
                    <button 
                        onClick={() => setExpandedStack(null)}
                        className="p-3 rounded-2xl bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors border-2 border-pink-200 flex items-center gap-1 font-black text-sm whitespace-nowrap cute-3d-button"
                    >
                        <ChevronLeft className="w-5 h-5" /> กลับ
                    </button>
                )}
                
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input 
                        type="text" 
                        placeholder={expandedStack ? `ค้นหาในกลุ่ม ${expandedStack}...` : "ค้นหาชื่อ, S/N, กลุ่ม..."}
                        className="w-full pl-12 pr-4 py-3 bg-white/60 border-2 border-purple-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-purple-200/50 focus:border-purple-300 transition-all placeholder:text-purple-300 text-purple-800 shadow-inner"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                
                {/* Tag Filter Button */}
                {!expandedStack && (
                    <div className="relative">
                        <button 
                            onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                            className={`p-3 rounded-2xl border-2 flex items-center gap-2 text-sm font-black transition-all whitespace-nowrap cute-3d-button ${filterTag ? 'bg-pink-100 border-pink-300 text-pink-600' : 'bg-white/80 border-purple-100 text-purple-500 hover:bg-purple-50 hover:border-purple-200'}`}
                            title="Filter by Tag"
                        >
                            <Hash className="w-5 h-5" /> {filterTag ? filterTag : 'แท็ก'}
                        </button>
                        
                        {isTagFilterOpen && (
                            <div className="absolute top-full right-0 mt-3 pastel-glass-cute p-4 rounded-3xl shadow-2xl border-2 border-pink-100 z-50 w-72 animate-in fade-in zoom-in-95">
                                <label className="text-xs font-black text-pink-400 uppercase mb-3 block">กรองด้วยแท็ก</label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="พิมพ์แท็ก..."
                                        className="flex-1 border-2 border-purple-100 bg-white/80 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all text-purple-800"
                                        value={tempTagInput}
                                        onChange={e => setTempTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSetTagFilter()}
                                    />
                                    <button onClick={() => handleSetTagFilter()} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-2 rounded-xl hover:opacity-90 cute-3d-button">
                                        <Check className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                {/* Suggestions */}
                                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {tagSuggestions.length > 0 ? (
                                        tagSuggestions.map(tag => (
                                            <button 
                                                key={tag}
                                                onClick={() => handleSetTagFilter(tag)}
                                                className="w-full text-left px-3 py-2 text-sm font-bold text-purple-600 hover:bg-pink-100 hover:text-pink-600 rounded-xl transition-colors flex items-center gap-2"
                                            >
                                                <Hash className="w-4 h-4 opacity-50" /> {tag}
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-xs text-purple-300 text-center py-3 font-bold">ไม่พบแท็กที่ตรงกัน 🥺</p>
                                    )}
                                </div>

                                {filterTag && (
                                    <button onClick={() => { setFilterTag(''); setTempTagInput(''); setIsTagFilterOpen(false); }} className="w-full mt-3 text-sm font-bold text-red-500 hover:bg-red-100 py-2 rounded-xl border-2 border-transparent hover:border-red-200 transition-all">
                                        ล้างตัวกรอง
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Import / Export / Create */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Import Group */}
                {!expandedStack && (
                    <div className="flex items-center gap-1 bg-white/50 p-1.5 rounded-2xl border-2 border-purple-100 hidden sm:flex shadow-inner">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="px-3 py-2 text-sm font-black text-purple-500 hover:text-pink-500 hover:bg-white rounded-xl flex items-center transition-all disabled:opacity-50 cute-3d-button"
                            title="นำเข้า CSV"
                        >
                            {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5"/> : <Upload className="w-4 h-4 mr-1.5" />} 
                            นำเข้า
                        </button>
                        <div className="w-0.5 h-6 bg-purple-200 rounded-full mx-1"></div>
                        <button 
                            onClick={handleDownloadTemplate}
                            className="px-3 py-2 text-sm font-black text-purple-400 hover:text-pink-500 hover:bg-white rounded-xl flex items-center transition-all cute-3d-button"
                            title="โหลดเทมเพลต"
                        >
                            <Download className="w-4 h-4 mr-1.5" /> เทมเพลต
                        </button>
                    </div>
                )}

                <button 
                    onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
                    className={`p-3 rounded-2xl border-2 flex items-center gap-2 text-sm font-black transition-all cute-3d-button ${showIncompleteOnly ? 'bg-orange-100 border-orange-300 text-orange-600 animate-pulse' : 'bg-white/80 border-purple-100 text-purple-400 hover:bg-purple-50 hover:text-purple-600'}`}
                    title="แสดงเฉพาะที่ข้อมูลไม่ครบ"
                >
                    <AlertTriangle className="w-5 h-5" />
                </button>

                <div className="flex bg-purple-100/50 p-1.5 rounded-2xl shrink-0 border-2 border-purple-100 shadow-inner">
                    <button onClick={() => setViewMode('LIST')} className={`p-2.5 rounded-xl transition-all font-bold ${viewMode === 'LIST' ? 'bg-white shadow-md text-pink-500 scale-105' : 'text-purple-400 hover:text-purple-600'}`}><List className="w-5 h-5"/></button>
                    <button onClick={() => setViewMode('GRID')} className={`p-2.5 rounded-xl transition-all font-bold ${viewMode === 'GRID' ? 'bg-white shadow-md text-pink-500 scale-105' : 'text-purple-400 hover:text-purple-600'}`}><LayoutGrid className="w-5 h-5"/></button>
                </div>
                
                {/* Selection Mode Toggle with Animation */}
                 <button 
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`
                        px-5 py-3 rounded-2xl border-2 flex items-center gap-2 text-sm font-black transition-all cute-3d-button
                        ${isSelectionMode 
                            ? 'bg-red-100 border-red-300 text-red-600 animate-pulse' 
                            : 'bg-white/80 border-purple-100 text-purple-500 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200'}
                    `}
                    title="เลือกรายการ (Selection Mode)"
                >
                    {isSelectionMode ? (
                        <>
                            <X className="w-5 h-5" /> ยกเลิก
                        </>
                    ) : (
                        <>
                            <CheckSquare className="w-5 h-5" /> เลือก
                        </>
                    )}
                </button>

                <button 
                    onClick={onCreate}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-2xl text-sm font-black shadow-lg shadow-pink-200 hover:shadow-xl hover:shadow-pink-300 transition-all cute-3d-button whitespace-nowrap animate-wiggle-hover"
                >
                    <Plus className="w-5 h-5 mr-2 stroke-[3px]" /> เพิ่มของใหม่
                </button>
            </div>
        </div>
    );
};

export default AssetHeaderControls;
