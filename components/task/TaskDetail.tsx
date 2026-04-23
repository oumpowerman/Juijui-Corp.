
import React from 'react';
import { 
    Calendar, 
    Clock, 
    AlertCircle, 
    Edit3, 
    Trash2, 
    Flag,
    Users,
    FileText,
    MessageSquare,
    Paperclip,
    Info,
    ChevronRight,
    Zap,
    Target,
    AlertTriangle,
    Sparkles,
    Link as LinkIcon,
    Copy
} from 'lucide-react';
import { Task, User, MasterOption } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { motion, Variants } from 'framer-motion';
import Markdown from 'react-markdown';
import { useToast } from '../../context/ToastContext';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface TaskDetailProps {
    task: Task;
    users: User[];
    masterOptions: MasterOption[];
    onEdit: () => void;
    onDelete?: () => void;
    onClose: () => void;
    onOpenTask?: (task: Task) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
    task, users, masterOptions, onEdit, onDelete, onClose, onOpenTask 
}) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();
    
    const getStatusInfo = (status: string) => {
        const option = masterOptions.find(o => o.key === status && o.type === 'TASK_STATUS');
        return {
            label: option?.label || status,
            color: option?.color || 'slate'
        };
    };

    const getPriorityInfo = (priority: string) => {
        switch (priority) {
            case 'URGENT': return { label: 'ด่วนที่สุด', color: 'rose', icon: AlertCircle };
            case 'HIGH': return { label: 'สำคัญมาก', color: 'orange', icon: Flag };
            case 'MEDIUM': return { label: 'ปกติ', color: 'indigo', icon: Flag };
            case 'LOW': return { label: 'ต่ำ', color: 'slate', icon: Flag };
            default: return { label: priority, color: 'slate', icon: Flag };
        }
    };

    const getUserById = (id: string) => users.find(u => u.id === id);

    const getDifficultyLevel = (difficulty?: string) => {
        switch (difficulty) {
            case 'EASY': return 1;
            case 'MEDIUM': return 3;
            case 'HARD': return 5;
            default: return 0;
        }
    };

    const statusInfo = getStatusInfo(task.status);
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

    const handleCopyTitle = () => {
        navigator.clipboard.writeText(task.title);
        showToast('คัดลอกชื่อรายการเรียบร้อยแล้ว ✅', 'success');
    };

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

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col h-full bg-[#FCFDFE] text-slate-700"
        >
            {/* --- SOFT PASTEL HEADER --- */}
            <div className="sticky top-0 z-40 px-8 py-6 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 flex items-center justify-between shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-5">
                    <motion.div 
                        whileHover={{ rotate: -8, scale: 1.15 }}
                        className={`
                            w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)]
                            bg-${statusInfo.color}-50 text-${statusInfo.color}-400 border border-${statusInfo.color}-100
                        `}
                    >
                        <Zap className="w-7 h-7" />
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-2xl font-semibold text-slate-700 tracking-tight leading-none">{task.title}</h3>
                            <button 
                                onClick={handleCopyTitle}
                                className="p-1.5 rounded-xl bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400 transition-all active:scale-90"
                                title="Copy Title"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-${statusInfo.color}-50 text-${statusInfo.color}-500 border border-${statusInfo.color}-100/50`}>
                                {statusInfo.label}
                            </span>
                            <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-emerald-50 text-emerald-500 border border-emerald-100/50">
                                TASK
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {onDelete && (
                        <motion.button 
                            whileHover={{ scale: 1.1, color: '#f43f5e' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDeleteClick}
                            className="p-3 text-slate-300 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    )}
                    <motion.button 
                        whileHover={bouncyHover}
                        whileTap={{ scale: 0.95 }}
                        onClick={onEdit}
                        className="group flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-2xl font-semibold text-sm shadow-[0_4px_12px_-2px_rgba(79,70,229,0.1)] hover:bg-indigo-100 transition-all"
                    >
                        <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        EDIT TASK
                    </motion.button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-none">
                
                {/* --- SECTION 1: KEY METRICS --- */}
                <motion.section variants={sectionVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-${priorityInfo.color}-50 text-${priorityInfo.color}-400 flex items-center justify-center`}>
                            <priorityInfo.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Priority</p>
                            <p className={`text-lg font-semibold text-${priorityInfo.color}-500`}>{priorityInfo.label}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
                    >
                        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-300 flex items-center justify-center">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Deadline</p>
                            <p className="text-lg font-semibold text-slate-600">
                                {task.endDate ? format(new Date(task.endDate), 'd MMM yyyy', { locale: th }) : 'ไม่ระบุ'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={bouncyHover}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 transition-all duration-500"
                    >
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-300 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Duration</p>
                            <p className="text-lg font-semibold text-slate-600">
                                {task.startDate && task.endDate ? (
                                    `${format(new Date(task.startDate), 'd MMM')} - ${format(new Date(task.endDate), 'd MMM')}`
                                ) : 'ไม่ระบุ'}
                            </p>
                        </div>
                    </motion.div>
                </motion.section>

                {/* --- SECTION 2: TASK BENTO --- */}
                <motion.section variants={sectionVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-300 px-1">
                        <Zap className="w-4 h-4" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Task Specifications</h4>
                    </div>
                    
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Assignee Type</p>
                                <p className="text-lg font-semibold text-slate-600">{task.assigneeType || 'รายบุคคล'}</p>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Target Position</p>
                                <p className="text-lg font-semibold text-slate-600">{task.targetPosition || 'ไม่ระบุ'}</p>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Difficulty</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Sparkles 
                                            key={star} 
                                            className={`w-4 h-4 ${star <= difficultyLevel ? 'text-amber-300 fill-amber-300' : 'text-slate-100'}`} 
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Exp. Hours</p>
                                <p className="text-lg font-semibold text-slate-600">{task.estimatedHours || 0} ชั่วโมง</p>
                            </div>
                        </div>

                        {task.contentId && (
                            <div className="pt-6 border-t border-slate-50">
                                <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">Linked Content Project</p>
                                <motion.button 
                                    whileHover={{ x: 5, backgroundColor: '#f8fafc' }}
                                    onClick={() => onOpenTask && onOpenTask({ id: task.contentId, type: 'CONTENT', title: 'Loading...' } as Task)}
                                    className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-500 transition-all group w-full sm:w-auto"
                                >
                                    <LinkIcon className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    View Main Project Detail
                                    <ChevronRight className="w-4 h-4 ml-auto sm:ml-4 text-slate-200" />
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </motion.section>

                {/* --- SECTION 3: DESCRIPTION & TEAM --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.section variants={sectionVariants} className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Task Description</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[250px] relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
                            <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-p:text-slate-500 prose-p:leading-relaxed prose-strong:text-slate-700">
                                {task.description ? (
                                    <Markdown>{task.description}</Markdown>
                                ) : (
                                    <p className="italic text-slate-200 text-lg">No description provided for this task.</p>
                                )}
                            </div>
                        </motion.div>

                        {(task.caution || task.importance) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {task.caution && (
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-rose-50/20 p-6 rounded-[2rem] border border-rose-100/20 flex gap-4"
                                    >
                                        <AlertTriangle className="w-6 h-6 text-rose-300 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-1">Caution</p>
                                            <p className="text-sm text-rose-600/70 leading-relaxed font-medium">{task.caution}</p>
                                        </div>
                                    </motion.div>
                                )}
                                {task.importance && (
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-indigo-50/20 p-6 rounded-[2rem] border border-indigo-100/20 flex gap-4"
                                    >
                                        <Target className="w-6 h-6 text-indigo-300 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">Key Focus</p>
                                            <p className="text-sm text-indigo-600/70 leading-relaxed font-medium">{task.importance}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {task.remark && (
                            <motion.div 
                                whileHover={{ scale: 1.01 }}
                                className="bg-amber-50/20 p-6 rounded-[2rem] border border-amber-100/20 flex gap-4"
                            >
                                <Info className="w-6 h-6 text-amber-300 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest mb-1">Remark</p>
                                    <p className="text-sm text-amber-700/70 leading-relaxed font-medium">{task.remark}</p>
                                </div>
                            </motion.div>
                        )}
                    </motion.section>

                    <motion.section variants={sectionVariants} className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-300 px-1">
                            <Users className="w-4 h-4" />
                            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Assigned Crew</h4>
                        </div>
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
                        >
                            <div className="space-y-4">
                                <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">Main Assignees</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {task.assigneeIds && task.assigneeIds.length > 0 ? (
                                        task.assigneeIds.map(id => {
                                            const user = getUserById(id);
                                            return user ? (
                                                <motion.div 
                                                    key={id} 
                                                    whileHover={{ scale: 1.1, x: 5 }}
                                                    className="group flex items-center gap-2 p-1 pr-3 bg-slate-50/50 border border-slate-100/50 rounded-full hover:bg-white hover:shadow-sm transition-all cursor-default"
                                                >
                                                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                                                    <span className="text-[11px] font-semibold text-slate-500">{user.name}</span>
                                                </motion.div>
                                            ) : null;
                                        })
                                    ) : (
                                        <p className="text-xs text-slate-200 italic">No assignees linked</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.section>
                </div>
            </div>

            {/* --- MINIMAL FOOTER --- */}
            <div className="px-10 py-6 bg-white border-t border-slate-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-8">
                    {task.createdAt && (
                        <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Created At</span>
                            <span className="text-[11px] font-semibold text-slate-400">{format(new Date(task.createdAt), 'd MMM yyyy, HH:mm', { locale: th })}</span>
                        </div>
                    )}
                    <div className="w-px h-6 bg-slate-100" />
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-300">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">0 Comments</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">{task.assets?.length || 0} Assets</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-slate-50 text-slate-400 font-semibold text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
                >
                    Close Window
                </button>
            </div>
        </motion.div>
    );
};

export default TaskDetail;
