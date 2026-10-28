import React, { Suspense, lazy } from 'react';
import { ViewMode, Task, Channel, TaskType, WeeklyQuest } from '../types';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import Dashboard from '../components/Dashboard';
import UltimateWorkroomView from '../components/dashboard/member/UltimateWorkroomView';

// --- LAZY LOAD SECONDARY PAGES WITH AUTO-RETRY ---
const CalendarView = lazyWithRetry(() => import('../components/CalendarView'), 'CalendarView');
const TeamView = lazyWithRetry(() => import('../components/TeamView'), 'TeamView');
const TeamChat = lazyWithRetry(() => import('../components/TeamChat'), 'TeamChat');
const ScriptHubView = lazyWithRetry(() => import('../components/script/ScriptHubView'), 'ScriptHubView');
const MeetingView = lazyWithRetry(() => import('../components/MeetingView'), 'MeetingView');
const DutyView = lazyWithRetry(() => import('../components/DutyView'), 'DutyView');
const QualityGateView = lazyWithRetry(() => import('../components/QualityGateView'), 'QualityGateView');
const KPIView = lazyWithRetry(() => import('../components/KPIView'), 'KPIView');
const FeedbackView = lazyWithRetry(() => import('../components/feedback/FeedbackView'), 'FeedbackView');
const ContentStock = lazyWithRetry(() => import('../components/content-stock/ContentStock'), 'ContentStock');
const ShootChecklist = lazyWithRetry(() => import('../components/shoot-checklist/ShootChecklist'), 'ShootChecklist');
const CompanyChecklistView = lazyWithRetry(() => import('../components/company-checklist/CompanyChecklistView'), 'CompanyChecklistView');
const WeeklyQuestBoard = lazyWithRetry(() => import('../components/WeeklyQuestBoard'), 'WeeklyQuestBoard');
const GoalView = lazyWithRetry(() => import('../components/GoalView'), 'GoalView');
const WikiView = lazyWithRetry(() => import('../components/WikiView'), 'WikiView');
const LeaderboardView = lazyWithRetry(() => import('../components/LeaderboardView'), 'LeaderboardView');
const NexusHub = lazyWithRetry(() => import('../components/nexus/NexusHub'), 'NexusHub');
const RoadmapView = lazyWithRetry(() => import('../components/roadmap/RoadmapView'), 'RoadmapView');
const ContentAnalyticsView = lazyWithRetry(() => import('../components/analytics/ContentAnalyticsView'), 'ContentAnalyticsView');

