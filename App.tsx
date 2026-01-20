
import React, { useState, useEffect } from 'react';
import { Loader2, Bell, Sparkles, Menu } from 'lucide-react';
import CalendarView from './components/CalendarView';
import Dashboard from './components/Dashboard';
import TeamView from './components/TeamView';
import ShootChecklist from './components/ShootChecklist';
import TaskModal from './components/TaskModal';
import ChannelManager from './components/ChannelManager';
import ContentStock from './components/ContentStock';
import WeeklyQuestBoard from './components/WeeklyQuestBoard';
import TeamChat from './components/TeamChat';
import MasterDataManager from './components/MasterDataManager'; 
import QualityGateView from './components/QualityGateView';
import WikiView from './components/WikiView'; 
import DutyView from './components/DutyView'; 
import GoalView from './components/GoalView';
import AuthPage from './components/AuthPage';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import InactiveScreen from './components/InactiveScreen'; 
import NotificationSettingsModal from './components/NotificationSettingsModal';
import NotificationPopover from './components/NotificationPopover'; 
import ProfileEditModal from './components/ProfileEditModal'; 
import ChatAssistant from './components/ChatAssistant';
import Sidebar from './components/Sidebar';
import MobileNavigation from './components/MobileNavigation';
import { ViewMode, Status } from './types';
import { useTaskManager } from './hooks/useTaskManager';
import { useSystemNotifications } from './hooks/useSystemNotifications'; 
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

