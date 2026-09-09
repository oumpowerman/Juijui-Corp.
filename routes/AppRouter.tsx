import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import AppShell from '../components/layout/AppShell';
import { useTaskManager } from '../hooks/useTaskManager';
import { useAuth } from '../hooks/useAuth';
import { useSystemNotifications } from '../hooks/useSystemNotifications';
import { useChatUnread } from '../hooks/useChatUnread';
import { useAutoJudge } from '../hooks/useAutoJudge'; 
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useGameEventListener } from '../hooks/useGameEventListener'; 
import { useToast } from '../context/ToastContext';
import ShortcutManager from '../components/common/ShortcutManager';
import { Loader2 } from 'lucide-react';
import { useWorkboxContext } from '../context/WorkboxContext';
import { BRAND_CONFIG } from '../config/brand';
import WorkboxPanel from '../components/workbox/WorkboxPanel';
import WorkboxTrigger from '../components/workbox/WorkboxTrigger';

// --- REFRACTORED MODULE REGISTRIES & GUARDS ---
import { ViewRouteRegistry } from './ViewRouteRegistry';
import { GlobalModalRegistry } from './GlobalModalRegistry';
import { AccountStatusGuard } from './guards/AccountStatusGuard';
import { useWarpPortal } from './hooks/useWarpPortal';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useTaskDeepLink } from './hooks/useTaskDeepLink';
import { usePWAShareReceiver } from './hooks/usePWAShareReceiver';
import { PWAShareTargetModal } from '../components/nexus/PWAShareTargetModal';
import ChatAssistant from '../components/ChatAssistant';
import { WarpGateOverlay } from '../components/dashboard/member/ultimate/WarpGateOverlay';

// --- LAZY LOAD ULTIMATE SCREEN ---
const UltimateWorkroomView = lazy(() => import('../components/dashboard/member/UltimateWorkroomView'));

