
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { ViewMode, TaskType } from './types';
import AuthPage from './components/AuthPage';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import InactiveScreen from './components/InactiveScreen';
import Sidebar from './components/Sidebar';
import AppShell from './components/layout/AppShell';
import NotificationPopover from './components/NotificationPopover';
import { useTaskManager } from './hooks/useTaskManager';
import { useSystemNotifications } from './hooks/useSystemNotifications';
import { useChatUnread } from './hooks/useChatUnread';
import { Loader2 } from 'lucide-react';
import PublicScriptViewer from './components/public/PublicScriptViewer';
import { TaskProvider } from './context/TaskContext'; // Import Provider

// --- LAZY LOAD PAGES ---
const Dashboard = lazy(() => import('./components/Dashboard'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const TeamView = lazy(() => import('./components/TeamView'));
const TeamChat = lazy(() => import('./components/TeamChat'));
const ScriptHubView = lazy(() => import('./components/script/ScriptHubView'));
const MeetingView = lazy(() => import('./components/MeetingView'));
const DutyView = lazy(() => import('./components/DutyView'));
const QualityGateView = lazy(() => import('./components/QualityGateView'));
const KPIView = lazy(() => import('./components/KPIView'));
const FeedbackView = lazy(() => import('./components/feedback/FeedbackView'));
const ChannelManager = lazy(() => import('./components/ChannelManager'));
const MasterDataManager = lazy(() => import('./components/MasterDataManager'));
const ContentStock = lazy(() => import('./components/checklist/ContentStock'));
const ShootChecklist = lazy(() => import('./components/ShootChecklist'));
const WeeklyQuestBoard = lazy(() => import('./components/WeeklyQuestBoard'));
const GoalView = lazy(() => import('./components/GoalView'));
const WikiView = lazy(() => import('./components/WikiView'));
const SystemLogicGuide = lazy(() => import('./components/admin/SystemLogicGuide'));

// --- LAZY LOAD MODALS (Optimization: Load only when needed) ---
const TaskModal = lazy(() => import('./components/TaskModal'));
const ProfileEditModal = lazy(() => import('./components/ProfileEditModal'));
const NotificationSettingsModal = lazy(() => import('./components/NotificationSettingsModal'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center text-indigo-300">
    <Loader2 className="w-10 h-10 animate-spin" />
  </div>
);

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);

  // --- INITIAL AUTH CHECK ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- MAIN LOGIC HOOK ---
  const {
    isLoading: isManagerLoading,
    isTaskFetching,
    currentUserProfile,
    allUsers,
    tasks,
    channels,
    masterOptions,
    fetchMasterOptions,
    
    checklistPresets, activeChecklistItems,
    
    isModalOpen, editingTask, selectedDate, notificationSettings, lockedTaskType,
    setIsModalOpen, setEditingTask,
    
    handleAddTask, handleEditTask, handleSelectDate, closeModal,
    handleSaveTask, handleDeleteTask, handleDelayTask,
    checkAndExpandRange, fetchAllTasks,
    
    handleAddChannel, handleUpdateChannel, handleDeleteChannel,
    updateNotificationSettings,
    
    handleToggleChecklist, handleAddChecklistItem, handleDeleteChecklistItem, handleResetChecklist,
    handleLoadPreset, handleAddPreset, handleDeletePreset,
    
    approveMember, removeMember, toggleUserStatus,

    quests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest,

    updateProfile
  } = useTaskManager(session?.user);

  // --- SUB-HOOKS ---
  const { notifications, unreadCount: sysUnread, dismissNotification, markAllAsRead } = useSystemNotifications(tasks, currentUserProfile);
  const { unreadCount: chatUnread } = useChatUnread(currentUserProfile);

  // --- LOADING SCREEN ---
  if (!session) {
    return <AuthPage onLoginSuccess={() => window.location.reload()} />;
  }

  // Initial Load or Profile Fetching
  if (isManagerLoading) {
     return (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">กำลังเชื่อมต่อฐานข้อมูล...</p>
        </div>
     );
  }

  // --- ACCESS CONTROL SCREENS ---
  if (!currentUserProfile) {
     return <div className="p-10 text-center">กำลังโหลดข้อมูลผู้ใช้...</div>;
  }
  
  if (!currentUserProfile.isApproved) {
    return <PendingApprovalScreen user={currentUserProfile} onLogout={async () => { await supabase.auth.signOut(); }} />;
  }

  if (!currentUserProfile.isActive) {
    return <InactiveScreen user={currentUserProfile} onLogout={async () => { await supabase.auth.signOut(); }} />;
  }

  // --- RENDER CONTENT SWITCHER ---
  const renderContent = () => {
    return (
      <Suspense fallback={<PageLoader />}>
        {(() => {
          switch (currentView) {
            case 'DASHBOARD':
              return (
                <Dashboard
                  tasks={tasks}
                  channels={channels}
                  users={allUsers}
                  currentUser={currentUserProfile}
                  onEditTask={handleEditTask}
                  onNavigateToCalendar={() => setCurrentView('CALENDAR')}
                  onNavigate={(view) => setCurrentView(view)} 
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onOpenNotifications={() => setIsNotificationOpen(true)}
                  onEditProfile={() => setIsProfileModalOpen(true)}
                  masterOptions={masterOptions}
                  onFetchAllData={fetchAllTasks}
                  isFetching={isTaskFetching}
                />
              );
            case 'CALENDAR':
              return (
                <CalendarView
                  tasks={tasks}
                  channels={channels}
                  users={allUsers}
                  masterOptions={masterOptions}
                  onSelectTask={handleEditTask}
                  onSelectDate={handleSelectDate}
                  onMoveTask={handleSaveTask}
                  onDelayTask={(tid, date, reason) => handleDelayTask(tid, date, reason, currentUserProfile.id)}
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onOpenNotifications={() => setIsNotificationOpen(true)} 
                  onAddTask={status => { 
                      const t = { status, type: 'TASK' }; 
                      // @ts-ignore
                      handleSaveTask(t); 
                  }}
                  onUpdateStatus={(t, s) => handleSaveTask({ ...t, status: s })}
                  onRangeChange={checkAndExpandRange}
                  isFetching={isTaskFetching}
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
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
                  onAddTask={(type) => handleAddTask(type)}
                />
              );
            case 'CHAT':
              return (
                  <TeamChat 
                      currentUser={currentUserProfile}
                      allUsers={allUsers}
                      onAddTask={handleSaveTask}
                  />
              );
            case 'STOCK':
              return (
                <ContentStock
                  tasks={tasks}
                  channels={channels}
                  users={allUsers}
                  masterOptions={masterOptions}
                  onSchedule={handleEditTask}
                  onEdit={handleEditTask}
                  onAdd={() => handleAddTask('CONTENT')}
                  onOpenSettings={() => setIsNotifSettingsOpen(true)}
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
                      onLoadPreset={handleLoadPreset}
                      onAddPreset={handleAddPreset}
                      onDeletePreset={handleDeletePreset}
                      onOpenSettings={() => setIsNotifSettingsOpen(true)}
                      masterOptions={masterOptions}
                  />
              );
            case 'CHANNELS':
               return (
                   <ChannelManager 
                      tasks={tasks}
                      channels={channels}
                      onAdd={handleAddChannel}
                      onEdit={handleUpdateChannel}
                      onDelete={handleDeleteChannel}
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
                        users={allUsers} 
                        currentUser={currentUserProfile}
                        tasks={tasks} 
                        masterOptions={masterOptions}
                    />
                );
            case 'DUTY': 
                return (
                    <DutyView 
                        users={allUsers}
                        currentUser={currentUserProfile}
                    />
                );
            case 'QUALITY_GATE':
                return (
                    <QualityGateView 
                        channels={channels}
                        users={allUsers}
                        masterOptions={masterOptions}
                        onOpenTask={handleEditTask}
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
                return <FeedbackView currentUser={currentUserProfile} />;
            case 'MASTER_DATA':
                return <MasterDataManager />;
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
                        users={allUsers}
                        currentUser={currentUserProfile}
                    />
                );
            case 'WIKI':
                return <WikiView currentUser={currentUserProfile} />;
            case 'SYSTEM_GUIDE':
                return <SystemLogicGuide />;
            default:
              return <div className="p-10 text-center text-gray-500">Coming Soon...</div>;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <AppShell
        currentUser={currentUserProfile}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={async () => { await supabase.auth.signOut(); }}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onAddTask={handleAddTask}
        chatUnreadCount={chatUnread}
        systemUnreadCount={sysUnread}
        isNotificationOpen={isNotificationOpen}
        onToggleNotification={() => setIsNotificationOpen(!isNotificationOpen)}
    >
        {renderContent()}

        {/* --- GLOBAL MODALS (Suspense Wrapped) --- */}
        <Suspense fallback={null}>
            {isModalOpen && (
                <TaskModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSave={(t) => handleSaveTask(t)}
                    onUpdate={(t) => handleSaveTask(t)} 
                    onDelete={handleDeleteTask}
                    initialData={editingTask}
                    selectedDate={selectedDate}
                    channels={channels}
                    users={allUsers}
                    lockedType={lockedTaskType}
                    masterOptions={masterOptions}
                    currentUser={currentUserProfile}
                    projects={tasks.filter(t => t.type === 'CONTENT')} 
                />
            )}

            {isProfileModalOpen && (
                <ProfileEditModal 
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={currentUserProfile}
                    onSave={updateProfile}
                />
            )}

            {isNotifSettingsOpen && (
                <NotificationSettingsModal 
                    isOpen={isNotifSettingsOpen}
                    onClose={() => setIsNotifSettingsOpen(false)}
                    preferences={notificationSettings}
                    onUpdate={updateNotificationSettings}
                />
            )}
        </Suspense>
        
        {/* Notification Popover */}
        <div className="relative z-[100]">
             <NotificationPopover 
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notifications}
                tasks={tasks}
                onOpenTask={handleEditTask}
                onOpenSettings={() => setIsNotifSettingsOpen(true)}
                onDismiss={dismissNotification}
                onMarkAllRead={markAllAsRead}
             />
        </div>

    </AppShell>
  );
}

function App() {
  // --- ROUTING CHECK: Magic Link ---
  const path = window.location.pathname;
  if (path.startsWith('/s/')) {
      const token = path.split('/s/')[1];
      if (token) {
          return <PublicScriptViewer token={token} />;
      }
  }

  // Wrap everything in TaskProvider
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;
