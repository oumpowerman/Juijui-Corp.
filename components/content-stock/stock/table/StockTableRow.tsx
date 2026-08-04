import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Video, Zap, AlertCircle } from 'lucide-react';
import { differenceInDays, startOfToday } from 'date-fns';
import { Task, Channel, MasterOption } from '../../../../types';
import { ColumnKey } from './StockTableSettings';
import { isStockTerminalStatus } from '../../../../config/status';

// Imported Parts
import { StockSubChecklist } from './parts/StockSubChecklist';
import { StockRowMetadata } from './parts/StockRowMetadata';
import { StockStorageBadge } from './parts/StockStorageBadge';
import { StockDynamicCell } from './parts/StockDynamicCell';
import { StockRowActions } from './parts/StockRowActions';

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
    
    const isInsightOverdue = useMemo(() => {
        const isTerminal = isStockTerminalStatus(task.status);
            
        // Must be explicitly scheduled (not in stock), terminal status, incomplete analytics (not COMPLETE), and > 7 days old
        if (task.type !== 'CONTENT' || task.isUnscheduled || !isTerminal || !task.endDate || task.analyticsStatus === 'COMPLETE') return false;
            
        const endDateObj = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        const daysSincePublish = differenceInDays(startOfToday(), endDateObj);
        return daysSincePublish >= 7;
    }, [task.type, task.status, task.endDate, task.isUnscheduled, task.analyticsStatus]);

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
                
                {/* Meta Tags & Storage Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <StockRowMetadata
                        task={task}
                        channel={channel}
                        getFormatLabel={getFormatLabel}
                        getPillarLabel={getPillarLabel}
                        getCategoryLabel={getCategoryLabel}
                        onTagClick={onTagClick}
                    />
                    <StockStorageBadge
                        driveLabel={task.driveLabel}
                        localPath={task.localPath}
                    />
                </div>

                {/* Sub-checklist Progress Section */}
                <StockSubChecklist
                    taskId={task.id}
                    currentStatus={task.status}
                    subChecklistProgress={task.subChecklistProgress}
                    masterOptions={masterOptions}
                    onUpdateSubChecklist={onUpdateSubChecklist}
                    onUpdateLocalTask={onUpdateLocalTask}
                    task={task}
                />
            </td>

            {/* Dynamic Columns */}
            {columnOrder.map((key) => {
                if (!visibleColumns.includes(key)) return null;
                const width = columnWidths[key] || 150;
                return (
                    <StockDynamicCell
                        key={key}
                        columnKey={key}
                        task={task}
                        width={width}
                        statusInfo={statusInfo}
                        statusProgress={statusProgress}
                        renderUserAvatars={renderUserAvatars}
                        formatDateDisplay={formatDateDisplay}
                    />
                );
            })}

            {/* 7. Actions (Fixed) */}
            <td className={`px-4 py-5 text-right sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle border-l border-gray-100 transition-colors hidden lg:table-cell ${
                task.isInShootQueue ? 'bg-[#f5f7ff] group-hover:bg-[#ebf0ff]' : 'bg-white group-hover:bg-indigo-50'
            }`}>
                <StockRowActions
                    task={task}
                    isInWorkbox={isInWorkbox}
                    onEdit={onEdit}
                    onSchedule={onSchedule}
                    onToggleQueue={onToggleQueue}
                    onAddToWorkbox={onAddToWorkbox}
                    onOpenAnalytics={onOpenAnalytics}
                    taskInShootQueue={!!task.isInShootQueue}
                />
            </td>
        </motion.tr>
    );
}));

export default StockTableRow;
