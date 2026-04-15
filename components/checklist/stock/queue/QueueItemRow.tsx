import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, FileText, CheckCircle2, ArrowRight, Loader2, Clock } from 'lucide-react';
import { MergedQueueItem } from './types';
import { Channel, Task, ScriptSummary, MasterOption } from '../../../../types';

interface QueueItemRowProps {
    item: MergedQueueItem;
    channel?: Channel;
    masterOptions: MasterOption[];
    isFinished: boolean;
    isProcessing: boolean;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
}

const QueueItemRow: React.FC<QueueItemRowProps> = ({
    item,
    channel,
    masterOptions,
    isFinished,
    isProcessing,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone
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
            className={`
                group flex items-center gap-4 p-3 bg-white hover:bg-gray-50 border-b border-gray-100 transition-all 
                ${isFinished ? 'opacity-60' : ''}
                ${isContent ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-blue-400'}
            `}
        >
            {/* Checkbox/Status */}
            <div className="flex-shrink-0">
                <button
                    onClick={() => isFinished ? onToggleFinished(item) : onMarkAsDone(item)}
                    disabled={isProcessing}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isFinished 
                            ? (isContent ? 'bg-amber-500 border-amber-500 text-white' : 'bg-blue-500 border-blue-500 text-white')
                            : 'border-gray-200 hover:border-indigo-400 text-transparent'
                    }`}
                >
                    {isProcessing ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : (
                        <CheckCircle2 className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Type Icon */}
            <div className="flex-shrink-0">
                {isContent ? (
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <LayoutGrid className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* Title & Info */}
            <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold text-gray-800 truncate transition-colors ${isContent ? 'group-hover:text-amber-600' : 'group-hover:text-blue-600'} ${isFinished ? 'line-through decoration-indigo-500 decoration-2' : ''}`}>
                    {item.title}
                </h4>
                <div className="flex items-center gap-3 mt-0.5">
                    {channel && (
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: channel.color.split(' ')[0].replace('bg-', '') }} />
                            <span className="text-[10px] font-medium text-gray-500">{channel.name}</span>
                        </div>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    {item.type === 'SCRIPT' && (item.item as ScriptSummary).estimatedDuration > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="w-3 h-3" />
                            {(item.item as ScriptSummary).estimatedDuration}m
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => {
                        if (item.type === 'CONTENT') onEditContent(item.item as Task);
                        else if (onEditScript) onEditScript(item.id);
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="ดูรายละเอียด"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default QueueItemRow;
