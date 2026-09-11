import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Users } from 'lucide-react';
import { Task, User } from '../../../../types';

interface TaskCrewSectionProps {
    task: Task;
    users: User[];
    variants?: Variants;
}

const TaskCrewSection: React.FC<TaskCrewSectionProps> = ({ task, users, variants }) => {
    const getUserById = (id: string) => users.find(u => u.id === id);

    return (
        <motion.section variants={variants} className="space-y-4">
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
                                const isInactive = user ? !user.isActive : true;
                                const displayName = user?.name || `ผู้ใช้เดิม (${id.slice(0, 8)}...)`;
                                const avatarUrl = user?.avatarUrl;

                                return (
                                    <motion.div 
                                        key={id} 
                                        whileHover={{ scale: 1.05, x: 3 }}
                                        className={`group flex items-center gap-2 p-1 pr-3 rounded-full transition-all cursor-default ${
                                            isInactive 
                                                ? 'bg-amber-50/80 border border-amber-200/80 hover:bg-amber-100/50 shadow-sm' 
                                                : 'bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-sm'
                                        }`}
                                    >
                                        {avatarUrl ? (
                                            <img 
                                                src={avatarUrl} 
                                                alt={displayName} 
                                                className={`w-7 h-7 rounded-full object-cover border-2 border-white ${isInactive ? 'grayscale opacity-75' : ''}`} 
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold border-2 border-white">
                                                ?
                                            </div>
                                        )}
                                        <span className={`text-[11px] font-semibold ${isInactive ? 'text-amber-900' : 'text-slate-500'}`}>
                                            {displayName}
                                        </span>
                                        {isInactive && (
                                            <span className="text-[9px] font-bold bg-amber-200/90 text-amber-900 px-1.5 py-0.5 rounded-md leading-none">
                                                พ้นสภาพ
                                            </span>
                                        )}
                                    </motion.div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-slate-200 italic">No assignees linked</p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.section>
    );
};

export default TaskCrewSection;

