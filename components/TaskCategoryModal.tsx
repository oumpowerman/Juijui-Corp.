
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Minimize2, Maximize2, Columns, LayoutList } from 'lucide-react';
import { Task, Channel, MasterOption } from '../types';
import { PLATFORM_ICONS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCategoryItem from './TaskCategoryItem';

interface TaskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tasks: Task[];
  channels: Channel[];
  masterOptions?: MasterOption[]; // Add masterOptions
  onEditTask: (task: Task) => void;
  colorTheme: string; // e.g., 'blue', 'green', 'red', 'orange'
}

const TaskCategoryModal: React.FC<TaskCategoryModalProps> = ({ 
  isOpen, onClose, title, tasks, channels, masterOptions = [], onEditTask, colorTheme 
}) => {
  const [isCompact, setIsCompact] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Group tasks by channel
  const { channelGroups, unassignedTasks } = React.useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const unassigned: Task[] = [];
    
    tasks.forEach(task => {
      if (task.channelId) {
        if (!groups[task.channelId]) groups[task.channelId] = [];
        groups[task.channelId].push(task);
      } else {
        unassigned.push(task);
      }
    });

    return { channelGroups: groups, unassignedTasks: unassigned };
  }, [tasks]);

  // Map color theme to actual styling
  const themeStyles: Record<string, { bg: string, text: string, border: string, iconBg: string }> = {
    slate: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', iconBg: 'bg-slate-200 text-slate-700' },
    blue: { bg: 'bg-blue-50/80', text: 'text-blue-800', border: 'border-blue-200', iconBg: 'bg-blue-200 text-blue-700' },
    green: { bg: 'bg-emerald-50/80', text: 'text-emerald-800', border: 'border-emerald-200', iconBg: 'bg-emerald-200 text-emerald-700' },
    red: { bg: 'bg-rose-50/80', text: 'text-rose-800', border: 'border-rose-200', iconBg: 'bg-rose-200 text-rose-700' },
    orange: { bg: 'bg-gradient-to-r from-orange-50 to-amber-50', text: 'text-orange-900', border: 'border-orange-200', iconBg: 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-200' },
  };

  // Force orange theme as requested by user ("มันสีสัมมี effect สวยงามกว่านี้")
  const theme = themeStyles['orange'];

  const getChannelInfo = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return null;
    const platform = channel.platforms?.[0] || 'OTHER';
    const Icon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.OTHER;
    const colorClass = (channel.color || 'bg-gray-100').split(' ')[1] || 'text-gray-500';
    return { name: channel.name, Icon, colorClass, fullColor: channel.color, logoUrl: channel.logoUrl };
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9000] flex items-center justify-center p-4 overflow-hidden perspective-1000"
        >
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-orange-900/20 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Animated Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40, rotateX: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.8 }}
            className={`bg-white/80 backdrop-blur-xl w-full ${viewMode === 'board' ? 'max-w-6xl' : 'max-w-2xl'} rounded-[1.75rem] sm:rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(251,146,60,0.3)] overflow-hidden flex flex-col border border-white/60 z-10 transition-all duration-300 ${tasks.length > 0 ? 'h-[85vh]' : 'max-h-[85vh]'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-4 py-3.5 sm:px-8 sm:py-6 border-b flex justify-between items-center ${theme.bg} ${theme.border}`}>
              <div className="flex items-center gap-2.5 sm:gap-4 overflow-hidden">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", delay: 0.1, stiffness: 400, damping: 15 }}
                  className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl shrink-0 ${theme.iconBg}`}
                >
                     <AlertCircle className="w-5 h-5 sm:w-7 h-7" />
                </motion.div>
                <div className="overflow-hidden">
                    <h2 className={`text-base sm:text-2xl font-bold ${theme.text} tracking-tight truncate`}>
                        {title}
                    </h2>
                    <p className="text-[11px] sm:text-sm font-medium opacity-70 text-orange-700/80 mt-0.5">
                        รายการทั้งหมด {tasks.length} งาน
                    </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                  {tasks.length > 0 && (
                      <>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setViewMode(viewMode === 'list' ? 'board' : 'list')}
                            className={`p-2 sm:p-2.5 rounded-full transition-colors ${viewMode === 'board' ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                            title={viewMode === 'list' ? "แสดงแบบแบ่งช่อง (Channels)" : "แสดงแบบรายการปกติ"}
                        >
                            {viewMode === 'list' ? <Columns className="w-4 h-4 sm:w-5 h-5" /> : <LayoutList className="w-4 h-4 sm:w-5 h-5" />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsCompact(!isCompact)}
                            className={`p-2 sm:p-2.5 rounded-full transition-colors ${isCompact ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-white border border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                            title={isCompact ? "ขยายรายการ" : "ย่อรายการ"}
                        >
                            {isCompact ? <Maximize2 className="w-4 h-4 sm:w-5 h-5" /> : <Minimize2 className="w-4 h-4 sm:w-5 h-5" />}
                        </motion.button>
                      </>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose} 
                    className="p-2 sm:p-2.5 bg-white border border-slate-100 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 rounded-full transition-colors text-slate-400 shadow-sm"
                  >
                    <X className="w-4 h-4 sm:w-5 h-5" />
                  </motion.button>
              </div>
            </div>

            {/* Content */}
            {viewMode === 'list' ? (
                <div className="p-3 sm:p-5 overflow-y-auto bg-slate-50/50 flex-1 space-y-3 custom-scrollbar">
                    {tasks.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-col items-center justify-center h-48 text-orange-400 bg-white/60 backdrop-blur-sm rounded-3xl border border-orange-100 shadow-sm p-6 text-center"
                        >
                            <div className={`p-4 rounded-full mb-3 ${theme.iconBg} opacity-80 backdrop-blur-md`}>
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                            <p className="font-semibold text-orange-800 text-lg">เบื้องต้นยังไม่มีรายการใดๆ</p>
                            <p className="text-sm font-medium text-orange-600/70 mt-1">ยังไม่มีงานในหมวดหมู่นี้ในขณะนี้</p>
                        </motion.div>
                    ) : (
                        <div className="space-y-3">
                            {[...tasks].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).map((task, index) => (
                                <TaskCategoryItem 
                                    key={task.id}
                                    task={task}
                                    channelInfo={getChannelInfo(task.channelId || '')}
                                    masterOptions={masterOptions}
                                    onClick={onEditTask}
                                    isCompact={isCompact}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-slate-50/50 flex-1 overflow-hidden flex flex-col">
                    {tasks.length === 0 ? (
                        <div className="p-5 flex-1 flex items-center justify-center">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex flex-col items-center justify-center h-48 text-orange-400 bg-white/60 backdrop-blur-sm rounded-3xl border border-orange-100 shadow-sm p-6 text-center"
                            >
                                <div className={`p-4 rounded-full mb-3 ${theme.iconBg} opacity-80 backdrop-blur-md`}>
                                    <AlertCircle className="w-8 h-8 text-white" />
                                </div>
                                <p className="font-semibold text-orange-800 text-lg">เบื้องต้นยังไม่มีรายการใดๆ</p>
                                <p className="text-sm font-medium text-orange-600/70 mt-1">ยังไม่มีงานในหมวดหมู่นี้ในขณะนี้</p>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="flex gap-4 sm:gap-6 h-full overflow-x-auto p-4 sm:p-6 select-none custom-scrollbar pb-6 items-start">
                            {/* Render active channels */}
                            {channels.filter(c => channelGroups[c.id]).map(channel => {
                                const groupTasks = channelGroups[channel.id];
                                const platform = channel.platforms?.[0] || 'OTHER';
                                const CIcon = PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.OTHER;
                                
                                return (
                                    <div key={channel.id} className="w-[280px] sm:w-[340px] max-h-full flex flex-col gap-3 shrink-0 bg-white/50 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-2 pb-2 border-b border-orange-100/30 shrink-0">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full border ${channel.color || 'bg-gray-100 border-gray-200'} shadow-sm overflow-hidden shrink-0`}>
                                                {channel.logoUrl ? (
                                                    <img src={channel.logoUrl} alt={channel.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <CIcon className="w-4 h-4" />
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-slate-800 text-sm truncate">{channel.name}</h3>
                                            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{groupTasks.length}</span>
                                        </div>
                                        <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1 pb-2">
                                            {[...groupTasks].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).map((task, index) => (
                                                <TaskCategoryItem 
                                                    key={task.id}
                                                    task={task}
                                                    channelInfo={getChannelInfo(task.channelId || '')}
                                                    masterOptions={masterOptions}
                                                    onClick={onEditTask}
                                                    isCompact={isCompact}
                                                    index={index}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Render unassigned tasks if any */}
                            {unassignedTasks.length > 0 && (
                                <div className="w-[280px] sm:w-[340px] max-h-full flex flex-col gap-3 shrink-0 bg-white/50 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 pb-2 border-b border-slate-250 shrink-0">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full border bg-gray-100 border-gray-200 shadow-sm text-gray-500 shrink-0">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-semibold text-slate-800 text-sm truncate">ไม่มีช่อง</h3>
                                        <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">{unassignedTasks.length}</span>
                                    </div>
                                    <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-1 pb-2">
                                        {[...unassignedTasks].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).map((task, index) => (
                                            <TaskCategoryItem 
                                                key={task.id}
                                                task={task}
                                                channelInfo={getChannelInfo(task.channelId || '')}
                                                masterOptions={masterOptions}
                                                onClick={onEditTask}
                                                isCompact={isCompact}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default TaskCategoryModal;
