import { useRef, useCallback, useEffect } from 'react';
import { ViewMode, Task, User, TaskType } from '../../types';

interface UseTaskDeepLinkProps {
  isManagerLoading: boolean;
  currentUserProfile: User | null;
  tasks: Task[];
  searchParams: URLSearchParams;
  handleNavigate: (view: ViewMode, queryParams?: Record<string, string>) => void;
  handleEditTask: (task: Task, viewMode?: string) => void;
  fetchTaskById: (id: string, type?: TaskType) => Promise<Task | null>;
  showToast: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export function useTaskDeepLink({
  isManagerLoading,
  currentUserProfile,
  tasks,
  searchParams,
  handleNavigate,
  handleEditTask,
  fetchTaskById,
  showToast,
}: UseTaskDeepLinkProps) {
  // --- TASK OPENER (Robust ID Resolution) ---
  const handleOpenTaskById = useCallback(async (taskOrId: any, currentViewMode?: string) => {
    if (!taskOrId) return;

    let finalTask: Task | undefined;
    
    // 1. Resolve from input or local state
    if (typeof taskOrId === 'string') {
      finalTask = tasks.find(t => t.id === taskOrId);
    } else if (taskOrId.title && taskOrId.type && taskOrId.status) {
      // It's already a full Task object
      finalTask = taskOrId as Task;
    } else if (taskOrId.id) {
      // It's a partial object (likely from TaskDetail's Linked Content)
      finalTask = tasks.find(t => t.id === taskOrId.id);
    }

    // 2. Fetch from Supabase if not found locally
    if (!finalTask && taskOrId) {
      const targetId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
      const targetType = (typeof taskOrId !== 'string' && taskOrId.type) ? taskOrId.type : undefined;
      
      if (targetId) {
        showToast('กำลังโหลดข้อมูล...', 'info');
        let fetchedTask = await fetchTaskById(targetId, targetType);
        if (!fetchedTask && !targetType) {
          fetchedTask = await fetchTaskById(targetId, 'TASK');
        }
        if (fetchedTask) {
          finalTask = fetchedTask;
        }
      }
    }

    if (finalTask) {
      handleEditTask(finalTask, currentViewMode);
    } else {
      console.warn("[useTaskDeepLink] Task not found for resolution:", taskOrId);
      showToast('ไม่พบข้อมูลรายการที่ต้องการเปิด', 'error');
    }
  }, [tasks, handleEditTask, fetchTaskById, showToast]);

  // --- DEEP LINK RESTORE FROM SESSIONSTORAGE ---
  useEffect(() => {
    if (isManagerLoading) return;

    const pendingDeepLink = sessionStorage.getItem('juijui_pending_deep_link');
    if (pendingDeepLink) {
      sessionStorage.removeItem('juijui_pending_deep_link');
      const params = new URLSearchParams(pendingDeepLink);
      const targetView = (params.get('view') as ViewMode) || (params.get('taskId') || params.get('contentId') || params.get('highlightTaskId') || params.get('openTaskId') ? 'CALENDAR' : null);
      if (targetView) {
        // Check if the current search parameters are already identical to the deep link parameters
        let isIdentical = true;
        const targetMap = new Map<string, string>();
        params.forEach((val, key) => {
          if (key !== 'openExternalBrowser') {
            targetMap.set(key, val);
          }
        });

        const currentMap = new Map<string, string>();
        searchParams.forEach((val, key) => {
          currentMap.set(key, val);
        });

        if (targetMap.size !== currentMap.size) {
          isIdentical = false;
        } else {
          for (const [key, val] of targetMap.entries()) {
            if (currentMap.get(key) !== val) {
              isIdentical = false;
              break;
            }
          }
        }

        if (isIdentical) {
          console.log("Deep link restoration skipped: already identical to current URL.");
        } else {
          const queryObj: Record<string, string> = {};
          params.forEach((val, key) => {
            if (key !== 'view' && key !== 'openExternalBrowser') {
              queryObj[key] = val;
            }
          });
          handleNavigate(targetView, queryObj);
        }
      }
    }
  }, [isManagerLoading, handleNavigate, searchParams]);

  // --- AUTO-OPEN TASK FROM URL PARAM (taskId / contentId / highlightTaskId / openTaskId) ---
  const initialTaskOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isManagerLoading || !currentUserProfile) return;
    const targetTaskId = searchParams.get('taskId') || searchParams.get('contentId') || searchParams.get('highlightTaskId') || searchParams.get('openTaskId');
    if (targetTaskId && initialTaskOpenedRef.current !== targetTaskId) {
      initialTaskOpenedRef.current = targetTaskId;
      handleOpenTaskById(targetTaskId);
    }
  }, [isManagerLoading, currentUserProfile, searchParams, handleOpenTaskById]);

  return {
    handleOpenTaskById,
  };
}
