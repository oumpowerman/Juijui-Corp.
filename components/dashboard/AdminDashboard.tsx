
import React, { useState } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import TaskCategoryModal from '../TaskCategoryModal';
import { useDashboardStats } from '../../hooks/useDashboardStats';

// Import Sub-components
import DashboardHeader from './admin/DashboardHeader';
import StatCardsGrid from './admin/StatCardsGrid';
import UrgentTasksWidget from './admin/UrgentTasksWidget';
import WorkloadChart from './admin/WorkloadChart';
import DutyRosterWidget from './admin/DutyRosterWidget';

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onOpenSettings: () => void;
  onEditProfile: () => void; // Added for interface consistency with Dashboard.tsx
  masterOptions?: MasterOption[];
  onRefreshMasterData?: () => Promise<void>;
  onFetchAllData?: () => void; // New prop for manual fetching ALL data
  isFetching?: boolean;
}

const AdminDashboard: React.FC<DashboardProps> = ({ 
    tasks, 
    channels, 
    users, 
    currentUser, 
    onEditTask, 
    onNavigateToCalendar, 
    onOpenSettings 
}) => {
  
  // Use the new hook for logic
  const {
      timeRange, setTimeRange,
      customDays, setCustomDays,
      viewScope, setViewScope,
      configLoading,
      currentTheme,
      cardStats,
      urgentTasks,
      dueSoon,
      chartData,
      progressPercentage,
      getTimeRangeLabel
  } = useDashboardStats(tasks, currentUser);

  // UI State for Modal (kept here as it's UI coordination)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTasks, setModalTasks] = useState<Task[]>([]);
  const [modalTheme, setModalTheme] = useState('blue');

  const handleCardClick = (title: string, tasks: Task[], theme: string) => {
    setModalTitle(title);
    setModalTasks(tasks);
    setModalTheme(theme);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. Header Section */}
      <DashboardHeader 
          currentUser={currentUser}
          currentThemeName={currentTheme.name}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customDays={customDays}
          setCustomDays={setCustomDays}
          viewScope={viewScope}
          setViewScope={setViewScope}
          onOpenSettings={onOpenSettings}
          getTimeRangeLabel={getTimeRangeLabel}
      />

      {/* 2. Stats Grid (Themed) */}
      <StatCardsGrid 
          stats={cardStats}
          loading={configLoading}
          currentTheme={currentTheme}
          onCardClick={handleCardClick}
          timeRangeLabel={getTimeRangeLabel()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Main Content: Urgent Tasks */}
        <UrgentTasksWidget 
            urgentTasks={urgentTasks}
            dueSoon={dueSoon}
            channels={channels}
            viewScope={viewScope}
            onEditTask={onEditTask}
            onNavigateToCalendar={onNavigateToCalendar}
        />

        {/* 4. Sidebar: Charts & Duty */}
        <div className="space-y-6">
          <WorkloadChart 
              chartData={chartData}
              progressPercentage={progressPercentage}
              timeRangeLabel={getTimeRangeLabel()}
          />
          <DutyRosterWidget users={users} />
        </div>
      </div>

      <TaskCategoryModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        tasks={modalTasks}
        channels={channels}
        onEditTask={onEditTask}
        colorTheme={modalTheme}
      />
    </div>
  );
};

export default AdminDashboard;
