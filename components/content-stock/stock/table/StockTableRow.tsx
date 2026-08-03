
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Tag, FileText, MoreHorizontal, CalendarPlus, Inbox, Video, BarChart3, AlertCircle, Zap, Loader2, Check, AlertTriangle, HardDrive } from 'lucide-react';
import { format, differenceInDays, startOfToday } from 'date-fns';
import th from 'date-fns/locale/th';
import { Task, Channel, User, MasterOption } from '../../../../types';
import { ColumnKey } from './StockTableSettings';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';
import { isStockTerminalStatus } from '../../../../config/status';

interface StockTableRowProps {
    task: Task;
    channel: Channel | null;
    statusInfo: { label: string; color: string };
    visibleColumns: ColumnKey[];
    columnOrder: ColumnKey[];
    columnWidths: Record<string, number>;
    statusProgress: number; // 0-100
    isInWorkbox?: boolean;
    renderUserAvatars: (userIds: string[] | undefined) => React.ReactNode;
    formatDateDisplay: (date: Date | undefined, type: 'PUBLISH' | 'SHOOT') => React.ReactNode;
    onEdit: (task: Task) => void;
    onSchedule: (task: Task) => void;
    onToggleQueue?: (id: string, currentStatus: boolean) => void;
    onAddToWorkbox?: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onOpenAnalytics?: (task: Task) => void;
    setIsDragging: (value: boolean) => void;
    getFormatLabel: (key?: string) => string;
    getPillarLabel: (key?: string) => string;
    getCategoryLabel: (key?: string) => string;
    onTagClick?: (tag: string) => void;
    onUpdateLocalTask?: (task: Task, isDelete?: boolean) => void;
    onUpdateSubChecklist?: (id: string, progress: Record<string, boolean>) => Promise<boolean>;
    masterOptions?: MasterOption[];
}

