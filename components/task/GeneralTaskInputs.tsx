
import React, { useState, useEffect } from 'react';
import { Task, User, MasterOption, ScriptSummary, Channel } from '../../types';
import { useGeneralTaskForm } from '../../hooks/useGeneralTaskForm';
import { AlertTriangle, Trash2, Send, Loader2, Lock, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TaskAssets from '../TaskAssets'; 
import { isTaskCompleted } from '../../constants';
import { useScripts } from '../../hooks/useScripts'; 

// Import Form Parts
import GTAssigneeSelector from './form-parts/GTAssigneeSelector';
import GTHeaderInput from './form-parts/GTHeaderInput';
import GTProjectLinker from './form-parts/GTProjectLinker';
import GTCoreDetails from './form-parts/GTCoreDetails';
import GTGuidelines from './form-parts/GTGuidelines';
import GTGamification from './form-parts/GTGamification';
import GTDateScheduler from './form-parts/GTDateScheduler';
import GTScriptLinker from './form-parts/GTScriptLinker'; 
import CreateScriptModal from '../script/hub/CreateScriptModal';
import ContentActionFooter from './content-parts/ContentActionFooter';

interface GeneralTaskInputsProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    projects?: Task[]; 
    channels?: Channel[]; // Add optional channels prop
    // New Props for Script Editor interaction
    onEditScript: (scriptId: string) => void;
}

