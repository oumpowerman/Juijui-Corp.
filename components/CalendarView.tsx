
import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Minimize2, Loader2 } from 'lucide-react';
import { Task, Channel, User, Status, MasterOption, TaskType } from '../types';
import MentorTip from './MentorTip';
import TaskCategoryModal from './TaskCategoryModal';
import { useCalendar } from '../hooks/useCalendar';
import CalendarHeader from './CalendarHeader';
import SmartFilterModal from './SmartFilterModal';
import BoardView from './BoardView';
import CalendarGrid from './calendar/CalendarGrid';
import { useCalendarHighlights } from '../hooks/useCalendarHightlights';
import DayHighlightModal from './calendar/DayHightlightModal';

interface CalendarViewProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  masterOptions?: MasterOption[];
  onSelectTask: (task: Task) => void;
  onSelectDate: (date: Date, type?: TaskType) => void;
  onMoveTask: (task: Task) => void; 
  onDelayTask?: (taskId: string, newDate: Date, reason: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void; // Added Prop
  onAddTask: (status: Status, type?: TaskType) => void;
  onUpdateStatus: (task: Task, newStatus: Status) => void;
  onRangeChange?: (targetDate: Date) => void; 
  isFetching?: boolean; 
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
    tasks, 
    channels, 
    users, 
    masterOptions = [],
    onSelectTask, 
    onSelectDate, 
    onMoveTask, 
    onDelayTask, 
    onOpenSettings,
    onOpenNotifications,
    onAddTask,
    onUpdateStatus,
    onRangeChange,
    isFetching = false
}) => {
  const {
      currentDate,
      viewMode, setViewMode,
      filterChannelId, setFilterChannelId,
      activeChipIds, toggleChip, customChips,
      isExpanded, setIsExpanded,
      showFilters,
      startDate, endDate,
      nextMonth, prevMonth, goToToday,
      filterTasks, getTasksForDay,
      saveChip, deleteChip,
      handleDragStart, handleDragOver, handleDrop, setDragOverDate, dragOverDate,
      isManageModalOpen, setIsManageModalOpen
  } = useCalendar({ tasks, onMoveTask });

  // --- Highlights Logic ---
  const { highlights, setHighlight, removeHighlight } = useCalendarHighlights(currentDate);
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [selectedHighlightDate, setSelectedHighlightDate] = useState<Date | null>(null);

  const [displayMode, setDisplayMode] = useState<'CALENDAR' | 'BOARD'>('CALENDAR');
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  // Trigger Range Change when month changes
  useEffect(() => {
      if (onRangeChange) {
          onRangeChange(currentDate);
      }
  }, [currentDate, onRangeChange]);

  // --- MEMOIZATION: Pre-calculate filtered tasks for the view (Used ONLY for Board View now) ---
  const filteredTasksForView = useMemo(() => {
      return filterTasks(tasks);
  }, [tasks, viewMode, activeChipIds, customChips]); 

  const handleDayClick = (day: Date, dayTasks: Task[]) => {
      setSelectedDayDate(day);
      setSelectedDayTasks(dayTasks); 
      setIsListModalOpen(true);
  };

  const handleDayContextMenu = (day: Date) => {
      setSelectedHighlightDate(day);
      setHighlightModalOpen(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      // Optional logic
  };

  const CALENDAR_TIPS = [
      "💡 Tip: กดปุ่มที่มุมขวาบนเพื่อสลับดูแบบ Board (Kanban) ได้นะ",
      "คลิกขวาที่ช่องวันที่ เพื่อเปลี่ยนสีไฮไลท์วัน (เช่น วันออกกอง, วันหยุด) ได้เลย!",
      "การลงคอนเทนต์สม่ำเสมอสำคัญกว่ายอดวิวเปรี้ยงปร้างแค่คลิปเดียว",
      "วางแผนล่วงหน้า 1 สัปดาห์ ชีวิตจะดีขึ้นเยอะ!",
  ];

  const containerClasses = isExpanded 
    ? "fixed inset-0 z-50 bg-[#f8fafc] p-2 md:p-6 overflow-y-auto" 
    : "space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-24";

  return (
    <div className={containerClasses}>
      {isExpanded && (
         <button 
           onClick={() => setIsExpanded(false)}
           className="absolute top-4 right-4 p-2.5 bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full z-50 shadow-lg border border-gray-200 transition-all hover:scale-110 active:scale-95"
           title="ย่อหน้าจอ"
         >
             <Minimize2 className="w-6 h-6" />
         </button>
      )}

      {isFetching && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] bg-white/90 backdrop-blur border border-indigo-100 shadow-xl px-4 py-2 rounded-full flex items-center gap-2 animate-in slide-in-from-top-4">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-xs font-bold text-indigo-800">กำลังโหลดข้อมูลเพิ่มเติม...</span>
          </div>
      )}

      {!isExpanded && <MentorTip variant="green" messages={CALENDAR_TIPS} />}
      
      <div className={`relative ${isExpanded ? 'mb-6 max-w-[1920px] mx-auto' : ''}`}>
         {!isExpanded && displayMode === 'CALENDAR' && (
             <>
                <div className="absolute -top-10 -right-10 w-48 md:w-72 h-48 md:h-72 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
                <div className="absolute -bottom-10 -left-10 w-40 md:w-64 h-40 md:h-64 bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
             </>
         )}

         <CalendarHeader 
            currentDate={currentDate || new Date()} 
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
            goToToday={goToToday}
            showFilters={showFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeChipIds={activeChipIds} 
            toggleChip={toggleChip}
            customChips={customChips || []} 
            setIsManageModalOpen={setIsManageModalOpen}
            onOpenSettings={onOpenSettings}
            onOpenNotifications={onOpenNotifications} // Pass down
            filterChannelId={filterChannelId}
            setFilterChannelId={setFilterChannelId}
            channels={channels}
            onSelectDate={(date, type) => {
                const targetType = type || viewMode; 
                onSelectDate(date, targetType); 
            }}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
         />
      </div>

      <div className={`relative transition-all duration-300 ${isExpanded ? 'h-full max-w-[1920px] mx-auto' : 'min-h-[600px]'}`}>
        {displayMode === 'CALENDAR' ? (
            <CalendarGrid 
                startDate={startDate}
                endDate={endDate}
                currentDate={currentDate || new Date()}
                isExpanded={isExpanded}
                dragOverDate={dragOverDate}
                viewMode={viewMode}
                activeChipIds={activeChipIds}
                customChips={customChips || []}
                highlights={highlights}
                masterOptions={masterOptions}
                getTasksForDay={getTasksForDay}
                filterTasks={filterTasks}
                onDayClick={handleDayClick}
                onDayContextMenu={handleDayContextMenu}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onTaskDragStart={handleDragStart}
                onTaskClick={onSelectTask}
            />
        ) : (
            <div 
                key="board-view" 
                className={`animate-slide-in-right ${isExpanded ? 'h-[90vh]' : ''}`}
            >
                <BoardView 
                    tasks={filteredTasksForView}
                    channels={channels}
                    users={users}
                    masterOptions={masterOptions}
                    onEditTask={onSelectTask}
                    onAddTask={(status) => onAddTask(status, viewMode)} 
                    onUpdateStatus={onUpdateStatus}
                    onOpenSettings={onOpenSettings}
                />
            </div>
        )}
      </div>

      {/* Modals */}
      <TaskCategoryModal 
            isOpen={isListModalOpen}
            onClose={() => setIsListModalOpen(false)}
            title={`รายการวันที่ ${format(selectedDayDate, 'd MMM yyyy')}`}
            tasks={selectedDayTasks}
            channels={channels}
            onEditTask={onSelectTask}
            colorTheme={viewMode === 'CONTENT' ? 'blue' : 'green'}
      />

      <SmartFilterModal 
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          chips={customChips || []} 
          channels={channels}
          masterOptions={masterOptions} 
          onSave={saveChip}
          onDelete={deleteChip}
      />
      
      <DayHighlightModal 
          isOpen={highlightModalOpen}
          onClose={() => setHighlightModalOpen(false)}
          date={selectedHighlightDate}
          masterOptions={masterOptions}
          currentHighlightType={highlights.find(h => selectedHighlightDate && isSameDay(h.date, selectedHighlightDate))?.typeKey}
          onSave={(typeKey, note) => selectedHighlightDate && setHighlight(selectedHighlightDate, typeKey, note)}
          onRemove={() => selectedHighlightDate && removeHighlight(selectedHighlightDate)}
      />
    </div>
  );
};

export default CalendarView;