// --- NEW MODULE BRIDGES (Lazy Loaded with Auto-Retry) ---
const AttendanceRouter = lazyWithRetry(() => import('./AttendanceRouter'), 'AttendanceRouter');
const FinanceRouter = lazyWithRetry(() => import('./FinanceRouter'), 'FinanceRouter');
const AdminRouter = lazyWithRetry(() => import('./AdminRouter'), 'AdminRouter');

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundary extends React.Component<{ currentView: string; children: React.ReactNode }, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: { currentView: string }) {
    if (prevProps.currentView !== this.props.currentView && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-2xl shadow-inner">
            🔄
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">กำลังเชื่อมต่อข้อมูลโมดูล...</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              ระบบกำลังเชื่อมต่อหรืออัปเดตไฟล์โมดูล กรุณากดปุ่มด้านล่างเพื่อโหลดใหม่อีกครั้ง
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            โหลดหน้านี้ใหม่
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ViewRouteRegistryProps {
  currentView: ViewMode;
  currentUserProfile: any;
  users: any[];
  activeUsers: any[];
  allUsers: any[];
  tasks: Task[];
  channels: any[];
  quests: any[];
  masterOptions: any;
  isTaskFetching: boolean;
  sysUnread: number;

  // Checklist State
  activeChecklistItems: any[];
  checklistPresets: any[];
  activePresetId: string | null;
  activePresetName: string | null;

  // Workbox State
  isWorkboxOpen: boolean;
  setIsWorkboxOpen: (open: boolean) => void;
  addToWorkbox: (item: any) => void;

  // Modal Controllers
  setIsNotifSettingsOpen: (open: boolean) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  handleToggleNotification: () => void;

  // URL State Controllers
  setSearchParams: any;

  // Action Handlers
  handleNavigate: (view: ViewMode) => void;
  handleEditTask: (task: any, currentViewMode?: string) => void;
  handleSaveTask: (task: any) => void;
  handleDeleteTask: (task: any) => void;
  handleDelayTask: (taskId: string, targetDate: any, reason: string, profileId: string) => void;
  handleSelectDate: (date: any) => void;
  handleAddTask: (type?: TaskType) => void;
  approveMember: (id: string) => void;
  removeMember: (id: string) => void;
  toggleUserStatus: (id: string, active: boolean) => void;
  adjustStatsLocally: (userId: string, adjustments: { hp?: number; xp?: number; points?: number }) => void;

  handleToggleChecklist: (id: string, currentStatus: boolean) => Promise<void>;
  handleAddChecklistItem: (text: string, categoryId: string) => Promise<void>;
  handleDeleteChecklistItem: (id: string) => void;
  handleResetChecklist: () => void;
  handleLoadPreset: (presetId: string) => void;
  handleAddPreset: (name: string) => void;
  handleDeletePreset: (presetId: string) => void;

  handleAddChannel: (channel: Channel, file?: File) => Promise<boolean>;
  handleUpdateChannel: (channel: Channel, file?: File) => Promise<boolean>;
  handleDeleteChannel: (channelId: string) => Promise<boolean>;

  handleOpenTaskById: (taskOrId: any, currentViewMode?: string) => void;

  handleAddQuest: (quest: any) => void;
  handleDeleteQuest: (questId: string) => void;
  updateManualProgress: (questId: string, progress: number) => void;
  updateQuest: (id: string, updates: Partial<WeeklyQuest>) => Promise<void>;

  fetchAllTasks: () => void;
  fetchProfile: () => Promise<any>;
  PageLoader: React.ComponentType;
  checkAndExpandRange: (range: any) => void;
}

export const ViewRouteRegistry: React.FC<ViewRouteRegistryProps> = ({
  currentView,
  currentUserProfile,
  users,
  activeUsers,
  allUsers,
  tasks,
  channels,
  quests,
  masterOptions,
  isTaskFetching,
  sysUnread,

  activeChecklistItems,
  checklistPresets,
  activePresetId,
  activePresetName,

  isWorkboxOpen,
  setIsWorkboxOpen,
  addToWorkbox,

  setIsNotifSettingsOpen,
  setIsProfileModalOpen,
  handleToggleNotification,

  setSearchParams,

  handleNavigate,
  handleEditTask,
  handleSaveTask,
  handleDeleteTask,
  handleDelayTask,
  handleSelectDate,
  handleAddTask,
  approveMember,
  removeMember,
  toggleUserStatus,
  adjustStatsLocally,

  handleToggleChecklist,
  handleAddChecklistItem,
  handleDeleteChecklistItem,
  handleResetChecklist,
  handleLoadPreset,
  handleAddPreset,
  handleDeletePreset,

  handleAddChannel,
  handleUpdateChannel,
  handleDeleteChannel,

  handleOpenTaskById,

  handleAddQuest,
  handleDeleteQuest,
  updateManualProgress,
  updateQuest,

  fetchAllTasks,
  fetchProfile,
  PageLoader,
  checkAndExpandRange,
}) => {
  return (
    <RouteErrorBoundary currentView={currentView}>
      <Suspense fallback={<PageLoader />}>
        {(() => {
        switch (currentView) {
          case 'DASHBOARD':
            return (
              <Dashboard
                tasks={tasks}
                channels={channels}
                users={allUsers || users || activeUsers}
                currentUser={currentUserProfile}
                onEditTask={handleEditTask}
                onNavigateToCalendar={() => handleNavigate('CALENDAR')}
                onNavigate={(view) => handleNavigate(view)}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                onOpenNotifications={handleToggleNotification}
                unreadCount={sysUnread}
                onEditProfile={() => setIsProfileModalOpen(true)}
                masterOptions={masterOptions}
                onFetchAllData={fetchAllTasks}
                onRefreshProfile={fetchProfile}
                isFetching={isTaskFetching}
              />
            );
          case 'CALENDAR':
            return (
              <CalendarView
                tasks={tasks}
                channels={channels}
                users={allUsers || users || activeUsers}
                currentUser={currentUserProfile}
                masterOptions={masterOptions}
                onSelectTask={handleEditTask}
                onSelectDate={handleSelectDate}
                onMoveTask={handleSaveTask}
                onDelayTask={(tid, date, reason) => handleDelayTask(tid, date, reason, currentUserProfile.id)}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                onOpenNotifications={handleToggleNotification}
                unreadCount={sysUnread}
                onAddTask={(status, type) => {
                  const t = { status, type: type || 'TASK' };
                  // @ts-ignore
                  handleSaveTask(t);
                }}
                onUpdateStatus={(t, s) => handleSaveTask({ ...t, status: s })}
                onRangeChange={checkAndExpandRange}
                isFetching={isTaskFetching}
                onToggleWorkbox={() => setIsWorkboxOpen(!isWorkboxOpen)}
                isWorkboxOpen={isWorkboxOpen}
                onSaveTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
              />
            );
          case 'TEAM':
            return (
              <TeamView
                tasks={tasks}
                users={allUsers}
                channels={channels}
                currentUser={currentUserProfile}
                onEditTask={handleEditTask}
                onApproveMember={approveMember}
                onRemoveMember={removeMember}
                onToggleStatus={toggleUserStatus}
                onAdjustStats={adjustStatsLocally}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                onAddTask={(type) => handleAddTask(type)}
                onMoveTask={(t) => handleSaveTask(t)}
              />
            );
          case 'CHAT':
            return (
              <TeamChat
                currentUser={currentUserProfile}
                allUsers={activeUsers}
                onAddTask={handleSaveTask}
              />
            );
          case 'ContentStock':
            return (
              <ContentStock
                tasks={tasks}
                channels={channels}
                users={activeUsers}
                masterOptions={masterOptions}
                onSchedule={handleEditTask}
                onEdit={handleEditTask}
                onAdd={() => handleAddTask('CONTENT')}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                onAddToWorkbox={(task) => addToWorkbox({ title: task.title, content_id: task.id, type: 'CONTENT' })}
                onEditScript={(id) => {
                  setSearchParams((prev: any) => {
                    const next = new URLSearchParams(prev);
                    next.set('view', 'SCRIPT_HUB');
                    next.set('scriptId', id);
                    next.set('origin', 'SHOOT_QUEUE');
                    return next;
                  }, { replace: true });
                }}
              />
            );
          case 'CHECKLIST':
            return (
              <ShootChecklist
                items={activeChecklistItems}
                onToggle={handleToggleChecklist}
                onAdd={handleAddChecklistItem}
                onDelete={handleDeleteChecklistItem}
                onReset={handleResetChecklist}
                presets={checklistPresets}
                activePresetId={activePresetId}
                activePresetName={activePresetName}
                onLoadPreset={handleLoadPreset}
                onAddPreset={handleAddPreset}
                onDeletePreset={handleDeletePreset}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                masterOptions={masterOptions}
              />
            );
          case 'CHANNELS':
          case 'MASTER_DATA':
          case 'SYSTEM_GUIDE':
          case 'ASSETS':
            return (
              <AdminRouter
                currentView={currentView}
                tasks={tasks}
                channels={channels}
                users={activeUsers}
                currentUser={currentUserProfile}
                masterOptions={masterOptions}
                onAddChannel={handleAddChannel}
                onUpdateChannel={handleUpdateChannel}
                onDeleteChannel={handleDeleteChannel}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
              />
            );
          case 'SCRIPT_HUB':
            return (
              <ScriptHubView
                currentUser={currentUserProfile}
                users={allUsers}
              />
            );
          case 'MEETINGS':
            return (
              <MeetingView
                users={activeUsers}
                currentUser={currentUserProfile}
                tasks={tasks}
                masterOptions={masterOptions}
              />
            );
          case 'DUTY':
            return (
              <DutyView
                users={activeUsers}
                currentUser={currentUserProfile}
              />
            );
          case 'COMPANY_CHECKLIST':
            return (
              <CompanyChecklistView
                users={allUsers || users || activeUsers}
                currentUser={currentUserProfile}
                masterOptions={masterOptions}
              />
            );
          case 'QUALITY_GATE':
            return (
              <QualityGateView
                channels={channels}
                users={activeUsers}
                masterOptions={masterOptions}
                onOpenTask={handleOpenTaskById}
                currentUser={currentUserProfile}
                tasks={tasks}
              />
            );
          case 'KPI':
            return (
              <KPIView
                users={allUsers}
                currentUser={currentUserProfile}
              />
            );
          case 'FEEDBACK':
            return <FeedbackView currentUser={currentUserProfile} users={allUsers} />;
          case 'WEEKLY':
            return (
              <WeeklyQuestBoard
                tasks={tasks}
                channels={channels}
                quests={quests}
                masterOptions={masterOptions}
                onAddQuest={handleAddQuest}
                onDeleteQuest={handleDeleteQuest}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                onUpdateProgress={updateManualProgress}
                onUpdateQuest={updateQuest}
              />
            );
          case 'GOALS':
            return (
              <GoalView
                channels={channels}
                users={activeUsers}
                currentUser={currentUserProfile}
              />
            );
          case 'WIKI':
            return <WikiView currentUser={currentUserProfile} />;

          case 'LEADERBOARD':
            return <LeaderboardView users={activeUsers} currentUser={currentUserProfile} />;

          case 'ATTENDANCE':
            return (
              <AttendanceRouter
                currentUser={currentUserProfile}
                users={allUsers}
                onApproveMember={approveMember}
                onRemoveMember={removeMember}
              />
            );
          case 'FINANCE':
            return (
              <FinanceRouter 
                currentUser={currentUserProfile} 
                users={activeUsers} 
                onSelectTask={handleOpenTaskById}
              />
            );

          case 'NEXUS':
            return <NexusHub currentUser={currentUserProfile} />;

          case 'ROADMAP':
            return <RoadmapView />;

          case 'ANALYTICS':
            return <ContentAnalyticsView />;

          case 'ULTIMATE_WORKROOM':
            return (
              <UltimateWorkroomView
                tasks={tasks}
                masterOptions={masterOptions}
                users={activeUsers || users || allUsers}
                currentUser={currentUserProfile}
                onEditTask={handleEditTask}
                onUpdateTask={handleSaveTask}
                onDeleteTask={handleDeleteTask}
                onNavigateBack={() => handleNavigate('DASHBOARD')}
                onNavigate={handleNavigate}
                onRefreshProfile={fetchProfile}
                isFetching={isTaskFetching}
              />
            );

          default:
            return <div className="p-10 text-center text-gray-500">เร็วๆ นี้... (Coming Soon)</div>;
        }
      })()}
      </Suspense>
    </RouteErrorBoundary>
  );
};
 