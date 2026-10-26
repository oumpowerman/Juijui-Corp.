
import React, { useState } from 'react';
import { MessageSquare, Paperclip, AlertCircle, Flag, Send, Loader2 } from 'lucide-react';
import { Task, User, MasterOption } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, Variants } from 'framer-motion';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useToast } from '../../context/ToastContext';
import { useTasks } from '../../hooks/useTasks';
import { isTaskCompleted } from '../../constants';
import { supabase } from '../../lib/supabase';
import TaskDetailHeader from './detail/TaskDetailHeader';
import TaskInfoView from './detail/TaskInfoView';
import QCSubmissionModal from './QCSubmissionModal';

interface TaskDetailProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[];
    currentUser?: User;
    onEdit: () => void;
    onSave?: (task: Task) => void;
    onDelete?: () => void;
    onClose: () => void;
    onOpenTask?: (task: Task, currentViewMode?: string) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
    task, users, masterOptions, currentUser, onEdit, onSave, onDelete, onClose, onOpenTask 
}) => {
    const { showConfirm, showAlert } = useGlobalDialog();
    const { showToast } = useToast();
    const { handleSendToQC: sendToQC } = useTasks();

    const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const [isSendingQC, setIsSendingQC] = useState(false);

    const isAdmin = currentUser?.role === 'ADMIN';
    const isAssigneeOrOwner = (currentUser && (task.assigneeIds || []).includes(currentUser.id)) || isAdmin;
    const isDone = isTaskCompleted(task.status);
    const isWaiting = task.status === 'WAITING';
    const canSubmitQC = Boolean(isAssigneeOrOwner && !isDone && !isWaiting);
    
    const getPriorityInfo = (priority?: string) => {
        if (!priority) return { label: 'ปกติ', color: 'slate', icon: Flag };
        switch (priority) {
            case 'URGENT': return { label: 'ด่วนที่สุด', color: 'rose', icon: AlertCircle };
            case 'HIGH': return { label: 'สำคัญมาก', color: 'orange', icon: Flag };
            case 'MEDIUM': return { label: 'ปกติ', color: 'indigo', icon: Flag };
            case 'LOW': return { label: 'ต่ำ', color: 'slate', icon: Flag };
            default: return { label: priority, color: 'slate', icon: Flag };
        }
    };

    const getDifficultyLevel = (difficulty?: string) => {
        switch (difficulty) {
            case 'EASY': return 1;
            case 'MEDIUM': return 3;
            case 'HARD': return 5;
            default: return 0;
        }
    };

    const priorityInfo = getPriorityInfo(task.priority);
    const difficultyLevel = getDifficultyLevel(task.difficulty);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const sectionVariants: Variants = {
        hidden: { opacity: 0, scale: 0.98, y: 15 },
        visible: { 
            opacity: 1, 
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 20, stiffness: 120 }
        }
    };

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    const handleDeleteClick = async () => {
        if (!onDelete) return;
        const confirm = await showConfirm(
            `คุณแน่ใจว่าต้องการลบรายการ "${task.title}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            'ยืนยันการลบรายการ'
        );
        if (confirm) {
            onDelete();
        }
    };

    const handleOpenQCModal = async () => {
        if (!canSubmitQC) return;
        setIsSendingQC(true);
        try {
            const { data: reviews } = await supabase
                .from('task_reviews')
                .select('round, status')
                .eq('task_id', task.id)
                .order('round', { ascending: false });

            if (reviews?.some(r => r.status === 'PENDING')) {
                const pendingRound = reviews.find(r => r.status === 'PENDING')?.round;
                await showAlert(`ตรวจพบรายการ "Draft ${pendingRound}" ที่รอการตรวจสอบอยู่แล้วในระบบ กรุณารอการตรวจสอบรอบนี้ให้เสร็จสิ้นก่อนครับ`, 'ไม่สามารถส่งงานได้');
                return;
            }

            setIsQCModalOpen(true);
        } catch (err: any) {
            console.error("Submission check error:", err);
            showToast(err.message || 'ตรวจสอบข้อมูลส่งตรวจไม่สำเร็จ', 'error');
        } finally {
            setIsSendingQC(false);
        }
    };

    const handleConfirmQCSubmit = async (notes: string, reviewerId: string) => {
        if (!currentUser) return;
        try {
            const assets = task.assets || [];
            const submissionAssetUrl = assets.length > 0 ? assets[assets.length - 1].url : undefined;
            const updatedTask = await sendToQC(task, currentUser, notes || undefined, submissionAssetUrl, reviewerId);
            
            onSave?.(updatedTask);
            await showAlert('ส่งงานเรียบร้อยแล้ว! 🚀 ผู้ตรวจที่คุณเลือกจะได้รับแจ้งเตือนทันทีและงานจะย้ายไปที่ช่อง "รอตรวจ"', 'ส่งงานสำเร็จ');
            onClose();
        } catch (err: any) {
            console.error("Submission error details:", err);
            showToast(err.message || 'ส่งงานไม่สำเร็จ', 'error');
            throw err;
        }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            <TaskDetailHeader 
                task={task}
                users={users}
                isExpanded={isHeaderExpanded}
                setIsExpanded={setIsHeaderExpanded}
                onEdit={onEdit}
                onDeleteClick={handleDeleteClick}
            />

            <TaskInfoView
                task={task}
                users={users}
                difficultyLevel={difficultyLevel}
                showAlert={showAlert}
                onOpenTask={onOpenTask}
                onEdit={onEdit}
                priorityInfo={priorityInfo}
                sectionVariants={sectionVariants}
                bouncyHover={bouncyHover}
            />

            {/* --- COMPACT FOOTER --- */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center shrink-0">
                <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
                    {task.createdAt && (
                        <div className="flex flex-col shrink-0">
                            <span className="text-[7.5px] sm:text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-tighter sm:tracking-normal">{format(new Date(task.createdAt), 'd MMM yy, HH:mm', { locale: th })}</span>
                        </div>
                    )}
                    <div className="w-px h-5 bg-slate-100 shrink-0" />
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                        <div className="flex items-center gap-1.5 text-slate-300">
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">0 Comments</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                            <Paperclip className="w-3 h-3" />
                            <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider">{task.assets?.length || 0} Assets</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                    {canSubmitQC && (
                        <button 
                            type="button"
                            onClick={handleOpenQCModal}
                            disabled={isSendingQC}
                            className="flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-indigo-200 transition-all active:scale-95 shrink-0"
                            title="ส่งงานตรวจคุณภาพ (QC)"
                        >
                            {isSendingQC ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Send className="w-3.5 h-3.5" />
                            )}
                            <span>ส่งตรวจ (QC)</span>
                        </button>
                    )}

                    <button 
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all active:scale-95 text-center shrink-0"
                    >
                        Close Window
                    </button>
                </div>
            </div>

            {/* QC Submission Modal */}
            {currentUser && (
                <QCSubmissionModal
                    isOpen={isQCModalOpen}
                    onClose={() => setIsQCModalOpen(false)}
                    onSubmit={handleConfirmQCSubmit}
                    task={task}
                    users={users}
                    masterOptions={masterOptions}
                    currentUser={currentUser}
                    assets={task.assets || []}
                />
            )}
        </motion.div>
    );
};

export default TaskDetail;
