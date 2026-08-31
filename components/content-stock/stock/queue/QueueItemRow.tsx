import React from 'react';
import { motion, AnimatePresence, DragControls } from 'framer-motion';
import { Film, FileEdit, CheckCircle2, ArrowRight, Loader2, Clock, GripVertical, Trash2, MapPin, Calendar, AlertTriangle, FileText, Check, RotateCcw } from 'lucide-react';
import { MergedQueueItem } from './types';
import { Channel, Task, MasterOption } from '../../../../types';

interface QueueItemRowProps {
    item: MergedQueueItem;
    sequenceNumber: number;
    channel?: Channel;
    masterOptions: MasterOption[];
    isFinished: boolean;
    isProcessing: boolean;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
    onRemove: (item: MergedQueueItem) => void;
    onOpenPlanning: (item: MergedQueueItem) => void;
    dragControls?: DragControls;
}

const QueueItemRow: React.FC<QueueItemRowProps> = ({
    item,
    sequenceNumber,
    channel,
    masterOptions,
    isFinished,
    isProcessing,
    isSelected = false,
    onToggleSelect,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone,
    onRemove,
    onOpenPlanning,
    dragControls
}) => {
    const getStatusInfo = (statusKey: string) => {
        const option = masterOptions.find(opt => opt.key === statusKey);
        return {
            label: option?.label || statusKey,
            color: option?.color || 'bg-gray-100 text-gray-600'
        };
    };

    const statusInfo = getStatusInfo(item.status);
    const isContent = item.type === 'CONTENT';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => {
                if (item.type === 'CONTENT') onEditContent(item.item as Task);
                else if (onEditScript) onEditScript(item.id);
            }}
            className={`
                group flex flex-col p-3.5 md:p-4 md:grid md:grid-cols-[36px_50px_110px_45px_1fr_160px_120px_90px] items-start md:items-center gap-3 md:gap-4 transition-all cursor-pointer border-b border-slate-100
                ${isSelected ? 'bg-indigo-50/70 hover:bg-indigo-50/90' : 'bg-white hover:bg-slate-50'}
                ${isFinished && !isSelected ? 'opacity-65' : ''}
                ${isContent ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-blue-400'}
            `}
        >
            {/* Top row for Mobile / Start of Grid for Desktop */}
            <div className="flex items-center justify-between w-full md:contents">
                <div className="flex items-center gap-2.5 md:contents">
                    {/* 0. Multi-select Checkbox */}
                    <div className="flex items-center justify-center shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelect?.(item.id);
                            }}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                isSelected 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                    : 'border-slate-300 hover:border-indigo-400 bg-white'
                            }`}
                            title={isSelected ? 'ยกเลิกเลือกรายการนี้' : 'เลือกรายการนี้'}
                        >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                    </div>

                    {/* 1. Drag Handle & Sequence */}
                    <div className="flex items-center justify-center gap-1.5 shrink-0">
                        <div 
                            className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-colors p-1"
                            onPointerDown={(e) => dragControls?.start(e)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-[12px] font-black font-mono text-slate-400">
                            {String(sequenceNumber).padStart(2, '0')}
                        </span>
                    </div>

                    {/* 2. Interactive Progress Badge (ถ่ายเสร็จแล้ว ⇄ รอถ่าย) with Framer Motion */}
                    <div className="flex justify-center shrink-0 w-[84px]">
                        <AnimatePresence mode="wait" initial={false}>
                            {isFinished ? (
                                <motion.button
                                    key="finished-btn"
                                    type="button"
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.92 }}
                                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFinished(item);
                                    }}
                                    disabled={isProcessing}
                                    className="group/btn w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-kanit font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 transition-colors shadow-xs"
                                    title="คลิกเพื่อยกเลิกสถานะเสร็จ (สลับกลับมารอถ่าย)"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                                    ) : (
                                        <>
                                            <motion.div
                                                initial={{ rotate: -45, scale: 0.5 }}
                                                animate={{ rotate: 0, scale: 1 }}
                                                className="shrink-0"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:hidden" />
                                                <RotateCcw className="w-3.5 h-3.5 text-amber-600 hidden group-hover/btn:inline" />
                                            </motion.div>
                                            <span className="group-hover/btn:hidden">เสร็จแล้ว</span>
                                            <span className="hidden group-hover/btn:inline font-bold">รอถ่าย</span>
                                        </>
                                    )}
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="pending-btn"
                                    type="button"
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.92 }}
                                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleFinished(item);
                                    }}
                                    disabled={isProcessing}
                                    className="group/btn w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-kanit font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors shadow-xs"
                                    title="คลิกเมื่อถ่ายทำเสร็จแล้ว"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                                    ) : (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0.5 }}
                                                animate={{ scale: 1 }}
                                                className="shrink-0"
                                            >
                                                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white" />
                                            </motion.div>
                                            <span className="group-hover/btn:hidden">รอถ่าย</span>
                                            <span className="hidden group-hover/btn:inline font-medium text-white">ติ๊กเสร็จ</span>
                                        </>
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 3. Type Icon (Desktop Only Slot) */}
                    <div className="hidden md:flex justify-center">
                        {isContent ? (
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl" title="Content Stock (คลิป)">
                                <Film className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl" title="Script Hub (บทสคริปต์)">
                                <FileEdit className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    {/* 4. Title & Info */}
                    <div className="min-w-0 md:pl-2 flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className={`text-[14px] md:text-[15px] font-kanit font-bold text-slate-800 truncate transition-colors ${isContent ? 'group-hover:text-amber-600' : 'group-hover:text-blue-600'} ${isFinished ? 'line-through decoration-emerald-500 decoration-2 text-slate-400' : ''}`}>
                                {item.title}
                            </h4>
                            {item.scriptId && onEditScript && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditScript(item.scriptId!);
                                    }}
                                    className="p-1 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all border border-teal-100/50"
                                    title="ไปหน้าแก้บทสคริปต์"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {channel && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded-full border border-slate-200 scale-90 origin-left">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: channel.color.split(' ')[0].replace('bg-', '') }} />
                                    <span className="text-[9px] font-bold text-slate-500">{channel.name}</span>
                                </div>
                            )}
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-lg border uppercase tracking-wider scale-90 origin-left ${statusInfo.color.replace('bg-', 'bg-opacity-10 text-opacity-100 ').replace('text-', 'border-')}`}>
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mobile Actions - only visible on small screens */}
                <div className="flex items-center gap-1 md:hidden pl-2">
                    {!isFinished && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenPlanning(item);
                            }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"
                        >
                            <Calendar className="w-4 h-4" />
                        </button>
                    )}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(item);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-300 ml-1" />
                </div>
            </div>

            {/* 5. Location Capsule (Slot 5 on Desktop / New line on Mobile) */}
            <div className="flex flex-col md:pl-4 w-full md:w-auto">
                {item.shootLocation ? (
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 md:py-2 rounded-xl flex items-center gap-2 group-hover:bg-white group-hover:border-indigo-200 transition-all shadow-sm w-fit max-w-[200px] md:max-w-none">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-[11px] md:text-[12px] font-kanit font-bold text-slate-700 truncate">{item.shootLocation}</span>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-1.5 text-[10px] font-kanit font-medium text-slate-300 italic group-hover:text-amber-400 transition-colors pl-2">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>ยังไม่ได้ระบุ</span>
                    </div>
                )}
            </div>

            {/* 6. Time Capsule (Slot 6 on Desktop / New line on Mobile) */}
            <div className="flex flex-col md:pl-4 w-full md:w-auto">
                {item.shootTimeStart ? (
                    <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 md:py-2 rounded-xl flex items-center gap-2 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all w-fit">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isFinished ? 'text-indigo-300' : 'text-indigo-600 group-hover:text-white'}`} />
                        <span className="text-[12px] md:text-[13px] font-medium">{item.shootTimeStart}</span>
                    </div>
                ) : (
                    <div className="hidden md:flex items-center gap-1.5 text-[10px] font-kanit font-medium text-slate-300 italic group-hover:text-indigo-400 transition-colors pl-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>รอระบุเวลา</span>
                    </div>
                )}
            </div>

            {/* 7. Actions (Desktop Slot 7) */}
            <div className="hidden md:flex items-center justify-center gap-1 border-l border-slate-100 pl-4 h-full">
                {!isFinished && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenPlanning(item);
                        }}
                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all border border-indigo-100 shadow-sm active:scale-90"
                        title="จัดตารางถ่ายทำ"
                    >
                        <Calendar className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item);
                    }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                    title="นำออกจากคิวถ่ายทำ"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default QueueItemRow;
