import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Minimize2, Loader2 } from 'lucide-react';
import { Task, Channel, User, Status, MasterOption, TaskType } from '../types';
import { useCalendar } from '../hooks/useCalendar';
import CalendarHeader from './CalendarHeader';
import CalendarSecondaryHeader from './calendar/CalendarSecondaryHeader';
import { useCalendarHighlights } from '../hooks/useCalendarHightlights';
import PastelWaveBackground from './dashboard/member/PastelWaveBackground';
import AppBackground, { BackgroundTheme } from './common/AppBackground';
import MobileLandscapeWrapper from './common/MobileLandscapeWrapper';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useTaskContext } from '../context/TaskContext';

// Extracted Subcomponents & Custom Hooks
import { useCalendarFilters } from './calendar/hooks/useCalendarFilters';
import { useCalendarModals } from './calendar/hooks/useCalendarModals';
import { useResponsiveCalendarView } from './calendar/hooks/useResponsiveCalendarView';
import CalendarViewSwitcher from './calendar/views/CalendarViewSwitcher';
import CalendarStockDrawer from './calendar/panels/CalendarStockDrawer';
import CalendarModalsContainer from './calendar/modals/CalendarModalsContainer';

export type TaskDisplayMode = 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL';
export type CalendarViewType = 'MONTH' | 'WEEK';