// Loading Fallback
const PageLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex-1 w-full flex flex-col items-center justify-center text-indigo-300 gap-6 min-h-[70vh] py-20"
  >
    <div className="relative">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-500" />
        <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse rounded-full" />
    </div>
    <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-black font-kanit uppercase tracking-[0.3em] text-indigo-400/80 animate-pulse">กำลังโหลดข้อมูล...</span>
        <div className="w-12 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-indigo-500"
                animate={{ x: [-48, 48] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
        </div>
    </div>
  </motion.div>
);

interface AppRouterProps {
    user: any; // Session User from Supabase Auth
}

const AppRouterInner: React.FC<AppRouterProps> = ({ user }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- UI MODAL & DRAWER LOCAL STATES ---
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  const [, setIsCommandPaletteOpen] = useState(false); 
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  const [activeDetailNotif, setActiveDetailNotif] = useState<any | null>(null);

  // --- HOOK 1: PWA SHARE TARGET LISTENER ---
  const { pwaSharedData, setPwaSharedData } = usePWAShareReceiver();

  // --- HOOK 2: COSMIC WARP PORTAL & AUDIO ---
  const {
    globalWarpStage,
    warpTargetView,
    triggerWarpTransition,
  } = useWarpPortal();

  // --- HOOK 3: AUTH HOOK ---
  const { currentUserProfile, fetchProfile, updateProfile } = useAuth(user);

  // --- HOOK 4: MAIN TASK & DATA MANAGER ---
  const {
    isLoading: isManagerLoading,
    isTaskFetching,
    allUsers,
    activeUsers,
    tasks,
    channels,
    masterOptions,
    
    checklistPresets,
    activeChecklistItems,
    activePresetId,
    activePresetName,
    
    isModalOpen, editingTask, initialViewMode, taskStack, selectedDate, notificationSettings, lockedTaskType,
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
    fetchTaskById
  } = useTaskManager(user, currentUserProfile, fetchProfile, updateProfile);

  // --- HOOK 5: ROUTE & URL NAVIGATION ---
  const {
    currentView,
    handleNavigate,
    searchParams,
    setSearchParams,
  } = useAppNavigation({
    currentUserProfile,
    masterOptions,
    isManagerLoading,
    globalWarpStage,
    triggerWarpTransition,
  });

  // --- HOOK 6: DEEP LINK RESTORE & TASK OPENER ---
  const { handleOpenTaskById } = useTaskDeepLink({
    isManagerLoading,
    currentUserProfile,
    tasks,
    searchParams,
    handleNavigate,
    handleEditTask,
    fetchTaskById,
    showToast,
  });

  // --- HOOK 7: WORKBOX CONTEXT ---
  const { items: workboxItems, addItem: addToWorkbox, isOpen: isWorkboxOpen, setIsOpen: setIsWorkboxOpen } = useWorkboxContext();

  // --- HOOK 8: SYSTEM NOTIFICATIONS & UNREAD COUNTS ---
  const { notifications, unreadCount: sysUnread, dismissNotification, markNotificationAsRead, markAllAsRead, markAsViewed } = useSystemNotifications(tasks, currentUserProfile, fetchProfile);
  const { unreadCount: chatUnread } = useChatUnread(currentUserProfile);
  const { requests: leaveRequests, approveRequest, rejectRequest } = useLeaveRequests(
    currentUserProfile, 
    { all: currentUserProfile?.role === 'ADMIN' }
  );
  
  // --- BACKGROUND SERVICES ---
  useAutoJudge(currentUserProfile); 
  useGameEventListener(currentUserProfile, fetchProfile); 

  // --- DETECT LOCK NOTIFICATIONS ---
  const negligenceNotification = BRAND_CONFIG.gamificationMode === 2 ? undefined : notifications.find(n => n.type === 'NEGLIGENCE' && !n.isRead);
  const deathWarningNotification = BRAND_CONFIG.gamificationMode === 2 ? undefined : notifications.find(n => n.type === 'DEATH_WARNING' && !n.isRead);
  const resurrectionNotification = BRAND_CONFIG.gamificationMode === 2 ? undefined : notifications.find(n => n.type === 'RESURRECTION' && !n.isRead);

  const handleToggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleCloseNotification = () => {
    setIsNotificationOpen(false);
    markAsViewed();
  };
  
  const handleAcknowledgeLock = async (notifId: string) => {
    await markNotificationAsRead(notifId);
  };

  const handleForceLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout error:", error);
    } finally {
      localStorage.clear(); 
      navigate('/');
    }
  };

  const isUltimateRoom = currentView === 'ULTIMATE_WORKROOM';

  return (
    <AccountStatusGuard
      isManagerLoading={isManagerLoading}
      currentUserProfile={currentUserProfile}
      onLogout={handleForceLogout}
    >
      {isUltimateRoom ? (
        <motion.div
          key="ultimate-workroom-screen"
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen w-full bg-[#0e101a] overflow-hidden"
        >
          <Suspense fallback={<PageLoader />}>
            <UltimateWorkroomView
              tasks={tasks}
              masterOptions={masterOptions}
              users={activeUsers}
              currentUser={currentUserProfile!}
              onEditTask={handleEditTask}
              onUpdateTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              onNavigateBack={() => handleNavigate('DASHBOARD')}
              onNavigate={handleNavigate}
              onRefreshProfile={fetchProfile}
              isFetching={isTaskFetching}
            />
          </Suspense>
        </motion.div>
      ) : (
        <motion.div
          key="standard-appshell-screen"
          initial={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen w-full"
        >
          <AppShell
            currentUser={currentUserProfile!}
            currentView={currentView}
            onNavigate={handleNavigate}
            onLogout={handleForceLogout}
            onEditProfile={() => setIsProfileModalOpen(true)}
            onAddTask={handleAddTask}
            onOpenTask={handleOpenTaskById}
            chatUnreadCount={chatUnread}
            systemUnreadCount={sysUnread}
            isNotificationOpen={isNotificationOpen}
            onToggleNotification={handleToggleNotification}
            tasks={tasks}
            allUsers={activeUsers}
            onOpenChatAssistant={() => setIsChatAssistantOpen(true)}
          >
            <ShortcutManager 
              onNavigate={handleNavigate}
              onAddTask={() => handleAddTask('TASK')}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(prev => !prev)}
            />
    
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeOut"
                }}
                className={`flex flex-col w-full ${['CHAT', 'CALENDAR'].includes(currentView) ? 'h-full min-h-0 flex-1' : 'min-h-full'}`}
              >
                <ViewRouteRegistry
                  currentView={currentView}
                  currentUserProfile={currentUserProfile!}
                  users={allUsers}
                  activeUsers={activeUsers}
                  allUsers={allUsers}
                  tasks={tasks}
                  channels={channels}
                  quests={quests}
                  masterOptions={masterOptions}
                  isTaskFetching={isTaskFetching}
                  sysUnread={sysUnread}
                  activeChecklistItems={activeChecklistItems}
                  checklistPresets={checklistPresets}
                  activePresetId={activePresetId}
                  activePresetName={activePresetName}
                  isWorkboxOpen={isWorkboxOpen}
                  setIsWorkboxOpen={setIsWorkboxOpen}
                  addToWorkbox={addToWorkbox}
                  setIsNotifSettingsOpen={setIsNotifSettingsOpen}
                  setIsProfileModalOpen={setIsProfileModalOpen}
                  handleToggleNotification={handleToggleNotification}
                  setSearchParams={setSearchParams}
                  handleNavigate={handleNavigate}
                  handleEditTask={handleEditTask}
                  handleSaveTask={handleSaveTask}
                  handleDeleteTask={handleDeleteTask}
                  handleDelayTask={handleDelayTask}
                  handleSelectDate={handleSelectDate}
                  handleAddTask={handleAddTask}
                  approveMember={approveMember}
                  removeMember={removeMember}
                  toggleUserStatus={toggleUserStatus}
                  adjustStatsLocally={adjustStatsLocally}
                  handleToggleChecklist={handleToggleChecklist}
                  handleAddChecklistItem={handleAddChecklistItem}
                  handleDeleteChecklistItem={handleDeleteChecklistItem}
                  handleResetChecklist={handleResetChecklist}
                  handleLoadPreset={handleLoadPreset}
                  handleAddPreset={handleAddPreset}
                  handleDeletePreset={handleDeletePreset}
                  handleAddChannel={handleAddChannel}
                  handleUpdateChannel={handleUpdateChannel}
                  handleDeleteChannel={handleDeleteChannel}
                  handleOpenTaskById={handleOpenTaskById}
                  handleAddQuest={handleAddQuest}
                  handleDeleteQuest={handleDeleteQuest}
                  updateManualProgress={updateManualProgress}
                  updateQuest={updateQuest}
                  fetchAllTasks={fetchAllTasks}
                  fetchProfile={fetchProfile}
                  PageLoader={PageLoader}
                  checkAndExpandRange={checkAndExpandRange}
                />
              </motion.div>
            </AnimatePresence>
    
            {/* --- WORKBOX TRIGGER & PANEL --- */}
            <WorkboxTrigger 
              onClick={() => setIsWorkboxOpen(true)} 
              itemCount={workboxItems.length} 
              onDrop={(data) => addToWorkbox(data)}
            />
            <WorkboxPanel 
              isOpen={isWorkboxOpen} 
              onClose={() => setIsWorkboxOpen(false)} 
              currentUser={currentUserProfile!} 
            />

            {/* AI Floating Chat Assistant - Globally Accessible */}
            <ChatAssistant 
              tasks={tasks}
              channels={channels}
              onAddChannel={handleAddChannel}
              onDeleteChannel={handleDeleteChannel}
              onAddTask={handleSaveTask}
              isOpen={isChatAssistantOpen}
              setIsOpen={setIsChatAssistantOpen}
            />
          </AppShell>
        </motion.div>
      )}

      {/* --- GLOBAL MODAL REGISTRY --- */}
      <GlobalModalRegistry
        negligenceNotification={negligenceNotification}
        deathWarningNotification={deathWarningNotification}
        resurrectionNotification={resurrectionNotification}
        handleAcknowledgeLock={handleAcknowledgeLock}
        handleForceLogout={handleForceLogout}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        handleSaveTask={handleSaveTask}
        handleDeleteTask={handleDeleteTask}
        editingTask={editingTask}
        selectedDate={selectedDate}
        channels={channels}
        activeUsers={activeUsers}
        lockedTaskType={lockedTaskType}
        masterOptions={masterOptions}
        currentUserProfile={currentUserProfile!}
        tasks={tasks}
        handleOpenTaskById={handleOpenTaskById}
        taskStack={taskStack}
        initialViewMode={initialViewMode}
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        updateProfile={updateProfile}
        isNotifSettingsOpen={isNotifSettingsOpen}
        setIsNotifSettingsOpen={setIsNotifSettingsOpen}
        notificationSettings={notificationSettings}
        updateNotificationSettings={updateNotificationSettings}
        isNotificationOpen={isNotificationOpen}
        handleCloseNotification={handleCloseNotification}
        notifications={notifications}
        dismissNotification={dismissNotification}
        markNotificationAsRead={markNotificationAsRead}
        markAllAsRead={markAllAsRead}
        handleNavigate={handleNavigate}
        approveRequest={approveRequest}
        rejectRequest={rejectRequest}
        leaveRequests={leaveRequests}
        activeDetailNotif={activeDetailNotif}
        setActiveDetailNotif={setActiveDetailNotif}
      />

      {/* --- GLOBAL HIGH-FIDELITY DIMENSIONAL WARP GATE OVERLAY --- */}
      <WarpGateOverlay globalWarpStage={globalWarpStage} warpTargetView={warpTargetView} />

      {/* --- PWA SHARE INTENT RECEIVER MODAL --- */}
      <PWAShareTargetModal 
        isOpen={!!pwaSharedData} 
        onClose={() => setPwaSharedData(null)} 
        data={pwaSharedData}
        currentUser={currentUserProfile}
      />
    </AccountStatusGuard>
  );
};

const AppRouter: React.FC<{ user: any }> = ({ user }) => {
  return <AppRouterInner user={user} />;
};

export default AppRouter;
