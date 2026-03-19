
import { useState, useEffect } from 'react';

// Import split hooks
import { useAuth } from './useAuth';
import { useTeam } from './useTeam';
import { useChannels } from './useChannels';
import { useTasks } from './useTasks';
import { useChecklist } from './useChecklist';
import { useWeeklyQuests } from './useWeeklyQuests'; 
import { useUI } from './useUI';
import { useMasterData } from './useMasterData'; 

export const useTaskManager = (sessionUser: any) => {
  const [isLoading, setIsLoading] = useState(true);

  // 1. Auth Hook
  const { currentUserProfile, fetchProfile, updateProfile } = useAuth(sessionUser);

  // 2. UI Hook
  const { 
    isModalOpen, setIsModalOpen, editingTask, setEditingTask, selectedDate, setSelectedDate, notificationSettings,
    updateNotificationSettings, handleAddTask, handleEditTask: handleEditTaskUI, handleSelectDate, closeModal, lockedTaskType
  } = useUI();

  // 3. Team Hook
  const { allUsers, fetchTeamMembers, approveMember, removeMember, toggleUserStatus, updateMember, adjustStatsLocally } = useTeam();

  // 4. Channels Hook
  const { channels, fetchChannels, handleAddChannel, handleUpdateChannel, handleDeleteChannel } = useChannels();

  // 5. Tasks Hook (Now with Range Controls)
  const { 
      tasks, fetchTasks, fetchTaskDetail, handleSaveTask: saveTaskInternal, 
      handleDeleteTask, handleDelayTask, checkAndExpandRange, fetchAllTasks, isFetching,
      setCurrentUser
  } = useTasks(setIsModalOpen);

  // 6. Checklist Hook
  const { 
    checklistPresets, activeChecklistItems, loadChecklistData,
    activePresetId, activePresetName,
    handleToggleChecklist, handleAddChecklistItem, handleDeleteChecklistItem, handleResetChecklist,
    handleLoadPreset, handleAddPreset, handleDeletePreset
  } = useChecklist();

  // 7. Weekly Quests Hook (New)
  const { quests, fetchQuests, handleAddQuest, handleDeleteQuest, updateManualProgress, updateQuest } = useWeeklyQuests();

  // 8. Master Data Hook (New)
  const { masterOptions, fetchMasterOptions } = useMasterData();

  // --- Initialize Logic (Orchestrator) ---
  useEffect(() => {
    const init = async () => {
      // 1. Load Profile first (Critical)
      const profile = await fetchProfile();
      
      // 2. Once profile is loaded, stop showing the global loader
      setIsLoading(false);
      
      if (profile) {
          setCurrentUser(profile);
      }
      
      // 3. Load other data in the background
      if (profile && profile.isApproved) {
         // The underlying hooks (useTasks, useChannels, useTeam, useWeeklyQuests, useMasterData, useChecklist)
         // already have their own useEffects that trigger fetches when they mount or when dependencies change.
         // Calling them here manually causes double/triple fetching.
      }
    };

    if (sessionUser?.id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id]); 

  // --- SMART HANDLERS ---
  
  // Override handleEditTask to fetch full details before opening modal
  const handleEditTask = async (task: any) => {
      // If it's a lightweight task (missing description), fetch full detail
      if (task.description === undefined || task.description === '') {
          const fullTask = await fetchTaskDetail(task.id, task.type);
          if (fullTask) {
              setEditingTask(fullTask);
              setIsModalOpen(true);
              return;
          }
      }
      // Fallback or if already full
      setEditingTask(task);
      setIsModalOpen(true);
  };

  // Wrapper for handleSaveTask to match original signature expected by App.tsx
  // UPDATED: Pass context data (users, masterOptions, channels) for Smart Diffing
  const handleSaveTask = (task: any) => saveTaskInternal(task, editingTask, {
      users: allUsers,
      masterOptions: masterOptions,
      channels: channels
  });

  const mergedUsers = allUsers.map(u => u.id === currentUserProfile?.id ? { ...u, ...currentUserProfile } : u);

  return {
    isLoading: isLoading || (tasks.length === 0 && isFetching), // Show load on initial empty
    isTaskFetching: isFetching, // Expose fetch state
    currentUserProfile,
    allUsers: mergedUsers,
    tasks,
    channels,
    masterOptions,
    fetchMasterOptions,
    
    // Checklist State
    checklistPresets,
    activeChecklistItems,
    activePresetId,
    activePresetName,
    
    // UI State
    isModalOpen,
    editingTask,
    selectedDate,
    notificationSettings,
    lockedTaskType, 
    setIsModalOpen, 
    setEditingTask,
    setSelectedDate,
    
    // UI Handlers
    handleAddTask,
    handleEditTask,
    handleSelectDate,
    closeModal,
    
    // Task Actions
    handleSaveTask,
    handleDeleteTask,
    handleDelayTask,
    checkAndExpandRange, // NEW: For Calendar
    fetchAllTasks,       // NEW: For Dashboard All Time
    
    // Channel Actions
    handleAddChannel,
    handleUpdateChannel,
    handleDeleteChannel,
    handleAddChannels: () => {}, 
    
    // Notification Actions
    updateNotificationSettings,
    
    // Checklist Actions
    handleToggleChecklist,
    handleAddChecklistItem,
    handleDeleteChecklistItem,
    handleResetChecklist,
    handleLoadPreset,
    handleAddPreset,     
    handleDeletePreset,  
    
    // Admin Actions
    approveMember,
    removeMember,
    toggleUserStatus,
    updateMember,
    adjustStatsLocally,

    // Quest Actions
    quests,
    handleAddQuest,
    handleDeleteQuest,
    updateManualProgress,
    updateQuest,

    // Profile Actions
    updateProfile,
    fetchProfile
  };
};
