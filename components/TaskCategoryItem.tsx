import React from 'react';
import { Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { Task, Channel, MasterOption } from '../types';
import { PLATFORM_ICONS, STATUS_COLORS, STATUS_LABELS } from '../constants';
import { format, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

interface TaskCategoryItemProps {
  task: Task;
  channelInfo: { name: string; Icon: React.ElementType; colorClass: string; fullColor: string; logoUrl?: string } | null;
  masterOptions: MasterOption[];
  onClick: (task: Task) => void;
  isCompact?: boolean;
  index?: number;
}

const TaskCategoryItem: React.FC<TaskCategoryItemProps> = ({
  task,
  channelInfo,
  masterOptions,
  onClick,
  isCompact = false,
  index = 0
}) => {
  const getDueText = (date: Date) => {
      const diff = differenceInDays(date, new Date());
      if (diff < 0) return { text: `${Math.abs(diff)} วันที่แล้ว`, color: 'text-rose-500' };
      if (diff === 0) return { text: 'วันนี้', color: 'text-orange-600' };
      if (diff === 1) return { text: 'พรุ่งนี้', color: 'text-amber-600' };
      return { text: `อีก ${diff} วัน`, color: 'text-gray-500' };
  };

  const dueInfo = getDueText(task.endDate);

  const getStatusDisplay = () => {
    const s = (task.status || '').toString().toUpperCase();
    let masterStatus = masterOptions.find(opt => 
        (opt.type === 'STATUS' || opt.type === 'TASK_STATUS') && 
        opt.key.toUpperCase() === s
    );

    if (!masterStatus) {
        masterStatus = masterOptions.find(opt => opt.key.toUpperCase() === s);
    }

    const rawLabel = masterStatus?.label || STATUS_LABELS[s as any] || task.status;
    const cleanLabel = rawLabel.replace(/^\d+\s*/, '');
    const colorClass = masterStatus?.color || STATUS_COLORS[s as any] || 'bg-gray-100 text-gray-600 border-gray-200';
    
    return { label: cleanLabel, colorClass };
  };

  const statusDisplay = getStatusDisplay();

  const getFormatDisplay = () => {
    if (!task.contentFormats || task.contentFormats.length === 0) return null;
    const f = task.contentFormats[0].toString().toUpperCase();
    const masterFormat = masterOptions.find(opt => 
        opt.type === 'FORMAT' && opt.key.toUpperCase() === f
    );
    return masterFormat?.label || task.contentFormats[0];
  };

  const formatDisplay = getFormatDisplay();

  const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
          opacity: 1, 
          y: 0, 
          transition: { 
              type: 'spring' as const, 
              damping: 25, 
              stiffness: 400, 
              delay: index * 0.05 
          } 
      }
  };

  if (isCompact) {
      return (
          <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onClick(task)}
              className="bg-white p-3 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md hover:border-orange-400 cursor-pointer transition-all group relative overflow-hidden flex items-center gap-3"
          >
              {/* Hover Bar - Orange Theme */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                      {channelInfo && (
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full border ${channelInfo.fullColor} shadow-sm overflow-hidden`} title={channelInfo.name}>
                              {channelInfo.logoUrl ? (
                                  <img src={channelInfo.logoUrl} alt={channelInfo.name} className="w-full h-full object-cover" />
                              ) : (
                                  <channelInfo.Icon className="w-4 h-4" />
                              )}
                          </div>
                      )}
                      
                      {task.scheduledTime ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-100 bg-orange-50/50 text-orange-600 shadow-sm">
                              <Clock className="w-3 h-3" /> {task.scheduledTime}
                          </span>
                      ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusDisplay.colorClass}`}>
                              {statusDisplay.label}
                          </span>
                      )}
                  </div>
                  
                  <h3 className="font-medium text-gray-700 text-sm truncate flex-1 group-hover:text-orange-700 transition-colors">
                      {task.title}
                  </h3>

                  <div className={`flex items-center font-bold text-xs shrink-0 ${dueInfo.color}`}>
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {format(task.endDate, 'd MMM')}
                  </div>
              </div>
          </motion.div>
      );
  }

  return (
    <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(task)}
        className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-400 cursor-pointer transition-all group relative overflow-hidden flex flex-col gap-3"
    >
        {/* Hover Bar - Orange Theme */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div className="flex justify-between items-start gap-4 w-full">
            <div className="flex-1 min-w-0">
                {/* Top Metadata */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    {channelInfo && (
                        <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${channelInfo.fullColor} shadow-sm bg-white`}>
                            {channelInfo.logoUrl ? (
                                <img src={channelInfo.logoUrl} alt={channelInfo.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                            ) : (
                                <channelInfo.Icon className="w-3 h-3" />
                            )}
                            {channelInfo.name}
                        </span>
                    )}
                    
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shadow-sm bg-white ${statusDisplay.colorClass}`}>
                        {statusDisplay.label}
                    </span>
                    
                    {formatDisplay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-orange-200 bg-orange-50 text-orange-700 shadow-sm">
                            {formatDisplay}
                        </span>
                    )}

                    {task.scheduledTime && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-100 bg-orange-50/50 text-orange-600 shadow-sm tracking-wider">
                          <Clock className="w-3 h-3" /> {task.scheduledTime}
                      </span>
                    )}
                </div>
                
                <h3 className="font-semibold text-gray-800 text-base leading-snug group-hover:text-orange-700 transition-colors">
                    {task.title}
                </h3>
            </div>

            <div className="p-2.5 bg-orange-50/50 rounded-full text-orange-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors shrink-0 shadow-sm">
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>

        {/* Bottom Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-orange-50">
            <div className={`flex items-center font-medium ${dueInfo.color}`}>
                <Calendar className="w-4 h-4 mr-1.5" />
                {format(task.endDate, 'd MMM')} ({dueInfo.text})
            </div>
            {/* Assignees (Visual only) */}
            {(task.assigneeIds.length > 0 || (task.ideaOwnerIds?.length ?? 0) > 0) && (
                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-600">{(task.assigneeIds.length || 0) + (task.ideaOwnerIds?.length ?? 0)} คน</span>
                </div>
            )}
        </div>
    </motion.div>
  );
};

export default TaskCategoryItem;
