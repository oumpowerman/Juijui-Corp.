import React, { memo, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AlertCircle, Clock8, Film, AlignLeft } from 'lucide-react';
import { Task, Channel, User } from '../../types';

interface TaskPillTooltipProps {
    task: Task;
    viewMode: 'CONTENT' | 'TASK' | 'PLAN';
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
    users?: User[];
    mousePos?: { x: number; y: number } | null;
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
    users = [],
    mousePos,
}) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 264, height: 260 });

    useLayoutEffect(() => {
        if (tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setDimensions({ width: rect.width, height: rect.height });
            }
        }
    }, [task.id, task.title, task.description, isOverdue, isUnfinishedContent, isInsightOverdue]);

    const pos = useMemo(() => {
        const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const tooltipWidth = dimensions.width || 264;
        const tooltipHeight = dimensions.height || 260;

        const offset = 14;
        const edgeMargin = 16;

        if (!mousePos) {
            return { x: -9999, y: -9999 };
        }

        // 1. Horizontal X Calculation (Prefer right of mouse, flip left if reaching edge, clamp strictly)
        let x = mousePos.x + offset;
        if (x + tooltipWidth > winW - edgeMargin) {
            x = mousePos.x - tooltipWidth - offset;
        }
        x = Math.max(edgeMargin, Math.min(x, winW - tooltipWidth - edgeMargin));

        // 2. Vertical Y Calculation (Prefer floating above mouse, flip below if hitting top edge, clamp strictly)
        let y = mousePos.y - tooltipHeight - offset;
        if (y < edgeMargin) {
            y = mousePos.y + offset + 6;
        }
        if (y + tooltipHeight > winH - edgeMargin) {
            y = Math.max(edgeMargin, winH - tooltipHeight - edgeMargin);
        }

        return { x, y };
    }, [mousePos, dimensions]);

    const assignees = useMemo(() => {
        if (!task.assigneeIds || !Array.isArray(task.assigneeIds)) return [];
        return users.filter(u => task.assigneeIds?.includes(u.id));
    }, [users, task.assigneeIds]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: 999999,
                pointerEvents: 'none',
                willChange: 'left, top',
            }}
        >
            <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ type: 'spring', damping: 22, stiffness: 400, mass: 0.5 }}
                className="w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_45px_rgba(0,0,0,0.15)] border border-slate-100 p-4 pointer-events-none text-left flex flex-col gap-2.5 select-none"
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
                    <span className={`text-[10px] font-black tracking-wider uppercase select-none ${
                        task.type === 'PLAN' 
                            ? 'text-fuchsia-600 bg-fuchsia-50/50 px-1.5 py-0.5 rounded-md border border-fuchsia-100/50' 
                            : task.type === 'CONTENT' 
                            ? 'text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md border border-indigo-100/50'
                            : 'text-emerald-600 bg-emerald-50/50 px-1.5 py-0.5 rounded-md border border-emerald-100/50'
                    }`}>
                        {task.type === 'PLAN' ? '📅 PLAN / นัดหมาย' : task.type === 'CONTENT' ? '🔮 CONTENT / คอนเทนต์' : '⚙️ SUB TASK / งานย่อย'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-relaxed pt-1">
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
                        <span className="text-slate-400">สถานะ:</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusColor}`}>
                            {isOverdue ? (isCriticalOverdue ? 'STUCK' : 'OVERDUE') : statusLabel}
                        </span>
                    </div>

                    {/* Recurrence Type for PLAN */}
                    {task.type === 'PLAN' && (
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">รูปแบบ:</span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                                {task.isMonthlyRecurring || task.recurrence === 'MONTHLY' ? '🔁 รูทีนประจำเดือน' : '📅 แผนเฉพาะกิจ'}
                            </span>
                        </div>
                    )}

                    {/* Due Date */}
                    {endDateObj && (
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">{task.startDate ? 'ช่วงเวลา:' : 'กำหนด:'}</span>
                            <span className={`font-mono font-medium ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                {task.startDate ? `${format(new Date(task.startDate), 'dd/MM')} - ${format(endDateObj, 'dd/MM/yyyy')}` : format(endDateObj, 'dd/MM/yyyy')}
                            </span>
                        </div>
                    )}
                </div>

                {/* PLAN Description / รายละเอียดของแพลนงาน */}
                {task.type === 'PLAN' && task.description && task.description.trim() !== '' && (
                    <>
                        <div className="h-px bg-slate-100" />
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none flex items-center gap-1">
                                <AlignLeft className="w-3 h-3 text-fuchsia-500" />
                                รายละเอียดแพลนงาน:
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap max-h-[80px] overflow-y-auto bg-fuchsia-50/20 p-2 rounded-lg border border-fuchsia-100/30">
                                {task.description}
                            </p>
                        </div>
                    </>
                )}

                {/* PLAN Participants / Assignees */}
                {task.type === 'PLAN' && assignees.length > 0 && (
                    <>
                        <div className="h-px bg-slate-100" />
                        <div className="space-y-1.5 pb-0.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase select-none">
                                ผู้ร่วม PLAN / นัดหมาย:
                            </div>
                            <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto pr-1">
                                {assignees.map(user => (
                                    <div key={user.id} className="flex items-center gap-1.5 py-0.5">
                                        <div className="w-5 h-5 rounded-full bg-fuchsia-100 border border-fuchsia-200/50 flex items-center justify-center overflow-hidden shrink-0">
                                            {user.avatarUrl ? (
                                                <img 
                                                    src={user.avatarUrl} 
                                                    alt={user.name} 
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <span className="text-[9px] font-black text-fuchsia-700 uppercase">
                                                    {user.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-700 truncate">
                                            {user.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Aesthetic Footer Decor Tip */}
                <div className="text-[9px] text-slate-400 italic text-center border-t border-slate-50 pt-2 shrink-0">
                    ✨ คลิกเพื่อเปิดดูรายละเอียดงานและสถิติ
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default memo(TaskPillTooltip);
