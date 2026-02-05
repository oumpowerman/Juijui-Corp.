
import React, { useState, useMemo } from 'react';
import { Task, User, MasterOption } from '../../types';
import { useGeneralTaskForm } from '../../hooks/useGeneralTaskForm';
import { AlertTriangle, Trash2, Send, Loader2, Lock, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TaskAssets from '../TaskAssets'; // Import TaskAssets component
import { isTaskCompleted } from '../../constants';

// Import Refactored Parts
import GTAssigneeSelector from './form-parts/GTAssigneeSelector';
import GTHeaderInput from './form-parts/GTHeaderInput';
import GTProjectLinker from './form-parts/GTProjectLinker';
import GTCoreDetails from './form-parts/GTCoreDetails';
import GTGuidelines from './form-parts/GTGuidelines';
import GTGamification from './form-parts/GTGamification';
import GTDateScheduler from './form-parts/GTDateScheduler';

interface GeneralTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User; 
    onSave: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onClose: () => void;
    projects?: Task[]; 
}

const GeneralTaskForm: React.FC<GeneralTaskFormProps> = ({ 
    initialData, selectedDate, users, masterOptions, currentUser, onSave, onDelete, onClose, projects = []
}) => {
    const { showToast } = useToast();
    const { showConfirm, showAlert } = useGlobalDialog();
    const [isSendingQC, setIsSendingQC] = useState(false);
    const isAdmin = currentUser?.role === 'ADMIN';

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
        assets, addAsset, removeAsset, // New from Hook
        error,
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

    const activeUsers = users.filter(u => u.isActive);
    const isOwnerOrAssignee = (currentUser && assigneeIds.includes(currentUser.id)) || isAdmin;
    
    // --- READ-ONLY LOGIC ---
    // If it's an existing task AND current user is NOT an assignee/admin => Read Only
    const isReadOnly = !!initialData && !isOwnerOrAssignee;

    // Filter Status Options: Hide 'DONE' for non-admins (Logic maintained, but irrelevant in Read-Only)
    const filteredStatusOptions = useMemo(() => {
        if (isAdmin) return taskStatusOptions;
        return taskStatusOptions.filter(opt => !isTaskCompleted(opt.key));
    }, [taskStatusOptions, isAdmin]);

    // --- Project Picker Logic ---
    const parentProject = useMemo(() => {
        return contentId ? projects.find(p => p.id === contentId) : null;
    }, [contentId, projects]);

    // --- LOGIC: Suggested Tasks based on Position ---
    const suggestedTasks = useMemo(() => {
        // Only active in Individual mode with 1 person selected
        if (assigneeType !== 'INDIVIDUAL' || assigneeIds.length !== 1) return [];
        
        const user = users.find(u => u.id === assigneeIds[0]);
        if (!user || !user.position) return [];
        
        // 1. Find the MasterOption for this Position (to get the KEY, e.g. "EDITOR")
        const positionOpt = masterOptions.find(o => o.type === 'POSITION' && o.label === user.position);
        
        // 2. If found, find Responsibilities that have parentKey === positionOpt.key
        if (positionOpt) {
            return masterOptions.filter(o => o.type === 'RESPONSIBILITY' && o.parentKey === positionOpt.key);
        }
        
        return [];
    }, [assigneeIds, assigneeType, users, masterOptions]);

    const handleSendToQC = async () => {
        // 1. Disable Immediately to prevent double clicks
        if (isSendingQC) return;
        
        // Security Check
        if (!isOwnerOrAssignee) {
             await showAlert('เฉพาะผู้รับผิดชอบงานนี้เท่านั้นที่สามารถส่งงานได้', '🔒 สิทธิ์ไม่เพียงพอ');
             return;
        }

        setIsSendingQC(true);

        // 2. Validation Checks
        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
            setIsSendingQC(false);
            return;
        }

        // --- FIX: Check for EXISTING Pending Reviews ---
        const existingPendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
        if (existingPendingReview) {
             await showAlert(
                 `มีรายการ "Draft ${existingPendingReview.round}" รอตรวจอยู่แล้ว \nกรุณารอผลการตรวจ หรือยกเลิกรายการเดิมก่อนส่งใหม่`,
                 '⚠️ ส่งซ้ำไม่ได้'
             );
             setIsSendingQC(false);
             return;
        }

        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;
        
        // 3. Confirmation Dialog
        const confirmed = await showConfirm(
            `งานจะถูกเปลี่ยนสถานะเป็น "Waiting" และส่งแจ้งเตือนให้หัวหน้าทราบ`,
            `🚀 ยืนยันการส่งงาน?`
        );

        if (!confirmed) {
            setIsSendingQC(false);
            return;
        }

        // 4. Proceed with API
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

            // Update status to WAITING (mapped from FEEDBACK in DB or specific key)
            const targetStatus = 'FEEDBACK'; // Or 'WAITING' if available in Master Data
            setStatus(targetStatus);
            await supabase.from('tasks').update({ status: targetStatus }).eq('id', initialData.id);
            
            showToast(`ส่งงานเรียบร้อย! 🚀 รอหัวหน้าตรวจรับ`, 'success');
            onClose();

        } catch (err: any) {
            console.error(err);
            showToast('ส่งงานไม่สำเร็จ: ' + err.message, 'error');
            setIsSendingQC(false); // Re-enable only on error
        }
    };

    // Wrapper to Auto-fill Position when User Selected in Solo Mode
    const handleUserSelectWrapper = (userId: string) => {
        // Call original toggle
        toggleUserSelection(userId);

        // Auto-fill logic
        if (assigneeType === 'INDIVIDUAL') {
            const isSelecting = !assigneeIds.includes(userId);
            
            if (isSelecting) {
                const user = users.find(u => u.id === userId);
                if (user && user.position) {
                    setTargetPosition(user.position);
                }
            } else {
                setTargetPosition(''); // Clear if deselected
            }
        }
    };

    const isTaskDone = isTaskCompleted(status);

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {/* Read-Only Banner */}
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

            {/* Fieldset disables all inputs inside when isReadOnly is true */}
            <fieldset disabled={isReadOnly} className={`space-y-6 ${isReadOnly ? 'opacity-90' : ''}`}>
                
                {/* 1. Assignee Selector */}
                <GTAssigneeSelector 
                    assigneeType={assigneeType}
                    setAssigneeType={setAssigneeType}
                    assigneeIds={assigneeIds}
                    setAssigneeIds={setAssigneeIds}
                    targetPosition={targetPosition}
                    setTargetPosition={setTargetPosition}
                    activeUsers={activeUsers}
                    toggleUserSelection={handleUserSelectWrapper} // Use Wrapper
                    startDate={startDate}
                    endDate={endDate}
                />

                {/* 2. Header & Title */}
                <GTHeaderInput 
                    title={title}
                    setTitle={setTitle}
                    assigneeType={assigneeType}
                    suggestedTasks={suggestedTasks} // Pass suggestions based on selected user
                />

                {/* 3. Project Linker */}
                <GTProjectLinker 
                    parentProject={parentProject}
                    onSetParentProject={handleSetParentProject}
                    projects={projects}
                />

                {/* 4. Core Details (Desc, Priority, Status) */}
                <GTCoreDetails 
                    description={description}
                    setDescription={setDescription}
                    priority={priority}
                    setPriority={setPriority}
                    status={status}
                    setStatus={setStatus}
                    taskStatusOptions={filteredStatusOptions} // Pass Filtered Options
                />

                {/* 5. Guidelines */}
                <GTGuidelines 
                    caution={caution}
                    setCaution={setCaution}
                    importance={importance}
                    setImportance={setImportance}
                />

                {/* 6. Assets (NEW FEATURE) */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <TaskAssets 
                        assets={assets}
                        onAdd={addAsset}
                        onDelete={removeAsset}
                    />
                </div>

                {/* 7. Gamification */}
                <GTGamification 
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    estimatedHours={estimatedHours}
                    setEstimatedHours={setEstimatedHours}
                />

                {/* 8. Dates */}
                <GTDateScheduler 
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                />
            </fieldset>

            {/* Footer */}
            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100 sticky bottom-0 pb-safe-area bg-white z-20">
                <div className="flex items-center gap-2">
                    {/* Delete Button - Only show if NOT ReadOnly and has permission */}
                    {!isReadOnly && initialData && onDelete && isAdmin && (
                        <button type="button" onClick={async () => { if(await showConfirm('แน่ใจนะว่าจะลบงานนี้?', 'ยืนยันการลบ')) { onDelete(initialData.id); onClose(); } }} className="text-red-400 text-sm hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> ลบ
                        </button>
                    )}
                </div>
                <div className="flex space-x-3">
                    {/* Send QC Button - Only show if NOT ReadOnly */}
                    {!isReadOnly && initialData && !isTaskDone && status !== 'FEEDBACK' && (
                        <div className="relative group">
                            <button 
                                type="button" 
                                onClick={handleSendToQC}
                                disabled={isSendingQC || !isOwnerOrAssignee}
                                className={`px-4 py-3 text-sm font-bold border rounded-xl flex items-center transition-colors shadow-sm active:scale-95 ${isOwnerOrAssignee ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'}`}
                                title={!isOwnerOrAssignee ? "เฉพาะคนรับผิดชอบงานเท่านั้น" : "ส่งงานเพื่อให้หัวหน้าตรวจสอบ"}
                            >
                                {isSendingQC ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                ส่งงาน / แจ้งเสร็จ
                            </button>
                            {!isOwnerOrAssignee && (
                                <div className="absolute bottom-full mb-2 right-0 w-40 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
                                    <Lock className="w-3 h-3 inline mr-1"/> เฉพาะผู้รับผิดชอบงาน
                                </div>
                            )}
                        </div>
                    )}

                    <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        {isReadOnly ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
                    </button>
                    
                    {/* Save Button - Hide if ReadOnly */}
                    {!isReadOnly && (
                        <button type="submit" className="px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                            {initialData ? 'บันทึกการแก้ไข' : 'สร้างงานเลย!'}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
};

export default GeneralTaskForm;