interface CalendarViewProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
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
  onToggleWorkbox?: () => void;
  isWorkboxOpen?: boolean;
  onSaveTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  tasks, 
  channels, 
  users, 
  currentUser,
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
  isFetching = false,
  onToggleWorkbox,
  isWorkboxOpen,
  onSaveTask,
  onDeleteTask
}) => {
  // --- Modals State & Handlers Hook ---
  const modals = useCalendarModals({
    onSelectTask,
    onMoveTask,
    onDelayTask,
  });

  // --- Core Calendar Engine Hook ---
  const {
    currentDate,
    viewMode, setViewMode,
    filterChannelId, setFilterChannelId,
    activeChipIds, toggleChip, toggleFilters, customChips,
    isExpanded, setIsExpanded,
    showFilters,
    startDate, endDate,
    nextMonth, prevMonth,
    nextWeek, prevWeek,
    goToToday,
    showPlanOverlay, togglePlanOverlay,
    filterTasks, getTasksForDay,
    saveChip, deleteChip,
    handleDragStart, handleDragOver, handleDrop: internalHandleDrop, setDragOverDate, dragOverDate,
  } = useCalendar({ 
    tasks, 
    userId: currentUser.id,
    onMoveTask: (t) => modals.handleMoveAttempt(t) 
  });

  // --- Highlights Engine Hook ---
  const { highlights, setHighlight, removeHighlight } = useCalendarHighlights(currentDate);

  // --- Cosmic & Detailed Filter Engine Hook ---
  const filters = useCalendarFilters({
    tasks,
    users,
    currentUser,
    viewMode,
    filterTasks,
    startDate,
    endDate,
  });

  // --- Local View & Display Modes ---
  const [displayMode, setDisplayMode] = useState<'CALENDAR' | 'BOARD'>('CALENDAR');
  const [taskDisplayMode, setTaskDisplayMode] = useState<TaskDisplayMode>('EMOJI');
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  // --- Responsive Device & Orientation Aware View Engine ---
  const {
    calendarViewType,
    setCalendarViewType,
    handleTouchStart,
    handleTouchEnd,
  } = useResponsiveCalendarView({
    isMobileLandscape,
    onPrevWeek: prevWeek,
    onNextWeek: nextWeek,
    onPrevMonth: prevMonth,
    onNextMonth: nextMonth,
  });

  const { showAlert } = useGlobalDialog();
  const { fetchCompletedTasks } = useTaskContext();

  // Lazy-load completed tasks for the active calendar date range
  const startDateTime = startDate ? startDate.getTime() : 0;
  const endDateTime = endDate ? endDate.getTime() : 0;
  useEffect(() => {
    if (viewMode === 'TASK' && startDate && endDate) {
      fetchCompletedTasks({ startDate, endDate });
    }
  }, [viewMode, startDateTime, endDateTime, fetchCompletedTasks]);

  // Focus mode body class
  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add('calendar-focus-mode');
    } else {
      document.body.classList.remove('calendar-focus-mode');
    }
    return () => {
      document.body.classList.remove('calendar-focus-mode');
    };
  }, [isExpanded]);

  // Range change listener
  const currentTime = currentDate ? currentDate.getTime() : 0;
  useEffect(() => {
    if (onRangeChange && currentDate) {
      onRangeChange(currentDate);
    }
  }, [currentTime, onRangeChange]);

  // Auto-close stock panel when switching to TASK mode
  useEffect(() => {
    if (viewMode === 'TASK' && isStockOpen) {
      setIsStockOpen(false);
    }
  }, [viewMode, isStockOpen]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    setDragOverDate(null);
  }, [setDragOverDate]);

  const handleToggleStock = useCallback(() => {
    if (viewMode === 'TASK') {
      showAlert(
        'ฟีเจอร์ "คลังเก็บเนื้อหา" จะใช้งานได้เฉพาะในโหมด Content เท่านั้น เพื่อช่วยให้คุณดึงไอเดียมาวางแผนลงตารางได้สะดวกขึ้น',
        'เปิดหน้าต่างคลังไม่ได้'
      );
      return;
    }
    setIsStockOpen(prev => !prev);
  }, [viewMode, showAlert]);

  const bgTheme = useMemo<BackgroundTheme>(() => {
    if (viewMode === 'CONTENT') return 'pastel-pink';
    if (viewMode === 'PLAN') return 'pastel-purple';
    return 'pastel-blue';
  }, [viewMode]);

  const containerClasses = isExpanded 
    ? "relative min-h-screen overflow-x-hidden p-2 md:p-6 pb-16 animate-in zoom-in-95 duration-300" 
    : "relative z-10 space-y-3 sm:space-y-4 md:space-y-8 animate-in fade-in duration-500 pb-32 sm:pb-36 md:pb-24 overflow-hidden md:overflow-visible flex-1 flex flex-col h-full md:h-auto";

  return (
    <AppBackground 
      theme={bgTheme} 
      pattern="dots" 
      className={isExpanded ? "p-2 md:p-6 min-h-screen relative overflow-hidden" : "p-2 sm:p-4 md:p-8 h-full md:min-h-screen flex flex-col overflow-hidden md:overflow-visible relative"}
    >
      {/* Dynamic Mode-Synced Pastel Wave Fluid Background */}
      <PastelWaveBackground mode={viewMode} enabled={true} />

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

        <div className={`
          isolate transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] 
          ${isExpanded 
            ? 'sticky top-0 z-50 mb-6 max-w-[1920px] mx-auto rounded-b-2xl md:rounded-b-[2.5rem] bg-white/95 backdrop-blur-xl border-b border-white/60 shadow-md' 
            : 'relative z-30 rounded-[2.5rem]'
          }
        `}>
          {!isExpanded && displayMode === 'CALENDAR' && (
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
              <div className="absolute -top-0 -right-10 w-48 md:w-72 h-48 md:h-72 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-2xl opacity-50 pointer-events-none mix-blend-multiply transition-all duration-1000" />
              <div className="absolute -bottom-10 -left-10 w-40 md:w-64 h-40 md:h-64 bg-gradient-to-tr from-emerald-200/40 to-teal-200/40 rounded-full blur-2xl opacity-50 pointer-events-none mix-blend-multiply transition-all duration-1000" />
            </div>
          )}

          <CalendarHeader 
            currentDate={currentDate || new Date()} 
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            prevMonth={calendarViewType === 'WEEK' ? prevWeek : prevMonth}
            nextMonth={calendarViewType === 'WEEK' ? nextWeek : nextMonth}
            goToToday={goToToday}
            showFilters={showFilters}
            onToggleFilters={toggleFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeChipIds={activeChipIds} 
            toggleChip={toggleChip}
            customChips={customChips || []} 
            setIsManageModalOpen={filters.setIsCosmicFilterOpen}
            onOpenSettings={onOpenSettings}
            onOpenNotifications={onOpenNotifications}
            unreadCount={unreadCount}
            filterChannelId={filterChannelId}
            setFilterChannelId={setFilterChannelId}
            channels={channels}
            users={users}
            masterOptions={masterOptions}
            currentUser={currentUser}
            taskAssigneeScope={filters.taskAssigneeScope}
            onTaskAssigneeScopeChange={filters.setTaskAssigneeScope}
            selectedPosition={filters.selectedPosition}
            onSelectedPositionChange={filters.setSelectedPosition}
            onSelectDate={(date, type) => {
              const targetType = type || viewMode; 
              if (targetType === 'PLAN') {
                modals.handleOpenPlanForDate(date, null);
              } else {
                onSelectDate(date, targetType); 
              }
            }}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            taskDisplayMode={taskDisplayMode}
            setTaskDisplayMode={setTaskDisplayMode}
            isStockOpen={isStockOpen}
            onToggleStock={handleToggleStock}
            isMobileLandscape={isMobileLandscape}
            onToggleMobileLandscape={() => setIsMobileLandscape(!isMobileLandscape)}
            onToggleWorkbox={onToggleWorkbox}
            isWorkboxOpen={isWorkboxOpen}
            calendarViewType={calendarViewType}
            setCalendarViewType={setCalendarViewType}
          />

          <CalendarSecondaryHeader 
            show={showFilters}
            viewMode={viewMode}
            currentUser={currentUser}
            users={users}
            tasks={tasks}
            onClose={toggleFilters}
            activeChipIds={activeChipIds}
            toggleChip={toggleChip}
            customChips={customChips || []}
            channels={channels}
            onManageFilters={() => filters.setIsCosmicFilterOpen(true)}
            onOpenCosmicFilter={() => filters.setIsCosmicFilterOpen(true)}
            activeFiltersCount={filters.activeFiltersCount}
            taskAssigneeScope={filters.taskAssigneeScope}
            onTaskAssigneeScopeChange={filters.setTaskAssigneeScope}
            selectedTaskStatuses={filters.selectedTaskStatuses}
            onToggleTaskStatus={filters.handleToggleTaskStatus}
            isUrgentOnly={filters.isUrgentOnly}
            onToggleUrgentOnly={filters.handleToggleUrgentOnly}
            isDueSoonOnly={filters.isDueSoonOnly}
            onToggleDueSoonOnly={filters.handleToggleDueSoonOnly}
            unreadCount={unreadCount}
            onOpenNotifications={onOpenNotifications}
            onOpenSettings={onOpenSettings}
            onToggleWorkbox={onToggleWorkbox}
            onToggleStock={handleToggleStock}
            isWorkboxOpen={!!isWorkboxOpen}
            isStockOpen={isStockOpen}
            showPlanOverlay={showPlanOverlay}
            onTogglePlanOverlay={togglePlanOverlay}
            taskDisplayMode={taskDisplayMode}
            setTaskDisplayMode={setTaskDisplayMode}
            isExpanded={isExpanded}
          />
        </div>

        <MobileLandscapeWrapper
          isActive={isMobileLandscape}
          onClose={() => setIsMobileLandscape(false)}
        >
          <div className={`relative z-20 hover:z-[45] transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex ${isExpanded ? 'h-full max-w-[1920px] mx-auto' : 'flex-1 min-h-[300px] md:min-h-[600px] h-full md:h-auto'}`}>
            {/* Main Content Area */}
            <div className={`
              flex-1 min-w-0 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex flex-col h-full md:h-auto
              ${isStockOpen ? 'mr-4' : 'mr-0'}
            `}>
              <CalendarViewSwitcher 
                displayMode={displayMode}
                viewMode={viewMode}
                calendarViewType={calendarViewType}
                startDate={startDate}
                endDate={endDate}
                currentDate={currentDate || new Date()}
                isExpanded={isExpanded}
                isMobileLandscape={isMobileLandscape}
                dragOverDate={dragOverDate}
                taskDisplayMode={taskDisplayMode}
                activeChipIds={activeChipIds}
                customChips={customChips || []}
                highlights={highlights}
                masterOptions={masterOptions}
                channels={channels}
                users={users}
                allTasks={tasks}
                filteredTasksForView={filters.filteredTasksForView}
                getTasksForDay={getTasksForDay}
                filterTasks={filters.cosmicFilterTasks}
                onDayClick={modals.handleDayClick}
                onDayContextMenu={modals.handleDayContextMenu}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={internalHandleDrop}
                onTaskDragStart={handleDragStart}
                onTaskClick={modals.handleTaskClick}
                onSelectDate={onSelectDate}
                onMoveTask={modals.handleMoveAttempt}
                onAddTask={onAddTask}
                onUpdateStatus={onUpdateStatus}
                onOpenSettings={onOpenSettings}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            {/* Desktop Stock Panel */}
            <CalendarStockDrawer 
              isStockOpen={isStockOpen}
              onClose={() => setIsStockOpen(false)}
              isMobileLandscape={isMobileLandscape}
              tasks={tasks}
              channels={channels}
              masterOptions={masterOptions}
              onSelectTask={onSelectTask}
              onMoveTask={modals.handleMoveAttempt}
              isMobileOverlay={false}
            />
          </div>
        </MobileLandscapeWrapper>

        {/* Mobile Stock Panel Overlay */}
        <CalendarStockDrawer 
          isStockOpen={isStockOpen}
          onClose={() => setIsStockOpen(false)}
          isMobileLandscape={isMobileLandscape}
          tasks={tasks}
          channels={channels}
          masterOptions={masterOptions}
          onSelectTask={onSelectTask}
          onMoveTask={modals.handleMoveAttempt}
          isMobileOverlay={true}
        />

        {/* Modals Container */}
        <CalendarModalsContainer 
          isListModalOpen={modals.isListModalOpen}
          onCloseListModal={() => modals.setIsListModalOpen(false)}
          selectedDayDate={modals.selectedDayDate}
          selectedDayTasks={modals.selectedDayTasks}
          channels={channels}
          masterOptions={masterOptions}
          onSelectTask={onSelectTask}
          viewMode={viewMode}
          isCosmicFilterOpen={filters.isCosmicFilterOpen}
          onCloseCosmicFilter={() => filters.setIsCosmicFilterOpen(false)}
          users={users}
          taskCountsByUser={filters.taskCountsByUser}
          selectedCosmicChannelIds={filters.selectedCosmicChannelIds}
          selectedCosmicFormats={filters.selectedCosmicFormats}
          selectedCosmicStatuses={filters.selectedCosmicStatuses}
          selectedCosmicAssigneeIds={filters.selectedCosmicAssigneeIds}
          onApplyCosmicFilters={(f) => {
            filters.setSelectedCosmicChannelIds(f.channelIds);
            filters.setSelectedCosmicFormats(f.formats);
            filters.setSelectedCosmicStatuses(f.statuses);
            if (f.assigneeIds) {
              filters.setSelectedCosmicAssigneeIds(f.assigneeIds);
            }
          }}
          customChips={customChips || []}
          onSaveChip={saveChip}
          onDeleteChip={deleteChip}
          highlightModalOpen={modals.highlightModalOpen}
          onCloseHighlightModal={() => modals.setHighlightModalOpen(false)}
          selectedHighlightDate={modals.selectedHighlightDate}
          highlights={highlights}
          onSaveHighlight={(typeKey, note) => modals.selectedHighlightDate && setHighlight(modals.selectedHighlightDate, typeKey, note)}
          onRemoveHighlight={() => modals.selectedHighlightDate && removeHighlight(modals.selectedHighlightDate)}
          onAddPlanFromHighlight={(date) => modals.handleOpenPlanForDate(date, null)}
          planModalOpen={modals.planModalOpen}
          onClosePlanModal={() => modals.setPlanModalOpen(false)}
          selectedPlanDate={modals.selectedPlanDate}
          selectedPlanData={modals.selectedPlanData}
          currentUser={currentUser}
          onSaveTask={onSaveTask}
          onDeleteTask={onDeleteTask}
          pendingDelayTask={modals.pendingDelayTask}
          delayModalOpen={modals.delayModalOpen}
          onCloseDelayModal={() => {
            modals.setDelayModalOpen(false);
            modals.setPendingDelayTask(null);
          }}
          confirmDelay={modals.confirmDelay}
          tasks={tasks}
        />
      </div>
    </AppBackground>
  );
};

export default CalendarView;
