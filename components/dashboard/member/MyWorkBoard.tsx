
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, MasterOption, User } from '../../../types';
import { isTaskCompleted, isTaskTodo } from '../../../constants';
import { 
    Layers, 
    Maximize2, 
    Minimize2, 
    PanelLeftOpen, 
    Flame, 
    Siren, 
    AlertCircle, 
    Sparkles, 
    Skull,
    AlertTriangle 
} from 'lucide-react';
import { subDays, isAfter } from 'date-fns'; // Import date helpers
import TaskCategoryModal from '../../TaskCategoryModal';
import DoneHistoryModal from './board/DoneHistoryModal'; // Import New Modal
import WorkColumn from './board/WorkColumn';
import QCSubmissionModal from '../../task/QCSubmissionModal';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';
import { useTaskContext } from '../../../context/TaskContext';
import { useTasks } from '../../../hooks/useTasks';
import { useToast } from '../../../context/ToastContext';
import { supabase } from '../../../lib/supabase';

import { motion, AnimatePresence, type Variants } from 'framer-motion';

const focusBtnSlideVariants: Variants = {
    initial: {
        opacity: 0,
        x: -28,
        scale: 0.92,
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 280,
            damping: 26,
        },
    },
    exit: {
        opacity: 0,
        x: -28,
        scale: 0.92,
        transition: {
            type: 'spring',
            stiffness: 280,
            damping: 26,
        },
    },
};

export interface UrgencyStats {
    urgentCount: number;
    overdueCount: number;
    totalScore: number;
    tier: 1 | 2 | 3 | 4 | 5;
}

interface MyWorkBoardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    users: User[];
    currentUser: User;
    onOpenTask: (task: Task) => void;
    onUpdateTask?: (task: Task) => void;
    onDeleteTask?: (taskId: string) => void;
    isUltimate?: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    urgentCount?: number;
    urgencyStats?: UrgencyStats;
}

type ColumnType = 'TODO' | 'DOING' | 'WAITING' | 'DONE';

