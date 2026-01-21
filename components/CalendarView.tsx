
import React, { useState, useEffect } from 'react';
import { format, isSameMonth, isToday, eachDayOfInterval, isSameDay } from 'date-fns';
import { Minimize2, Loader2 } from 'lucide-react'; // Added Loader2
import { Task, Channel, User, Status, MasterOption, TaskType } from '../types';
import { COLOR_THEMES } from '../constants';
import MentorTip from './MentorTip';
import TaskCategoryModal from './TaskCategoryModal';
import { useCalendar } from '../hooks/useCalendar';
import CalendarHeader from './CalendarHeader';
import SmartFilterModal from './SmartFilterModal';
import BoardView from './BoardView';

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
  onAddTask: (status: Status, type?: TaskType) => void;
  onUpdateStatus: (task: Task, newStatus: Status) => void;
  onRangeChange?: (targetDate: Date) => void; // New Prop
  isFetching?: boolean; // New Prop
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

  const [displayMode, setDisplayMode] = useState<'CALENDAR' | 'BOARD'>('CALENDAR');
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  const gridDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // Trigger Range Change when month changes
  useEffect(() => {
      if (onRangeChange) {
          onRangeChange(currentDate);
      }
  }, [currentDate, onRangeChange]);

  const handleDayClick = (day: Date, dayTasks: Task[]) => {
      const relevantTasks = filterTasks(dayTasks);
      setSelectedDayDate(day);
      setSelectedDayTasks(relevantTasks);
      setIsListModalOpen(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      // Optional: Logic to clear highlight if leaving grid
  };

  const getTaskStyle = (task: Task) => {
      let styleClass = viewMode === 'CONTENT' 
          ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';

      if (activeChipIds.length > 0 && Array.isArray(customChips)) {
          const matchingChipId = activeChipIds.find(chipId => {
              const chip = customChips.find(c => c.id === chipId);
              if (!chip) return false;
              
              switch (chip.type) {
                  case 'CHANNEL': return task.channelId === chip.value;
                  case 'FORMAT': return task.contentFormat === chip.value;
                  case 'STATUS': return task.status === chip.value;
                  case 'PILLAR': return task.pillar === chip.value;
                  default: return false;
              }
          });

          if (matchingChipId) {
              const chip = customChips.find(c => c.id === matchingChipId);
              if (chip) {
                  const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                  styleClass = `${theme.bg} ${theme.text} ${theme.border} hover:opacity-90`;
              }
          }
      }

      return styleClass;
  };

  const getTaskDotClass = (task: Task) => {
      if (task.status === Status.DONE || task.status === Status.APPROVE) return 'bg-green-500';
      if (task.status === Status.TODO || task.status === Status.IDEA) return 'bg-gray-400';
      if (task.status === Status.BLOCKED) return 'bg-red-500';
      return 'bg-indigo-500'; 
  };

  const renderCellContent = (day: Date, dayTasks: Task[]) => {
      const visibleTasks = filterTasks(dayTasks);
      const count = visibleTasks.length;
      
      const maxVisible = isExpanded ? 8 : 3; 
      const containerSpacing = isExpanded ? 'space-y-1.5' : 'space-y-1';
      const containerPadding = isExpanded ? 'px-1.5' : 'px-1';
      
      const taskBaseClass = isExpanded 
        ? "w-full text-xs font-bold px-2 py-1.5 rounded-lg border truncate cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-sm leading-snug"
        : "w-full text-[10px] px-1.5 py-1 rounded-md border truncate cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-sm";

      return (
        <>
            <div className={`${isExpanded ? 'flex' : 'hidden md:flex'} flex-col items-center mt-2 w-full ${containerPadding} ${containerSpacing} h-full overflow-hidden`}>
                {count > 0 && visibleTasks.slice(0, maxVisible).map((task, index) => (
                    <div 
                        key={`${task.id}-${viewMode}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onSelectTask(task);
                        }}
                        style={{ 
                            animationDelay: `${index * 50}ms`, // Stagger delay
                            animationFillMode: 'both' 
                        }}
                        className={`
                            animate-spring
                            ${taskBaseClass}
                            ${getTaskStyle(task)}
                        `}
                        title={task.title}
                    >
                        {task.title}
                    </div>
                ))}
                {visibleTasks.length > maxVisible && (
                    <span 
                        className={`
                            ${isExpanded ? 'text-xs mt-1' : 'text-[9px]'} 
                            text-gray-400 font-bold animate-spring text-center block
                        `}
                        style={{ animationDelay: `${maxVisible * 50}ms`, animationFillMode: 'both' }}
                    >
                        +{visibleTasks.length - maxVisible} more
                    </span>
                )}
            </div>

            {!isExpanded && (
                <div className="flex md:hidden flex-wrap content-end justify-center gap-1 p-1 w-full h-full pb-2">
                    {visibleTasks.slice(0, 5).map((task, index) => (
                        <div 
                            key={task.id}
                            className={`
                                w-1.5 h-1.5 rounded-full ${getTaskDotClass(task)}
                                animate-spring
                            `}
                            style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                        />
                    ))}
                    {visibleTasks.length > 5 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex items-center justify-center text-[5px]">
                            +
                        </div>
                    )}
                </div>
            )}
        </>
      );
  };

  const CALENDAR_TIPS = [
      "💡 Tip: กดปุ่มที่มุมขวาบนเพื่อสลับดูแบบ Board (Kanban) ได้นะ",
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
            <div 
                key="calendar-view"
                className={`
                    bg-white rounded-[1.5rem] shadow-sm border border-gray-200 overflow-hidden 
                    ${isExpanded ? 'min-h-[85vh] shadow-2xl border-gray-300' : 'ring-4 ring-gray-50/50'} 
                    animate-slide-in-left
                `}
            >
                <div className="grid grid-cols-7 border-b border-gray-200">
                    {weekDays.map((day, index) => (
                        <div key={day} className={`py-3 text-center font-black uppercase tracking-widest ${isExpanded ? 'text-sm py-4' : 'text-[10px] md:text-xs'} ${index === 0 || index === 6 ? 'text-red-400 bg-red-50/30' : 'text-gray-400 bg-gray-50/50'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className={`
                    grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200 
                    ${isExpanded ? 'auto-rows-[minmax(140px,1fr)] md:auto-rows-[minmax(180px,1fr)]' : 'auto-rows-[minmax(70px,1fr)] lg:auto-rows-[minmax(120px,1fr)]'}
                `}>
                    {gridDays.map((day, dayIdx) => {
                        const dayTasks = getTasksForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate || new Date());
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
                                    relative flex flex-col group transition-all cursor-pointer select-none
                                    ${isExpanded ? 'p-1.5 md:p-3' : 'p-1 md:p-2'}
                                    ${!isCurrentMonth ? 'bg-gray-50/80 text-gray-300' : 'bg-white hover:bg-indigo-50/10'}
                                    ${isTodayDate ? 'bg-indigo-50/20 shadow-inner' : ''}
                                    ${isDragOver ? 'bg-indigo-100 ring-inset ring-2 ring-indigo-400 scale-[0.98] rounded-lg z-10 shadow-lg' : ''}
                                `}
                            >
                                <div className={`flex justify-center md:justify-between items-start mb-1 pointer-events-none relative z-10 ${isExpanded ? 'justify-between w-full' : ''}`}>
                                    <span className={`
                                        font-bold flex items-center justify-center transition-all
                                        ${isExpanded 
                                            ? 'text-lg w-8 h-8 rounded-xl' 
                                            : 'text-[10px] md:text-sm w-5 h-5 md:w-6 md:h-6 rounded-full md:rounded-lg'
                                        }
                                        ${isTodayDate ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''} 
                                        ${!isCurrentMonth ? 'opacity-50' : ''}
                                    `}>
                                        {format(day, 'd')}
                                    </span>
                                    
                                    {isExpanded && dayTasks.length > 0 && (
                                        <span className="hidden md:inline-block text-xs font-bold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                            {dayTasks.length}
                                        </span>
                                    )}
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
            <div 
                key="board-view" 
                className={`animate-slide-in-right ${isExpanded ? 'h-[90vh]' : ''}`}
            >
                <BoardView 
                    tasks={filterTasks(tasks)} 
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
    </div>
  );
};

export default CalendarView;
