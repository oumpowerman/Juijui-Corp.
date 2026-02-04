
import React, { useState } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import TaskCategoryModal from '../TaskCategoryModal';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import WorkloadModal from '../workload/WorkloadModal'; // NEW

// Import Sub-components
import DashboardHeader from './admin/DashboardHeader';
import StatCardsGrid from './admin/StatCardsGrid';
import UrgentTasksWidget from './admin/UrgentTasksWidget';
import WorkloadChart from './admin/WorkloadChart';
import DutyRosterWidget from './admin/DutyRosterWidget';
import AttendanceComparisonWidget from './admin/AttendanceComparisonWidget'; // NEW

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void; // Added Prop
  unreadCount?: number; // Added Prop for Notification Badge
  onEditProfile: () => void;
  masterOptions?: MasterOption[];
  onRefreshMasterData?: () => Promise<void>;
  onFetchAllData?: () => void;
  isFetching?: boolean;
}

const AdminDashboard: React.FC<DashboardProps> = ({ 
    tasks, 
    channels, 
    users, 
    currentUser, 
    onEditTask, 
    onNavigateToCalendar, 
    onOpenSettings,
    onOpenNotifications,
    unreadCount = 0,
    masterOptions = [] // Default to empty array if not passed
}) => {
  
  // Use the new hook for logic
  const {
      timeRange, setTimeRange,
      customDays, setCustomDays,
      viewScope, setViewScope,
      configLoading,
      currentTheme,
      cardStats,
      // urgentTasks, // REMOVED: Widget calculates itself now
      // dueSoon,     // REMOVED: Widget calculates itself now
      chartData,
      progressPercentage,
      getTimeRangeLabel,
      attendanceToday,
      attendanceYesterday
  } = useDashboardStats(tasks, currentUser);

  // UI State for Modal (kept here as it's UI coordination)
  const [modalOpen, setModalOpen] = useState(false);
  const [isWorkloadOpen, setIsWorkloadOpen] = useState(false); // NEW
  const [modalTitle, setModalTitle] = useState('');
  const [modalTasks, setModalTasks] = useState<Task[]>([]);
  const [modalTheme, setModalTheme] = useState('blue');

  const handleCardClick = (title: string, tasks: Task[], theme: string) => {
    setModalTitle(title);
    
    // 🔥 SORTING: Sort tasks by end date (Ascending: Oldest/Overdue first)
    const sortedTasks = [...tasks].sort((a, b) => {
        const timeA = new Date(a.endDate).getTime();
        const timeB = new Date(b.endDate).getTime();
        return timeA - timeB;
    });

    setModalTasks(sortedTasks);
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
          onOpenNotifications={onOpenNotifications} 
          unreadCount={unreadCount} // Pass down to Header
          getTimeRangeLabel={getTimeRangeLabel}
          onOpenWorkload={() => setIsWorkloadOpen(true)} // Pass handler
      />

      {/* 2. Stats Grid (Themed) */}
      <StatCardsGrid 
          stats={cardStats}
          loading={configLoading}
          currentTheme={currentTheme}
          onCardClick={handleCardClick}
          timeRangeLabel={getTimeRangeLabel()}
      />

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Urgent Tasks (2 cols wide on large screens) */}
        <div className="xl:col-span-2 space-y-6">
            <UrgentTasksWidget 
                tasks={tasks} // PASS ALL TASKS
                channels={channels}
                users={users} // PASS USERS for avatars
                masterOptions={masterOptions} // PASS MASTER OPTIONS FOR VLOOKUP
                currentUser={currentUser}
                viewScope={viewScope}
                onEditTask={onEditTask}
                onNavigateToCalendar={onNavigateToCalendar}
            />
        </div>

        {/* Right Column: Widgets (1 col wide) */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">
          {/* New Attendance Widget */}
          <div className="flex-shrink-0">
             <AttendanceComparisonWidget 
                todayStats={attendanceToday}
                yesterdayStats={attendanceYesterday}
             />
          </div>

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

      {/* NEW Workload Modal */}
      <WorkloadModal 
        isOpen={isWorkloadOpen}
        onClose={() => setIsWorkloadOpen(false)}
        tasks={tasks}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
};

export default AdminDashboard;
