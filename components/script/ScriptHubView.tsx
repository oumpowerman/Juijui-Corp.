
import React, { useState, useMemo, useEffect } from 'react';
import { User, Script, MasterOption, ScriptSummary } from '../../types';
import { useScripts } from '../../hooks/useScripts';
import { useChannels } from '../../hooks/useChannels';
import { useMasterData } from '../../hooks/useMasterData';
import ScriptHubHeader from './hub/ScriptHubHeader';
import ScriptFilterBar from './hub/ScriptFilterBar';
import ScriptList from './hub/ScriptList';
import CreateScriptModal from './hub/CreateScriptModal';
import ScriptEditor from './ScriptEditor';
import InfoModal from '../ui/InfoModal'; // Import
import ScriptGuide from './hub/ScriptGuide'; // Import
import { Clapperboard, FileText, Edit3, CheckCircle2, Layers, ChevronRight, Loader2, ChevronLeft } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext'; // NEW IMPORT

// --- Sub-components ---

interface StatCardProps {
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
    isActive: boolean;
    onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, icon: Icon, color, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-32 group text-left
            ${isActive 
                ? `bg-white border-${color}-400 shadow-xl shadow-${color}-100 ring-1 ring-${color}-200 scale-[1.02]` 
                : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
            }
        `}
    >
        <div className={`
            absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 pointer-events-none transition-transform group-hover:scale-110
            bg-${color}-500
        `}></div>
        
        <div className="flex justify-between items-start relative z-10">
            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? `text-${color}-600` : 'text-gray-400'}`}>{label}</span>
            <div className={`p-2 rounded-xl ${isActive ? `bg-${color}-100 text-${color}-600` : 'bg-gray-50 text-gray-400'}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        
        <div className="relative z-10">
            <span className={`text-4xl font-black ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{count}</span>
        </div>
    </button>
);

