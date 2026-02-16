
import React, { useState, useMemo } from 'react';
import { Task, Channel, MasterOption } from '../types';
import { Search, Package, GripVertical, Calendar, Archive, X, LayoutTemplate } from 'lucide-react';

interface StockSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
}

const StockSidePanel: React.FC<StockSidePanelProps> = ({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions,
    onEditTask
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter only unscheduled tasks
    const stockTasks = useMemo(() => {
        return tasks.filter(t => {
            const isStock = t.isUnscheduled;
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            return isStock && matchesSearch;
        });
    }, [tasks, searchQuery]);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('source', 'STOCK'); // Mark source
        e.dataTransfer.effectAllowed = 'move';
    };

    const getChannelInfo = (id?: string) => channels.find(c => c.id === id);

    if (!isOpen) return null;

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl animate-in slide-in-from-right duration-300 z-40">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-2 text-indigo-900">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-sm">คลังงาน (Stock)</h3>
                    <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {stockTasks.length}
                    </span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-indigo-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหางาน..." 
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
                {stockTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center">
                        <Archive className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-xs font-medium">ไม่พบงานในคลัง</p>
                        <p className="text-[10px] text-gray-300">สร้างงานใหม่และติ๊ก "Stock Mode"</p>
                    </div>
                ) : (
                    stockTasks.map(task => {
                        const channel = getChannelInfo(task.channelId);
                        const isContent = task.type === 'CONTENT';
                        
                        return (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => onEditTask(task)}
                                className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200 group-hover:bg-indigo-400 transition-colors"></div>
                                
                                <div className="flex items-start gap-2 pl-2">
                                    <div className="mt-0.5 text-gray-300 group-hover:text-indigo-400">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                            {channel && (
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${channel.color}`}>
                                                    {channel.name}
                                                </span>
                                            )}
                                            {task.contentFormat && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-50 text-purple-600 border-purple-100">
                                                    {task.contentFormat}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-xs font-bold text-gray-700 leading-snug line-clamp-2 group-hover:text-indigo-700">
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center gap-1 mt-1.5 text-[9px] text-gray-400">
                                            {isContent ? <LayoutTemplate className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                            <span>{isContent ? 'Content' : 'Task'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Hint */}
            <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-[10px] text-indigo-600 text-center font-medium">
                💡 ลากการ์ดไปวางในปฏิทินเพื่อลงตาราง
            </div>
        </div>
    );
};

export default StockSidePanel;
