import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, FileText, CheckCircle2, Info, ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { MergedQueueItem } from './types';
import { Channel, Task, ScriptSummary, MasterOption } from '../../../../types';

interface QueueItemCardProps {
    item: MergedQueueItem;
    channel?: Channel;
    masterOptions: MasterOption[];
    isFinished: boolean;
    isProcessing: boolean;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
    onRemove: (item: MergedQueueItem) => void;
}

const QueueItemCard: React.FC<QueueItemCardProps> = ({
    item,
    channel,
    masterOptions,
    isFinished,
    isProcessing,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone,
    onRemove
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`
                group bg-white rounded-3xl border-2 transition-all overflow-hidden flex flex-col
                ${isContent 
                    ? 'border-amber-100 hover:border-amber-300 shadow-amber-50' 
                    : 'border-blue-100 hover:border-blue-300 shadow-blue-50'}
                ${isFinished ? 'opacity-60 grayscale-[0.5]' : 'shadow-sm hover:shadow-md'}
            `}
        >
            {/* Type Indicator Bar */}
            <div className={`h-1.5 w-full ${isContent ? 'bg-amber-400' : 'bg-blue-400'}`} />

            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        {isContent ? (
                            <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-100 flex items-center gap-1">
                                <LayoutGrid className="w-3 h-3" />
                                CONTENT STOCK
                            </div>
                        ) : (
                            <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                SCRIPT HUB
                            </div>
                        )}
                        {item.scriptId && (
                            <div className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold border border-green-100 flex items-center gap-1" title="มีสคริปต์ผูกอยู่">
                                <CheckCircle2 className="w-3 h-3" />
                                LINKED
                            </div>
                        )}
                    </div>
                    {channel && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color.split(' ')[0].replace('bg-', '') }} />
                            <span className="text-[10px] font-bold text-gray-600">{channel.name}</span>
                        </div>
                    )}
                </div>

                <h4 className={`text-md font-bold text-gray-800 line-clamp-2 mb-2 transition-colors ${isContent ? 'group-hover:text-amber-600' : 'group-hover:text-blue-600'} ${isFinished ? 'line-through decoration-indigo-500 decoration-2' : ''}`}>
                    {item.title}
                </h4>
                
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    {item.type === 'SCRIPT' && (item.item as ScriptSummary).estimatedDuration > 0 && (
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            ~{(item.item as ScriptSummary).estimatedDuration} นาที
                        </span>
                    )}
                    {item.type === 'CONTENT' && (item.item as Task).estimatedHours && (item.item as Task).estimatedHours! > 0 && (
                        <span className="flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            ~{(item.item as Task).estimatedHours} ชม.
                        </span>
                    )}
                </div>
            </div>

            <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onRemove(item)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="นำออกจากคิวถ่ายทำ"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={() => {
                            if (item.type === 'CONTENT') onEditContent(item.item as Task);
                            else if (onEditScript) onEditScript(item.id);
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                        ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                <button
                    onClick={() => isFinished ? onToggleFinished(item) : onMarkAsDone(item)}
                    disabled={isProcessing}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        font-bold text-xs transition-all
                        ${isProcessing 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : isFinished
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95'}
                    `}
                >
                    {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFinished ? (
                        <>
                            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            ยกเลิก
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ถ่ายเสร็จแล้ว
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default QueueItemCard;
