
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2, ExternalLink, PlusCircle, AlertCircle, Link as LinkIcon, X, Search, CheckCircle2, User, Calendar, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { ScriptSummary } from '../../../types';
import { useScripts } from '../../../hooks/useScripts';
import { format } from 'date-fns';

interface CFScriptLinkerProps {
    hasContentId: boolean;
    linkedScript: ScriptSummary | null;
    isLoadingScript: boolean;
    onOpenScript: () => void;
    onCreateScript: () => void;
    // New Props
    onLinkScript: (scriptId: string) => Promise<void>;
    onUnlinkScript: () => Promise<void>;
    currentUser: any;
}

const ITEMS_PER_PAGE = 8;

// Internal Modal Component for selecting script
const ScriptSelectorModal = ({ isOpen, onClose, onSelect, currentUser }: { isOpen: boolean, onClose: () => void, onSelect: (id: string) => Promise<void>, currentUser: any }) => {
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<'ALL' | 'MINE' | 'FINAL'>('ALL');
    const [page, setPage] = useState(1);
    
    // Selection state
    const [selectingId, setSelectingId] = useState<string | null>(null);

    // Derived Filters
    const filterOwner = filterMode === 'MINE' ? [currentUser.id] : [];
    const filterStatus = filterMode === 'FINAL' ? 'FINAL' : 'ALL';

    const { scripts, fetchScripts, isLoading, totalCount } = useScripts(currentUser);

    // Fetch on change
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                fetchScripts({ 
                    page, 
                    pageSize: ITEMS_PER_PAGE, 
                    searchQuery: search, 
                    viewTab: 'LIBRARY', // Search in Library
                    filterOwner,
                    filterStatus,
                    sortOrder: 'DESC'
                });
            }, 300); // Debounce
            return () => clearTimeout(timer);
        }
    }, [isOpen, search, page, filterMode]);

    if (!isOpen) return null;

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const handleSelectScript = async (id: string) => {
        if (selectingId) return; // Prevent double click
        setSelectingId(id);
        await onSelect(id);
        onClose();
        setSelectingId(null);
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-rose-100">
                
                {/* Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-rose-800 flex items-center gap-2 text-lg">
                            <span className="bg-white p-2 rounded-xl shadow-sm"><LinkIcon className="w-5 h-5 text-rose-500" /></span>
                            เลือกสคริปต์ (Link Script)
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full text-rose-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 group-focus-within:text-rose-600 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ, #แท็ก..." 
                                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-rose-100 rounded-2xl text-sm font-bold text-gray-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all placeholder:text-rose-300/70"
                                value={search}
                                onChange={e => { setSearch(e.target.value); setPage(1); }}
                                autoFocus
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <button onClick={() => { setFilterMode('ALL'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterMode === 'ALL' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>ทั้งหมด ({totalCount})</button>
                            <button onClick={() => { setFilterMode('MINE'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${filterMode === 'MINE' ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}><User className="w-3 h-3" /> ของฉัน</button>
                            <button onClick={() => { setFilterMode('FINAL'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${filterMode === 'FINAL' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}><CheckCircle2 className="w-3 h-3" /> Final Only</button>
                        </div>
                    </div>
                </div>
                
                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#fdf2f8] scrollbar-thin scrollbar-thumb-rose-200">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-rose-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2 text-rose-500"/>
                            <span className="font-bold text-sm">กำลังโหลดข้อมูล...</span>
                        </div>
                    ) : scripts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-rose-300 opacity-60">
                            <FileText className="w-16 h-16 mb-2" />
                            <p className="font-bold">ไม่พบสคริปต์ที่ค้นหา</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scripts.map(script => (
                                <div 
                                    key={script.id} 
                                    onClick={() => handleSelectScript(script.id)}
                                    className={`
                                        group bg-white p-4 rounded-2xl border border-rose-100 transition-all cursor-pointer relative overflow-hidden
                                        ${selectingId === script.id ? 'bg-rose-50 border-rose-300' : 'hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100/50'}
                                    `}
                                >
                                    {selectingId === script.id && (
                                        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                                                <Loader2 className="w-5 h-5 animate-spin" /> กำลังเชื่อมต่อ...
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h4 className="font-black text-gray-800 text-base line-clamp-1 group-hover:text-rose-600 transition-colors">
                                            {script.title}
                                        </h4>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${script.status === 'FINAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                            {script.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 relative z-10">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                            {script.author?.avatarUrl ? <img src={script.author.avatarUrl} className="w-4 h-4 rounded-full" /> : <div className="w-4 h-4 rounded-full bg-gray-300"></div>}
                                            <span className="font-bold text-gray-600 truncate max-w-[80px]">{script.author?.name}</span>
                                        </div>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-rose-300" /> {format(new Date(script.updatedAt), 'd MMM yy')}</span>
                                        {script.channelId && <span className="flex items-center gap-1 text-rose-400 font-bold"><Hash className="w-3 h-3" /> Channel</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-white border-t border-rose-100 flex justify-between items-center shrink-0">
                     <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {page} of {totalPages || 1}</span>
                     <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0 || isLoading} className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const CFScriptLinker: React.FC<CFScriptLinkerProps> = ({ 
    hasContentId, linkedScript, isLoadingScript, onOpenScript, onCreateScript, onLinkScript, onUnlinkScript, currentUser
}) => {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    
    // Protection: If task is new (no ID yet), don't allow script creation to prevent orphaned records
    if (!hasContentId) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-200 text-gray-500 rounded-xl">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-600 text-sm">📜 บท/สคริปต์ (Script)</h4>
                        <p className="text-xs text-gray-400">กรุณาบันทึกคอนเทนต์ก่อนเริ่มเขียนบท</p>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-orange-500 flex items-center bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                    <AlertCircle className="w-3 h-3 mr-1" /> Save First
                </div>
            </div>
        );
    }

    return (
        <div className="bg-rose-50/50 rounded-[1.5rem] p-4 border border-rose-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 rounded-bl-[4rem] -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white text-rose-500 rounded-xl shadow-sm border border-rose-100">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            Script Attachment
                            {linkedScript && (
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${linkedScript.status === 'DONE' || linkedScript.status === 'FINAL' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                    {linkedScript.status}
                                </span>
                            )}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                            {linkedScript ? linkedScript.title : 'ยังไม่ได้เชื่อมโยงบท'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {isLoadingScript ? (
                        <div className="p-2"><Loader2 className="w-5 h-5 animate-spin text-rose-500"/></div>
                    ) : linkedScript ? (
                        <>
                            <button 
                                type="button"
                                onClick={onOpenScript}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm active:scale-95"
                            >
                                <ExternalLink className="w-3 h-3" /> เปิดอ่านบท
                            </button>
                            <button 
                                type="button"
                                onClick={onUnlinkScript}
                                className="px-3 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all"
                                title="ยกเลิกการเชื่อมโยง"
                            >
                                Unlink
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                type="button"
                                onClick={() => setIsSelectorOpen(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-rose-200 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 hover:border-rose-400 transition-all active:scale-95"
                            >
                                <LinkIcon className="w-3.5 h-3.5" /> เลือกที่มีอยู่
                            </button>
                            <button 
                                type="button"
                                onClick={onCreateScript}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95"
                            >
                                <PlusCircle className="w-3.5 h-3.5" /> สร้างใหม่
                            </button>
                        </>
                    )}
                </div>
            </div>

            <ScriptSelectorModal 
                isOpen={isSelectorOpen} 
                onClose={() => setIsSelectorOpen(false)} 
                onSelect={onLinkScript} 
                currentUser={currentUser}
            />
        </div>
    );
};

export default CFScriptLinker;
