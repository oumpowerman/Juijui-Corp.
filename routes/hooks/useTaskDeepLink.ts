import { useRef, useCallback, useEffect } from 'react';
import { ViewMode, Task, User, TaskType } from '../../types';

interface UseTaskDeepLinkProps {
  isManagerLoading: boolean;
  currentUserProfile: User | null;
  tasks: Task[];
  searchParams: URLSearchParams;
  setSearchParams: (params: any, options?: any) => void;
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
  setSearchParams,
  handleNavigate,
  handleEditTask,
  fetchTaskById,
  showToast,
}: UseTaskDeepLinkProps) {
  // --- TASK OPENER (Robust ID Resolution) ---
  const handleOpenTaskById = useCallback(async (taskOrId: any, currentViewMode?: string) => {
    if (!taskOrId) return;

    // Backwards-compatible recovery for legacy SLA_WARN:<uuid>:<date> strings
    let normalizedInput = taskOrId;
    if (typeof taskOrId === 'string' && taskOrId.startsWith('SLA_WARN:')) {
      const parts = taskOrId.split(':');
      normalizedInput = parts[1] || '';
      if (!normalizedInput) return;
    }

    let finalTask: Task | undefined;
    
    // 1. Resolve from input or local state
    if (typeof normalizedInput === 'string') {
      finalTask = tasks.find(t => t.id === normalizedInput);
    } else if (normalizedInput.title && normalizedInput.type && normalizedInput.status) {
      // It's already a full Task object
      finalTask = normalizedInput as Task;
    } else if (normalizedInput.id) {
      // It's a partial object (likely from TaskDetail's Linked Content)
      finalTask = tasks.find(t => t.id === normalizedInput.id);
    }

    // 2. Fetch from Supabase if not found locally
    if (!finalTask && normalizedInput) {
      const targetId = typeof normalizedInput === 'string' ? normalizedInput : normalizedInput.id;
      const targetType = (typeof normalizedInput !== 'string' && normalizedInput.type) ? normalizedInput.type : undefined;
      
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

  const inferTargetViewFromParams = useCallback((params: URLSearchParams): ViewMode | null => {
    return (
      (params.get('view') as ViewMode) ||
      (params.get('tab') || params.get('highlightReqId') ? 'ATTENDANCE' : null) ||
      (params.get('presetId') ? 'COMPANY_CHECKLIST' : null) ||
      (params.get('swapId') || params.get('expandSwap') ? 'DUTY' : null) ||
      (params.get('meetingId') ? 'MEETINGS' : null) ||
      (params.get('goalId') ? 'GOALS' : null) ||
      (params.get('channels') || params.get('channel') || params.get('stockTab') || params.get('stockMode') ? 'ContentStock' : null) ||
      (params.get('taskId') || params.get('contentId') || params.get('highlightTaskId') || params.get('openTaskId') ? 'CALENDAR' : null)
    );
  }, []);

  // --- DEEP LINK RESTORE FROM SESSIONSTORAGE ---
  useEffect(() => {
    if (isManagerLoading) return;

    const pendingDeepLink = sessionStorage.getItem('juijui_pending_deep_link');
    if (pendingDeepLink) {
      sessionStorage.removeItem('juijui_pending_deep_link');
      const params = new URLSearchParams(pendingDeepLink);
      const targetView = inferTargetViewFromParams(params);
      if (targetView) {
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
  }, [isManagerLoading, handleNavigate, searchParams, inferTargetViewFromParams]);

  // --- AUTO-OPEN TASK FROM URL PARAM (taskId / contentId / highlightTaskId / openTaskId) ---
  const initialTaskOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isManagerLoading || !currentUserProfile) return;
    const targetTaskId = searchParams.get('taskId') || searchParams.get('contentId') || searchParams.get('highlightTaskId') || searchParams.get('openTaskId');
    if (targetTaskId && initialTaskOpenedRef.current !== targetTaskId) {
      initialTaskOpenedRef.current = targetTaskId;
      handleOpenTaskById(targetTaskId);

      // Clean up URL parameters immediately so the URL stays clean without adding history
      setSearchParams((prev: any) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        ['taskId', 'contentId', 'highlightTaskId', 'openTaskId'].forEach(key => {
          if (next.has(key)) {
            next.delete(key);
            changed = true;
          }
        });
        return changed ? next : prev;
      }, { replace: true });
    }
  }, [isManagerLoading, currentUserProfile, searchParams, handleOpenTaskById, setSearchParams]);

  // --- SERVICE WORKER PUSH NOTIFICATION CLICK LISTENER ---
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'PUSH_NOTIFICATION_CLICK') return;

      const rawUrl: string = event.data.url || '/';
      try {
        const parsed = new URL(rawUrl, window.location.origin);
        const params = parsed.searchParams;
        const targetView = inferTargetViewFromParams(params);

        const queryObj: Record<string, string> = {};
        params.forEach((val, key) => {
          if (key !== 'view' && key !== 'openExternalBrowser') {
            queryObj[key] = val;
          }
        });

        const taskToOpen = params.get('openTaskId') || params.get('taskId') || params.get('contentId') || params.get('highlightTaskId');
        const taskModalViews = new Set<string>(['ContentStock', 'DASHBOARD', 'QUALITY_GATE', 'CALENDAR']);

        if (targetView) {
          handleNavigate(targetView, queryObj);
        }

        if (taskToOpen && (!targetView || taskModalViews.has(targetView))) {
          initialTaskOpenedRef.current = taskToOpen;
          handleOpenTaskById(taskToOpen);
        }
      } catch (err) {
        console.warn('[useTaskDeepLink] Failed to parse SW notification URL:', err);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [handleNavigate, handleOpenTaskById, inferTargetViewFromParams]);

  return {
    handleOpenTaskById,
  };
}
