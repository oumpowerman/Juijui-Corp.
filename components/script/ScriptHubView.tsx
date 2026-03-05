
import React, { useState, useMemo, useEffect } from 'react';
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
import AppBackground from '../common/AppBackground';
import { Clapperboard, FileText, Edit3, CheckCircle2, Layers, ChevronRight, Loader2, ChevronLeft, X } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext'; // NEW IMPORT
import ContentForm from '../task/ContentForm'; // IMPORT
import { createPortal } from 'react-dom'; // IMPORT

// --- Main Component ---

interface ScriptHubViewProps {
    currentUser: User;
    users: User[]; 
}

const ScriptHubView: React.FC<ScriptHubViewProps> = ({ currentUser, users }) => {
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
    const [viewTab, setViewTab] = useState<'QUEUE' | 'LIBRARY' | 'HISTORY'>('QUEUE');
    const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('LIST'); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false); // Info Modal State

    // Promote State
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteScriptData, setPromoteScriptData] = useState<Script | null>(null);

    // Pagination & Filters (Updated to Array)
    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOwner, setFilterOwner] = useState<string[]>([]); // Array of IDs
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterChannel, setFilterChannel] = useState<string[]>([]); // Array of IDs
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC'); // NEW SORT STATE

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
            filterStatus,
            sortOrder // NEW
        });
    }, [page, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus, sortOrder, fetchScripts]);

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
        fetchScripts({ page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus, sortOrder });
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
            const success = await updateScript(id, { status: 'DONE', isInShootQueue: false });
            if (success) {
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
                setViewTab('LIBRARY');
            }
        }
    };
    
    // --- PROMOTE LOGIC ---
    const handlePromoteClick = (scriptId: string) => {
        // We need the full script data (which we have in activeScript)
        if (activeScript && activeScript.id === scriptId) {
            setPromoteScriptData(activeScript);
            setIsPromoteModalOpen(true);
        }
    };

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

    // If Editor is open, show full screen editor
    if (activeScript) {
        return (
            <>
                <ScriptEditor 
                    key={activeScript.id} // FORCE REMOUNT ON SCRIPT CHANGE
                    script={activeScript} 
                    users={users}
                    channels={channels} // Pass channels
                    masterOptions={masterOptions} // Pass masterOptions
                    currentUser={currentUser}
                    onClose={() => { setActiveScript(null); fetchScripts({ page, pageSize, searchQuery, viewTab, filterOwner, filterChannel, filterCategory, filterStatus, sortOrder }); }} 
                    onSave={updateScript} 
                    onGenerateAI={generateScriptWithAI}
                    onPromote={handlePromoteClick} // Pass handler
                />
                
                {/* Promote Modal Overlay */}
                {isPromoteModalOpen && promoteScriptData && createPortal(
                     <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                             <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex justify-between items-center">
                                 <div>
                                     <h3 className="text-xl font-black flex items-center gap-2">🚀 ส่งเข้าผลิต (Promote to Content)</h3>
                                     <p className="text-sm text-orange-100">แปลงสคริปต์เป็นงานจริงในระบบ</p>
                                 </div>
                                 <button onClick={() => setIsPromoteModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                             </div>
                             
                             <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
                                 <ContentForm 
                                    // Pre-fill data from Script
                                    initialData={{ 
                                        type: 'CONTENT', 
                                        title: promoteScriptData.title,
                                        channelId: promoteScriptData.channelId,
                                        category: promoteScriptData.category,
                                        description: `Script Link: ${promoteScriptData.title}`, // Optional: Add context
                                        // Default fields will be handled by useContentForm
                                    } as any}
                                    channels={channels}
                                    users={users}
                                    masterOptions={masterOptions}
                                    currentUser={currentUser}
                                    onSave={handlePromoteSubmit}
                                    onClose={() => setIsPromoteModalOpen(false)}
                                    // Hide Delete button
                                 />
                             </div>
                        </div>
                     </div>,
                     document.body
                )}
            </>
        );
    }

    return (
        <AppBackground theme="script" pattern="dots" className="pb-24">
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
                <ScriptStatsGrid 
                    filterOwner={filterOwner}
                    filterChannel={filterChannel}
                    filterCategory={filterCategory}
                    viewTab={viewTab}
                    filterStatus={filterStatus}
                    onTabChange={(tab, status) => {
                        setViewTab(tab);
                        if (status) setFilterStatus(status);
                        // We don't reset category here to allow filtered stats to stay
                    }}
                />

                {/* 3. Category Deck */}
                <ScriptCategoryFilter
                    categories={scriptCategories}
                    value={filterCategory}
                    onChange={setFilterCategory}
                />

                {/* 4. Filter Bar & List */}
                <div className="space-y-4">
                     <ScriptFilterBar 
                        layoutMode={layoutMode} setLayoutMode={setLayoutMode}
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        filterOwner={filterOwner} setFilterOwner={setFilterOwner}
                        filterChannel={filterChannel} setFilterChannel={setFilterChannel}
                        // NEW PROPS
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        sortOrder={sortOrder} setSortOrder={setSortOrder}
                        users={users} channels={channels} masterOptions={masterOptions}
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

                               {/* pastel glow */}
                            <div className="
                                absolute -top-10 -left-10 w-[200%] h-[200%]
                                opacity-30 blur-3xl
                                animate-pastel
                            "/>
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
        </AppBackground>
    );
};

export default ScriptHubView;
