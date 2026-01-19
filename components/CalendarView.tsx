
import React, { useState } from 'react';
import { format, isSameMonth, isToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { Minimize2 } from 'lucide-react';
import { Task, Channel, User, Status, MasterOption } from '../types';
import MentorTip from './MentorTip';
import TaskCategoryModal from './TaskCategoryModal';
import { useCalendar } from '../hooks/useCalendar';
import CalendarHeader from './CalendarHeader';
import SmartFilterModal from './SmartFilterModal';
import BoardView from './BoardView'; // Import Board View

interface CalendarViewProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  masterOptions?: MasterOption[]; // New Prop
  onSelectTask: (task: Task) => void;
  onSelectDate: (date: Date) => void;
  onMoveTask: (task: Task) => void; 
  onDelayTask?: (taskId: string, newDate: Date, reason: string) => void;
  onOpenSettings: () => void;
  
  // Board specific props
  onAddTask: (status: Status) => void;
  onUpdateStatus: (task: Task, newStatus: Status) => void;
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
    onAddTask,
    onUpdateStatus
}) => {
  // Use Custom Hook for Logic
  const {
      currentDate,
      viewMode, setViewMode,
      filterChannelId, setFilterChannelId,
      activeChipId, setActiveChipId, customChips,
      isExpanded, setIsExpanded,
      showFilters,
      startDate, endDate,
      nextMonth, prevMonth, goToToday,
      filterTasks, getTasksForDay,
      saveChip, deleteChip,
      handleDragStart, handleDragOver, handleDrop, setDragOverDate, dragOverDate,
      isManageModalOpen, setIsManageModalOpen
  } = useCalendar({ tasks, onMoveTask });

  // New State for switching view modes (Calendar vs Board)
  const [displayMode, setDisplayMode] = useState<'CALENDAR' | 'BOARD'>('CALENDAR');

  // Local state for list modal (kept here as it's UI specific)
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  const gridDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  const handleDayClick = (day: Date, dayTasks: Task[]) => {
      const relevantTasks = filterTasks(dayTasks);
      setSelectedDayDate(day);
      setSelectedDayTasks(relevantTasks);
      setIsListModalOpen(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      // Optional: Logic to clear highlight if leaving grid
  };

  // Helper to map status to simple color class for dots
  const getTaskColorClass = (task: Task) => {
      if (task.status === Status.DONE || task.status === Status.APPROVE) return 'bg-green-500';
      if (task.status === Status.TODO || task.status === Status.IDEA) return 'bg-gray-400';
      if (task.status === Status.BLOCKED) return 'bg-red-500';
      return 'bg-indigo-500'; // Doing/In Progress
  };

  const renderCellContent = (day: Date, dayTasks: Task[]) => {
      const visibleTasks = filterTasks(dayTasks);
      const count = visibleTasks.length;
      
      return (
        <>
            {/* --- DESKTOP VIEW: BARS --- */}
            <div className="hidden md:flex flex-col items-center mt-2 w-full px-1 space-y-1 h-full overflow-hidden">
                {count > 0 && visibleTasks.slice(0, 3).map((task, index) => (
                    <div 
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onSelectTask(task);
                        }}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className={`
                            w-full text-[10px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing hover:scale-105 transition-all
                            animate-in fade-in zoom-in-95 duration-300 fill-mode-forwards
                            ${viewMode === 'CONTENT' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'}
                            shadow-sm
                        `}
                        title={task.title}
                    >
                        {task.title}
                    </div>
                ))}
                {visibleTasks.length > 3 && (
                    <span className="text-[9px] text-gray-400 font-bold animate-in fade-in">+{visibleTasks.length - 3}</span>
                )}
            </div>

            {/* --- MOBILE VIEW: DOTS --- */}
            <div className="flex md:hidden flex-wrap content-end justify-center gap-1 p-1 w-full h-full pb-2">
                {visibleTasks.slice(0, 5).map((task) => (
                    <div 
                        key={task.id}
                        className={`w-1.5 h-1.5 rounded-full ${getTaskColorClass(task)}`}
                    />
                ))}
                {visibleTasks.length > 5 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex items-center justify-center text-[5px]">
                        +
                    </div>
                )}
            </div>
        </>
      );
  };

  const CALENDAR_TIPS = [
      "💡 Tip: กดปุ่มที่มุมขวาบนเพื่อสลับดูแบบ Board (Kanban) ได้นะ",
      "การลงคอนเทนต์สม่ำเสมอสำคัญกว่ายอดวิวเปรี้ยงปร้างแค่คลิปเดียว",
      "วางแผนล่วงหน้า 1 สัปดาห์ ชีวิตจะดีขึ้นเยอะ!",
  ];

  const containerClasses = isExpanded 
    ? "fixed inset-0 z-50 bg-white p-2 md:p-6 overflow-y-auto" 
    : "space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 md:pb-24";

  return (
    <div className={containerClasses}>
      {isExpanded && (
         <button 
           onClick={() => setIsExpanded(false)}
           className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-50"
         >
             <Minimize2 className="w-6 h-6 text-gray-600" />
         </button>
      )}

      {!isExpanded && <MentorTip variant="green" messages={CALENDAR_TIPS} />}
      
      {/* --- HEADER WRAPPER --- */}
      <div className={`relative ${isExpanded ? 'mb-4' : ''}`}>
         {!isExpanded && displayMode === 'CALENDAR' && (
             <>
                <div className="absolute -top-10 -right-10 w-48 md:w-72 h-48 md:h-72 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
                <div className="absolute -bottom-10 -left-10 w-40 md:w-64 h-40 md:h-64 bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
             </>
         )}

         {/* Extracted Header Component */}
         <CalendarHeader 
            currentDate={currentDate}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
            goToToday={goToToday}
            showFilters={showFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeChipId={activeChipId}
            setActiveChipId={setActiveChipId}
            customChips={customChips}
            setIsManageModalOpen={setIsManageModalOpen}
            onOpenSettings={onOpenSettings}
            filterChannelId={filterChannelId}
            setFilterChannelId={setFilterChannelId}
            channels={channels}
            onSelectDate={onSelectDate}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
         />
      </div>

      {/* --- CONTENT AREA SWITCHER --- */}
      <div className="relative min-h-[600px] transition-all duration-300">
        {displayMode === 'CALENDAR' ? (
            /* Calendar Grid */
            <div 
                key="calendar-view"
                className={`
                    bg-white rounded-[1.5rem] shadow-sm border border-gray-200 overflow-hidden ring-4 ring-gray-50/50 
                    ${isExpanded ? 'min-h-screen' : ''} 
                    animate-slide-in-left
                `}
            >
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {weekDays.map((day, index) => (
                        <div key={day} className={`py-3 text-center text-[10px] md:text-xs font-black uppercase tracking-widest ${index === 0 || index === 6 ? 'text-red-400 bg-red-50/30' : 'text-gray-400 bg-gray-50/50'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Adjust grid rows for mobile (smaller) vs desktop (taller) */}
                <div className={`
                    grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200 
                    auto-rows-[minmax(70px,1fr)] lg:auto-rows-[minmax(120px,1fr)]
                    ${isExpanded ? 'auto-rows-[minmax(150px,1fr)]' : ''}
                `}>
                    {gridDays.map((day, dayIdx) => {
                        const dayTasks = getTasksForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isTodayDate = isToday(day);
                        
                        const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

                        return (
                            <div 
                                key={day.toString()} 
                                onClick={() => handleDayClick(day, dayTasks)}
                                onDragOver={(e) => handleDragOver(e, day)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, day)}
                                className={`
                                    relative p-1 md:p-2 flex flex-col group transition-all cursor-pointer select-none
                                    ${!isCurrentMonth ? 'bg-gray-50/80 text-gray-300' : 'bg-white hover:bg-indigo-50/10'}
                                    ${isTodayDate ? 'bg-indigo-50/20 shadow-inner' : ''}
                                    ${isDragOver ? 'bg-indigo-100 ring-inset ring-2 ring-indigo-400 scale-[0.98] rounded-lg z-10 shadow-lg' : ''}
                                `}
                            >
                                <div className="flex justify-center md:justify-between items-start mb-1 pointer-events-none relative z-10">
                                    <span className={`text-[10px] md:text-sm font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full md:rounded-lg ${isTodayDate ? 'bg-indigo-600 text-white' : ''} ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col justify-start overflow-hidden w-full">
                                    {renderCellContent(day, dayTasks)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            /* Kanban Board View */
            <div 
                key="board-view" 
                className="animate-slide-in-right"
            >
                <BoardView 
                    tasks={tasks}
                    channels={channels}
                    users={users}
                    masterOptions={masterOptions}
                    onEditTask={onSelectTask}
                    onAddTask={onAddTask}
                    onUpdateStatus={onUpdateStatus}
                    onOpenSettings={onOpenSettings}
                />
            </div>
        )}
      </div>

      <TaskCategoryModal 
            isOpen={isListModalOpen}
            onClose={() => setIsListModalOpen(false)}
            title={`รายการวันที่ ${format(selectedDayDate, 'd MMM yyyy')}`}
            tasks={selectedDayTasks}
            channels={channels}
            onEditTask={onSelectTask}
            colorTheme={viewMode === 'CONTENT' ? 'blue' : 'green'}
      />

      {/* --- EXTRACTED CHIP MANAGER MODAL --- */}
      <SmartFilterModal 
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          chips={customChips}
          channels={channels}
          masterOptions={masterOptions} // PASSED
          onSave={saveChip}
          onDelete={deleteChip}
      />
    </div>
  );
};

export default CalendarView;
