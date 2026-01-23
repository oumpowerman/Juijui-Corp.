
import React from 'react';
import { X, Calendar, ArrowRight } from 'lucide-react';
import { Task, Channel, Status } from '../types';
import { STATUS_COLORS, STATUS_LABELS, PLATFORM_ICONS } from '../constants';
import { format } from 'date-fns';

interface TaskCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tasks: Task[];
  channels: Channel[];
  onEditTask: (task: Task) => void;
  colorTheme: string; // e.g., 'blue', 'green', 'red'
}

const TaskCategoryModal: React.FC<TaskCategoryModalProps> = ({ 
  isOpen, onClose, title, tasks, channels, onEditTask, colorTheme 
}) => {
  if (!isOpen) return null;

  const getChannelIcon = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return null;
    const platform = channel.platforms?.[0] || 'OTHER';
    const Icon = PLATFORM_ICONS[platform];
    const colorClass = (channel.color || 'bg-gray-100').split(' ')[1] || 'text-gray-500';
    return <Icon className={`w-3 h-3 ${colorClass}`} />;
  };

  // Map color theme to actual tailwind classes
  const themeClasses: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  const currentTheme = themeClasses[colorTheme] || themeClasses['blue'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-gray-100 animate-modal-pop">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${currentTheme}`}>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold">
                {title}
            </h2>
            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold border border-white/20">
                {tasks.length} งาน
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/50 rounded-full transition-colors opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-2 overflow-y-auto bg-gray-50 flex-1">
            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <p>ไม่มีงานในรายการนี้ครับ</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {tasks.map(task => (
                        <div 
                            key={task.id}
                            onClick={() => {
                                onEditTask(task);
                                onClose();
                            }}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group active:scale-[0.98]"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_COLORS[task.status]}`}>
                                        {STATUS_LABELS[task.status]}
                                    </span>
                                    <div className="flex items-center space-x-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                        {getChannelIcon(task.channelId)}
                                        <span className="text-[10px] text-gray-500 font-medium truncate max-w-[80px]">
                                            {channels.find(c => c.id === task.channelId)?.name}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {format(task.endDate, 'd MMM')}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{task.title}</h3>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskCategoryModal;
