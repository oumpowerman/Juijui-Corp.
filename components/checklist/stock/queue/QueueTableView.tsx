import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { MergedQueueItem } from './types';
import QueueItemRow from './QueueItemRow';
import { Channel, Task, MasterOption } from '../../../../types';

interface QueueTableViewProps {
    items: MergedQueueItem[];
    channels: Channel[];
    masterOptions: MasterOption[];
    isProcessing: string | null;
    onEditContent: (task: Task) => void;
    onEditScript?: (scriptId: string) => void;
    onToggleFinished: (item: MergedQueueItem) => void;
    onMarkAsDone: (item: MergedQueueItem) => void;
}

const QueueTableView: React.FC<QueueTableViewProps> = ({
    items,
    channels,
    masterOptions,
    isProcessing,
    onEditContent,
    onEditScript,
    onToggleFinished,
    onMarkAsDone
}) => {
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 overflow-hidden shadow-sm">
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <div className="w-6"></div>
                <div className="w-8"></div>
                <div className="flex-1">รายการที่ต้องถ่ายทำ</div>
                <div className="w-20">จัดการ</div>
            </div>
            <div className="divide-y divide-gray-50">
                <AnimatePresence mode='popLayout'>
                    {items.map((item) => (
                        <QueueItemRow
                            key={item.id}
                            item={item}
                            channel={channels.find(c => c.id === item.channelId)}
                            masterOptions={masterOptions}
                            isFinished={item.isSoftFinished}
                            isProcessing={isProcessing === item.id}
                            onEditContent={onEditContent}
                            onEditScript={onEditScript}
                            onToggleFinished={onToggleFinished}
                            onMarkAsDone={onMarkAsDone}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QueueTableView;
