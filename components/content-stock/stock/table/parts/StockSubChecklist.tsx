import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Task, MasterOption } from '../../../../../types';

interface StockSubChecklistProps {
    taskId: string;
    currentStatus: string;
    subChecklistProgress?: Record<string, boolean>;
    masterOptions: MasterOption[];
    onUpdateSubChecklist?: (id: string, progress: Record<string, boolean>) => Promise<boolean>;
    onUpdateLocalTask?: (task: Task) => void;
    task: Task;
}

export const StockSubChecklist: React.FC<StockSubChecklistProps> = ({
    taskId,
    currentStatus,
    subChecklistProgress,
    masterOptions,
    onUpdateSubChecklist,
    onUpdateLocalTask,
    task
}) => {
    const checklistSteps = useMemo(() => {
        if (!currentStatus || !masterOptions) return [];
        return masterOptions
            .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === currentStatus && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [currentStatus, masterOptions]);

    const [syncStatus, setSyncStatus] = React.useState<'idle' | 'pending' | 'saved' | 'error'>('idle');
    const [localProgress, setLocalProgress] = React.useState<Record<string, boolean>>(() => subChecklistProgress || {});
    const progressRef = React.useRef(localProgress);
    const lastAttemptedProgressRef = React.useRef<Record<string, boolean>>(localProgress);
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const checkedStepsCount = useMemo(() => {
        return checklistSteps.filter(s => !!(localProgress && localProgress[s.key])).length;
    }, [checklistSteps, localProgress]);

    const checklistPercentage = useMemo(() => {
        const totalCount = checklistSteps.length;
        if (totalCount === 0) return 0;

        // Parse weights for each step
        let definedWeightSum = 0;
        let definedWeightCount = 0;
        
        const stepsData = checklistSteps.map(step => {
            let weight: number | null = null;
            if (typeof step.progressValue === 'number' && step.progressValue > 0) {
                weight = step.progressValue;
            } else {
                try {
                    const desc = JSON.parse(step.description || '{}');
                    if (typeof desc.weight === 'number') {
                        weight = desc.weight;
                    }
                } catch (e) {}
            }

            if (weight !== null) {
                definedWeightSum += weight;
                definedWeightCount++;
            }

            return {
                key: step.key,
                weight,
                isChecked: !!(localProgress && localProgress[step.key])
            };
        });

        // If all steps have defined weights, use them
        if (definedWeightCount === totalCount) {
            if (definedWeightSum === 0) return 0;
            const checkedWeightSum = stepsData
                .filter(s => s.isChecked)
                .reduce((sum, s) => sum + (s.weight || 0), 0);
            return Math.round((checkedWeightSum / definedWeightSum) * 100);
        }

        // If only some or none have weights, distribute the remaining of 100% evenly to the undefined ones
        const undefinedCount = totalCount - definedWeightCount;
        const remainingWeight = Math.max(0, 100 - definedWeightSum);
        const defaultWeightPerUndefined = undefinedCount > 0 ? remainingWeight / undefinedCount : 0;

        let totalPercentage = 0;
        stepsData.forEach(s => {
            if (s.isChecked) {
                if (s.weight !== null) {
                    totalPercentage += s.weight;
                } else {
                    totalPercentage += defaultWeightPerUndefined;
                }
            }
        });

        return Math.min(100, Math.round(totalPercentage));
    }, [checklistSteps, localProgress]);

    // Sync with prop when taskId or subChecklistProgress changes, unless actively pending/saved
    const progressStr = JSON.stringify(subChecklistProgress || {});
    React.useEffect(() => {
        if (syncStatus !== 'pending' && syncStatus !== 'saved') {
            setLocalProgress(subChecklistProgress || {});
            progressRef.current = subChecklistProgress || {};
        }
    }, [taskId, progressStr, syncStatus, subChecklistProgress]);

    // Clean up timer on unmount
    React.useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const handleToggleStep = (e: React.MouseEvent, stepKey: string) => {
        e.stopPropagation();
        if (!onUpdateSubChecklist) return;

        const nextProgress = {
            ...progressRef.current,
            [stepKey]: !progressRef.current[stepKey]
        };

        // Instantly update local state for responsive UI (Optimistic Update)
        setLocalProgress(nextProgress);
        progressRef.current = nextProgress;
        lastAttemptedProgressRef.current = nextProgress; // Backup in case of error
        setSyncStatus('pending');

        // Debounce database update (600ms)
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const success = await onUpdateSubChecklist(taskId, nextProgress);
                if (success) {
                    setSyncStatus('saved');
                    if (onUpdateLocalTask) {
                        onUpdateLocalTask({
                            ...task,
                            subChecklistProgress: nextProgress
                        });
                    }
                    setTimeout(() => {
                        setSyncStatus(prev => prev === 'saved' ? 'idle' : prev);
                    }, 1500);
                } else {
                    setSyncStatus('error');
                    // Automatic Rollback to original database values
                    const actualProgress = subChecklistProgress || {};
                    setLocalProgress(actualProgress);
                    progressRef.current = actualProgress;
                }
            } catch (err) {
                console.error("Failed to update sub-checklist:", err);
                setSyncStatus('error');
                // Automatic Rollback to original database values
                const actualProgress = subChecklistProgress || {};
                setLocalProgress(actualProgress);
                progressRef.current = actualProgress;
            }
        }, 600);
    };

    const handleRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onUpdateSubChecklist) return;

        const targetProgress = lastAttemptedProgressRef.current;
        setLocalProgress(targetProgress);
        progressRef.current = targetProgress;
        setSyncStatus('pending');

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const success = await onUpdateSubChecklist(taskId, targetProgress);
                if (success) {
                    setSyncStatus('saved');
                    if (onUpdateLocalTask) {
                        onUpdateLocalTask({
                            ...task,
                            subChecklistProgress: targetProgress
                        });
                    }
                    setTimeout(() => {
                        setSyncStatus(prev => prev === 'saved' ? 'idle' : prev);
                    }, 1500);
                } else {
                    setSyncStatus('error');
                    // Rollback
                    const actualProgress = subChecklistProgress || {};
                    setLocalProgress(actualProgress);
                    progressRef.current = actualProgress;
                }
            } catch (err) {
                console.error("Failed to update sub-checklist on retry:", err);
                setSyncStatus('error');
                const actualProgress = subChecklistProgress || {};
                setLocalProgress(actualProgress);
                progressRef.current = actualProgress;
            }
        }, 200);
    };

    if (checklistSteps.length === 0) return null;

    return (
        <div className="mt-3 pt-2.5 border-t border-dashed border-gray-150 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                        <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                        <span>ขั้นตอนย่อย ({checkedStepsCount}/{checklistSteps.length})</span>
                    </span>
                    
                    {/* Pastel Progress Bar */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full select-none">
                        <div className="w-14 bg-slate-200 h-1 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${checklistPercentage}%` }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className={`h-full rounded-full ${
                                    checklistPercentage === 100
                                        ? 'bg-gradient-to-r from-emerald-300 to-teal-400'
                                        : 'bg-gradient-to-r from-indigo-300 to-purple-400'
                                }`}
                            />
                        </div>
                        <span className={`text-[8.5px] font-extrabold font-mono leading-none ${
                            checklistPercentage === 100
                                ? 'text-emerald-500'
                                : 'text-indigo-500'
                        }`}>
                            {checklistPercentage}%
                        </span>
                    </div>
                </div>

                {/* Sub-checklist Sync Status Indicators */}
                <div className="flex items-center gap-1.5">
                    {syncStatus === 'pending' && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-500 animate-pulse bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100/30">
                            <Loader2 className="w-2.5 h-2.5 text-indigo-500 animate-spin" />
                            <span>กำลังบันทึก...</span>
                        </div>
                    )}
                    {syncStatus === 'saved' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"
                        >
                            <Check className="w-2.5 h-2.5 text-emerald-500" />
                            <span>บันทึกแล้ว ✨</span>
                        </motion.div>
                    )}
                    {syncStatus === 'error' && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500 animate-bounce" />
                            <span>บันทึกไม่สำเร็จ ⚠️</span>
                            <button 
                                onClick={handleRetry}
                                className="ml-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-tighter cursor-pointer"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
                {checklistSteps.map((step) => {
                    const isStepChecked = !!(localProgress && localProgress[step.key]);
                    return (
                        <button
                            key={step.key}
                            onClick={(e) => handleToggleStep(e, step.key)}
                            className={`
                                flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all duration-200 active:scale-95 cursor-pointer
                                ${isStepChecked
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70 shadow-[0_1px_2px_rgba(16,185,129,0.05)]'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            <span className={`w-3 h-3 rounded-md flex items-center justify-center border transition-all ${
                                isStepChecked
                                    ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold text-[8px]'
                                    : 'border-gray-300 text-transparent'
                            }`}>
                                ✓
                            </span>
                            <span className="whitespace-nowrap">{step.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
