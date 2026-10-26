import React from 'react';
import { ChevronUp, ChevronDown, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import { Task, User } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailHeaderProps {
    task: Task;
    users: User[];
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    onEdit: () => void;
    onDeleteClick: () => void;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({
    task,
    users,
    isExpanded,
    setIsExpanded,
    onEdit,
    onDeleteClick
}) => {
    const getUserById = (id: string) => users.find(u => u.id === id);

    const bouncyHover = {
        scale: 1.03,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 12 }
    } as const;

    return (
        <motion.div 
            layout
            animate={{ 
                height: isExpanded ? 'auto' : 40,
            }}
            transition={{
                height: { type: 'spring', damping: 25, stiffness: 120 }
            }}
            className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100/50 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.03)] overflow-hidden relative"
        >
            {/* Rainbow Rail Anchor */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 opacity-80" />

            <AnimatePresence initial={false}>
                {!isExpanded ? (
                    <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setIsExpanded(true)}
                        className="h-[40px] flex items-center justify-between px-4 sm:px-6 cursor-pointer hover:bg-slate-50/50 transition-colors group absolute inset-0 z-10"
                    >
                        <div className="flex items-center gap-2.5">
                            <motion.div 
                                className={`w-6 h-6 rounded-md flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100/40`}
                            >
                                <ChevronDown className="w-3 h-3" />
                            </motion.div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                                MORE TASK INFORMATION
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 mr-2">
                                {task.assigneeIds?.slice(0, 3).map((id, index) => {
                                    const user = getUserById(id);
                                    const isInactive = user ? !user.isActive : true;
                                    const avatarUrl = user?.avatarUrl;
                                    const displayName = user?.name || `ผู้ใช้เดิม (${id.slice(0, 8)}...)`;

                                    return avatarUrl ? (
                                        <img 
                                            key={id} 
                                            src={avatarUrl} 
                                            alt={displayName} 
                                            className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${isInactive ? 'grayscale ring-1 ring-amber-400' : ''}`} 
                                            style={{ zIndex: 3 - index }}
                                        />
                                    ) : (
                                        <div 
                                            key={id} 
                                            title={displayName}
                                            className="w-5 h-5 rounded-full bg-amber-100 text-[8px] font-bold flex items-center justify-center text-amber-800 border-2 border-white shadow-sm ring-1 ring-amber-400"
                                            style={{ zIndex: 3 - index }}
                                        >
                                            ?
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-tight">Tap to reveal info</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="px-4 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3"
                        >
                            <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                                <motion.div 
                                    onClick={() => setIsExpanded(false)}
                                    whileHover={{ rotate: -8, scale: 1.15 }}
                                    className={`
                                        w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)]
                                        bg-rose-50 text-rose-400 border border-rose-100 shrink-0 cursor-pointer group
                                    `}
                                >
                                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                                </motion.div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <div className="flex -space-x-2">
                                            {task.assigneeIds?.slice(0, 3).map((id, index) => {
                                                const user = getUserById(id);
                                                return user ? (
                                                    <img 
                                                        key={id} 
                                                        src={user.avatarUrl} 
                                                        alt={user.name} 
                                                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                                                        style={{ zIndex: 3 - index }}
                                                    />
                                                ) : null;
                                            })}
                                            {task.assigneeIds && task.assigneeIds.length > 3 && (
                                                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 z-0">
                                                    +{task.assigneeIds.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                                {task.type && (
                                    <motion.button 
                                        whileHover={{ scale: 1.1, color: '#f43f5e' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onDeleteClick}
                                        className="p-1.5 sm:p-2 text-slate-300 hover:bg-rose-50 rounded-lg sm:rounded-xl transition-all shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                )}
                                <motion.button 
                                    whileHover={bouncyHover}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onEdit}
                                    className="flex-1 sm:flex-none group flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-lg sm:rounded-xl font-semibold text-[10px] sm:text-xs shadow-[0_2px_8px_-2px_rgba(79,70,229,0.08)] hover:bg-indigo-100 transition-all"
                                >
                                    <Edit3 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                    EDIT TASK
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TaskDetailHeader;
