import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Video, MoreHorizontal, CalendarPlus, BarChart3, Inbox } from 'lucide-react';
import { Task } from '../../../../../types';
import { useGlobalDialog } from '../../../../../context/GlobalDialogContext';

interface StockRowActionsProps {
    task: Task;
    isInWorkbox: boolean;
    onEdit: (task: Task) => void;
    onSchedule: (task: Task) => void;
    onToggleQueue?: (id: string, currentStatus: boolean) => void;
    onAddToWorkbox?: (task: Task) => void;
    onOpenAnalytics?: (task: Task) => void;
    taskInShootQueue: boolean;
}

export const StockRowActions: React.FC<StockRowActionsProps> = ({
    task,
    isInWorkbox,
    onEdit,
    onSchedule,
    onToggleQueue,
    onAddToWorkbox,
    onOpenAnalytics,
    taskInShootQueue
}) => {
    const { showConfirm } = useGlobalDialog();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative w-12 h-9 flex items-center justify-end select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => e.stopPropagation()}
        >
            <AnimatePresence mode="wait">
                {/* Collapsed State: Neat and compact MoreHorizontal trigger or Video indicator */}
                {!isHovered ? (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shadow-sm ${
                            taskInShootQueue 
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                : 'bg-slate-50 text-slate-400 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-650 group-hover:border-indigo-100'
                        }`}
                    >
                        {taskInShootQueue ? (
                            <Video className="w-4 h-4 fill-current animate-pulse" />
                        ) : (
                            <MoreHorizontal className="w-4 h-4" />
                        )}
                    </motion.div>
                ) : (
                    /* Expanded State: Floating Panel containing all actions */
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 15, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 450, damping: 28 }}
                            className="flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md border border-indigo-100/80 rounded-2xl shadow-[-10px_0_30px_rgba(99,102,241,0.08),_0_10px_20px_rgba(0,0,0,0.05)] whitespace-nowrap"
                            style={{ transformOrigin: 'right center' }}
                        >
                            {onToggleQueue && (
                                <button 
                                    onClick={async (e) => { 
                                        e.stopPropagation(); 
                                        if (!taskInShootQueue) {
                                            const confirmed = await showConfirm(
                                                `คุณต้องการเพิ่ม "${task.title}" เข้าสู่คิวถ่ายใช่หรือไม่?`,
                                                "ยืนยันการเพิ่มเข้าคิวถ่าย"
                                            );
                                            if (!confirmed) return;
                                        }
                                        onToggleQueue(task.id, taskInShootQueue); 
                                    }} 
                                    className={`p-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                                        taskInShootQueue 
                                            ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' 
                                            : 'text-gray-500 bg-slate-50 hover:text-indigo-600 hover:bg-white border border-slate-100 hover:border-slate-200'
                                    }`}
                                    title={taskInShootQueue ? "เอาออกจากคิวถ่าย" : "เพิ่มเข้าคิวถ่าย"}
                                >
                                    <Video className={`w-4 h-4 ${taskInShootQueue ? 'fill-current' : ''}`} />
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(task); }} 
                                className="p-2 text-gray-500 bg-slate-50 hover:text-indigo-600 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
                                title="แก้ไขรายละเอียด"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSchedule(task); }} 
                                className="p-2 text-gray-500 bg-slate-50 hover:text-green-650 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer" 
                                title="ลงตาราง"
                            >
                                <CalendarPlus className="w-4 h-4" />
                            </button>
                            {onOpenAnalytics && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onOpenAnalytics(task); 
                                    }} 
                                    className="p-2 text-gray-500 bg-slate-50 hover:text-indigo-600 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
                                    title="สถิติคอนเทนต์"
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                            )}
                            {onAddToWorkbox && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAddToWorkbox(task); }} 
                                    className={`p-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                                        isInWorkbox 
                                            ? 'text-amber-600 bg-amber-50 border border-amber-100' 
                                            : 'text-gray-500 bg-slate-50 hover:text-amber-600 hover:bg-white border border-slate-100 hover:border-slate-200'
                                    }`}
                                    title={isInWorkbox ? "อยู่ใน WorkBox แล้ว" : "เก็บเข้า WorkBox"}
                                >
                                    <Inbox className={`w-4 h-4 ${isInWorkbox ? 'fill-current' : ''}`} />
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

