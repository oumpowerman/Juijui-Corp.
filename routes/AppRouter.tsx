
// Trigger re-process
import React, { useState, Suspense, lazy, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ViewMode } from '../types';
import PendingApprovalScreen from '../components/PendingApprovalScreen';
import InactiveScreen from '../components/InactiveScreen';
import AppShell from '../components/layout/AppShell';
import NotificationPopover from '../components/NotificationPopover';
import { useTaskManager } from '../hooks/useTaskManager';
import { useAuth } from '../hooks/useAuth';
import { useSystemNotifications } from '../hooks/useSystemNotifications';
import { useChatUnread } from '../hooks/useChatUnread';
import { useAutoJudge } from '../hooks/useAutoJudge'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useGameEventListener } from '../hooks/useGameEventListener'; 
import NegligenceLockModal from '../components/duty/NegligenceLockModal'; // NEW IMPORT
import ShortcutManager from '../components/common/ShortcutManager';
import { Loader2, Search, Inbox } from 'lucide-react';
import { WorkboxProvider, useWorkboxContext } from '../context/WorkboxContext';
import { GoogleDriveProvider } from '../context/GoogleDriveContext';
import VibrantChecklistBackground from '../components/common/VibrantChecklistBackground';
import WorkboxPanel from '../components/workbox/WorkboxPanel';
import WorkboxTrigger from '../components/workbox/WorkboxTrigger';

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
const ContentStock = lazy(() => import('../components/checklist/ContentStock'));
const ShootChecklist = lazy(() => import('../components/ShootChecklist'));
const WeeklyQuestBoard = lazy(() => import('../components/WeeklyQuestBoard'));
const GoalView = lazy(() => import('../components/GoalView'));
const WikiView = lazy(() => import('../components/WikiView'));
const LeaderboardView = lazy(() => import('../components/LeaderboardView')); 
const NexusHub = lazy(() => import('../components/nexus/NexusHub'));

// --- NEW MODULE BRIDGES (Lazy Loaded) ---
const AttendanceRouter = lazy(() => import('./AttendanceRouter'));
const FinanceRouter = lazy(() => import('./FinanceRouter'));
const AdminRouter = lazy(() => import('./AdminRouter'));
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

