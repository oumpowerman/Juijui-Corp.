
import React from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Tag, FileText, MoreHorizontal, CalendarPlus, Inbox, Video } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Task, Channel, User, MasterOption } from '../../../../types';
import { ColumnKey } from './StockTableSettings';

interface StockTableRowProps {
    task: Task;
    channel: Channel | null;
    statusInfo: { label: string; color: string };
    visibleColumns: ColumnKey[];
    columnOrder: ColumnKey[];
    columnWidths: Record<string, number>;
    statusProgress: number; // 0-100
    renderUserAvatars: (userIds: string[] | undefined) => React.ReactNode;
    formatDateDisplay: (date: Date | undefined, type: 'PUBLISH' | 'SHOOT') => React.ReactNode;
    onEdit: (task: Task) => void;
    onSchedule: (task: Task) => void;
    onAddToWorkbox?: (task: Task) => void;
    setIsDragging: (value: boolean) => void;
    getFormatLabel: (key?: string) => string;
    getPillarLabel: (key?: string) => string;
    getCategoryLabel: (key?: string) => string;
}

const StockTableRow: React.FC<StockTableRowProps> = ({
    task,
    channel,
    statusInfo,
    visibleColumns,
    columnOrder,
    columnWidths,
    statusProgress,
    renderUserAvatars,
    formatDateDisplay,
    onEdit,
    onSchedule,
    onAddToWorkbox,
    setIsDragging,
    getFormatLabel,
    getPillarLabel,
    getCategoryLabel
}) => {
    const channelStyle = channel ? channel.color : 'bg-gray-100 text-gray-500 border-gray-200';

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
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => onEdit(task)} 
            draggable
            onDragStartCapture={handleDragStart}
            onDragEndCapture={() => setIsDragging(false)}
            className="hover:bg-indigo-50 transition-colors group cursor-pointer relative cursor-grab active:cursor-grabbing border-b border-gray-50"
        >
            {/* 1. Title (Fixed) */}
            <td 
                className="px-6 py-5 sticky left-0 bg-white group-hover:bg-indigo-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] align-top border-r border-gray-100 transition-colors"
                style={{ width: columnWidths['title'] || 350 }}
            >
                <div className="font-bold text-gray-800 group-hover:text-indigo-700 line-clamp-2 text-sm leading-snug mb-2" title={task.title}>
                    {task.title}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-tight ${channelStyle}`}>{channel?.name || '-'}</span>
                    {task.contentFormat && <span className="text-[9px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 font-black flex items-center">{getFormatLabel(task.contentFormat)}</span>}
                    {task.pillar && <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-black flex items-center">{getPillarLabel(task.pillar)}</span>}
                    {task.category && <span className="text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 font-black flex items-center"><Tag className="w-2.5 h-2.5 mr-1 opacity-50" />{getCategoryLabel(task.category)}</span>}
                </div>
            </td>

            {/* Dynamic Columns */}
            {columnOrder.map((key) => {
                if (!visibleColumns.includes(key)) return null;
                const width = columnWidths[key] || 150;

                switch (key) {
                    case 'shortNote':
                        return (
                            <td key={key} className="px-4 py-5 align-top" style={{ width }}>
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
                            <td key={key} className="px-4 py-5 text-center align-middle" style={{ width }}>
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
                                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] drop-shadow-sm ${textClass}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Percentage Tooltip on Hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover/status:opacity-100 transition-opacity bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                                        <span className="text-[10px] font-black text-indigo-600">{statusProgress}%</span>
                                    </div>
                                </div>
                            </td>
                        );
                    case 'publishDate':
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle whitespace-nowrap" style={{ width }}>
                                {task.isUnscheduled ? (
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg font-black uppercase tracking-tighter">Unscheduled</span>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {formatDateDisplay(task.endDate, 'PUBLISH')}
                                    </div>
                                )}
                            </td>
                        );
                    case 'shootDate':
                        return (
                            <td key={key} className="px-4 py-5 text-center align-middle whitespace-nowrap" style={{ width }}>
                                {task.shootDate ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-black bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                            <Video className="w-3 h-3" />
                                            {format(new Date(task.shootDate), 'd MMM')}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 text-xs">-</span>
                                )}
                            </td>
                        );
                    case 'ideaOwner':
                        return <td key={key} className="px-2 py-5 text-center align-middle" style={{ width }}>{renderUserAvatars(task.ideaOwnerIds)}</td>;
                    case 'editor':
                        return <td key={key} className="px-2 py-5 text-center align-middle" style={{ width }}>{renderUserAvatars(task.editorIds)}</td>;
                    case 'helper':
                        return <td key={key} className="px-2 py-5 text-center align-middle" style={{ width }}>{renderUserAvatars(task.assigneeIds)}</td>;
                    default:
                        return null;
                }
            })}

            {/* 7. Actions (Fixed) */}
            <td className="px-4 py-5 text-right sticky right-0 bg-white group-hover:bg-indigo-50 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] align-middle border-l border-gray-100 transition-colors">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onSchedule(task); }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-xl transition-all shadow-sm" title="ลงตาราง">
                        <CalendarPlus className="w-4 h-4" />
                    </button>
                    {onAddToWorkbox && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddToWorkbox(task); }} 
                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all shadow-sm" 
                            title="เก็บเข้า WorkBox"
                        >
                            <Inbox className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </td>
        </motion.tr>
    );
};

export default StockTableRow;
