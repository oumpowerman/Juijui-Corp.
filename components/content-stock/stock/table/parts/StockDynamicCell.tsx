import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Video } from 'lucide-react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { Task } from '../../../../../types';
import { ColumnKey } from '../StockTableSettings';

interface StockDynamicCellProps {
    columnKey: ColumnKey;
    task: Task;
    width: number;
    statusInfo: { label: string; color: string };
    statusProgress: number;
    renderUserAvatars: (userIds: string[] | undefined) => React.ReactNode;
    formatDateDisplay: (date: Date | undefined, type: 'PUBLISH' | 'SHOOT') => React.ReactNode;
}

export const StockDynamicCell: React.FC<StockDynamicCellProps> = ({
    columnKey,
    task,
    width,
    statusInfo,
    statusProgress,
    renderUserAvatars,
    formatDateDisplay
}) => {
    switch (columnKey) {
        case 'shortNote':
            return (
                <td className="px-4 py-5 align-top hidden md:table-cell" style={{ width }}>
                    <div className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed italic">
                            {task.description || task.remark || 'ไม่มีรายละเอียดเพิ่มเติม...'}
                        </p>
                    </div>
                </td>
            );
        case 'status': {
            const bgClass = statusInfo.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-gray-200';
            const textClass = statusInfo.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-700';
            
            return (
                <td className="px-4 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>
                    <div className="relative w-full h-7 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner group/status">
                        {/* Progress Fill */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${statusProgress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`absolute inset-y-0 left-0 ${bgClass}`}
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
        }
        case 'publishDate':
            return (
                <td className="px-4 py-5 text-center align-middle whitespace-nowrap hidden md:table-cell" style={{ width }}>
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
                <td className="px-4 py-5 text-center align-middle whitespace-nowrap hidden md:table-cell" style={{ width }}>
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
            return (
                <td className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>
                    {renderUserAvatars(task.ideaOwnerIds)}
                </td>
            );
        case 'editor':
            return (
                <td className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>
                    {renderUserAvatars(task.editorIds)}
                </td>
            );
        case 'helper':
            return (
                <td className="px-2 py-5 text-center align-middle hidden md:table-cell" style={{ width }}>
                    {renderUserAvatars(task.assigneeIds)}
                </td>
            );
        default:
            return null;
    }
};
