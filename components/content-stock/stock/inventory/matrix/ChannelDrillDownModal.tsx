import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Channel, MasterOption, Task } from '../../../../../types';
import { DrillDownFilterState } from './types';
import { Search, X, Calendar, ClipboardList, ArrowRight, Layers } from 'lucide-react';

// Helper to compute subtask checklist progress percentage
const getChecklistPercentage = (task: Task, masterOptions: MasterOption[]) => {
    if (!task.status || !masterOptions) return 0;
    const groupKey = task.status.trim().toUpperCase();
    
    const checklistSteps = masterOptions
        .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === groupKey && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    
    const totalCount = checklistSteps.length;
    if (totalCount === 0) return 0;

    const localProgress = task.subChecklistProgress || {};
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
            isChecked: !!localProgress[step.key]
        };
    });

    if (definedWeightCount === totalCount) {
        if (definedWeightSum === 0) return 0;
        const checkedWeightSum = stepsData
            .filter(s => s.isChecked)
            .reduce((sum, s) => sum + (s.weight || 0), 0);
        return Math.round((checkedWeightSum / definedWeightSum) * 100);
    }

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

    return Math.round(totalPercentage);
};

const getStatusBadgeStyles = (status: string = '', masterOptions: MasterOption[]) => {
    const opt = masterOptions.find(o => o.type === 'STATUS' && o.key === status);
    if (opt?.color) return opt.color;
    
    const s = status.toUpperCase();
    if (s.includes('IDEA') || s.includes('BACKLOG')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (s.includes('SCRIPT')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (s.includes('SHOOT') || s.includes('FILM')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('EDIT')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s.includes('FEEDBACK') || s.includes('REVIEW')) return 'bg-pink-50 text-pink-700 border-pink-200';
    if (s.includes('APPROVE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
};

const getStatusLabel = (status: string = '', masterOptions: MasterOption[]) => {
    const option = masterOptions.find(o => o.type === 'STATUS' && o.key === status);
    return option?.label || status;
};

interface ChannelDrillDownModalProps {
    drillDown: DrillDownFilterState | null;
    drillDownTasks: Task[];
    drillSearchQuery: string;
    onSearchChange: (q: string) => void;
    onClose: () => void;
    channels: Channel[];
    masterOptions: MasterOption[];
    onEditTask?: (task: Task) => void;
}

export const ChannelDrillDownModal: React.FC<ChannelDrillDownModalProps> = ({
    drillDown,
    drillDownTasks,
    drillSearchQuery,
    onSearchChange,
    onClose,
    channels,
    masterOptions,
    onEditTask
}) => {
    if (!drillDown) return null;

    return (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 sm:p-6 font-sans">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl h-[80vh] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10"
            >
                {/* Header */}
                <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            <span>{drillDown.channelName}</span>
                            <span>›</span>
                            <span>{drillDown.formatLabel}</span>
                            <span>›</span>
                            <span>{drillDown.statusLabel}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
                            <span>รายการคอนเทนต์ที่ยังไม่ได้ลง</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tabular-nums">
                                {drillDownTasks.length} คลิป
                            </span>
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search inside drilldown */}
                <div className="px-6 sm:px-8 py-3.5 bg-white border-b border-slate-100">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="พิมพ์เพื่อค้นหาชื่อคอนเทนต์ในกลุ่มนี้..."
                            value={drillSearchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        {drillSearchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4 space-y-3 scrollbar-hide">
                    {drillDownTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                            <Layers className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-xs font-bold uppercase tracking-wider">ไม่พบคอนเทนต์ตรงตามเงื่อนไข</p>
                        </div>
                    ) : (
                        drillDownTasks.map(task => {
                            const pct = getChecklistPercentage(task, masterOptions);
                            const ch = channels.find(c => c.id === task.channelId);

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => {
                                        if (onEditTask) {
                                            onEditTask({ ...task, _isPartial: true, type: 'CONTENT' });
                                        }
                                    }}
                                    className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                >
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                {task.title || 'Untitled Content'}
                                            </h4>
                                            {task.isUnscheduled && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                                                    STOCK
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                            {/* Channel badge */}
                                            {ch && (
                                                <span className="font-semibold text-slate-700">
                                                    {ch.name}
                                                </span>
                                            )}

                                            {/* Formats */}
                                            {task.contentFormats && task.contentFormats.length > 0 && (
                                                <>
                                                    <span>·</span>
                                                    <span className="text-indigo-600 font-semibold">
                                                        {task.contentFormats.join(', ')}
                                                    </span>
                                                </>
                                            )}

                                            {/* Shoot Date */}
                                            {task.shootDate && (
                                                <>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-1 text-slate-600">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        <span>
                                                            {new Date(task.shootDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </span>
                                                </>
                                            )}

                                            {/* Checklist progress */}
                                            <span>·</span>
                                            <span className="flex items-center gap-1 text-slate-600">
                                                <ClipboardList className="w-3 h-3 text-slate-400" />
                                                <span>Checklist {pct}%</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusBadgeStyles(task.status, masterOptions)}`}>
                                            {getStatusLabel(task.status, masterOptions)}
                                        </span>

                                        <div className="p-1.5 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 sm:px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>พบทั้งหมด {drillDownTasks.length} รายการ</span>
                    <span>คลิกที่รายการเพื่อเปิดแก้ไขรายละเอียด</span>
                </div>
            </motion.div>
        </div>
    );
};

export default ChannelDrillDownModal;
