
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
    updateNotificationSettings, handleAddTask, handleEditTask, handleSelectDate, closeModal, lockedTaskType
  } = useUI();

  // 3. Team Hook
  const { allUsers, fetchTeamMembers, approveMember, removeMember, toggleUserStatus } = useTeam();

  // 4. Channels Hook
  const { channels, fetchChannels, handleAddChannel, handleUpdateChannel, handleDeleteChannel } = useChannels();

  // 5. Tasks Hook
  const { tasks, fetchTasks, handleSaveTask: saveTaskInternal, handleDeleteTask, handleDelayTask } = useTasks(setIsModalOpen);

  // 6. Checklist Hook
  const { 
    checklistPresets, activeChecklistItems, loadChecklistData,
    handleToggleChecklist, handleAddChecklistItem, handleDeleteChecklistItem, handleResetChecklist,
    handleLoadPreset, handleAddPreset, handleDeletePreset
  } = useChecklist();

  // 7. Weekly Quests Hook (New)
  const { quests, fetchQuests, handleAddQuest, handleDeleteQuest } = useWeeklyQuests();

  // 8. Master Data Hook (New)
  const { masterOptions, fetchMasterOptions } = useMasterData();

  // --- Initialize Logic (Orchestrator) ---
  useEffect(() => {
    const init = async () => {
      // Only set loading if we don't have profile yet to prevent flicker on refocus
      if (!currentUserProfile) setIsLoading(true);
      
      const profile = await fetchProfile();
      
      if (profile && profile.isApproved) {
         // Use Promise.allSettled or just all to ensure fetching
         // We check if data is empty to decide if we strictly need to fetch, 
         // but normally simply fetching here is fine if we depend on ID.
         await Promise.all([
             fetchTasks(), 
             fetchChannels(), 
             fetchTeamMembers(),
             fetchQuests(),
             fetchMasterOptions() 
         ]);
         loadChecklistData();
      }
      setIsLoading(false);
    };

    if (sessionUser?.id) init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id]); // CHANGED: Depend only on ID, not the entire object

  // Wrapper for handleSaveTask to match original signature expected by App.tsx
  const handleSaveTask = (task: any) => saveTaskInternal(task, editingTask);

  // Return the exact same structure as before to keep App.tsx happy
  return {
    isLoading,
    currentUserProfile,
    allUsers,
    tasks,
    channels,
    masterOptions,
    fetchMasterOptions, // EXPORTED: For manual refresh in Dashboard
    
    // Checklist State
    checklistPresets,
    activeChecklistItems,
    
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
    toggleUserStatus, // NEW EXPORT

    // Quest Actions
    quests,
    handleAddQuest,
    handleDeleteQuest,

    // Profile Actions
    updateProfile
  };
};
    