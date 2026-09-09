import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, Status, MasterOption, TaskType, ChipConfig, CalendarHighlight } from '../../../types';
import { TaskDisplayMode, CalendarViewType } from '../../CalendarView';
import CalendarGrid from '../CalendarGrid';
import WeeklyView from '../WeeklyView';
import BoardView from '../../BoardView';

interface CalendarViewSwitcherProps {
  displayMode: 'CALENDAR' | 'BOARD';
  viewMode: 'CONTENT' | 'TASK' | 'PLAN';
  calendarViewType: CalendarViewType;
  startDate: Date;
  endDate: Date;
  currentDate: Date;
  isExpanded: boolean;
  isMobileLandscape: boolean;
  dragOverDate: Date | null;
  taskDisplayMode: TaskDisplayMode;
  activeChipIds: string[];
  customChips: ChipConfig[];
  highlights: CalendarHighlight[];
  masterOptions: MasterOption[];
  channels: Channel[];
  users: User[];
  allTasks: Task[];
  filteredTasksForView: Task[];
  getTasksForDay: (day: Date) => Task[];
  filterTasks: (tasks: Task[]) => Task[];
  onDayClick: (day: Date, dayTasks: Task[]) => void;
  onDayContextMenu: (day: Date) => void;
  onDragOver: (e: React.DragEvent, day: Date) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, day: Date) => void;
  onTaskDragStart: (e: React.DragEvent, taskId: string) => void;
  onTaskClick: (task: Task) => void;
  onSelectDate: (date: Date, type?: TaskType) => void;
  onMoveTask: (task: Task) => void;
  onAddTask: (status: Status, type?: TaskType) => void;
  onUpdateStatus: (task: Task, newStatus: Status) => void;
  onOpenSettings: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

export const CalendarViewSwitcher: React.FC<CalendarViewSwitcherProps> = ({
  displayMode,
  viewMode,
  calendarViewType,
  startDate,
  endDate,
  currentDate,
  isExpanded,
  isMobileLandscape,
  dragOverDate,
  taskDisplayMode,
  activeChipIds,
  customChips,
  highlights,
  masterOptions,
  channels,
  users,
  allTasks,
  filteredTasksForView,
  getTasksForDay,
  filterTasks,
  onDayClick,
  onDayContextMenu,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onTaskClick,
  onSelectDate,
  onMoveTask,
  onAddTask,
  onUpdateStatus,
  onOpenSettings,
  onTouchStart,
  onTouchEnd,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={`${displayMode}-${viewMode}-${calendarViewType}`}
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.02, y: -10 }}
        transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="h-full md:h-auto flex flex-col flex-1 touch-pan-y"
      >
        {displayMode === 'CALENDAR' ? (
          calendarViewType === 'MONTH' ? (
            <CalendarGrid 
              startDate={startDate}
              endDate={endDate}
              currentDate={currentDate || new Date()}
              isExpanded={isExpanded || isMobileLandscape} // Force expanded mode in landscape
              dragOverDate={dragOverDate}
              viewMode={viewMode}
              taskDisplayMode={taskDisplayMode}
              activeChipIds={activeChipIds}
              customChips={customChips || []}
              highlights={highlights}
              masterOptions={masterOptions}
              channels={channels}
              users={users}
              allTasks={allTasks}
              getTasksForDay={getTasksForDay}
              filterTasks={filterTasks}
              onDayClick={onDayClick}
              onDayContextMenu={onDayContextMenu}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onTaskDragStart={onTaskDragStart}
              onTaskClick={onTaskClick}
            />
          ) : (
            <WeeklyView 
              currentDate={currentDate || new Date()}
              viewMode={viewMode}
              taskDisplayMode={taskDisplayMode}
              getTasksForDay={getTasksForDay}
              filterTasks={filterTasks}
              channels={channels}
              masterOptions={masterOptions}
              onTaskClick={onTaskClick}
              onSelectDate={onSelectDate}
              isLandscape={isMobileLandscape}
              allTasks={allTasks}
              onMoveTask={onMoveTask}
              onDayClick={onDayClick}
            />
          )
        ) : (
          <div 
            key="board-view" 
            className={`h-full ${isExpanded ? 'h-[90vh]' : ''}`}
          >
            <BoardView 
              tasks={filteredTasksForView}
              channels={channels}
              users={users}
              masterOptions={masterOptions}
              viewMode={viewMode}
              onEditTask={onTaskClick}
              onAddTask={(status) => onAddTask(status, viewMode)} 
              onUpdateStatus={onUpdateStatus}
              onOpenSettings={onOpenSettings}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default React.memo(CalendarViewSwitcher);
