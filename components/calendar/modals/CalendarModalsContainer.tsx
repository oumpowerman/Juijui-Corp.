import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Task, Channel, User, MasterOption, ChipConfig, CalendarHighlight } from '../../../types';
import TaskCategoryModal from '../../TaskCategoryModal';
import UnifiedFilterModal from '../UnifiedFilterModal';
import DayHighlightModal from '../DayHightlightModal';
import PlanFormModal from '../PlanFormModal';
import DelayModal from '../../DelayModal';

interface CalendarModalsContainerProps {
  // Day List Modal
  isListModalOpen: boolean;
  onCloseListModal: () => void;
  selectedDayDate: Date;
  selectedDayTasks: Task[];
  channels: Channel[];
  masterOptions?: MasterOption[];
  onSelectTask: (task: Task) => void;
  viewMode: 'CONTENT' | 'TASK' | 'PLAN';

  // Cosmic Filter Modal
  isCosmicFilterOpen: boolean;
  onCloseCosmicFilter: () => void;
  users: User[];
  taskCountsByUser: Record<string, number>;
  selectedCosmicChannelIds: string[];
  selectedCosmicFormats: string[];
  selectedCosmicStatuses: string[];
  selectedCosmicAssigneeIds: string[];
  onApplyCosmicFilters: (filters: {
    channelIds: string[];
    formats: string[];
    statuses: string[];
    assigneeIds?: string[];
  }) => void;
  customChips: ChipConfig[];
  onSaveChip: (chip: ChipConfig) => void;
  onDeleteChip: (chipId: string) => void;

  // Highlight Modal
  highlightModalOpen: boolean;
  onCloseHighlightModal: () => void;
  selectedHighlightDate: Date | null;
  highlights: CalendarHighlight[];
  onSaveHighlight: (typeKey: string, note?: string) => void;
  onRemoveHighlight: () => void;
  onAddPlanFromHighlight: (date: Date) => void;

  // Plan Modal
  planModalOpen: boolean;
  onClosePlanModal: () => void;
  selectedPlanDate: Date | null;
  selectedPlanData: Task | null;
  currentUser: User;
  onSaveTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;

  // Delay Modal
  pendingDelayTask: Task | null;
  delayModalOpen: boolean;
  onCloseDelayModal: () => void;
  confirmDelay: (reason: string) => void;
  tasks: Task[];
}

export const CalendarModalsContainer: React.FC<CalendarModalsContainerProps> = ({
  // Day List Modal
  isListModalOpen,
  onCloseListModal,
  selectedDayDate,
  selectedDayTasks,
  channels,
  masterOptions = [],
  onSelectTask,
  viewMode,

  // Cosmic Filter Modal
  isCosmicFilterOpen,
  onCloseCosmicFilter,
  users,
  taskCountsByUser,
  selectedCosmicChannelIds,
  selectedCosmicFormats,
  selectedCosmicStatuses,
  selectedCosmicAssigneeIds,
  onApplyCosmicFilters,
  customChips,
  onSaveChip,
  onDeleteChip,

  // Highlight Modal
  highlightModalOpen,
  onCloseHighlightModal,
  selectedHighlightDate,
  highlights,
  onSaveHighlight,
  onRemoveHighlight,
  onAddPlanFromHighlight,

  // Plan Modal
  planModalOpen,
  onClosePlanModal,
  selectedPlanDate,
  selectedPlanData,
  currentUser,
  onSaveTask,
  onDeleteTask,

  // Delay Modal
  pendingDelayTask,
  delayModalOpen,
  onCloseDelayModal,
  confirmDelay,
  tasks,
}) => {
  const currentHighlightType = highlights.find(
    h => selectedHighlightDate && isSameDay(h.date, selectedHighlightDate)
  )?.typeKey;

  return (
    <>
      {/* Day Tasks List Modal */}
      <TaskCategoryModal 
        isOpen={isListModalOpen}
        onClose={onCloseListModal}
        title={`รายการวันที่ ${format(selectedDayDate, 'd MMM yyyy')}`}
        tasks={selectedDayTasks}
        channels={channels}
        masterOptions={masterOptions}
        onEditTask={onSelectTask}
        colorTheme={viewMode === 'CONTENT' ? 'blue' : 'green'}
      />

      {/* Cosmic / Unified Filter Modal */}
      <UnifiedFilterModal 
        isOpen={isCosmicFilterOpen}
        onClose={onCloseCosmicFilter}
        channels={channels}
        masterOptions={masterOptions}
        users={users}
        viewMode={viewMode}
        taskCountsByUser={taskCountsByUser}
        selectedChannelIds={selectedCosmicChannelIds}
        selectedFormats={selectedCosmicFormats}
        selectedStatuses={selectedCosmicStatuses}
        selectedAssigneeIds={selectedCosmicAssigneeIds}
        onApplyFilters={onApplyCosmicFilters}
        customChips={customChips || []}
        onSaveChip={onSaveChip}
        onDeleteChip={onDeleteChip}
      />
      
      {/* Day Highlight Modal */}
      <DayHighlightModal 
        isOpen={highlightModalOpen}
        onClose={onCloseHighlightModal}
        date={selectedHighlightDate}
        masterOptions={masterOptions}
        currentHighlightType={currentHighlightType}
        onSave={onSaveHighlight}
        onRemove={onRemoveHighlight}
        onAddPlan={onAddPlanFromHighlight}
      />

      {/* Plan Form Modal */}
      <PlanFormModal 
        isOpen={planModalOpen}
        onClose={onClosePlanModal}
        date={selectedPlanDate}
        initialData={selectedPlanData}
        users={users}
        currentUser={currentUser}
        onSave={(plan) => {
          if (onSaveTask) {
            onSaveTask(plan);
          }
        }}
        onDelete={(planId) => {
          if (onDeleteTask) {
            onDeleteTask(planId);
          }
        }}
      />

      {/* Delay Modal */}
      {pendingDelayTask && (
        <DelayModal 
          isOpen={delayModalOpen}
          onClose={onCloseDelayModal}
          onConfirm={confirmDelay}
          taskTitle={pendingDelayTask.title}
          oldDate={tasks.find(t => t.id === pendingDelayTask.id)?.endDate || new Date()}
          newDate={pendingDelayTask.endDate}
        />
      )}
    </>
  );
};

export default React.memo(CalendarModalsContainer);
