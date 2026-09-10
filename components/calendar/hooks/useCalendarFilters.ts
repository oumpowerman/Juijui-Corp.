import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Task, User, ChipConfig } from '../../../types';

interface UseCalendarFiltersProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  viewMode: 'CONTENT' | 'TASK' | 'PLAN';
  setViewMode?: (mode: 'CONTENT' | 'TASK' | 'PLAN') => void;
  filterTasks: (tasksToFilter: Task[]) => Task[];
  startDate: Date;
  endDate: Date;
  customChips?: ChipConfig[];
  activeChipIds?: string[];
  setActiveChipIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useCalendarFilters = ({
  tasks,
  users,
  currentUser,
  viewMode,
  setViewMode,
  filterTasks,
  startDate,
  endDate,
  customChips = [],
  activeChipIds = [],
  setActiveChipIds,
}: UseCalendarFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Cosmic / Unified Detailed Filter State ---
  const [selectedCosmicChannelIds, setSelectedCosmicChannelIds] = useState<string[]>([]);
  const [selectedCosmicFormats, setSelectedCosmicFormats] = useState<string[]>([]);
  const [selectedCosmicStatuses, setSelectedCosmicStatuses] = useState<string[]>([]);
  const [selectedCosmicAssigneeIds, setSelectedCosmicAssigneeIds] = useState<string[]>([]);
  const [isCosmicFilterOpen, setIsCosmicFilterOpen] = useState(false);

  // --- Deep Link Channel Detection from URL (?channelId=... or ?channel=...) ---
  useEffect(() => {
    const urlChannelParam = searchParams.get('channelId') || searchParams.get('channel');
    if (urlChannelParam) {
      const parsedChannelIds = urlChannelParam
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      if (parsedChannelIds.length > 0) {
        setSelectedCosmicChannelIds(parsedChannelIds);

        // Switch to CONTENT mode for content notifications
        if (viewMode !== 'CONTENT' && setViewMode) {
          setViewMode('CONTENT');
        }

        // Sync with active custom chips if a chip exists for this channel
        if (customChips && customChips.length > 0 && setActiveChipIds) {
          const matchingChipIds = customChips
            .filter(c => c.type === 'CHANNEL' && parsedChannelIds.includes(c.value))
            .map(c => c.id);

          if (matchingChipIds.length > 0) {
            setActiveChipIds(prev => {
              const merged = new Set([...prev, ...matchingChipIds]);
              return Array.from(merged);
            });
          }
        }
      }
    }
  }, [searchParams, viewMode, setViewMode, customChips, setActiveChipIds]);

  // Sync custom chips whenever chips or selectedCosmicChannelIds update
  useEffect(() => {
    if (customChips && customChips.length > 0 && selectedCosmicChannelIds.length > 0 && setActiveChipIds) {
      const matchingChipIds = customChips
        .filter(c => c.type === 'CHANNEL' && selectedCosmicChannelIds.includes(c.value))
        .map(c => c.id);

      if (matchingChipIds.length > 0) {
        setActiveChipIds(prev => {
          const merged = new Set([...prev, ...matchingChipIds]);
          return Array.from(merged);
        });
      }
    }
  }, [customChips, selectedCosmicChannelIds, setActiveChipIds]);

  // Helper to clear channel filter and remove channelId / channel from URL
  const clearChannelFilter = useCallback(() => {
    setSelectedCosmicChannelIds([]);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      let changed = false;
      ['channelId', 'channel'].forEach(key => {
        if (next.has(key)) {
          next.delete(key);
          changed = true;
        }
      });
      return changed ? next : prev;
    }, { replace: true });
  }, [setSearchParams]);

  // --- TASK Mode Filters (Smart Default to current user, Quick Status & Urgency) ---
  const [taskAssigneeScope, setTaskAssigneeScope] = useState<'ONLY_ME' | 'ALL' | string>('ONLY_ME');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedTaskStatuses, setSelectedTaskStatuses] = useState<string[]>([]);
  const [isUrgentOnly, setIsUrgentOnly] = useState(false);
  const [isDueSoonOnly, setIsDueSoonOnly] = useState(false);

  // Auto-default to current user when switching into TASK mode
  useEffect(() => {
    if (viewMode === 'TASK') {
      setTaskAssigneeScope('ONLY_ME');
    }
  }, [viewMode]);

  // Toggle helpers for Task mode chips
  const handleToggleTaskStatus = useCallback((status: string) => {
    setSelectedTaskStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }, []);

  const handleToggleUrgentOnly = useCallback(() => {
    setIsUrgentOnly(prev => !prev);
  }, []);

  const handleToggleDueSoonOnly = useCallback(() => {
    setIsDueSoonOnly(prev => !prev);
  }, []);

  // Wrap filterTasks with cosmic & detailed filter logic
  const cosmicFilterTasks = useCallback((tasksToFilter: Task[]) => {
    let filtered = filterTasks(tasksToFilter);

    // In TASK Mode: Apply Assignee Scope & Position Filters & Quick Task filters
    if (viewMode === 'TASK') {
      // 1. Assignee Scope Filter (Default: ONLY_ME)
      if (taskAssigneeScope === 'ONLY_ME') {
        if (currentUser?.id) {
          filtered = filtered.filter(t => t.assigneeIds && t.assigneeIds.includes(currentUser.id));
        }
      } else if (taskAssigneeScope !== 'ALL') {
        filtered = filtered.filter(t => t.assigneeIds && t.assigneeIds.includes(taskAssigneeScope));
      }

      // 2. Position / Role Filter
      if (selectedPosition && selectedPosition !== 'ALL') {
        const userIdsWithPos = users.filter(u => u.position === selectedPosition).map(u => u.id);
        filtered = filtered.filter(t => {
          if (t.targetPosition && t.targetPosition === selectedPosition) return true;
          if (t.assigneeIds && t.assigneeIds.some(uid => userIdsWithPos.includes(uid))) return true;
          return false;
        });
      }

      // 3. Task Status Quick Filter
      if (selectedTaskStatuses.length > 0) {
        filtered = filtered.filter(t => t.status && selectedTaskStatuses.includes(t.status));
      }

      // 4. Urgent Only Filter (Urgent or Critical)
      if (isUrgentOnly) {
        filtered = filtered.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT' || (t as any).isUrgent);
      }

      // 5. Due Soon Only Filter (due within next 3 days)
      if (isDueSoonOnly) {
        const now = new Date().getTime();
        const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter(t => {
          if (!t.endDate || t.status === 'DONE' || t.status === 'CANCELLED') return false;
          const taskEnd = new Date(t.endDate).getTime();
          return taskEnd >= (now - 24 * 60 * 60 * 1000) && taskEnd <= threeDaysFromNow;
        });
      }
    }

    // 6. Assignee Filter from Cosmic Modal (if selected)
    if (selectedCosmicAssigneeIds.length > 0) {
      filtered = filtered.filter(t => t.assigneeIds && t.assigneeIds.some(uid => selectedCosmicAssigneeIds.includes(uid)));
    }

    // 7. Channel Filter (Only if active)
    if (selectedCosmicChannelIds.length > 0) {
      filtered = filtered.filter(t => t.channelId && selectedCosmicChannelIds.includes(t.channelId));
    }

    // 8. Format Filter (Only if active)
    if (selectedCosmicFormats.length > 0) {
      filtered = filtered.filter(t => {
        if (!t.contentFormats) return false;
        return t.contentFormats.some(f => {
          const fStr = typeof f === 'string' ? f : (f as any).key || '';
          return selectedCosmicFormats.includes(fStr);
        });
      });
    }

    // 9. Status Filter (Only if active)
    if (selectedCosmicStatuses.length > 0) {
      filtered = filtered.filter(t => t.status && selectedCosmicStatuses.includes(t.status));
    }

    return filtered;
  }, [
    filterTasks,
    viewMode,
    taskAssigneeScope,
    currentUser?.id,
    selectedPosition,
    users,
    selectedTaskStatuses,
    isUrgentOnly,
    isDueSoonOnly,
    selectedCosmicAssigneeIds,
    selectedCosmicChannelIds,
    selectedCosmicFormats,
    selectedCosmicStatuses
  ]);

  // Memoized task counts for cosmic modal
  const taskCountsByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.status !== 'DONE' && t.status !== 'CANCELLED' && t.assigneeIds) {
        t.assigneeIds.forEach(uid => {
          counts[uid] = (counts[uid] || 0) + 1;
        });
      }
    });
    return counts;
  }, [tasks]);

  // Active filters count for badges
  const activeFiltersCount = useMemo(() => {
    return selectedCosmicChannelIds.length + selectedCosmicFormats.length + selectedCosmicStatuses.length + selectedCosmicAssigneeIds.length;
  }, [selectedCosmicChannelIds.length, selectedCosmicFormats.length, selectedCosmicStatuses.length, selectedCosmicAssigneeIds.length]);

  // Pre-calculate filtered tasks for the view (Used for Board View)
  const filteredTasksForView = useMemo(() => {
    const filteredByView = cosmicFilterTasks(tasks);
    // Also filter by date range for Board View to keep it synced with Calendar
    return filteredByView.filter(t => 
      !t.isUnscheduled && 
      t.endDate >= startDate && 
      t.endDate <= endDate
    );
  }, [tasks, cosmicFilterTasks, startDate, endDate]);

  return {
    selectedCosmicChannelIds,
    setSelectedCosmicChannelIds,
    selectedCosmicFormats,
    setSelectedCosmicFormats,
    selectedCosmicStatuses,
    setSelectedCosmicStatuses,
    selectedCosmicAssigneeIds,
    setSelectedCosmicAssigneeIds,
    isCosmicFilterOpen,
    setIsCosmicFilterOpen,
    taskAssigneeScope,
    setTaskAssigneeScope,
    selectedPosition,
    setSelectedPosition,
    selectedTaskStatuses,
    setSelectedTaskStatuses,
    isUrgentOnly,
    setIsUrgentOnly,
    isDueSoonOnly,
    setIsDueSoonOnly,
    handleToggleTaskStatus,
    handleToggleUrgentOnly,
    handleToggleDueSoonOnly,
    cosmicFilterTasks,
    taskCountsByUser,
    activeFiltersCount,
    filteredTasksForView,
    clearChannelFilter,
  };
};