const StockTableRow = React.memo(React.forwardRef<HTMLTableRowElement, StockTableRowProps>(({
    task,
    channel,
    statusInfo,
    visibleColumns,
    columnOrder,
    columnWidths,
    statusProgress,
    isInWorkbox = false,
    renderUserAvatars,
    formatDateDisplay,
    onEdit,
    onSchedule,
    onToggleQueue,
    onAddToWorkbox,
    onEditScript,
    onOpenAnalytics,
    setIsDragging,
    getFormatLabel,
    getPillarLabel,
    getCategoryLabel,
    onTagClick,
    onUpdateLocalTask,
    onUpdateSubChecklist,
    masterOptions = []
}, ref) => {
    const { showConfirm } = useGlobalDialog();
    const channelStyle = channel ? channel.color : 'bg-gray-100 text-gray-500 border-gray-200';

    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
            
        // Must be explicitly scheduled (not in stock), terminal status, incomplete analytics (not COMPLETE), and > 7 days old
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.analyticsStatus === 'COMPLETE') return false;
            
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        const daysSincePublish = differenceInDays(startOfToday(), endDateObj);
        return daysSincePublish >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.analyticsStatus]);

    const checklistSteps = useMemo(() => {
        if (!task.status || !masterOptions) return [];
        return masterOptions
            .filter(o => o.type === 'STATUS_CHECKLIST' && o.parentKey === task.status && o.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [task.status, masterOptions]);

    const [syncStatus, setSyncStatus] = React.useState<'idle' | 'pending' | 'saved' | 'error'>('idle');
    const [localProgress, setLocalProgress] = React.useState<Record<string, boolean>>(() => task.subChecklistProgress || {});
    const progressRef = React.useRef(localProgress);
    const lastAttemptedProgressRef = React.useRef<Record<string, boolean>>(localProgress);
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Sync with prop when task.id or task.subChecklistProgress changes, unless actively pending/saved
    const progressStr = JSON.stringify(task.subChecklistProgress || {});
    React.useEffect(() => {
        if (syncStatus !== 'pending' && syncStatus !== 'saved') {
            setLocalProgress(task.subChecklistProgress || {});
            progressRef.current = task.subChecklistProgress || {};
        }
    }, [task.id, progressStr, syncStatus]);

    // Clean up timer on unmount
    React.useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // States and handlers for Local Path Tooltip Portal
    const [tooltipCoords, setTooltipCoords] = React.useState({ top: 0, left: 0 });
    const [isTooltipHovered, setIsTooltipHovered] = React.useState(false);
    const badgeRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (badgeRef.current) {
            const rect = badgeRef.current.getBoundingClientRect();
            setTooltipCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
            setIsTooltipHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsTooltipHovered(false);
    };

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
                const success = await onUpdateSubChecklist(task.id, nextProgress);
                if (success) {
                    setSyncStatus('saved');
                    setTimeout(() => {
                        setSyncStatus(prev => prev === 'saved' ? 'idle' : prev);
                    }, 1500);
                } else {
                    setSyncStatus('error');
                    // Automatic Rollback to original database values
                    const actualProgress = task.subChecklistProgress || {};
                    setLocalProgress(actualProgress);
                    progressRef.current = actualProgress;
                }
            } catch (err) {
                console.error("Failed to update sub-checklist:", err);
                setSyncStatus('error');
                // Automatic Rollback to original database values
                const actualProgress = task.subChecklistProgress || {};
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
                const success = await onUpdateSubChecklist(task.id, targetProgress);
                if (success) {
                    setSyncStatus('saved');
                    setTimeout(() => {
                        setSyncStatus(prev => prev === 'saved' ? 'idle' : prev);
                    }, 1500);
                } else {
                    setSyncStatus('error');
                    // Rollback
                    const actualProgress = task.subChecklistProgress || {};
                    setLocalProgress(actualProgress);
                    progressRef.current = actualProgress;
                }
            } catch (err) {
                console.error("Failed to update sub-checklist on retry:", err);
                setSyncStatus('error');
                const actualProgress = task.subChecklistProgress || {};
                setLocalProgress(actualProgress);
                progressRef.current = actualProgress;
            }
        }, 200);
    };

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        const dragData = {
            title: task.title,
            content_id: task.id,
            type: 'CONTENT',
            description: task.description || task.remark || ''
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <motion.tr 
            ref={ref}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => onEdit(task)} 
            draggable
            onDragStartCapture={handleDragStart}
            onDragEndCapture={() => setIsDragging(false)}
            className={`transition-colors group cursor-pointer relative cursor-grab active:cursor-grabbing border-b border-gray-50 ${
                task.isInShootQueue 
                    ? 'bg-[#f5f7ff] hover:bg-[#ebf0ff]' 
                    : 'hover:bg-indigo-50'
            }`}
        >
            {/* 1. Title (Fixed) */}
            <td 
                className={`px-6 py-5 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-top border-r border-gray-100 transition-colors overflow-hidden ${
                    task.isInShootQueue ? 'bg-[#f5f7ff] group-hover:bg-[#ebf0ff]' : 'bg-white group-hover:bg-indigo-50'
                }`}
                style={{ width: columnWidths['title'] || 350 }}
            >
                <div className="relative">
                    <div className="flex items-start gap-2 mb-2">
                        {task.isInShootQueue && (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex-shrink-0"
                            >
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-500 border border-indigo-100 text-[8px] font-bold rounded-md shadow-sm animate-pulse uppercase tracking-wider">
                                    <Video className="w-2 h-2 fill-current" />
                                    IN QUEUE
                                </span>
                            </motion.div>
                        )}
                        <div className={`font-medium font-kanit text-[18px] group-hover:text-indigo-700 line-clamp-2 text-sm leading-snug ${task.isInShootQueue ? 'text-indigo-600' : 'text-gray-800'}`} title={task.title}>
                            {task.title}
                        </div>
                        {task.hasAnalytics && (
                             <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                className="shrink-0 flex items-center justify-center w-5 h-5 bg-purple-100 rounded-full border border-purple-200"
                                title="Performance Data Entry Complete ✨"
                            >
                                <Zap className="w-2.5 h-2.5 text-purple-600 fill-purple-600" />
                            </motion.div>
                        )}
                        {isInsightOverdue && (
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex-shrink-0"
                            >
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-100 text-[8px] font-bold rounded-md shadow-sm animate-bounce italic uppercase tracking-wider">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    MISSING INSIGHT
                                </span>
                            </motion.div>
                        )}
                    </div>
                    {/* Subtle fade for long text */}
                    <div className={`absolute bottom-2 right-0 w-12 h-4 bg-gradient-to-r from-transparent pointer-events-none ${
                        task.isInShootQueue ? 'to-indigo-50 group-hover:to-indigo-100' : 'to-white group-hover:to-indigo-50'
                    }`} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {channel ? (
                        <div 
                            className="flex items-center justify-center p-0.5 rounded-full bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors"
                            title={channel.name}
                        >
                            {channel.logoUrl ? (
                                <img src={channel.logoUrl} alt={channel.name} className="w-6 h-6 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: channel.color || '#6366f1' }}>
                                    {channel.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-full border border-slate-100 text-slate-400 uppercase tracking-tight">-</span>
                    )}
                    {task.contentFormats && task.contentFormats.length > 0 ? (
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-bold flex items-center">
                                {getFormatLabel(task.contentFormats[0])}
                            </span>
                            {task.contentFormats.length > 1 && (
                                <div className="relative group/tooltip">
                                    <motion.span 
                                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }}
                                        transition={{ 
                                            scale: { type: "spring", stiffness: 400, damping: 10 },
                                            rotate: { duration: 0.4, ease: "easeInOut" }
                                        }}
                                        className="text-[9px] text-purple-500 bg-purple-100/50 px-2 py-0.5 rounded-full border border-purple-200 font-bold cursor-help flex items-center justify-center"
                                    >
                                        +{task.contentFormats.length - 1}
                                    </motion.span>
                                    
                                    {/* Custom Animated Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50">
                                        <div className="bg-white/90 backdrop-blur-xl text-purple-900 text-[10px] font-bold px-3 py-2 rounded-2xl shadow-2xl shadow-purple-200/50 border border-purple-100 flex flex-col gap-1.5 min-w-max">
                                            <div className="text-[8px] text-purple-500 uppercase tracking-widest mb-0.5 opacity-70">Format อื่นๆ</div>
                                            {task.contentFormats.slice(1).map(f => (
                                                <div key={f} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]" />
                                                    {getFormatLabel(f)}
                                                </div>
                                            ))}
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white/90" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        null
                    )}
                    {task.pillar && <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-bold flex items-center">{getPillarLabel(task.pillar)}</span>}
                    {task.category && <span className="text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 font-bold flex items-center"><Tag className="w-2.5 h-2.5 mr-1 opacity-50" />{getCategoryLabel(task.category)}</span>}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {task.tags.slice(0, 2).map((tag) => (
                                <motion.span 
                                    key={tag} 
                                    whileHover={{ scale: 1.05, y: -0.5 }}
                                    onClick={() => onTagClick?.(tag)}
                                    className="text-[9px] font-bold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 text-indigo-650 hover:text-indigo-700 border border-indigo-500/20 shadow-[0_2px_4px_rgba(99,102,241,0.03)] hover:shadow-[0_6px_12px_rgba(99,102,241,0.12)] hover:border-indigo-400/50 transition-all duration-300 cursor-pointer"
                                >
                                    <span className="text-[10px] text-indigo-400 font-extrabold leading-none animate-pulse">#</span>
                                    {tag}
                                </motion.span>
                            ))}
                            {task.tags.length > 2 && (
                                <div className="relative group/tag-tooltip">
                                    <motion.span 
                                        whileHover={{ scale: 1.1 }}
                                        className="text-[9px] text-indigo-500 bg-white px-1.5 py-0.5 rounded-full border border-indigo-100 font-extrabold cursor-help flex items-center justify-center shadow-[0_2px_4px_rgba(99,102,241,0.02)] hover:shadow-[0_4px_8px_rgba(99,102,241,0.08)] transition-all"
                                    >
                                        +{task.tags.length - 2}
                                    </motion.span>
                                    
                                    {/* Custom Animated Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tag-tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tag-tooltip:translate-y-0 z-50">
                                        <div className="bg-white/95 backdrop-blur-xl text-indigo-900 text-[10px] font-bold px-3 py-2 rounded-2xl shadow-xl border border-indigo-100 flex flex-col gap-1.5 min-w-max">
                                            <div className="text-[8px] text-indigo-400 uppercase tracking-widest mb-0.5 opacity-80">แท็กทั้งหมด</div>
                                            {task.tags.slice(2).map(t => (
                                                <div 
                                                    key={t} 
                                                    onClick={() => onTagClick?.(t)}
                                                    className="flex items-center gap-1.5 text-indigo-700 font-extrabold cursor-pointer hover:underline"
                                                >
                                                    <span className="text-indigo-400">#</span>
                                                    {t}
                                                </div>
                                            ))}
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Drive and Local Path Badge */}
                    {task.driveLabel && task.localPath && (
                        <div 
                            ref={badgeRef}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.div 
                                whileHover={{ scale: 1.05 }}
                                className="text-[9px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/50 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-help transition-all duration-300 shadow-sm"
                            >
                                <HardDrive className="w-2.5 h-2.5 text-teal-600" />
                                <span>{task.driveLabel}</span>
                            </motion.div>
                            
                            {/* React Portal Hover Tooltip */}
                            {isTooltipHovered && createPortal(
                                <div 
                                    style={{ 
                                        position: 'absolute', 
                                        top: `${tooltipCoords.top}px`, 
                                        left: `${tooltipCoords.left}px`,
                                        transform: 'translate(-50%, -100%)',
                                        zIndex: 9999 
                                    }}
                                    className="pointer-events-none mb-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <motion.div 
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="bg-white/95 backdrop-blur-xl text-teal-950 text-[10px] font-bold px-3 py-2.5 rounded-2xl shadow-xl border border-teal-100 flex flex-col gap-1.5 min-w-[220px] max-w-[340px]"
                                    >
                                        <div className="text-[8px] text-teal-600 uppercase tracking-widest mb-0.5 opacity-80 flex items-center gap-1">
                                            <HardDrive className="w-2.5 h-2.5 text-teal-500 animate-pulse" />
                                            <span>ที่อยู่ไฟล์ในเครื่อง (Local Path) 🖥️</span>
                                        </div>
                                        <div className="font-mono text-[9px] text-slate-650 bg-slate-50 border border-slate-100 p-2 rounded-xl break-all select-all leading-normal">
                                            {task.localPath}
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white" />
                                    </motion.div>
                                </div>,
                                document.body
                            )}
                        </div>
                    )}

                    {/* Sub-checklist steps */}
                    {checklistSteps.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-dashed border-gray-150 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
                                    <ClipboardList className="w-3 h-3 text-slate-400" />
                                    ขั้นตอนย่อย ({checklistSteps.filter(s => !!(localProgress && localProgress[s.key])).length}/{checklistSteps.length})
                                </span>

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
                    )}
                </div>
            </td>

            {/* Dynamic Columns */}
            {columnOrder.map((key) => {
                if (!visibleColumns.includes(key)) return null;
                const width = columnWidths[key] || 150;

                switch (key) {
                    case 'shortNote':
                        return (
                            <td key={key} className="px-4 py-5 align-top hidden md:table-cell" style={{ width }}>
                                <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed italic">
                                        {task.description || task.remark || 'ไม่มีรายละเอียดเพิ่มเติม...'}
                                    </p>
                                </div>
                            </td>
                        );
                    case 'status':
                        const bgClass = statusInfo.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-200';
                        const textClass = statusInfo.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-700';
                        
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>
                                <div className="relative w-full h-7 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner group/status">
                                    {/* Progress Fill */}
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${statusProgress}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className={`absolute inset-y-0 left-0 ${bgClass} `}
                                    />
                                    


                                    {/* Status Label */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-[9px] font-bold uppercase tracking-[0.15em] drop-shadow-sm ${textClass}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Percentage Tooltip on Hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover/status:opacity-100 transition-opacity bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-indigo-600">{statusProgress}%</span>
                                    </div>
                                </div>
                            </td>
                        );
                    case 'publishDate':
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle whitespace-nowrap hidden md:table-cell" style={{ width }}>
                                {task.isUnscheduled ? (
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg font-bold uppercase tracking-tighter">Unscheduled</span>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {formatDateDisplay(task.endDate, 'PUBLISH')}
                                    </div>
                                )}
                            </td>
                        );
                    case 'shootDate':
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle whitespace-nowrap hidden md:table-cell" style={{ width }}>
                                {task.shootDate ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                            <Video className="w-3 h-3" />
                                            {format(new Date(task.shootDate), 'd MMM yy', { locale: th })}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 text-xs">-</span>
                                )}
                            </td>
                        );
                    case 'ideaOwner':
                        return <td key={key} className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>{renderUserAvatars(task.ideaOwnerIds)}</td>;
                    case 'editor':
                        return <td key={key} className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>{renderUserAvatars(task.editorIds)}</td>;
                    case 'helper':
                        return <td key={key} className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>{renderUserAvatars(task.assigneeIds)}</td>;
                    default:
                        return null;
                }
            })}

            {/* 7. Actions (Fixed) */}
            <td className={`px-4 py-5 text-right sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle border-l border-gray-100 transition-colors hidden lg:table-cell ${
                task.isInShootQueue ? 'bg-[#f5f7ff] group-hover:bg-[#ebf0ff]' : 'bg-white group-hover:bg-indigo-50'
            }`}>
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onToggleQueue && (
                        <button 
                            onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (!task.isInShootQueue) {
                                    const confirmed = await showConfirm(
                                        `คุณต้องการเพิ่ม "${task.title}" เข้าสู่คิวถ่ายใช่หรือไม่?`,
                                        "ยืนยันการเพิ่มเข้าคิวถ่าย"
                                    );
                                    if (!confirmed) return;
                                }
                                onToggleQueue(task.id, task.isInShootQueue || false); 
                            }} 
                            className={`p-2 rounded-xl transition-all shadow-sm ${
                                task.isInShootQueue 
                                    ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' 
                                    : 'text-gray-400 hover:text-indigo-600 hover:bg-white'
                            }`}
                            title={task.isInShootQueue ? "เอาออกจากคิวถ่าย" : "เพิ่มเข้าคิวถ่าย"}
                        >
                            <Video className={`w-4 h-4 ${task.isInShootQueue ? 'fill-current' : ''}`} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSchedule(task); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="ลงตาราง">
                        <CalendarPlus className="w-4 h-4" />
                    </button>
                    {onOpenAnalytics && (
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onOpenAnalytics(task); 
                            }} 
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"
                            title="สถิติคอนเทนต์"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    )}
                    {onAddToWorkbox && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddToWorkbox(task); }} 
                            className={`p-2 rounded-xl transition-all shadow-sm ${
                                isInWorkbox 
                                    ? 'text-amber-600 bg-amber-50 border border-amber-100' 
                                    : 'text-gray-400 hover:text-amber-600 hover:bg-white'
                            }`}
                            title={isInWorkbox ? "อยู่ใน WorkBox แล้ว" : "เก็บเข้า WorkBox"}
                        >
                            <Inbox className={`w-4 h-4 ${isInWorkbox ? 'fill-current' : ''}`} />
                        </button>
                    )}
                </div>
            </td>
        </motion.tr>
    );
}));

export default StockTableRow;
