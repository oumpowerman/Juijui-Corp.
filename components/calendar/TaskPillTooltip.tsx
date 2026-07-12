import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AlertCircle, Clock8, Film } from 'lucide-react';
import { Task, Channel } from '../../types';

interface TaskPillTooltipProps {
    task: Task;
    viewMode: 'CONTENT' | 'TASK';
    channels: Channel[];
    dayOfWeek?: number;
    isFirstWeek?: boolean;
    isUnfinishedContent: boolean;
    isOverdue: boolean;
    isCriticalOverdue: boolean;
    isInsightOverdue: boolean;
    overdueDays: number;
    endDateObj: Date | null;
    statusLabel: string;
    statusColor: string;
}

const TaskPillTooltip: React.FC<TaskPillTooltipProps> = ({
    task,
    viewMode,
    channels,
    dayOfWeek,
    isFirstWeek = false,
    isUnfinishedContent,
    isOverdue,
    isCriticalOverdue,
    isInsightOverdue,
    overdueDays,
    endDateObj,
    statusLabel,
    statusColor,
}) => {
    const tooltipPosition = useMemo(() => {
        if (dayOfWeek === 0) {
            return {
                className: `absolute left-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-2.5 ${
                    isFirstWeek ? 'top-[calc(100%+8px)] origin-top-left' : 'bottom-[calc(100%+8px)] origin-bottom-left'
                }`,
                xValue: '0%',
            };
        }
        if (dayOfWeek === 6) {
            return {
                className: `absolute right-0 left-auto w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-2.5 ${
                    isFirstWeek ? 'top-[calc(100%+8px)] origin-top-right' : 'bottom-[calc(100%+8px)] origin-bottom-right'
                }`,
                xValue: '0%',
            };
        }
        return {
            className: `absolute left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.12)] border border-slate-100 p-4 z-[9999] pointer-events-none text-left flex flex-col gap-2.5 ${
                isFirstWeek ? 'top-[calc(100%+8px)] origin-top' : 'bottom-[calc(100%+8px)] origin-bottom'
            }`,
            xValue: '-50%',
        };
    }, [dayOfWeek, isFirstWeek]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isFirstWeek ? -10 : 10, x: tooltipPosition.xValue }}
            animate={{ opacity: 1, scale: 1, y: 0, x: tooltipPosition.xValue }}
            exit={{ opacity: 0, scale: 0.95, y: isFirstWeek ? -6 : 6, x: tooltipPosition.xValue }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className={tooltipPosition.className}
        >
            {/* Warning Header */}
            {isUnfinishedContent && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(249,115,22,0.06)] animate-pulse">
                    <Film className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>ด่วน! วันนี้มีคิวลงคลิปนี้ (ยังไม่เสร็จสิ้น) 🎥</span>
                </div>
            )}

            {isOverdue && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(239,68,68,0.06)] animate-pulse">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>งานตกค้างเกินกำหนด! ({overdueDays} วัน)</span>
                </div>
            )}

            {isInsightOverdue && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[11px] leading-tight shadow-[0_2px_8px_rgba(244,63,94,0.06)] animate-pulse">
                    <Clock8 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>ค้างสรุปรายงานสถิติ!</span>
                </div>
            )}

            {/* Task Title */}
            <div className="space-y-1">
                <span className="text-[10px] font-black tracking-wider text-slate-450 uppercase select-none">
                    {viewMode === 'CONTENT' ? 'CONTENT PLAN' : 'SUB TASK'}
                </span>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed">
                    {task.title}
                </h4>
            </div>

            {/* Mid Divider */}
            <div className="h-px bg-slate-100" />

            {/* Status, Channel & Date info */}
            <div className="space-y-1.5 text-[11px] text-slate-600">
                {/* Target Channel */}
                {task.channelId && channels && (
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">ช่องทาง:</span>
                        {(() => {
                            const ch = channels.find(c => c.id === task.channelId);
                            return ch ? (
                                <span 
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                                    style={{ 
                                        backgroundColor: ch.color?.startsWith('#') ? `${ch.color}15` : undefined,
                                        borderColor: ch.color?.startsWith('#') ? `${ch.color}40` : undefined,
                                        color: ch.color?.startsWith('#') ? ch.color : undefined
                                    }}
                                >
                                    {ch.name}
                                </span>
                            ) : <span className="text-slate-500">-</span>;
                        })()}
                    </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">สถานะหลัก:</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                        {isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusLabel}
                    </span>
                </div>

                {/* Due Date */}
                {endDateObj && (
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">กำหนดส่ง:</span>
                        <span className={`font-mono font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                            {format(endDateObj, 'dd/MM/yyyy')}
                        </span>
                    </div>
                )}
            </div>

            {/* Aesthetic Footer Decor Tip */}
            <div className="text-[9px] text-slate-400 italic text-center border-t border-slate-50 pt-2 shrink-0">
                ✨ คลิกเพื่อเปิดดูรายละเอียดงานและสถิติ
            </div>
        </motion.div>
    );
};

export default memo(TaskPillTooltip);