const MainApp = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // View State
  const [currentView, setCurrentView] = useState<ViewMode>('DASHBOARD');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); 
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    isLoading: isDataLoading,
    currentUserProfile,
    allUsers,
    tasks,
    channels,
    activeChecklistItems: checklistItems,
    checklistPresets,
    isModalOpen,
    editingTask,
    selectedDate,
    lockedTaskType, 
    notificationSettings,
    masterOptions, 
    fetchMasterOptions,
    setIsModalOpen, 
    closeModal,
    handleAddTask,
    handleEditTask,
    handleSelectDate,
    handleSaveTask,
    handleDeleteTask,
    handleDelayTask, 
    handleAddChannel,
    handleUpdateChannel,
    handleDeleteChannel,
    updateNotificationSettings,
    handleToggleChecklist,
    handleAddChecklistItem,
    handleDeleteChecklistItem,
    handleResetChecklist,
    handleLoadPreset,
    handleAddPreset,
    handleDeletePreset,
    approveMember,
    removeMember,
    toggleUserStatus, 
    quests,
    handleAddQuest,
    handleDeleteQuest,
    updateProfile,
    setEditingTask,
  } = useTaskManager(session?.user);

  const { notifications: systemNotifications, unreadCount } = useSystemNotifications(tasks, currentUserProfile);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setSession(null);
      localStorage.removeItem('supabase.auth.token'); 
    }
  };

  const handleNavigation = (view: ViewMode) => {
      setCurrentView(view);
  };

  // --- RENDERING GATES ---

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage onLoginSuccess={() => {}} />;
  }

  if (isDataLoading) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
     );
  }

  // GATE 1: Check if user exists
  if (!currentUserProfile) {
       return <AuthPage onLoginSuccess={() => {}} />;
  }

  // GATE 2: Check Approval (First time)
  if (!currentUserProfile.isApproved) {
      return <PendingApprovalScreen user={currentUserProfile} onLogout={handleLogout} />;
  }

  // GATE 3: Check Active Status (Suspended/Inactive)
  if (!currentUserProfile.isActive) {
      return <InactiveScreen user={currentUserProfile} onLogout={handleLogout} />;
  }

  const scheduledTasks = tasks.filter(t => !t.isUnscheduled);
  const contentTasks = tasks.filter(t => t.type === 'CONTENT');

  const handleBoardStatusUpdate = async (task: any, newStatus: Status) => {
      const updatedTask = { ...task, status: newStatus };
      await handleSaveTask(updatedTask);
  };

  const handleBoardAddTask = (status: Status) => {
      setEditingTask({ status } as any); 
      handleAddTask('CONTENT');
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            currentUser={currentUserProfile} 
            tasks={scheduledTasks} 
            channels={channels}
            users={allUsers}
            masterOptions={masterOptions}
            onEditTask={handleEditTask} 
            onNavigateToCalendar={() => setCurrentView('CALENDAR')}
            onOpenSettings={() => setIsNotificationOpen(true)}
            onRefreshMasterData={fetchMasterOptions}
          />
        );
      case 'CALENDAR':
        return (
          <CalendarView 
            tasks={scheduledTasks} 
            channels={channels} 
            users={allUsers}
            masterOptions={masterOptions}
            onSelectTask={handleEditTask} 
            onSelectDate={handleSelectDate}
            onMoveTask={(task) => handleSaveTask(task)} 
            onDelayTask={(taskId, newDate, reason) => {
               if(currentUserProfile) handleDelayTask(taskId, newDate, reason, currentUserProfile.id);
            }}
            onOpenSettings={() => setIsNotificationOpen(true)}
            onAddTask={handleBoardAddTask}
            onUpdateStatus={handleBoardStatusUpdate}
          />
        );
      case 'TEAM':
        return (
          <TeamView 
            tasks={scheduledTasks}
            channels={channels}
            users={allUsers}
            currentUser={currentUserProfile}
            onEditTask={handleEditTask} 
            onApproveMember={approveMember}
            onRemoveMember={removeMember}
            onToggleStatus={toggleUserStatus} 
            onOpenSettings={() => setIsNotificationOpen(true)}
            onAddTask={() => handleAddTask('TASK')}
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
      case 'CHECKLIST':
        return (
            <ShootChecklist 
                items={checklistItems}
                onToggle={handleToggleChecklist}
                onAdd={handleAddChecklistItem}
                onDelete={handleDeleteChecklistItem}
                onReset={handleResetChecklist}
                presets={checklistPresets}
                onLoadPreset={handleLoadPreset}
                onAddPreset={handleAddPreset}
                onDeletePreset={handleDeletePreset}
                onOpenSettings={() => setIsNotificationOpen(true)}
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
                onOpenSettings={() => setIsNotificationOpen(true)}
            />
        );
      case 'STOCK':
        return (
            <ContentStock 
                tasks={contentTasks} 
                channels={channels} 
                users={allUsers}
                masterOptions={masterOptions} 
                onEdit={handleEditTask}
                onSchedule={(task) => handleEditTask(task)}
                onAdd={() => handleAddTask('CONTENT')} 
                onOpenSettings={() => setIsNotificationOpen(true)}
            />
        );
      case 'WEEKLY':
        return (
            <WeeklyQuestBoard 
                tasks={contentTasks}
                channels={channels}
                quests={quests}
                masterOptions={masterOptions} 
                onAddQuest={handleAddQuest}
                onDeleteQuest={handleDeleteQuest}
                onOpenSettings={() => setIsNotificationOpen(true)}
            />
        );
      case 'QUALITY_GATE': 
        return (
            <QualityGateView 
                channels={channels}
                onOpenTask={handleEditTask}
            />
        );
      case 'WIKI':
        return (
            <WikiView currentUser={currentUserProfile} />
        );
      case 'DUTY': 
        return (
            <DutyView users={allUsers} />
        );
      case 'GOALS': 
        return (
            <GoalView channels={channels} />
        );
      case 'MASTER_DATA':
          return <MasterDataManager />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar 
        currentUser={currentUserProfile}
        currentView={currentView}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        onEditProfile={() => setIsProfileModalOpen(true)}
        unreadChatCount={unreadCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] h-full relative">
        {/* Mobile Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex lg:hidden items-center justify-between px-4 sticky top-0 z-10 shrink-0 shadow-sm">
          <div className="flex items-center">
            {/* Note: Menu trigger moved to bottom nav for consistency, just branding here */}
            <div className="mr-3 p-1 text-gray-600">
               <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-sm">
                   <Sparkles className="text-white w-5 h-5" />
               </div>
            </div>
            <div>
                 <h1 className="font-bold text-gray-800 leading-none">Juijui Planner</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pt-4 lg:pt-8 pb-24 lg:pb-8">
          <div className="w-full max-w-[1800px] mx-auto h-full">
             {renderContent()}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <MobileNavigation 
            currentUser={currentUserProfile}
            currentView={currentView}
            onNavigate={handleNavigation}
            onAddTask={() => handleAddTask()}
            onLogout={handleLogout}
            onEditProfile={() => setIsProfileModalOpen(true)}
            unreadChatCount={unreadCount}
        />
      </main>

      {/* --- POPUPS & MODALS --- */}
      <NotificationPopover 
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          notifications={systemNotifications}
          tasks={tasks}
          onOpenTask={handleEditTask}
          onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <TaskModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={editingTask}
        selectedDate={selectedDate}
        channels={channels}
        users={allUsers}
        lockedType={lockedTaskType} 
        masterOptions={masterOptions} 
        currentUser={currentUserProfile}
      />

      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={notificationSettings}
        onUpdate={updateNotificationSettings}
      />

      <ProfileEditModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUserProfile}
        onSave={updateProfile}
      />

      <ChatAssistant 
         tasks={tasks}
         channels={channels}
         onAddChannel={handleAddChannel}
         onDeleteChannel={handleDeleteChannel}
         onAddTask={handleSaveTask}
      />
    </div>
  );
};

export default MainApp;
    