const GeneralTaskInputs: React.FC<GeneralTaskInputsProps> = ({ 
    initialData, selectedDate, users, masterOptions, currentUser, onSave, onDelete, onClose, projects = [], channels = [], onEditScript
}) => {
    const { showToast } = useToast();
    const { showConfirm, showAlert } = useGlobalDialog();
    const [isSendingQC, setIsSendingQC] = useState(false);
    const isAdmin = currentUser?.role === 'ADMIN';
    const isCreative = currentUser?.position === 'Creative' || isAdmin;

    const {
        title, setTitle,
        description, setDescription,
        status, setStatus,
        priority, setPriority,
        startDate, setStartDate,
        endDate, setEndDate,
        assigneeType, setAssigneeType,
        assigneeIds, setAssigneeIds,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        contentId, handleSetParentProject,
        scriptId, setScriptId, 
        assets, addAsset, removeAsset,
        error,
        isSaving,
        taskStatusOptions,
        handleSubmit,
        toggleUserSelection
    } = useGeneralTaskForm({
        initialData,
        selectedDate,
        users,
        masterOptions,
        onSave,
        projects
    });
    
    // --- Script Linking Logic (Local to Form) ---
    const { 
        getScriptById, 
        createScript 
    } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);

    const [linkedScript, setLinkedScript] = useState<ScriptSummary | null>(null);
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    const [isCreateScriptModalOpen, setIsCreateScriptModalOpen] = useState(false);

    // Fetch Linked Script Summary (to show in the Linker Card)
    useEffect(() => {
        const fetchLinked = async () => {
            if (scriptId) {
                setIsLoadingScript(true);
                const script = await getScriptById(scriptId);
                if (script) setLinkedScript(script);
                setIsLoadingScript(false);
            } else {
                setLinkedScript(null);
            }
        };
        fetchLinked();
    }, [scriptId]);

    // Handle Create Script
    const handleCreateScriptSubmit = async (data: any) => {
        const newScriptId = await createScript({
            ...data,
        });
        if (newScriptId) {
            setScriptId(newScriptId);
            setIsCreateScriptModalOpen(false);
            // CHANGED: Removed auto-open. Just notify and link.
            showToast('สร้างสคริปต์เรียบร้อย! (Linked)', 'success');
        }
    };
    
    // --- Standard Task Logic ---

    const activeUsers = users.filter(u => u.isActive);
    const isOwnerOrAssignee = (currentUser && assigneeIds.includes(currentUser.id)) || isAdmin;
    const isReadOnly = !!initialData && !isOwnerOrAssignee;

    const filteredStatusOptions = React.useMemo(() => {
        if (isAdmin) return taskStatusOptions;
        // Member only Todo and Doing as requested
        return taskStatusOptions.filter(opt => opt.key === 'TODO' || opt.key === 'DOING');
    }, [taskStatusOptions, isAdmin]);

    const suggestedTasks = React.useMemo(() => {
        if (assigneeType !== 'INDIVIDUAL' || assigneeIds.length !== 1) return [];
        const user = users.find(u => u.id === assigneeIds[0]);
        if (!user || !user.position) return [];
        const positionOpt = masterOptions.find(o => o.type === 'POSITION' && o.label === user.position);
        if (positionOpt) {
            return masterOptions.filter(o => o.type === 'RESPONSIBILITY' && o.parentKey === positionOpt.key);
        }
        return [];
    }, [assigneeIds, assigneeType, users, masterOptions]);

    const handleSendToQC = async () => {
        if (isSendingQC) return;
        if (!isOwnerOrAssignee) {
             await showAlert('เฉพาะผู้รับผิดชอบงานนี้เท่านั้นที่สามารถส่งงานได้', '🔒 สิทธิ์ไม่เพียงพอ');
             return;
        }

        setIsSendingQC(true);

        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
            setIsSendingQC(false);
            return;
        }

        const existingPendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
        if (existingPendingReview) {
             await showAlert(`มีรายการ "Draft ${existingPendingReview.round}" รอตรวจอยู่แล้ว`, '⚠️ ส่งซ้ำไม่ได้');
             setIsSendingQC(false);
             return;
        }

        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;
        
        const confirmed = await showConfirm(
            `งานจะถูกเปลี่ยนสถานะเป็น "รอตรวจ (Waiting)" และส่งแจ้งเตือนให้หัวหน้าทราบ`,
            `🚀 ยืนยันการส่งงาน?`
        );

        if (!confirmed) {
            setIsSendingQC(false);
            return;
        }

        try {
            const { error: reviewError } = await supabase.from('task_reviews').insert({
                task_id: initialData.id,
                content_id: null,
                round: nextRound,
                scheduled_at: new Date().toISOString(),
                status: 'PENDING',
                reviewer_id: null
            });
            if (reviewError) throw reviewError;

            await supabase.from('task_logs').insert({
                task_id: initialData.id,
                action: 'SENT_TO_QC',
                details: `ส่งงาน (Submission ${nextRound})`,
                user_id: currentUser?.id
            });

            const targetStatus = 'WAITING'; 
            
            const newOptimisticReview = {
                id: `temp-${Date.now()}`,
                taskId: initialData.id,
                round: nextRound,
                scheduledAt: new Date(),
                status: 'PENDING',
                reviewerId: null
            };

            const updatedTask: Task = {
                ...initialData!,
                title,
                description,
                status: targetStatus,
                priority,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                assigneeIds,
                assigneeType,
                targetPosition,
                difficulty,
                estimatedHours,
                assets,
                reviews: [...(initialData.reviews || []), newOptimisticReview as any], 
                showOnBoard: true 
            };

            const { error: updateError } = await supabase
                .from('tasks')
                .update({ 
                    status: targetStatus,
                    show_on_board: true
                })
                .eq('id', initialData.id);

            if (updateError) throw updateError;

            setStatus(targetStatus);
            onSave(updatedTask);
            
            await showAlert('ส่งงานเรียบร้อยแล้ว! 🚀 หัวหน้าจะได้รับแจ้งเตือนทันทีและงานจะย้ายไปที่ช่อง "รอตรวจ"', 'ส่งงานสำเร็จ');
            onClose();

        } catch (err: any) {
            console.error("Submission error details:", err);
            showToast('ส่งงานไม่สำเร็จ: ' + (err.message || 'Unknown Error'), 'error');
            setIsSendingQC(false); 
        }
    };

    const handleUserSelectWrapper = (userId: string) => {
        toggleUserSelection(userId);
        if (assigneeType === 'INDIVIDUAL') {
            const isSelecting = !assigneeIds.includes(userId);
            if (isSelecting) {
                const user = users.find(u => u.id === userId);
                if (user && user.position) {
                    setTargetPosition(user.position);
                }
            } else {
                setTargetPosition(''); 
            }
        }
    };

    const isTaskDone = isTaskCompleted(status);

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full bg-white relative overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {isReadOnly && (
                        <div className="bg-slate-100 border-l-4 border-slate-400 p-4 rounded-r-lg animate-in slide-in-from-top-2">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Eye className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-slate-700">
                                        <span className="font-bold">View Only Mode:</span> คุณไม่มีสิทธิ์แก้ไขงานนี้ (เฉพาะผู้รับผิดชอบหรือ Admin)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

                    <fieldset disabled={isReadOnly} className={`space-y-6 ${isReadOnly ? 'opacity-90' : ''}`}>
                        
                        <GTAssigneeSelector 
                            assigneeType={assigneeType}
                            setAssigneeType={setAssigneeType}
                            assigneeIds={assigneeIds}
                            setAssigneeIds={setAssigneeIds}
                            targetPosition={targetPosition}
                            setTargetPosition={setTargetPosition}
                            activeUsers={activeUsers}
                            toggleUserSelection={handleUserSelectWrapper} 
                            startDate={startDate}
                            endDate={endDate}
                        />

                        <GTHeaderInput 
                            title={title}
                            setTitle={setTitle}
                            assigneeType={assigneeType}
                            suggestedTasks={suggestedTasks} 
                        />
                        
                        {/* Script Linker with Bridge to Parent */}
                        {isCreative && (
                            <GTScriptLinker 
                                scriptId={scriptId}
                                linkedScript={linkedScript}
                                isLoadingScript={isLoadingScript}
                                onSelectScript={(id) => {
                                    setScriptId(id);
                                }}
                                onCreateScript={() => setIsCreateScriptModalOpen(true)}
                                onOpenScript={(script) => onEditScript(script.id)} // BRIDGE: Call Parent to Open Editor
                                onUnlink={() => setScriptId(undefined)}
                                currentUser={currentUser}
                            />
                        )}

                        {/* Updated Project Linker props */}
                        <GTProjectLinker 
                            projectId={contentId || ''}
                            setProjectId={(id) => handleSetParentProject(id || null)}
                            projects={projects}
                            channels={channels}
                            masterOptions={masterOptions}
                        />

                        <GTCoreDetails 
                            description={description}
                            setDescription={setDescription}
                            priority={priority}
                            setPriority={setPriority}
                            status={status}
                            setStatus={setStatus}
                            taskStatusOptions={filteredStatusOptions} 
                            currentUser={currentUser}
                        />

                        <GTGuidelines 
                            caution={caution}
                            setCaution={setCaution}
                            importance={importance}
                            setImportance={setImportance}
                        />

                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <TaskAssets 
                                assets={assets}
                                onAdd={addAsset}
                                onDelete={removeAsset}
                            />
                        </div>

                        <GTGamification 
                            difficulty={difficulty}
                            setDifficulty={setDifficulty}
                            estimatedHours={estimatedHours}
                            setEstimatedHours={setEstimatedHours}
                        />

                        <GTDateScheduler 
                            startDate={startDate}
                            setStartDate={setStartDate}
                            endDate={endDate}
                            setEndDate={setEndDate}
                        />
                    </fieldset>
                </div>
                    
                <div className="bg-white shrink-0 z-30 px-6 pb-6 pt-2 border-t border-gray-100">
                    <ContentActionFooter 
                        mode={initialData ? 'EDIT' : 'CREATE'}
                        onCancel={onClose}
                        onDelete={initialData && onDelete && isAdmin ? (async () => { if(await showConfirm('แน่ใจนะว่าจะลบงานนี้?', 'ยืนยันการลบ')) { onDelete(initialData.id); onClose(); } }) : undefined}
                        onSendQC={handleSendToQC}
                        isSaving={Boolean(isSaving)}
                        isSendingQC={isSendingQC}
                        canSendQC={isOwnerOrAssignee}
                        showSendQC={Boolean(initialData && !isTaskDone && status !== 'WAITING' && status !== 'FEEDBACK')}
                        showDelete={Boolean(initialData && onDelete && isAdmin)}
                    />
                </div>
            </form>

            {/* Create Script Modal - Moved OUTSIDE the form */}
            <CreateScriptModal 
                isOpen={isCreateScriptModalOpen}
                onClose={() => setIsCreateScriptModalOpen(false)}
                onSubmit={handleCreateScriptSubmit}
                channels={channels}
                masterOptions={masterOptions}
            />
        </>
    );
};

export default GeneralTaskInputs;
