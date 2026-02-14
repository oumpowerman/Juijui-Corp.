
import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Link, PlusCircle, X, Search, CheckCircle2, User, Calendar, Filter, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { ScriptSummary } from '../../../types';
import { useScripts } from '../../../hooks/useScripts';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';

interface GTScriptLinkerProps {
    scriptId: string | undefined;
    linkedScript: ScriptSummary | null;
    isLoadingScript: boolean;
    onSelectScript: (id: string) => void;
    onCreateScript: () => void;
    onOpenScript: (script: ScriptSummary) => void;
    onUnlink: () => void;
    currentUser: any;
}

const ITEMS_PER_PAGE = 10;

const ScriptSelectorModal = ({ isOpen, onClose, onSelect, currentUser }: { isOpen: boolean, onClose: () => void, onSelect: (id: string) => void, currentUser: any }) => {
    // Advanced Filters State
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<'ALL' | 'MINE' | 'FINAL'>('ALL');
    const [page, setPage] = useState(1);

    // Derived Filters for Hook
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
                    viewTab: 'LIBRARY',
                    filterOwner,
                    filterStatus
                });
            }, 300); // Debounce search
            return () => clearTimeout(timer);
        }
    }, [isOpen, search, page, filterMode]);

    if (!isOpen) return null;

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-rose-100">
                
                {/* Header & Search */}
                <div className="px-6 py-5 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-rose-800 flex items-center gap-2 text-lg">
                            <span className="bg-white p-2 rounded-xl shadow-sm"><Link className="w-5 h-5 text-rose-500" /></span>
                            เลือกสคริปต์ (Link Script)
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full text-rose-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Search Bar */}
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

                        {/* Quick Filters */}
                        <div className="flex gap-2">
                            <button 
                                onClick={() => { setFilterMode('ALL'); setPage(1); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${filterMode === 'ALL' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                ทั้งหมด ({totalCount})
                            </button>
                            <button 
                                onClick={() => { setFilterMode('MINE'); setPage(1); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${filterMode === 'MINE' ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <User className="w-3 h-3" /> ของฉัน
                            </button>
                            <button 
                                onClick={() => { setFilterMode('FINAL'); setPage(1); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${filterMode === 'FINAL' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <CheckCircle2 className="w-3 h-3" /> Final Only
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* List Area */}
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
                                    onClick={() => { onSelect(script.id); onClose(); }}
                                    className="group bg-white p-4 rounded-2xl border border-rose-100 hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100/50 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-rose-50 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
                                    
                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <h4 className="font-black text-gray-800 text-base line-clamp-1 group-hover:text-rose-600 transition-colors">
                                            {script.title}
                                        </h4>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                                            script.status === 'FINAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            script.status === 'DONE' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                            'bg-orange-50 text-orange-600 border-orange-100'
                                        }`}>
                                            {script.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500 relative z-10">
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                            {script.author?.avatarUrl ? (
                                                <img src={script.author.avatarUrl} className="w-4 h-4 rounded-full" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                                            )}
                                            <span className="font-bold text-gray-600 truncate max-w-[80px]">{script.author?.name}</span>
                                        </div>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-rose-300" />
                                            {format(new Date(script.updatedAt), 'd MMM yyyy')}
                                        </span>
                                        {script.channelId && (
                                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                                                <Hash className="w-3 h-3" /> Channel
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="px-6 py-4 bg-white border-t border-rose-100 flex justify-between items-center shrink-0">
                     <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 disabled:hover:bg-gray-50 transition-colors"
                     >
                         <ChevronLeft className="w-5 h-5" />
                     </button>
                     
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                         Page {page} of {totalPages || 1}
                     </span>

                     <button 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 0 || isLoading}
                        className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 disabled:hover:bg-gray-50 transition-colors"
                     >
                         <ChevronRight className="w-5 h-5" />
                     </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const GTScriptLinker: React.FC<GTScriptLinkerProps> = ({ 
    scriptId, linkedScript, isLoadingScript, onSelectScript, onCreateScript, onOpenScript, onUnlink, currentUser 
}) => {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    return (
        <div className="bg-gradient-to-br from-rose-50/50 to-white rounded-[1.5rem] p-1 border-2 border-rose-100 shadow-sm">
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-widest">
                         <div className="p-1.5 bg-rose-100 rounded-lg"><FileText className="w-3.5 h-3.5 text-rose-600" /></div>
                         Script Attachment
                     </div>
                     {scriptId && (
                         <button type="button" onClick={onUnlink} className="text-[10px] font-bold text-rose-400 hover:text-red-500 bg-white hover:bg-red-50 px-2 py-1 rounded-lg border border-rose-100 transition-colors flex items-center">
                             <X className="w-3 h-3 mr-1" /> Unlink
                         </button>
                     )}
                </div>

                {scriptId ? (
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400"></div>
                        
                        {isLoadingScript ? (
                            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold w-full justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดข้อมูล...
                            </div>
                        ) : linkedScript ? (
                            <>
                                <div className="flex-1 min-w-0 mr-3 pl-2">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{linkedScript.title}</h4>
                                    <div className="flex gap-2 mt-1.5 items-center">
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wide border ${linkedScript.status === 'DONE' || linkedScript.status === 'FINAL' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                            {linkedScript.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400">v{linkedScript.version}</span>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => onOpenScript(linkedScript)}
                                    className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap shadow-sm border border-rose-100"
                                >
                                    เปิดอ่าน
                                </button>
                            </>
                        ) : (
                            <div className="text-red-400 text-xs font-bold flex items-center pl-2">
                                <AlertTriangle className="w-4 h-4 mr-2" /> ไม่พบข้อมูลสคริปต์ (ID: {scriptId})
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsSelectorOpen(true)}
                            className="flex flex-col items-center justify-center gap-2 py-4 bg-white border-2 border-dashed border-rose-200 text-rose-400 rounded-2xl hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all active:scale-95 group"
                        >
                            <Link className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                            <span className="text-xs font-bold">เลือกที่มีอยู่</span>
                        </button>
                        <button 
                            type="button"
                            onClick={onCreateScript}
                            className="flex flex-col items-center justify-center gap-2 py-4 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-2xl shadow-lg shadow-rose-200 hover:shadow-rose-300 hover:-translate-y-0.5 transition-all active:scale-95 group"
                        >
                            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
                            <span className="text-xs font-bold">สร้างใหม่</span>
                        </button>
                    </div>
                )}
            </div>

            <ScriptSelectorModal 
                isOpen={isSelectorOpen} 
                onClose={() => setIsSelectorOpen(false)} 
                onSelect={(id) => { onSelectScript(id); setIsSelectorOpen(false); }}
                currentUser={currentUser}
            />
        </div>
    );
};

// Helper for AlertTriangle icon if needed locally (though imported)
const AlertTriangle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

export default GTScriptLinker;
