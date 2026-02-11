
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ViewMode } from '../types';
import PendingApprovalScreen from '../components/PendingApprovalScreen';
import InactiveScreen from '../components/InactiveScreen';
import AppShell from '../components/layout/AppShell';
import NotificationPopover from '../components/NotificationPopover';
import { useTaskManager } from '../hooks/useTaskManager';
import { useSystemNotifications } from '../hooks/useSystemNotifications';
import { useChatUnread } from '../hooks/useChatUnread';
import { useAutoJudge } from '../hooks/useAutoJudge'; 
import { useGameEventListener } from '../hooks/useGameEventListener'; 
import { Loader2, Search } from 'lucide-react';

// --- LAZY LOAD PAGES ---
const Dashboard = lazy(() => import('../components/Dashboard'));
const CalendarView = lazy(() => import('../components/CalendarView'));
const TeamView = lazy(() => import('../components/TeamView'));
const TeamChat = lazy(() => import('../components/TeamChat'));
const ScriptHubView = lazy(() => import('../components/script/ScriptHubView'));
const MeetingView = lazy(() => import('../components/MeetingView'));
const DutyView = lazy(() => import('../components/DutyView'));
const QualityGateView = lazy(() => import('../components/QualityGateView'));
const KPIView = lazy(() => import('../components/KPIView'));
const FeedbackView = lazy(() => import('../components/feedback/FeedbackView'));
const ChannelManager = lazy(() => import('../components/ChannelManager'));
const MasterDataManager = lazy(() => import('../components/MasterDataManager'));
const ContentStock = lazy(() => import('../components/checklist/ContentStock'));
const ShootChecklist = lazy(() => import('../components/ShootChecklist'));
const WeeklyQuestBoard = lazy(() => import('../components/WeeklyQuestBoard'));
const GoalView = lazy(() => import('../components/GoalView'));
const WikiView = lazy(() => import('../components/WikiView'));
const SystemLogicGuide = lazy(() => import('../components/admin/SystemLogicGuide'));
const LeaderboardView = lazy(() => import('../components/LeaderboardView')); 
const AssetRegistryView = lazy(() => import('../components/assets/AssetRegistryView')); 

// --- NEW MODULE BRIDGES (Lazy Loaded) ---
const AttendanceRouter = lazy(() => import('./AttendanceRouter'));
const FinanceRouter = lazy(() => import('./FinanceRouter'));
const CommandPalette = lazy(() => import('../components/ui/CommandPalette')); 

// --- LAZY LOAD MODALS ---
const TaskModal = lazy(() => import('../components/TaskModal'));
const ProfileEditModal = lazy(() => import('../components/ProfileEditModal'));
const NotificationSettingsModal = lazy(() => import('../components/NotificationSettingsModal'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center text-indigo-300">
    <Loader2 className="w-10 h-10 animate-spin" />
  </div>
);

interface AppRouterProps {
    user: any; // Session User from Supabase Auth
}

const AppRouter: React.FC<AppRouterProps> = ({ user }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); 

  // --- MAIN LOGIC HOOK (Orchestrator) ---
  const {
    isLoading: isManagerLoading,
    isTaskFetching,
    currentUserProfile,
    allUsers,
    tasks,
    channels,
    masterOptions,
    
    checklistPresets,
    activeChecklistItems,
    
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
  } = useTaskManager(user);

  // --- SUB-HOOKS ---
  const { notifications, unreadCount: sysUnread, dismissNotification, markAllAsRead, markAsViewed } = useSystemNotifications(tasks, currentUserProfile);
  const { unreadCount: chatUnread } = useChatUnread(currentUserProfile);
  
  // --- BACKGROUND SERVICES ---
  useAutoJudge(currentUserProfile); 
  useGameEventListener(currentUserProfile); 

  // --- GLOBAL KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Cmd/Ctrl + K = Command Palette
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleNotification = () => {
      // Changed: Do NOT mark as viewed immediately upon opening
      // Let the user read it first. Marking happens on Close or explicit 'Read All'
      setIsNotificationOpen(!isNotificationOpen);
  };

  // Handler for Popover Close
  const handleCloseNotification = () => {
      setIsNotificationOpen(false);
      markAsViewed(); // Mark read when closing
  };

  const handleForceLogout = async () => {
      try {
          await supabase.auth.signOut();
      } catch (error) {
          console.warn("Logout error:", error);
      } finally {
          localStorage.clear(); 
          window.location.href = '/'; 
      }
  };

  if (isManagerLoading) {
     return (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">กำลังเชื่อมต่อฐานข้อมูล...</p>
        </div>
     );
  }

  if (!currentUserProfile) {
     return <div className="p-10 text-center text-gray-500">ไม่พบข้อมูลผู้ใช้ (User Profile Not Found)</div>;
  }
  
  if (!currentUserProfile.isApproved) {
    return <PendingApprovalScreen user={currentUserProfile} onLogout={handleForceLogout} />;
  }

  if (!currentUserProfile.isActive) {
    return <InactiveScreen user={currentUserProfile} onLogout={handleForceLogout} />;
  }

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
                  onOpenNotifications={handleToggleNotification}
                  unreadCount={sysUnread}
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
                  onMoveTask={(t) => handleSaveTask(t)}
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
                        currentUser={currentUserProfile}
                        tasks={tasks} // Pass tasks here!
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
                
            case 'LEADERBOARD':
                return <LeaderboardView users={allUsers} currentUser={currentUserProfile} />;

            case 'ATTENDANCE':
                return <AttendanceRouter currentUser={currentUserProfile} users={allUsers} />;
            case 'FINANCE':
                return <FinanceRouter currentUser={currentUserProfile} users={allUsers} />;

            case 'ASSETS':
                return <AssetRegistryView users={allUsers} masterOptions={masterOptions} />;
                
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
        onLogout={handleForceLogout}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onAddTask={handleAddTask}
        chatUnreadCount={chatUnread}
        systemUnreadCount={sysUnread}
        isNotificationOpen={isNotificationOpen}
        onToggleNotification={handleToggleNotification}
    >
        {/* --- GLOBAL SEARCH BUTTON (FLOATING) --- */}
        <button 
            onClick={() => setIsCommandPaletteOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-white p-3 rounded-full shadow-xl border border-indigo-100 text-indigo-600 hover:scale-110 transition-transform lg:hidden"
        >
            <Search className="w-6 h-6" />
        </button>

        {renderContent()}

        {/* --- GLOBAL MODALS --- */}
        <Suspense fallback={null}>
            {isCommandPaletteOpen && (
                <CommandPalette 
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    onNavigate={setCurrentView}
                    tasks={tasks}
                    users={allUsers}
                    onOpenTask={(task) => { handleEditTask(task); setIsCommandPaletteOpen(false); }}
                    onOpenProfile={() => { setIsProfileModalOpen(true); setIsCommandPaletteOpen(false); }}
                />
            )}

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
        
        <NotificationPopover 
            isOpen={isNotificationOpen}
            onClose={handleCloseNotification} // Changed to new handler
            notifications={notifications}
            tasks={tasks}
            onOpenTask={handleEditTask}
            onOpenSettings={() => setIsNotifSettingsOpen(true)}
            onDismiss={dismissNotification}
            onMarkAllRead={markAllAsRead}
            onNavigate={setCurrentView} 
        />

    </AppShell>
  );
};

export default AppRouter;
