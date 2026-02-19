
import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { Minimize2, Loader2, RotateCcw } from 'lucide-react';
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
import StockSidePanel from './StockSidePanel';

export type TaskDisplayMode = 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL';

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
  onOpenNotifications?: () => void;
  unreadCount?: number; 
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
    unreadCount = 0,
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

  // --- View Density State ---
  const [taskDisplayMode, setTaskDisplayMode] = useState<TaskDisplayMode>('EMOJI');

  // --- Stock Panel State ---
  const [isStockOpen, setIsStockOpen] = useState(false);

  // --- Mobile Landscape State ---
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

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
    ? "fixed inset-0 z-50 bg-[#f8fafc] p-2 md:p-6 overflow-y-auto animate-in zoom-in-95 duration-300" 
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
      
      <div className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${isExpanded ? 'mb-6 max-w-[1920px] mx-auto' : ''}`}>
         {!isExpanded && displayMode === 'CALENDAR' && (
             <>
                <div className="absolute -top-10 -right-10 w-48 md:w-72 h-48 md:h-72 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply transition-all duration-1000"></div>
                <div className="absolute -bottom-10 -left-10 w-40 md:w-64 h-40 md:h-64 bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply transition-all duration-1000"></div>
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
            onOpenNotifications={onOpenNotifications}
            unreadCount={unreadCount}
            filterChannelId={filterChannelId}
            setFilterChannelId={setFilterChannelId}
            channels={channels}
            onSelectDate={(date, type) => {
                const targetType = type || viewMode; 
                onSelectDate(date, targetType); 
            }}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            taskDisplayMode={taskDisplayMode}
            setTaskDisplayMode={setTaskDisplayMode}
            isStockOpen={isStockOpen}
            onToggleStock={() => setIsStockOpen(!isStockOpen)}
            isMobileLandscape={isMobileLandscape}
            onToggleMobileLandscape={() => setIsMobileLandscape(!isMobileLandscape)}
         />
      </div>

      <div className={`relative transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex ${isExpanded ? 'h-full max-w-[1920px] mx-auto' : 'min-h-[600px]'}`}>
        
        {/* Main Content Area */}
        <div className={`
            flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
            ${isStockOpen ? 'mr-4' : 'mr-0'}
            ${isMobileLandscape ? 'fixed inset-0 z-[100] bg-white w-[100vh] h-[100vw] origin-top-left rotate-90 translate-x-[100%] overflow-auto' : ''}
        `}>
            {/* Close Landscape Button (Mobile Only) */}
            {isMobileLandscape && (
                <button 
                    onClick={() => setIsMobileLandscape(false)}
                    className="fixed top-4 right-4 z-[110] bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md shadow-lg transition-all animate-in zoom-in"
                    title="หมุนกลับ"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            )}

            <div key={`${displayMode}-${viewMode}`} className="animate-in fade-in zoom-in-[0.98] duration-300 h-full">
                {displayMode === 'CALENDAR' ? (
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
                        className={`animate-in slide-in-from-right-8 duration-300 ${isExpanded ? 'h-[90vh]' : ''}`}
                    >
                        <BoardView 
                            tasks={filteredTasksForView}
                            channels={channels}
                            users={users}
                            masterOptions={masterOptions}
                            viewMode={viewMode}
                            onEditTask={onSelectTask}
                            onAddTask={(status) => onAddTask(status, viewMode)} 
                            onUpdateStatus={onUpdateStatus}
                            onOpenSettings={onOpenSettings}
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Stock Side Panel (Animated Slide) - Hidden in Mobile Landscape to save space */}
        {!isMobileLandscape && (
            <div 
                className={`
                    shrink-0 hidden lg:block sticky top-24 self-start h-[calc(100vh-120px)]
                    transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden
                    ${isStockOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10'}
                `}
            >
                 <div className="w-80 h-full">
                     <StockSidePanel 
                        isOpen={true} // Always render internal logic, control visibility via wrapper
                        onClose={() => setIsStockOpen(false)}
                        tasks={tasks}
                        channels={channels}
                        masterOptions={masterOptions}
                        onEditTask={onSelectTask}
                     />
                 </div>
            </div>
        )}
      </div>

      {/* Mobile Stock Panel Overlay (If Open on Mobile & Not Landscape) */}
      {isStockOpen && !isMobileLandscape && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsStockOpen(false)}>
               <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                    <StockSidePanel 
                        isOpen={true}
                        onClose={() => setIsStockOpen(false)}
                        tasks={tasks}
                        channels={channels}
                        masterOptions={masterOptions}
                        onEditTask={onSelectTask}
                    />
               </div>
          </div>
      )}

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
