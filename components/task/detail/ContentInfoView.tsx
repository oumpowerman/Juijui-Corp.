
import React from 'react';
import { motion } from 'framer-motion';
import { Task, User, MasterOption, getChecklistGroupKey } from '../../../types';
import { ListTodo, Check } from 'lucide-react';
import StorageSection from './sections/StorageSection';
import StrategySection from './sections/StrategySection';
import ProductionSection from './sections/ProductionSection';
import SponsorshipSection from './sections/SponsorshipSection';
import TeamSection from './sections/TeamSection';
import BriefSection from './sections/BriefSection';

interface ContentInfoViewProps {
    task: Task;
    users: User[];
    masterOptions?: MasterOption[];
    onSave?: (task: Task) => void;
}

const ContentInfoView: React.FC<ContentInfoViewProps> = ({ task, users, masterOptions = [], onSave }) => {
    const checklistSteps = React.useMemo(() => {
        if (!task.status || !masterOptions) return [];
        const groupKey = getChecklistGroupKey(task.status, masterOptions);
        return masterOptions
            .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [task.status, masterOptions]);

    const progress = React.useMemo(() => {
        if (checklistSteps.length === 0) return 0;
        const completed = checklistSteps.filter(s => !!task.subChecklistProgress?.[s.key]).length;
        return Math.round((completed / checklistSteps.length) * 100);
    }, [checklistSteps, task.subChecklistProgress]);

    const handleToggleStep = async (stepKey: string, checked: boolean) => {
        if (!onSave) return;
        const updatedProgress = {
            ...(task.subChecklistProgress || {}),
            [stepKey]: checked
        };
        await onSave({
            ...task,
            subChecklistProgress: updatedProgress
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-10"
        >
            <StorageSection task={task} />
            <StrategySection task={task} />
            
            {/* --- SUB-CHECKLIST SECTION --- */}
            {checklistSteps.length > 0 && (
                <motion.section 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 text-slate-300 px-1">
                        <ListTodo className="w-4 h-4" />
                        <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em]">ขั้นตอนย่อย (Sub-checklist)</h4>
                    </div>
                    
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                        {/* Header with progress numbers & bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h5 className="text-sm font-semibold text-slate-700">ความคืบหน้าของขั้นตอนย่อยในสถานะนี้</h5>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    ({checklistSteps.filter(s => !!task.subChecklistProgress?.[s.key]).length}/{checklistSteps.length} ขั้นตอนสำเร็จ)
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-indigo-500 font-mono">{progress}%</span>
                                <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="bg-indigo-500 h-full rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Checklist items list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {checklistSteps.map((step) => {
                                const isChecked = !!task.subChecklistProgress?.[step.key];
                                return (
                                    <motion.div 
                                        key={step.key}
                                        whileHover={{ y: -2 }}
                                        onClick={() => handleToggleStep(step.key, !isChecked)}
                                        className={`flex items-center space-x-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none text-sm
                                            ${isChecked 
                                                ? 'bg-indigo-50/40 border-indigo-100/80 text-slate-800 font-medium' 
                                                : 'bg-slate-50/50 border-slate-100/80 text-slate-500 hover:bg-slate-50 hover:border-slate-200/80'}`}
                                    >
                                        <div className="shrink-0">
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150
                                                ${isChecked 
                                                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                                                    : 'border-slate-300 bg-white'}`}>
                                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                        <span className="flex-1 line-clamp-1 break-words">{step.label}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.section>
            )}

            <SponsorshipSection taskId={task.id} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ProductionSection task={task} />
                </div>
                <TeamSection task={task} users={users} />
            </div>

            <BriefSection task={task} />
        </motion.div>
    );
};

export default ContentInfoView;
