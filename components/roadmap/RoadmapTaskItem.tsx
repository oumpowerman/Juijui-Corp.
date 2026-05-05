
import React from 'react';
import { motion } from 'framer-motion';
import { Diamond, GripVertical } from 'lucide-react';
import { RoadmapTask, TaskStatus } from '../../services/roadmapService';

interface RoadmapTaskItemProps {
  task: RoadmapTask;
  timelineStartWeek: number;
  currentWeekIndex: number;
  totalWeeks: number;
  onEdit: (task: RoadmapTask) => void;
  isDraggable?: boolean;
}

const CategoryPill = ({ category }: { category: string }) => {
  const colors: Record<string, string> = {
    TikTok: 'bg-rose-50 text-rose-500 border-rose-100',
    System: 'bg-indigo-50 text-indigo-500 border-indigo-100',
    Marketing: 'bg-emerald-50 text-emerald-500 border-emerald-100',
    Other: 'bg-slate-50 text-slate-500 border-slate-100'
  };
  
  const colorClass = colors[category] || 'bg-slate-50 text-slate-500 border-slate-100';
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${colorClass}`}>
      {category}
    </span>
  );
};

const StatusPill = ({ status }: { status: TaskStatus }) => {
  const colors: Record<TaskStatus, string> = {
    Planned: 'bg-slate-100 text-slate-500',
    Ongoing: 'bg-blue-50 text-blue-500',
    Done: 'bg-emerald-50 text-emerald-500',
    Delayed: 'bg-amber-50 text-amber-500'
  };
  
  const labels: Record<TaskStatus, string> = {
    Planned: 'แผนงาน',
    Ongoing: 'กำลังทำ',
    Done: 'เสร็จสิ้น',
    Delayed: 'ล่าช้า'
  };
  
  return (
    <span className={`px-3 py-1 rounded text-[11px] font-semibold uppercase tracking-tight ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

const RoadmapTaskItem: React.FC<RoadmapTaskItemProps> = ({ 
  task, 
  timelineStartWeek, 
  currentWeekIndex,
  totalWeeks,
  onEdit,
  isDraggable = false
}) => {
  // 1 week = 40px
  const weekPixel = 40;
  
  // Calculate relative start position in the timeline window
  const relativeStart = task.start_week - timelineStartWeek;
  const leftOffset = relativeStart * weekPixel;
  const width = task.duration_weeks * weekPixel;

  // Render check: If task is completely outside the timeline window, hide it
  const isOutOfWindow = (task.start_week + task.duration_weeks) < timelineStartWeek || task.start_week > (timelineStartWeek + totalWeeks);

  if (isOutOfWindow) return null;

  const barColors: Record<string, { bg: string, border: string, fill: string, text: string }> = {
    TikTok: { bg: 'rgba(255, 228, 230, 0.15)', border: 'rgba(253, 164, 175, 0.4)', fill: '#E11D48', text: 'text-rose-600' },
    System: { bg: 'rgba(224, 231, 255, 0.15)', border: 'rgba(165, 180, 252, 0.4)', fill: '#4F46E5', text: 'text-indigo-600' },
    Marketing: { bg: 'rgba(209, 250, 229, 0.15)', border: 'rgba(110, 231, 183, 0.4)', fill: '#059669', text: 'text-emerald-600' },
    Other: { bg: 'rgba(241, 245, 249, 0.15)', border: 'rgba(203, 213, 225, 0.4)', fill: '#475569', text: 'text-slate-600' }
  };

  const scheme = barColors[task.category] || barColors.Other;

  // Highlight check
  const isActive = currentWeekIndex >= task.start_week && currentWeekIndex < (task.start_week + task.duration_weeks);

  return (
    <div className={`flex group hover:bg-slate-50 transition-all border-b border-slate-100 ${isActive ? 'bg-indigo-50/10' : ''}`}>
      {/* Sticky Table Columns - MUST match Timeline Header widths: 48 + 320 + 112 + 96 + 80 + 160 + 5 (borders) + 1 (right border) = 822px */}
      <div className={`flex divide-x divide-slate-100 items-center shrink-0 sticky left-0 z-50 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${isActive ? '!bg-indigo-50/30' : ''}`}>
        <div className={`w-[48px] min-w-[48px] max-w-[48px] py-5 px-2 flex flex-col items-center justify-center ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
          {isDraggable && (
            <GripVertical className="w-3.5 h-3.5 mb-1 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <span className="text-[12px] font-mono leading-none">{task.no}</span>
        </div>
        <div 
          onClick={() => onEdit(task)}
          className={`w-[320px] min-w-[320px] max-w-[320px] py-5 px-8 cursor-pointer group/title hover:text-indigo-600 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}
        >
          <div className="flex flex-col gap-1.5 overflow-hidden">
            <span className="text-base font-semibold truncate leading-tight">{task.initiative}</span>
            <div className="flex items-center gap-2">
              {/* Value Markers (B) */}
              {task.effort && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200" title={`Effort: ${task.effort}`}>
                  <span className="text-[9px] font-black text-slate-400">E</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <div key={v} className={`w-1.5 h-1.5 rounded-full ${v <= (task.effort || 0) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              )}
              {task.impact && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100" title={`Impact: ${task.impact}`}>
                  <span className="text-[9px] font-black text-emerald-400">I</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <div key={v} className={`w-1.5 h-1.5 rounded-full ${v <= (task.impact || 0) ? 'bg-emerald-500' : 'bg-emerald-100'}`} />
                    ))}
                  </div>
                </div>
              )}
              {/* Linkage Marker (A) */}
              {(task.dependencies?.length || 0) > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-600" title={`Has ${task.dependencies?.length} dependencies`}>
                  <Diamond className="w-2.5 h-2.5 fill-current" />
                  <span className="text-[9px] font-black">{task.dependencies?.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-[112px] min-w-[112px] max-w-[112px] py-5 px-2 flex justify-center"><CategoryPill category={task.category} /></div>
        <div className="w-[96px] min-w-[96px] max-w-[96px] py-5 px-2 flex justify-center"><StatusPill status={task.status} /></div>
        <div className="w-[80px] min-w-[80px] max-w-[80px] py-5 px-2 text-xs text-center text-slate-400 font-medium italic truncate px-2">{task.buffer}</div>
        <div className="w-[160px] min-w-[160px] max-w-[160px] py-5 px-4 text-xs text-center font-semibold text-slate-500 truncate">{task.milestone || '-'}</div>
      </div>

      {/* Timeline Bar Area */}
      <div className="relative h-14 flex-1 bg-transparent overflow-visible">
        {/* Grid Lines (Columns) */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: totalWeeks }).map((_, i) => (
             <div 
                key={i} 
                className={`w-[40px] h-full shrink-0 border-r border-slate-50/50 ${ 
                   (timelineStartWeek + i) === currentWeekIndex ? 'bg-indigo-50/5' : '' 
                }`} 
             />
          ))}
        </div>

        {/* The Strategy Pill / Gantt Bar */}
        <div className="relative h-14 w-full flex items-center">
            {/* Baseline Bar (D) - Only visible on hover or if baseline tracking is fully implemented */}
            {task.original_start_week && (
              <div 
                className="absolute h-4 bg-slate-200/50 border border-slate-300/30 rounded-full z-0 opacity-50"
                style={{
                  left: `${((task.original_start_week || task.start_week) - timelineStartWeek) * weekPixel + 4}px`,
                  width: `${(task.original_duration_weeks || task.duration_weeks) * weekPixel - 8}px`,
                }}
              />
            )}

            <motion.div
                layoutId={`task-${task.id}`}
                animate={{ 
                  scaleY: isActive ? 1.05 : 1,
                  boxShadow: isActive ? `0 10px 25px -5px ${scheme.border}` : '0 1px 3px rgba(0,0,0,0.05)',
                  zIndex: isActive ? 30 : 10,
                  opacity: 1
                }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                whileHover={{ scaleY: 1.1, zIndex: 40 }}
                onClick={() => onEdit(task)}
                className={`absolute h-8 rounded-full flex items-center px-4 cursor-pointer border transition-shadow overflow-hidden shadow-sm`}
                style={{
                  left: `${leftOffset + 4}px`,
                  width: `${width - 8}px`,
                  backgroundColor: '#ffffff',
                  borderColor: isActive ? scheme.fill : scheme.border
                }}
            >
                {/* Progress Fill - More subtle */}
                <div 
                    className="absolute left-0 top-0 bottom-0 opacity-10 transition-all duration-700 rounded-l-full"
                    style={{ 
                        width: `${task.progress}%`,
                        backgroundColor: scheme.fill
                    }}
                />
                
                {/* Simplified Bar with Color Line at top or bottom? No, just keep simple */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: scheme.fill }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between w-full overflow-hidden pl-1">
                  <span className={`text-[11px] font-bold uppercase truncate ${scheme.text} tracking-tight`}>
                    {task.initiative}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 ${scheme.text}`}>
                      {task.progress}%
                    </span>
                  </div>
                </div>

                {/* Milestone Indicator on Bar - Positioned at the end */}
                {task.milestone && (
                  <div 
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
                    title={`Milestone: ${task.milestone}`}
                  >
                    <div className="p-1 bg-white rounded-full shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
                      <Diamond className={`w-3.5 h-3.5 ${scheme.text} fill-current`} />
                    </div>
                  </div>
                )}

                {/* Tooltip Content - Moved below to avoid header cutoff */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-slate-900 text-white text-[11px] px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-[150] shadow-2xl font-bold border border-white/10 scale-90 group-hover:scale-100">
                  <div className="flex flex-col gap-1">
                    <span className="text-indigo-300">โครงการ: {task.initiative}</span>
                    <span>ความคืบหน้า: {task.progress}%</span>
                    {task.milestone && <span className="text-rose-300">เป้าหมาย: {task.milestone}</span>}
                  </div>
                  {/* Arrow pointing up */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-l border-t border-white/10" />
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapTaskItem;
