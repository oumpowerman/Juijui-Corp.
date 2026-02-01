
import React, { useState, useMemo } from 'react';
import { Task, User, MasterOption } from '../../types';
import { useGeneralTaskForm } from '../../hooks/useGeneralTaskForm';
import { AlertTriangle, Trash2, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import TaskAssets from '../TaskAssets'; // Import TaskAssets component

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
        if (!initialData?.id) {
            await showAlert('กรุณาบันทึกงานครั้งแรกก่อนส่งตรวจครับ', 'แจ้งเตือน');
            return;
        }

        const pendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
        if (pendingReview) {
             await showAlert(
                 `มีรายการ "Draft ${pendingReview.round}" รอตรวจอยู่แล้ว \nกรุณารอผลการตรวจ หรือยกเลิกรายการเดิมก่อนส่งใหม่`,
                 '⚠️ ส่งซ้ำไม่ได้'
             );
             return;
        }

        const currentRoundCount = initialData.reviews?.length || 0;
        const nextRound = currentRoundCount + 1;
        
        const confirmed = await showConfirm(
            `งานจะถูกส่งเข้าห้องตรวจ และเปลี่ยนสถานะเป็น "Feedback"`,
            `🚀 ยืนยันส่งตรวจ "Draft ${nextRound}" ?`
        );

        if (!confirmed) return;

        setIsSendingQC(true);
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
                details: `ส่งตรวจงาน (Draft ${nextRound})`,
                user_id: currentUser?.id
            });

            setStatus('FEEDBACK');
            await supabase.from('tasks').update({ status: 'FEEDBACK' }).eq('id', initialData.id);
            
            showToast(`ส่ง Draft ${nextRound} เรียบร้อย! 🚀`, 'success');
            onClose();

        } catch (err: any) {
            console.error(err);
            showToast('ส่งตรวจไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsSendingQC(false);
        }
    };

    // Wrapper to Auto-fill Position when User Selected in Solo Mode
    const handleUserSelectWrapper = (userId: string) => {
        // Call original toggle
        toggleUserSelection(userId);

        // Auto-fill logic
        if (assigneeType === 'INDIVIDUAL') {
            // Check if we are selecting (not deselecting)
            // Note: toggleUserSelection logic in hook clears list if same ID is sent.
            // So if assigneeIds already contains userId, we are clearing -> don't auto-fill.
            // If it doesn't contain, we are selecting -> auto-fill.
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

    return (
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
            {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center shadow-sm border border-red-100 animate-bounce"><AlertTriangle className="w-4 h-4 mr-2" />{error}</div>}

            <div className="space-y-6">
                
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
                    taskStatusOptions={taskStatusOptions}
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
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    {initialData && onDelete && (
                        <button type="button" onClick={async () => { if(await showConfirm('แน่ใจนะว่าจะลบงานนี้?', 'ยืนยันการลบ')) { onDelete(initialData.id); onClose(); } }} className="text-red-400 text-sm hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl flex items-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> ลบ
                        </button>
                    )}
                </div>
                <div className="flex space-x-3">
                    {initialData && status !== 'FEEDBACK' && status !== 'DONE' && status !== 'APPROVE' && (
                        <button 
                            type="button" 
                            onClick={handleSendToQC}
                            disabled={isSendingQC}
                            className="px-4 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors flex items-center active:scale-95 disabled:opacity-50"
                        >
                            {isSendingQC ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            ส่งตรวจ
                        </button>
                    )}

                    <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                        ยกเลิก
                    </button>
                    <button type="submit" className="px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    {initialData ? 'บันทึกการแก้ไข' : 'สร้างงานเลย!'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default GeneralTaskForm;