interface CategoryPillProps {
    cat: MasterOption | { key: string, label: string };
    count?: number;
    isActive: boolean;
    onClick: () => void;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ cat, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold whitespace-nowrap transition-all
            ${isActive 
                ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
        `}
    >
        <span>{cat.label}</span>
        {/* Count disabled for categorized pill in server-side mode to simplify initial query */}
    </button>
);

// --- Main Component ---

interface ScriptHubViewProps {
    currentUser: User;
    users: User[]; 
}

const ScriptHubView: React.FC<ScriptHubViewProps> = ({ currentUser, users }) => {
    // Hooks
    const { 
        scripts, totalCount, stats, isLoading, 
        fetchScripts, getScriptById,
        createScript, updateScript, deleteScript, toggleShootQueue, generateScriptWithAI 
    } = useScripts(currentUser);
    
    const { channels } = useChannels();
    const { masterOptions } = useMasterData();
    const { showConfirm } = useGlobalDialog(); // USE DIALOG

    // UI State
    const [activeScript, setActiveScript] = useState<Script | null>(null);
    const [viewTab, setViewTab] = useState<'QUEUE' | 'LIBRARY' | 'HISTORY'>('QUEUE');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('LIST'); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Info Modal State

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOwner, setFilterOwner] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterChannel, setFilterChannel] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');

    const totalPages = Math.ceil(totalCount / pageSize);

    // Effect: Fetch scripts when filters or page change
    useEffect(() => {
        fetchScripts({
            page,
            pageSize,
            searchQuery,
            viewTab,
            filterOwner,
            filterChannel,
            filterCategory,
            filterStatus
        });
    }, [page, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus, fetchScripts]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus]);

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    const handleCreateSubmit = async (data: any) => {
        const id = await createScript(data);
        if (id) {
            // Optional: Immediately open the new script
            const fullScript = await getScriptById(id);
            if (fullScript) setActiveScript(fullScript);
        }
        // Refetch list to show new item
        fetchScripts({ page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus });
    };

    const handleOpenScript = async (summary: ScriptSummary) => {
        setIsFetchingDetail(true);
        const fullScript = await getScriptById(summary.id);
        setIsFetchingDetail(false);
        
        if (fullScript) {
            setActiveScript(fullScript);
        } else {
            alert("ไม่สามารถโหลดข้อมูลสคริปต์ได้");
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    // --- WRAPPED HANDLERS WITH GLOBAL MODAL ---
    
    const handleToggleQueue = async (id: string, currentStatus: boolean) => {
        // currentStatus: true = in queue, false = not in queue
        const actionText = currentStatus ? 'นำออกจากคิวถ่ายทำ (เก็บเข้าคลัง)' : 'ย้ายเข้าคิวถ่ายทำ (Active Queue)';
        const confirmed = await showConfirm(
            `คุณต้องการ ${actionText} ใช่หรือไม่?`,
            'ยืนยันการย้ายรายการ'
        );
        
        if (confirmed) {
            toggleShootQueue(id, currentStatus);
        }
    };

    const handleDeleteScript = async (id: string) => {
        const confirmed = await showConfirm(
            'สคริปต์จะถูกลบถาวรและไม่สามารถกู้คืนได้',
            '⚠️ ยืนยันการลบสคริปต์?'
        );
        if (confirmed) {
            deleteScript(id);
        }
    };

    const handleDoneScript = async (id: string) => {
        const confirmed = await showConfirm(
            'รายการจะถูกย้ายไปที่ "ประวัติ (History)" และถือว่าถ่ายทำเสร็จสิ้นแล้ว',
            '🎉 ยืนยันจบงาน (Mark as Done)?'
        );
        if (confirmed) {
            updateScript(id, { status: 'DONE', isInShootQueue: false });
        }
    };

    const handleRestoreScript = async (id: string) => {
        const confirmed = await showConfirm(
            'สคริปต์จะถูกย้ายกลับมาที่คลัง (Library) ในสถานะ DRAFT',
            'ยืนยันการนำกลับมาใช้?'
        );
        if (confirmed) {
            updateScript(id, { status: 'DRAFT', isInShootQueue: false });
        }
    };

    // If Editor is open, show full screen editor
    if (activeScript) {
        return (
            <ScriptEditor 
                script={activeScript} 
                users={users}
                channels={channels} // Pass channels
                masterOptions={masterOptions} // Pass masterOptions
                currentUser={currentUser}
                onClose={() => { setActiveScript(null); fetchScripts({ page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus }); }} 
                onSave={updateScript} 
                onGenerateAI={generateScriptWithAI}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 relative">
            {isFetchingDetail && (
                <div className="fixed inset-0 z-[60] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        <span className="text-sm font-bold text-gray-700">กำลังโหลดเนื้อหา...</span>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
                
                {/* 1. Header with Info Button */}
                <ScriptHubHeader 
                    onCreateClick={() => setIsCreateModalOpen(true)} 
                    onInfoClick={() => setIsInfoOpen(true)} 
                />

                {/* 2. Dashboard Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="ถ่ายวันนี้ (Queue)" 
                        count={stats.queue} 
                        icon={Clapperboard} 
                        color="orange" 
                        isActive={viewTab === 'QUEUE'}
                        onClick={() => { setViewTab('QUEUE'); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                    />
                    <StatCard 
                        label="คลังบท (Library)" 
                        count={stats.library} 
                        icon={FileText} 
                        color="indigo" 
                        isActive={viewTab === 'LIBRARY' && filterStatus === 'ALL'}
                        onClick={() => { setViewTab('LIBRARY'); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                    />
                    <StatCard 
                        label="แบบร่าง (Drafts)" 
                        count={stats.drafts} 
                        icon={Edit3} 
                        color="pink" 
                        isActive={viewTab === 'LIBRARY' && filterStatus === 'DRAFT'}
                        onClick={() => { setViewTab('LIBRARY'); setFilterStatus('DRAFT'); setFilterCategory('ALL'); }}
                    />
                    <StatCard 
                        label="เสร็จแล้ว (History)" 
                        count={stats.history} 
                        icon={CheckCircle2} 
                        color="emerald" 
                        isActive={viewTab === 'HISTORY'}
                        onClick={() => { setViewTab('HISTORY'); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                    />
                </div>

                {/* 3. Category Deck */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider px-1">
                        <Layers className="w-4 h-4" /> เลือกดูตามประเภท (Categories)
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <CategoryPill 
                            cat={{ key: 'ALL', label: 'ทั้งหมด (All)' }} 
                            isActive={filterCategory === 'ALL'} 
                            onClick={() => setFilterCategory('ALL')} 
                        />
                        {scriptCategories.map(cat => (
                            <CategoryPill 
                                key={cat.key} 
                                cat={cat} 
                                isActive={filterCategory === cat.key} 
                                onClick={() => setFilterCategory(cat.key)} 
                            />
                        ))}
                    </div>
                </div>

                {/* 4. Filter Bar & List */}
                <div className="space-y-4">
                     <ScriptFilterBar 
                        layoutMode={layoutMode} setLayoutMode={setLayoutMode}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        filterOwner={filterOwner} setFilterOwner={setFilterOwner}
                        filterChannel={filterChannel} setFilterChannel={setFilterChannel}
                        users={users} channels={channels}
                    />

                    <ScriptList 
                        scripts={scripts}
                        layoutMode={layoutMode}
                        viewTab={viewTab}
                        isLoading={isLoading}
                        channels={channels}
                        masterOptions={masterOptions}
                        onOpen={handleOpenScript}
                        
                        // Pass wrapped handlers
                        onToggleQueue={handleToggleQueue}
                        onDelete={handleDeleteScript}
                        onRestore={handleRestoreScript}
                        onDone={handleDoneScript}
                    />

                    {/* Pagination Controls */}
                    {totalCount > 0 && (
                        <div className="flex items-center justify-between pt-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="text-xs text-gray-500 font-medium">
                                แสดง {((page - 1) * pageSize) + 1} ถึง {Math.min(page * pageSize, totalCount)} จาก {totalCount} รายการ
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handlePageChange(page - 1)} 
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>
                                <span className="text-sm font-bold text-gray-700 px-2">
                                    หน้า {page} / {totalPages}
                                </span>
                                <button 
                                    onClick={() => handlePageChange(page + 1)} 
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CreateScriptModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
                channels={channels}
                masterOptions={masterOptions}
            />

            {/* INFO MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือ Script Hub"
            >
                <ScriptGuide />
            </InfoModal>
        </div>
    );
};

export default ScriptHubView;
