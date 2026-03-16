
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Script, MasterOption, ScriptSummary, Task } from '../../types';
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
import ScriptCategoryFilter from './hub/ScriptCategoryFilter';
import ScriptStatsGrid from './hub/ScriptStatsGrid';
import ScriptModeSwitcher, { ScriptHubMode } from './hub/ScriptModeSwitcher';
import AppBackground from '../common/AppBackground';
import ScriptLabView from './lab/ScriptLabView';
import { Clapperboard, FileText, Edit3, CheckCircle2, Layers, ChevronRight, Loader2, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalDialog } from '../../context/GlobalDialogContext'; // NEW IMPORT
import ContentForm from '../task/ContentForm'; // IMPORT
import { createPortal } from 'react-dom'; // IMPORT

// --- Main Component ---

interface ScriptHubViewProps {
    currentUser: User;
    users: User[]; 
    initialMode?: ScriptHubMode;
}

const ScriptHubView: React.FC<ScriptHubViewProps> = ({ currentUser, users, initialMode = 'HUB' }) => {
    // Hooks
    const { 
        scripts, totalCount, isLoading, 
        fetchScripts, getScriptById,
        createScript, updateScript, deleteScript, toggleShootQueue, generateScriptWithAI,
        promoteToContent // NEW
    } = useScripts(currentUser);
    
    const { channels } = useChannels();
    const { masterOptions } = useMasterData();
    const { showConfirm, showAlert } = useGlobalDialog(); // USE DIALOG

    // UI State
    const [activeScript, setActiveScript] = useState<Script | null>(null);
    const [viewTab, setViewTab] = useState<'QUEUE' | 'LIBRARY' | 'HISTORY'>('LIBRARY');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('LIST'); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Info Modal State
    const [refreshStatsKey, setRefreshStatsKey] = useState(0); // NEW: Trigger for stats refresh
    const [mode, setMode] = useState<ScriptHubMode>(initialMode); // NEW: Mode switcher

    // Guard: Prevent LAB mode on mobile
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && mode === 'LAB') {
            setMode('HUB');
        }
    }, [mode]);

    // Promote State
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteScriptData, setPromoteScriptData] = useState<Script | null>(null);

    // Pagination & Filters (Updated to Array)
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOwner, setFilterOwner] = useState<string[]>([]); // Array of IDs
    const [filterStatus, setFilterStatus] = useState<string[]>(['ALL']); // Changed to array
    const [filterChannel, setFilterChannel] = useState<string[]>([]); // Array of IDs
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterTags, setFilterTags] = useState<string[]>([]); // NEW: Multi-tag filter
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC'); // NEW SORT STATE
    const [isDeepSearch, setIsDeepSearch] = useState(false); // NEW DEEP SEARCH STATE

    const totalPages = Math.ceil(totalCount / pageSize);

    // Effect: Fetch scripts when filters or page change
    useEffect(() => {
        // Detect initial layout mode based on screen size
        const isMobile = window.innerWidth < 768;
        setLayoutMode(isMobile ? 'GRID' : 'LIST');
    }, []);

    useEffect(() => {
        fetchScripts({
            page,
            pageSize,
            searchQuery,
            viewTab,
            filterOwner,
            filterChannel,
            filterCategory,
            filterTags, // NEW
            filterStatus,
            sortOrder, // NEW
            isDeepSearch, // NEW
            isPersonal: mode === 'STUDIO' ? true : false // Filter based on mode
        });
    }, [page, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterTags, filterStatus, sortOrder, isDeepSearch, fetchScripts, mode]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus, filterTags, isDeepSearch]);

    const scriptCategories = masterOptions.filter(o => o.type === 'SCRIPT_CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    const handleCreateSubmit = async (data: any) => {
        const id = await createScript({
            ...data,
            isPersonal: mode === 'STUDIO' // Set isPersonal based on current mode
        });
        if (id) {
            // Optional: Immediately open the new script
            const fullScript = await getScriptById(id);
            if (fullScript) setActiveScript(fullScript);
        }
        // Refetch list to show new item
        fetchScripts({ 
            page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, 
            filterCategory, filterTags, filterStatus, sortOrder, isDeepSearch,
            isPersonal: mode === 'STUDIO'
        });
        setRefreshStatsKey(prev => prev + 1);
    };

    const handleOpenScript = async (summary: ScriptSummary) => {
        setIsFetchingDetail(true);
        const fullScript = await getScriptById(summary.id);
        setIsFetchingDetail(false);
        
        if (fullScript) {
            setActiveScript(fullScript);
        } else {
            showAlert("ไม่สามารถโหลดข้อมูลสคริปต์ได้", "ข้อผิดพลาด");
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
            const success = await toggleShootQueue(id, currentStatus);
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                // If we were in LIBRARY, move to QUEUE. If in QUEUE, move to LIBRARY.
                if (viewTab === 'LIBRARY') {
                    setViewTab('QUEUE');
                } else if (viewTab === 'QUEUE') {
                    setViewTab('LIBRARY');
                }
            }
        }
    };

    const handleDeleteScript = async (id: string) => {
        const script = scripts.find(s => s.id === id);
        if (script && script.authorId !== currentUser.id && script.ideaOwnerId !== currentUser.id) {
            showAlert("คุณไม่ใช่เจ้าของสคริปต์นี้ ไม่สามารถลบได้", "ไม่อนุญาต");
            return;
        }

        const confirmed = await showConfirm(
            'สคริปต์จะถูกลบถาวรและไม่สามารถกู้คืนได้',
            '⚠️ ยืนยันการลบสคริปต์?'
        );
        if (confirmed) {
            await deleteScript(id);
            setRefreshStatsKey(prev => prev + 1);
        }
    };

    const handleDoneScript = async (id: string) => {
        const confirmed = await showConfirm(
            'รายการจะถูกย้ายไปที่ "ประวัติ (History)" และถือว่าถ่ายทำเสร็จสิ้นแล้ว',
            '🎉 ยืนยันจบงาน (Mark as Done)?'
        );
        if (confirmed) {
            const success = await updateScript(id, { status: 'DONE', isInShootQueue: false });
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                setViewTab('HISTORY');
            }
        }
    };

    const handleRestoreScript = async (id: string) => {
        const confirmed = await showConfirm(
            'สคริปต์จะถูกย้ายกลับมาที่คลัง (Library) ในสถานะ DRAFT',
            'ยืนยันการนำกลับมาใช้?'
        );
        if (confirmed) {
            const success = await updateScript(id, { status: 'DRAFT', isInShootQueue: false });
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                setViewTab('LIBRARY');
            }
        }
    };
    
    // --- PROMOTE LOGIC ---
    const handlePromoteClick = useCallback((scriptId: string) => {
        // Use the latest activeScript from state directly
        if (activeScript) {
            setPromoteScriptData(activeScript);
            setIsPromoteModalOpen(true);
        }
    }, [activeScript]);

    const handlePromoteSubmit = async (contentTask: Task) => {
        if (!promoteScriptData) return;

        // Extract payload from Task object (ContentForm returns a Task object)
        // We need to strip ID if it's auto-generated in form, but here we want DB to generate
        const payload = {
            title: contentTask.title,
            description: contentTask.description,
            status: contentTask.status,
            channel_id: contentTask.channelId,
            start_date: contentTask.startDate,
            end_date: contentTask.endDate,
            target_platform: contentTask.targetPlatforms,
            content_format: contentTask.contentFormat,
            pillar: contentTask.pillar,
            category: contentTask.category,
            is_unscheduled: contentTask.isUnscheduled,
            // Add creator as idea owner by default if not set? 
            // ContentForm already handles this via `ideaOwnerIds`
            idea_owner_ids: contentTask.ideaOwnerIds,
            editor_ids: contentTask.editorIds,
            assignee_ids: contentTask.assigneeIds,
            remark: contentTask.remark
        };

        const success = await promoteToContent(promoteScriptData.id, payload);
        
        if (success) {
            setIsPromoteModalOpen(false);
            setPromoteScriptData(null);
            // Refresh Active Script to show linked content status
            const refreshed = await getScriptById(promoteScriptData.id);
            if (refreshed) setActiveScript(refreshed);
        }
    };

    const handleTogglePersonal = async (id: string, currentStatus: boolean) => {
        const script = scripts.find(s => s.id === id);
        if (script && script.authorId !== currentUser.id && script.ideaOwnerId !== currentUser.id) {
            showAlert("คุณไม่ใช่เจ้าของสคริปต์นี้ ไม่สามารถเปลี่ยนสถานะได้", "ไม่อนุญาต");
            return;
        }

        const actionText = currentStatus ? 'ย้ายเข้าส่วนกลาง (Public Hub)' : 'เก็บเข้าพื้นที่ส่วนตัว (My Studio)';
        const confirmed = await showConfirm(
            `คุณต้องการ ${actionText} ใช่หรือไม่?`,
            'ยืนยันการเปลี่ยนสถานะการมองเห็น'
        );
        
        if (confirmed) {
            const success = await updateScript(id, { isPersonal: !currentStatus });
            if (success) {
                setRefreshStatsKey(prev => prev + 1);
                fetchScripts({ page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterTags, filterStatus, sortOrder, isPersonal: mode === 'STUDIO' });
            }
        }
    };

    // --- RENDER LOGIC WITH ANIMATIONS ---
    return (
        <AppBackground 
            theme={mode === 'STUDIO' ? 'pastel-indigo' : 'script'} 
            pattern="dots" 
            className={!activeScript && mode !== 'LAB' ? "pb-24" : ""}
        >
            <AnimatePresence mode="wait">
                {mode === 'LAB' ? (
                    <motion.div
                        key="lab-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <ScriptLabView 
                            currentUser={currentUser}
                            users={users}
                            channels={channels}
                            masterOptions={masterOptions}
                            onClose={() => setMode('HUB')}
                        />
                    </motion.div>
                ) : activeScript ? (
                    <motion.div
                        key="editor-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <ScriptEditor 
                            key={activeScript.id} 
                            script={activeScript} 
                            users={users}
                            channels={channels}
                            masterOptions={masterOptions}
                            currentUser={currentUser}
                            onClose={() => { 
                                setActiveScript(null); 
                                fetchScripts({ 
                                    page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, 
                                    filterCategory, filterStatus, sortOrder,
                                    isPersonal: mode === 'STUDIO'
                                }); 
                                setRefreshStatsKey(prev => prev + 1);
                            }} 
                            onSave={updateScript} 
                            onGenerateAI={generateScriptWithAI}
                            onPromote={handlePromoteClick}
                        />
                        
                        {isPromoteModalOpen && promoteScriptData && createPortal(
                            <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                                    <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2">🚀 ส่งเข้าผลิต (Promote to Content)</h3>
                                            <p className="text-sm text-orange-100">แปลงสคริปต์เป็นงานจริงในระบบ</p>
                                        </div>
                                        <button onClick={() => setIsPromoteModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                                        <ContentForm 
                                            initialData={null}
                                            sourceScript={promoteScriptData}
                                            channels={channels}
                                            users={users}
                                            masterOptions={masterOptions}
                                            currentUser={currentUser}
                                            onSave={handlePromoteSubmit}
                                            onClose={() => setIsPromoteModalOpen(false)}
                                        />
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="hub-view"
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ 
                            duration: 0.5, 
                            ease: [0.23, 1, 0.32, 1] 
                        }}
                    >
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
                                mode={mode}
                                onModeChange={setMode}
                            />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={mode}
                                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                    transition={{ 
                                        duration: 0.4, 
                                        ease: [0.23, 1, 0.32, 1] 
                                    }}
                                    className="space-y-8"
                                >
                                    {/* 2. Dashboard Stats Grid */}
                                    <ScriptStatsGrid 
                                        refreshTrigger={refreshStatsKey}
                                        filterOwner={filterOwner}
                                        filterChannel={filterChannel}
                                        filterCategory={filterCategory}
                                        filterTags={filterTags}
                                        searchQuery={searchQuery}
                                        viewTab={viewTab}
                                        filterStatus={filterStatus}
                                        isPersonal={mode === 'STUDIO'}
                                        currentUser={currentUser}
                                        onTabChange={(tab, status) => {
                                            setViewTab(tab);
                                            if (status) setFilterStatus([status]);
                                        }}
                                    />

                                    {/* 4. Filter Bar & List */}
                                    <div className="space-y-4">
                                        <ScriptFilterBar 
                                            layoutMode={layoutMode} setLayoutMode={setLayoutMode}
                                            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                            filterOwner={filterOwner} setFilterOwner={setFilterOwner}
                                            filterChannel={filterChannel} setFilterChannel={setFilterChannel}
                                            filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                                            filterTags={filterTags} setFilterTags={setFilterTags}
                                            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                                            sortOrder={sortOrder} setSortOrder={setSortOrder}
                                            isDeepSearch={isDeepSearch} setIsDeepSearch={setIsDeepSearch}
                                            users={users} channels={channels} masterOptions={masterOptions}
                                            mode={mode}
                                        />

                                        <ScriptList 
                                            scripts={scripts}
                                            layoutMode={layoutMode}
                                            viewTab={viewTab}
                                            isLoading={isLoading}
                                            channels={channels}
                                            masterOptions={masterOptions}
                                            mode={mode}
                                            currentUser={currentUser}
                                            onOpen={handleOpenScript}
                                            onToggleQueue={handleToggleQueue}
                                            onDelete={handleDeleteScript}
                                            onRestore={handleRestoreScript}
                                            onDone={handleDoneScript}
                                            onTogglePersonal={handleTogglePersonal}
                                        />

                                        {/* Pagination Controls */}
                                        {totalCount > 0 && (
                                            <div className="
                                            flex items-center justify-between pt-4
                                            p-4 rounded-3xl
                                            bg-white/70
                                            backdrop-blur-xl
                                            border border-white/40
                                            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
                                            animate-breathe
                                            relative overflow-hidden
                                            ">
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent"/>
                                                    <div className="absolute -top-10 -left-10 w-[200%] h-[200%] opacity-30 blur-3xl animate-pastel"/>
                                                </div>

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
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <CreateScriptModal 
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            onSubmit={handleCreateSubmit}
                            channels={channels}
                            masterOptions={masterOptions}
                            users={users}
                            currentUser={currentUser}
                            mode={mode}
                        />

                        {/* INFO MODAL */}
                        <InfoModal 
                            isOpen={isInfoOpen}
                            onClose={() => setIsInfoOpen(false)}
                            title="คู่มือ Script Hub"
                        >
                            <ScriptGuide />
                        </InfoModal>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppBackground>
    );
};

export default ScriptHubView;