const MyWorkBoard: React.FC<MyWorkBoardProps> = ({ 
    tasks, 
    masterOptions, 
    users, 
    currentUser, 
    onOpenTask, 
    onUpdateTask, 
    onDeleteTask, 
    isUltimate = false,
    isExpanded = false,
    onToggleExpand,
    urgentCount = 0,
    urgencyStats
}) => {
    const { showAlert } = useGlobalDialog();
    const { showToast } = useToast();
    const { handleSendToQC } = useTasks();
    const [activeModalColumn, setActiveModalColumn] = useState<ColumnType | null>(null);
    const [isDoneHistoryOpen, setIsDoneHistoryOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ColumnType>('TODO');
    const [taskForQC, setTaskForQC] = useState<Task | null>(null);
    const [isQCModalOpen, setIsQCModalOpen] = useState(false);
    const isAdmin = currentUser.role === 'ADMIN';

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            const isHorizontalOverflow = container.scrollWidth > container.clientWidth;
            if (isHorizontalOverflow && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                container.scrollLeft += e.deltaY;
                e.preventDefault();
            }
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheelEvent);
        };
    }, []);

    // 🚀 Lazy-load more items when opening history modal
    const { fetchCompletedTasks } = useTaskContext();
    useEffect(() => {
        if (isDoneHistoryOpen && currentUser?.id) {
            fetchCompletedTasks({ userId: currentUser.id, limit: 100 });
        }
    }, [isDoneHistoryOpen, currentUser?.id, fetchCompletedTasks]);

    // --- Logic: Categorize Tasks ---
    const getPhase = (status: string): ColumnType => {
        const s = status ? status.toUpperCase() : '';
        if (isTaskCompleted(s)) return 'DONE';
        if (isTaskTodo(s)) return 'TODO';
        const WAITING_KEYWORDS = ['FEEDBACK', 'WAITING', 'APPROVE', 'REVIEW', 'QC', 'PENDING', 'CHECK'];
        if (WAITING_KEYWORDS.some(k => s.includes(k))) return 'WAITING';
        return 'DOING';
    };

    const { todoTasks, doingTasks, waitingTasks, doneTasks, allDoneTasks } = useMemo(() => {
        const activeTasks = tasks.filter(t => !t.isUnscheduled && t.type !== 'CONTENT');
        const doneCutoffDate = subDays(new Date(), 7);

        return {
            todoTasks: activeTasks.filter(t => getPhase(t.status as string) === 'TODO'),
            doingTasks: activeTasks.filter(t => getPhase(t.status as string) === 'DOING'),
            waitingTasks: activeTasks.filter(t => getPhase(t.status as string) === 'WAITING'),
            doneTasks: activeTasks.filter(t => {
                if (getPhase(t.status as string) !== 'DONE') return false;
                return isAfter(new Date(t.endDate), doneCutoffDate);
            }),
            allDoneTasks: activeTasks.filter(t => getPhase(t.status as string) === 'DONE'),
        };
    }, [tasks]);

    const handleDropTask = async (taskId: string, targetType: ColumnType) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !onUpdateTask) return;

        if (targetType === 'DONE' && !isAdmin) {
            showAlert('🔒 เฉพาะหัวหน้า/Admin เท่านั้นที่สามารถย้ายงานไปช่อง "เสร็จแล้ว" ได้\n\nกรุณากด "ส่งงาน" ในหน้าแก้ไขงาน เพื่อให้หัวหน้าตรวจสอบครับ');
            return;
        }

        const currentType = getPhase(task.status as string);
        if (currentType === targetType) return;

        // If dragging into WAITING column -> Trigger standard QC Submission flow
        if (targetType === 'WAITING') {
            const isAssigneeOrOwner = (task.assigneeIds || []).includes(currentUser.id) || isAdmin;
            if (!isAssigneeOrOwner) {
                showAlert('🔒 เฉพาะผู้รับผิดชอบงานหรือ Admin เท่านั้นที่สามารถส่งตรวจงานนี้ได้ครับ', 'ไม่มีสิทธิ์ส่งงาน');
                return;
            }

            if (currentType === 'DONE') {
                showAlert('งานชิ้นนี้อยู่ในสถานะเสร็จสมบูรณ์แล้ว ไม่จำเป็นต้องส่งตรวจซ้ำครับ', 'แจ้งเตือน');
                return;
            }

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

                setTaskForQC(task);
                setIsQCModalOpen(true);
            } catch (err: any) {
                console.error("Submission check error:", err);
                showToast(err.message || 'ตรวจสอบข้อมูลส่งตรวจไม่สำเร็จ', 'error');
            }
            return;
        }

        let newStatus = task.status;
        if (targetType === 'TODO') newStatus = 'TODO';
        else if (targetType === 'DOING') newStatus = 'DOING';
        else if (targetType === 'DONE' && isAdmin) newStatus = 'DONE';
        else return;

        onUpdateTask({ ...task, status: newStatus });
    };

    const handleConfirmQCSubmit = async (notes: string, reviewerId: string) => {
        if (!taskForQC || !currentUser) return;
        try {
            const assets = taskForQC.assets || [];
            const submissionAssetUrl = assets.length > 0 ? assets[assets.length - 1].url : undefined;

            const updatedTask = await handleSendToQC(
                taskForQC,
                currentUser,
                notes || undefined,
                submissionAssetUrl,
                reviewerId
            );

            onUpdateTask?.(updatedTask);
            await showAlert('ส่งงานเรียบร้อยแล้ว! 🚀 ผู้ตรวจที่คุณเลือกจะได้รับแจ้งเตือนทันที และงานจะย้ายไปที่ช่อง "รอตรวจ"', 'ส่งงานสำเร็จ');
            setIsQCModalOpen(false);
            setTaskForQC(null);
        } catch (err: any) {
            console.error("Drag to QC error:", err);
            showToast(err.message || 'ส่งงานไม่สำเร็จ', 'error');
            throw err;
        }
    };

    const getModalData = () => {
        switch (activeModalColumn) {
            case 'TODO': return { title: '🎒 รายการที่รอทำ (To Do)', tasks: todoTasks, theme: 'slate' };
            case 'DOING': return { title: '⚡ กำลังลุยงาน (Doing)', tasks: doingTasks, theme: 'blue' };
            case 'WAITING': return { title: '☕ รอตรวจ / รอผล (Waiting)', tasks: waitingTasks, theme: 'orange' };
            case 'DONE': return { title: '', tasks: [], theme: 'green' }; 
            default: return { title: '', tasks: [], theme: 'slate' };
        }
    };
    const modalData = getModalData();

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`min-h-0 flex flex-col rounded-[2.5rem] border shadow-2xl overflow-hidden relative group transition-colors duration-300 ${
                isUltimate 
                    ? 'h-full bg-[#0a0c16]/30 backdrop-blur-xl border-indigo-500/20 text-white' 
                    : 'h-full bg-white/40 backdrop-blur-xl border-white/60 text-slate-800'
            }`}
        >
            {/* Animated Background Blobs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 45, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
                    isUltimate ? 'bg-indigo-500/10' : 'bg-indigo-200'
                }`}
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    x: [0, -30, 0],
                    opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[80px] pointer-events-none ${
                    isUltimate ? 'bg-purple-500/10' : 'bg-purple-200'
                }`}
            />

            {/* Header Section */}
            <div className="p-4 md:p-8 pb-3 md:pb-4 relative z-10 flex-shrink-0">
                <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 md:gap-4">
                        <div className="p-2 md:p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl md:rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                            <Layers className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h3 className={`text-lg md:text-2xl font-bold tracking-tight leading-none ${isUltimate ? 'text-indigo-200' : 'text-slate-800'}`}>กระดานงานของฉัน</h3>
                            <p className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 md:mt-1">My Personal Work Board</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <AnimatePresence mode="popLayout" initial={false}>
                            {onToggleExpand && isExpanded && (
                                <motion.div
                                    key="open-focus-zone-tab"
                                    variants={focusBtnSlideVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    {(() => {
                                        const totalScore = urgencyStats?.totalScore ?? (urgentCount || 0);
                                        const tier: 1 | 2 | 3 | 4 | 5 = urgencyStats?.tier ?? (
                                            totalScore >= 13 ? 5 :
                                            totalScore >= 9 ? 4 :
                                            totalScore >= 6 ? 3 :
                                            totalScore >= 3 ? 2 : 1
                                        );

                                        if (totalScore === 0) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={onToggleExpand}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-102 active:scale-95 cursor-pointer text-xs font-bold shadow-xs border ${
                                                        isUltimate 
                                                            ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white' 
                                                            : 'bg-white/90 text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:text-indigo-600'
                                                    }`}
                                                    title="เปิด Focus Zone (ไม่มีภารกิจเร่งด่วน)"
                                                >
                                                    <PanelLeftOpen className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="hidden sm:inline">เปิด Focus Zone</span>
                                                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">
                                                        ว่าง
                                                    </span>
                                                </button>
                                            );
                                        }

                                        // Tier 1: 1 - 2 items (Calm Sky Blue)
                                        if (tier === 1) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={onToggleExpand}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-102 active:scale-95 cursor-pointer text-xs font-bold shadow-xs border ${
                                                        isUltimate 
                                                            ? 'bg-sky-950/40 text-sky-200 border-sky-800 hover:bg-sky-900/50' 
                                                            : 'bg-sky-50 text-sky-900 border-sky-200/90 hover:bg-sky-100'
                                                    }`}
                                                    title={`Tier 1: มีงานด่วน/เกินกำหนด ${totalScore} ชิ้น (จัดการได้สบายๆ)`}
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                                    <span className="hidden sm:inline">เปิด Focus Zone</span>
                                                    <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px] font-bold shadow-xs">
                                                        {totalScore}
                                                    </span>
                                                </button>
                                            );
                                        }

                                        // Tier 2: 3 - 5 items (Amber Attention)
                                        if (tier === 2) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={onToggleExpand}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-102 active:scale-95 cursor-pointer text-xs font-bold shadow-xs border ${
                                                        isUltimate 
                                                            ? 'bg-amber-950/50 text-amber-200 border-amber-800 hover:bg-amber-900/60' 
                                                            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                                    }`}
                                                    title={`Tier 2: งานเริ่มสะสม ${totalScore} ชิ้น (ควรเริ่มจัดสรรเวลา)`}
                                                >
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                    <span className="hidden sm:inline">เปิด Focus Zone</span>
                                                    <span className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                                        {totalScore}
                                                    </span>
                                                </button>
                                            );
                                        }

                                        // Tier 3: 6 - 8 items (Orange Fire Alert)
                                        if (tier === 3) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={onToggleExpand}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-102 active:scale-95 cursor-pointer text-xs font-bold shadow-xs border ${
                                                        isUltimate 
                                                            ? 'bg-orange-950/50 text-orange-200 border-orange-700 hover:bg-orange-900/60' 
                                                            : 'bg-orange-50 text-orange-950 border-orange-300/90 hover:bg-orange-100'
                                                    }`}
                                                    title={`Tier 3: งานด่วนสะสม ${totalScore} ชิ้น (เร่งสะสางด่วน)`}
                                                >
                                                    <Flame className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                                                    <span className="hidden sm:inline">เปิด Focus Zone</span>
                                                    <span className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-bold shadow-sm ring-1 ring-orange-300">
                                                        <Flame className="w-2.5 h-2.5" />
                                                        {totalScore} ด่วน
                                                    </span>
                                                </button>
                                            );
                                        }

                                        // Tier 4: 9 - 12 items (Rose/Crimson Siren Alert)
                                        if (tier === 4) {
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={onToggleExpand}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-102 active:scale-95 cursor-pointer text-xs font-bold shadow-sm border ${
                                                        isUltimate 
                                                            ? 'bg-rose-950/60 text-rose-200 border-rose-700 hover:bg-rose-900/70 shadow-rose-950/50' 
                                                            : 'bg-rose-50 text-rose-950 border-rose-400 hover:bg-rose-100 shadow-rose-200/50'
                                                    }`}
                                                    title={`Tier 4: งานวิกฤติรุมเร้า ${totalScore} ชิ้น (ต้องเคลียร์ทันที!)`}
                                                >
                                                    <Siren className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                                                    <span className="hidden sm:inline">เปิด Focus Zone</span>
                                                    <span className="flex items-center gap-1.5 px-2.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-md shadow-rose-500/40 ring-2 ring-rose-200 animate-pulse">
                                                        <Siren className="w-2.5 h-2.5" />
                                                        {totalScore} วิกฤติ!
                                                    </span>
                                                </button>
                                            );
                                        }

                                        // Tier 5: 13+ items (Nightmare Hellfire / Catastrophic Urgency)
                                        return (
                                            <button
                                                type="button"
                                                onClick={onToggleExpand}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold shadow-md border-2 ${
                                                    isUltimate 
                                                        ? 'bg-gradient-to-r from-red-950/80 via-rose-950/80 to-purple-950/80 text-rose-100 border-red-500 hover:border-red-400 shadow-red-900/60' 
                                                        : 'bg-gradient-to-r from-red-500/20 via-rose-500/25 to-purple-500/20 text-rose-950 border-red-500 hover:border-red-600 shadow-red-500/30'
                                                }`}
                                                title={`Tier 5: ภาวะฉุกเฉินสูงสุด ${totalScore} ชิ้น (ละเลยไม่ได้เด็ดขาด!)`}
                                            >
                                                <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                                                    <Flame className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                                                    <span className="animate-ping absolute -top-0.5 -right-0.5 inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                                                </span>
                                                <span className="hidden sm:inline">เปิด Focus Zone</span>
                                                <span className="flex items-center gap-1.5 px-2.5 py-0.2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 text-white text-[10px] font-bold shadow-lg shadow-red-500/50 ring-2 ring-red-300 animate-bounce">
                                                    <Flame className="w-2.5 h-2.5 text-amber-200" />
                                                    {totalScore} ฉุกเฉินขั้นสุด!
                                                </span>
                                            </button>
                                        );
                                    })()}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-sm border ${
                            isUltimate 
                                ? 'bg-slate-900/60 border-indigo-500/20' 
                                : 'bg-white/80 border-slate-100'
                        }`}>
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isUltimate ? 'text-slate-400' : 'text-slate-500'}`}>Total: </span>
                            <span className={`text-xs md:text-sm font-bold ${isUltimate ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                {todoTasks.length + doingTasks.length + waitingTasks.length + doneTasks.length}
                            </span>
                        </div>

                        <AnimatePresence mode="popLayout" initial={false}>
                            {onToggleExpand && !isExpanded && (
                                <motion.div
                                    key="expand-workboard-btn"
                                    variants={focusBtnSlideVariants}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                >
                                    <button
                                        type="button"
                                        onClick={onToggleExpand}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl transition-all hover:scale-102 active:scale-95 cursor-pointer text-xs font-bold shadow-xs border group ${
                                            isUltimate 
                                                ? 'bg-slate-900/70 text-slate-300 border-indigo-500/20 hover:text-white hover:bg-slate-800' 
                                                : 'bg-white/80 text-slate-600 border-slate-200/80 hover:text-indigo-600 hover:bg-white'
                                        }`}
                                        title="ขยายกระดานเต็มหน้าจอ (Full Width)"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                                        <span className="hidden md:inline">ขยายเต็มจอ</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile Segments / iOS style Switcher (Visible on mobile only) */}
            <div className="md:hidden px-4 mb-3 relative z-10 select-none">
                <div className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border ${
                    isUltimate 
                        ? 'bg-[#121424]/60 border-indigo-500/10' 
                        : 'bg-slate-100/90 border-slate-200/60'
                }`}>
                    <button
                        onClick={() => setActiveTab('TODO')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative ${
                            activeTab === 'TODO'
                                ? isUltimate 
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                                    : 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                : isUltimate ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider">To Do</span>
                        <span className={`text-[10px] font-bold mt-1 rounded-md px-1.5 py-0.2 ${
                            activeTab === 'TODO'
                                ? isUltimate ? 'bg-indigo-400/20 text-indigo-300' : 'bg-slate-100 text-slate-700'
                                : isUltimate ? 'bg-slate-950/40 text-slate-600' : 'bg-slate-200/60 text-slate-500'
                        }`}>
                            {todoTasks.length}
                        </span>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('DOING')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative ${
                            activeTab === 'DOING'
                                ? isUltimate 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                    : 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200/50'
                                : isUltimate ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider">Doing</span>
                        <span className={`text-[10px] font-bold mt-1 rounded-md px-1.5 py-0.2 ${
                            activeTab === 'DOING'
                                ? isUltimate ? 'bg-purple-400/20 text-purple-300' : 'bg-indigo-100 text-indigo-800'
                                : isUltimate ? 'bg-slate-950/40 text-slate-600' : 'bg-slate-200/60 text-slate-500'
                        }`}>
                            {doingTasks.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('WAITING')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative ${
                            activeTab === 'WAITING'
                                ? isUltimate 
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35' 
                                    : 'bg-amber-50 text-amber-700 shadow-sm border border-[#f59e0b]/20'
                                : isUltimate ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider">Waiting</span>
                        <span className={`text-[10px] font-bold mt-1 rounded-md px-1.5 py-0.2 ${
                            activeTab === 'WAITING'
                                ? isUltimate ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                                : isUltimate ? 'bg-slate-950/40 text-slate-600' : 'bg-slate-200/60 text-slate-500'
                        }`}>
                            {waitingTasks.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('DONE')}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative ${
                            activeTab === 'DONE'
                                ? isUltimate 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35' 
                                    : 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200/50'
                                : isUltimate ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
                        <span className={`text-[10px] font-bold mt-1 rounded-md px-1.5 py-0.2 ${
                            activeTab === 'DONE'
                                ? isUltimate ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                                : isUltimate ? 'bg-slate-950/40 text-slate-600' : 'bg-slate-200/60 text-slate-500'
                        }`}>
                            {doneTasks.length}
                        </span>
                    </button>
                </div>
            </div>
            
            {/* 4-Column Grid - Adaptive layout (single column on mobile, scrollable list on md, grid on xl+) */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 min-h-0 p-4 md:p-6 pb-6 pt-2 relative z-10 overflow-x-auto overflow-y-auto scrollbar-thin"
            >
                <div className={`flex xl:grid xl:grid-cols-4 gap-4 md:gap-5 h-full w-full md:w-max xl:w-full ${isUltimate ? '' : 'min-h-[400px] md:min-h-[500px]'}`}>
                    
                    <div className={`${activeTab === 'TODO' ? 'flex w-full md:w-[320px] xl:w-auto' : 'hidden md:flex md:w-[320px] xl:w-auto'} flex-col h-full flex-shrink-0 xl:flex-shrink`}>
                        <WorkColumn 
                            type="TODO" 
                            tasks={todoTasks} 
                            users={users}
                            masterOptions={masterOptions}
                            isDroppable={true}
                            onDropTask={handleDropTask}
                            onOpenTask={onOpenTask}
                            onDeleteTask={onDeleteTask}
                            onViewAll={() => setActiveModalColumn('TODO')}
                            isUltimate={isUltimate}
                        />
                    </div>

                    <div className={`${activeTab === 'DOING' ? 'flex w-full md:w-[320px] xl:w-auto' : 'hidden md:flex md:w-[320px] xl:w-auto'} flex-col h-full flex-shrink-0 xl:flex-shrink`}>
                        <WorkColumn 
                            type="DOING" 
                            tasks={doingTasks} 
                            users={users}
                            masterOptions={masterOptions}
                            isDroppable={true}
                            onDropTask={handleDropTask}
                            onOpenTask={onOpenTask}
                            onDeleteTask={onDeleteTask}
                            onViewAll={() => setActiveModalColumn('DOING')}
                            isUltimate={isUltimate}
                        />
                    </div>

                    <div className={`${activeTab === 'WAITING' ? 'flex w-full md:w-[320px] xl:w-auto' : 'hidden md:flex md:w-[320px] xl:w-auto'} flex-col h-full flex-shrink-0 xl:flex-shrink`}>
                        <WorkColumn 
                            type="WAITING" 
                            tasks={waitingTasks} 
                            users={users}
                            masterOptions={masterOptions}
                            isDroppable={true}
                            onDropTask={handleDropTask}
                            onOpenTask={onOpenTask}
                            onDeleteTask={onDeleteTask}
                            onViewAll={() => setActiveModalColumn('WAITING')}
                            isUltimate={isUltimate}
                        />
                    </div>

                    <div className={`${activeTab === 'DONE' ? 'flex w-full md:w-[320px] xl:w-auto' : 'hidden md:flex md:w-[320px] xl:w-auto'} flex-col h-full flex-shrink-0 xl:flex-shrink`}>
                        <WorkColumn 
                            type="DONE" 
                            tasks={doneTasks} 
                            users={users}
                            masterOptions={masterOptions}
                            isDroppable={isAdmin}
                            onDropTask={handleDropTask}
                            onOpenTask={onOpenTask}
                            onDeleteTask={onDeleteTask}
                            onViewAll={() => setIsDoneHistoryOpen(true)}
                            isUltimate={isUltimate}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TaskCategoryModal 
                isOpen={!!activeModalColumn && activeModalColumn !== 'DONE'}
                onClose={() => setActiveModalColumn(null)}
                title={modalData.title}
                tasks={modalData.tasks}
                channels={[]} 
                onEditTask={onOpenTask}
                colorTheme={modalData.theme}
            />

            <DoneHistoryModal 
                isOpen={isDoneHistoryOpen}
                onClose={() => setIsDoneHistoryOpen(false)}
                tasks={allDoneTasks}
                onOpenTask={onOpenTask}
            />

            {/* QC Submission Modal on Drag to Waiting */}
            {taskForQC && currentUser && (
                <QCSubmissionModal 
                    isOpen={isQCModalOpen}
                    onClose={() => {
                        setIsQCModalOpen(false);
                        setTaskForQC(null);
                    }}
                    onSubmit={handleConfirmQCSubmit}
                    task={taskForQC}
                    users={users}
                    masterOptions={masterOptions}
                    currentUser={currentUser}
                    assets={taskForQC.assets || []}
                />
            )}
        </motion.div>
    );
};

export default MyWorkBoard;