const AppRouterInner: React.FC<AppRouterProps> = ({ user }) => {
  // Initialize view from URL or default to DASHBOARD
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
      if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const viewParam = params.get('view');
          if (viewParam) return viewParam as ViewMode;
      }
      return 'DASHBOARD';
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false); 
  const [isWorkboxOpen, setIsWorkboxOpen] = useState(false);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.reload();
  };

  // --- NAVIGATION HANDLER (Sync with URL) ---
  const handleNavigate = useCallback((view: ViewMode) => {
      setCurrentView(view);
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.pushState({}, '', url);
  }, []);

  // Handle Browser Back/Forward Buttons
  useEffect(() => {
      const handlePopState = () => {
          const params = new URLSearchParams(window.location.search);
          const view = params.get('view') as ViewMode;
          setCurrentView(view || 'DASHBOARD');
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    activePresetId,
    activePresetName,
    
    isModalOpen, editingTask, selectedDate, notificationSettings, lockedTaskType,
    setIsModalOpen, setEditingTask,
    
    handleAddTask, handleEditTask, handleSelectDate, closeModal,
    handleSaveTask, handleDeleteTask, handleDelayTask,
    checkAndExpandRange, fetchAllTasks,
    
    handleAddChannel, handleUpdateChannel, handleDeleteChannel,
    updateNotificationSettings,
    
    handleToggleChecklist, handleAddChecklistItem, handleDeleteChecklistItem, handleResetChecklist,
    handleLoadPreset, handleAddPreset, handleDeletePreset,
    
    approveMember, removeMember, toggleUserStatus, adjustStatsLocally,

    quests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest,

    updateProfile,
    fetchProfile
  } = useTaskManager(user);

  // --- WORKBOX CONTEXT ---
  const { items: workboxItems, addItem: addToWorkbox, setIsDragging } = useWorkboxContext();

  // --- SUB-HOOKS ---
  const { notifications, unreadCount: sysUnread, dismissNotification, markAllAsRead, markAsViewed } = useSystemNotifications(tasks, currentUserProfile, fetchProfile);
  const { unreadCount: chatUnread } = useChatUnread(currentUserProfile);
  const { requests: leaveRequests, approveRequest, rejectRequest } = useLeaveRequests(
    currentUserProfile, 
    { all: currentUserProfile?.role === 'ADMIN' }
  );
  
  // --- BACKGROUND SERVICES ---
  useAutoJudge(currentUserProfile); 
  useGameEventListener(currentUserProfile, fetchProfile); 

  // --- GLOBAL KEYBOARD SHORTCUTS REMOVED (Moved to ShortcutManager) ---

  // --- DETECT LOCK NOTIFICATION ---
  const lockNotification = undefined; 

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
  
  // Handler for Lock Modal Acknowledge
  const handleAcknowledgeLock = async (notifId: string) => {
      await dismissNotification(notifId); // Remove/Mark Read
      // Trigger refresh if needed, usually handled by realtime
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
     return <div className="p-10 text-center text-gray-500">ไม่พบข้อมูลโปรไฟล์ผู้ใช้ (User Profile Not Found)</div>;
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
                  users={allUsers}
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
                  onAddToWorkbox={(task) => addToWorkbox({ title: task.title, content_id: task.id, type: 'CONTENT' })}
                />
              );
            case 'CHECKLIST':
              return (
                <VibrantChecklistBackground className="pb-20">
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
                </VibrantChecklistBackground>
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
                        users={allUsers}
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
                
            case 'LEADERBOARD':
                return <LeaderboardView users={allUsers} currentUser={currentUserProfile} />;

            case 'ATTENDANCE':
                return <AttendanceRouter currentUser={currentUserProfile} users={allUsers} />;
            case 'FINANCE':
                return <FinanceRouter currentUser={currentUserProfile} users={allUsers} />;

            case 'NEXUS':
                return <NexusHub currentUser={currentUserProfile} />;

            default:
              return <div className="p-10 text-center text-gray-500">เร็วๆ นี้... (Coming Soon)</div>;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <AppShell
          currentUser={currentUserProfile}
          currentView={currentView}
          onNavigate={handleNavigate}
          onLogout={handleForceLogout}
          onEditProfile={() => setIsProfileModalOpen(true)}
          onAddTask={handleAddTask}
          onOpenTask={handleEditTask}
          chatUnreadCount={chatUnread}
          systemUnreadCount={sysUnread}
          isNotificationOpen={isNotificationOpen}
          onToggleNotification={handleToggleNotification}
          tasks={tasks}
          allUsers={allUsers}
      >
          <ShortcutManager 
              onNavigate={handleNavigate}
              onAddTask={() => handleAddTask('TASK')}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(prev => !prev)}
          />
  
          {renderContent()}
  
          {/* --- WORKBOX TRIGGER & PANEL --- */}
          <WorkboxTrigger 
              onClick={() => setIsWorkboxOpen(true)} 
              itemCount={workboxItems.length} 
              onDrop={(data) => addToWorkbox(data)}
          />
          <WorkboxPanel 
              isOpen={isWorkboxOpen} 
              onClose={() => setIsWorkboxOpen(false)} 
              currentUser={currentUserProfile} 
          />
          
          {/* --- SPECIAL LOCK MODAL --- */}
          <NegligenceLockModal 
              notification={lockNotification} 
              onAcknowledge={handleAcknowledgeLock} 
          />
  
          {/* --- GLOBAL MODALS --- */}
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
                      onOpenTask={handleEditTask}
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
              onNavigate={handleNavigate} 
              onApproveLeave={approveRequest}
              onRejectLeave={rejectRequest}
              leaveRequests={leaveRequests}
          />
  
      </AppShell>
  );
};

import { MasterDataProvider } from '../context/MasterDataContext';

const AppRouter: React.FC<{ user: any }> = ({ user }) => {
  const { currentUserProfile } = useAuth(user);

  return (
    <GoogleDriveProvider>
     <MasterDataProvider>
      <WorkboxProvider currentUser={currentUserProfile}>
        <AppRouterInner user={user} />
      </WorkboxProvider>
     </MasterDataProvider>
    </GoogleDriveProvider>
  );
};

export default AppRouter;
